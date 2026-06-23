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
    const bodyText = await req.text();
    const requestId = crypto.randomUUID();
    
    // Simulate headroom compression for MVP
    // Assuming simple token estimation (1 token ~= 4 chars)
    const originalTokens = Math.floor(bodyText.length / 4);
    const compressedTokens = Math.floor(originalTokens * 0.7); // 30% compression simulated
    
    // Log the request
    db.prepare(`
      INSERT INTO requests (id, session_id, payload_diff, routing_decision)
      VALUES (?, ?, ?, ?)
    `).run(requestId, sessionId, `Simulated diff: ${originalTokens - compressedTokens} tokens removed`, 'routed_to_openai');

    // Update session metrics
    db.prepare(`
      UPDATE sessions 
      SET original_tokens = original_tokens + ?,
          compressed_tokens = compressed_tokens + ?
      WHERE id = ?
    `).run(originalTokens, compressedTokens, sessionId);

    let upstreamResponse;
    const isStream = bodyText.includes('"stream":true') || bodyText.includes('"stream": true');

    // If we have an upstream to forward to, we would do it here. 
    // For MVP proxy simulation, we will just return a dummy response if it's not actually forwarded.
    // In a real proxy, we'd fetch from https://api.openai.com/v1/...
    const targetUrl = `https://api.openai.com/${resolvedParams.path.join('/')}`;
    const authHeader = req.headers.get('authorization');
    
    if (authHeader) {
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

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
