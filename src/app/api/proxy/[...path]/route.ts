import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const startTime = Date.now();
  const sessionId = req.headers.get('x-session-id') || crypto.randomUUID();
  const agentId = req.headers.get('x-agent-id') || 'unknown-agent';
  
  // Create session if it doesn't exist
  try {
    db.prepare('INSERT OR IGNORE INTO sessions (id, agent_id) VALUES (?, ?)').run(sessionId, agentId);
  } catch (error) {
    console.error('Failed to create session:', error);
  }

  try {
    let bodyText = await req.text();
    const requestId = crypto.randomUUID();
    
    // Fetch Settings
    const hrUrlRow = db.prepare("SELECT value FROM settings WHERE key = 'HEADROOM_API_URL'").get() as { value: string } | undefined;
    const hrKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'HEADROOM_API_KEY'").get() as { value: string } | undefined;
    const headroomUrl = hrUrlRow?.value || process.env.HEADROOM_API_URL || '';
    const headroomKey = hrKeyRow?.value || process.env.HEADROOM_API_KEY || '';

    let originalText = bodyText;
    let compressedText = bodyText;

    // Try extracting JSON and last user message
    try {
      const payloadJson = JSON.parse(bodyText);
      if (payloadJson.messages && Array.isArray(payloadJson.messages)) {
        const lastMsg = payloadJson.messages[payloadJson.messages.length - 1];
        if (lastMsg && lastMsg.content && typeof lastMsg.content === 'string') {
          originalText = lastMsg.content;
          compressedText = originalText;

          if (headroomUrl) {
            try {
              const hrRes = await fetch(headroomUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(headroomKey && { 'Authorization': `Bearer ${headroomKey}` })
                },
                body: JSON.stringify({ prompt: originalText })
              });
              if (hrRes.ok) {
                const hrData = await hrRes.json();
                compressedText = hrData.compressed_prompt || hrData.compressed || hrData.text || compressedText;
                lastMsg.content = compressedText;
                bodyText = JSON.stringify(payloadJson);
              }
            } catch (err) {
              console.error('Headroom API fetch failed:', err);
            }
          } else {
            // Free local compression fallback
            let c = originalText;
            // 1. Strip conversational filler
            const fillers = [/please\s+/gi, /can you\s+/gi, /could you\s+/gi, /would you\s+/gi, /I would like to\s+/gi];
            fillers.forEach(f => c = c.replace(f, ''));
            // 2. Collapse excessive whitespace and newlines
            c = c.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
            
            compressedText = c;
            lastMsg.content = compressedText;
            bodyText = JSON.stringify(payloadJson);
          }
        }
      }
    } catch {}

    const originalTokens = Math.floor(originalText.length / 4);
    const compressedTokens = Math.floor(compressedText.length / 4);

    // Log the request
    db.prepare(`
      INSERT INTO requests (id, session_id, payload_diff, routing_decision)
      VALUES (?, ?, ?, ?)
    `).run(requestId, sessionId, `Tokens removed: ${originalTokens - compressedTokens}`, 'routed_to_openrouter');

    // Update session metrics
    db.prepare(`
      UPDATE sessions 
      SET original_tokens = original_tokens + ?,
          compressed_tokens = compressed_tokens + ?,
          original_prompt = ?,
          compressed_prompt = ?
      WHERE id = ?
    `).run(originalTokens, compressedTokens, originalText, compressedText, sessionId);

    let upstreamResponse;
    const isStream = bodyText.includes('"stream":true') || bodyText.includes('"stream": true');

    // If we have an upstream to forward to, we would do it here. 
    // For MVP proxy simulation, we will just return a dummy response if it's not actually forwarded.
    // In a real proxy, we'd fetch from https://api.openai.com/v1/...
    const targetUrl = `https://openrouter.ai/api/${resolvedParams.path.join('/')}`;
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && !authHeader.includes('no-key-required') && authHeader !== 'Bearer ') {
      upstreamResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: bodyText
      });
      
      const latency = Date.now() - startTime;
      db.prepare('UPDATE sessions SET latency_ms = latency_ms + ? WHERE id = ?').run(latency, sessionId);
      
      if (isStream) {
        return new NextResponse(upstreamResponse.body, {
          status: upstreamResponse.status,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }
      
      const responseData = await upstreamResponse.json();
      return NextResponse.json(responseData);
    }

    // MVP dummy response if no auth is provided
    const latency = Date.now() - startTime;
    db.prepare('UPDATE sessions SET latency_ms = latency_ms + ? WHERE id = ?').run(latency, sessionId);
    
    if (isStream) {
      const mockStreamData = {
        id: `chatcmpl-${requestId}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-3.5-turbo-0125',
        choices: [{
          index: 0,
          delta: { role: 'assistant', content: 'This is a simulated streamed response from the Slimbox proxy MVP.' },
          finish_reason: null
        }]
      };
      
      const mockStreamEnd = {
        id: `chatcmpl-${requestId}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-3.5-turbo-0125',
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
      };

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockStreamData)}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockStreamEnd)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    return NextResponse.json({
      id: `chatcmpl-${requestId}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-3.5-turbo-0125',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a simulated response from the Slimbox proxy MVP.',
          },
          finish_reason: 'stop',
        }
      ],
      usage: {
        prompt_tokens: compressedTokens,
        completion_tokens: 15,
        total_tokens: compressedTokens + 15
      }
    });

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    object: 'list',
    data: [{ id: 'cohere/north-mini-code:free', object: 'model', owned_by: 'system' }]
  });
}
