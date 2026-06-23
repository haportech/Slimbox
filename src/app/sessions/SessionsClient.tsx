'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { diffWords } from 'diff';
import { Activity, X } from 'lucide-react';

export interface Session {
  id: string;
  agent_id: string;
  original_tokens: number;
  compressed_tokens: number;
  latency_ms: number;
  created_at: string;
  original_prompt: string | null;
  compressed_prompt: string | null;
}

export default function SessionsClient({ sessions }: { sessions: Session[] }) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-2xl uppercase tracking-widest text-muted-foreground">
        NO SESSIONS RECORDED
      </div>
    );
  }

  const renderDiff = (original: string, compressed: string) => {
    const diff = diffWords(original || '', compressed || '');
    return diff.map((part, index) => {
      if (part.added) {
        return <span key={index} className="bg-green-900 text-green-300 font-bold">{part.value}</span>;
      }
      if (part.removed) {
        return <span key={index} className="bg-red-900 text-red-300 line-through opacity-70">{part.value}</span>;
      }
      return <span key={index}>{part.value}</span>;
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Card 
            key={session.id} 
            className="brutalist-card rounded-none cursor-pointer hover:-translate-y-1 hover:translate-x-1 transition-transform hover:shadow-[4px_4px_0px_0px_#22C55E]"
            onClick={() => setSelectedSession(session)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-lg text-accent">[{session.agent_id}]</span>
                <span className="text-xs text-muted-foreground">{new Date(session.created_at).toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-sm">
                <div>ID: {session.id.split('-')[0]}...</div>
                <div>Tokens Saved: <span className="text-accent">{session.original_tokens - session.compressed_tokens}</span></div>
                <div>Latency: {session.latency_ms}ms</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border-2 border-foreground w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_#334155]">
            <div className="flex justify-between items-center p-4 border-b-2 border-foreground bg-primary text-primary-foreground">
              <h2 className="font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-5 h-5" /> Session Diff {selectedSession.id.split('-')[0]}
              </h2>
              <button onClick={() => setSelectedSession(null)} className="hover:text-red-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap bg-[#020617] text-[#f8fafc] flex-1">
              {renderDiff(selectedSession.original_prompt || '', selectedSession.compressed_prompt || '')}
            </div>

            <div className="p-4 border-t-2 border-foreground bg-muted/20 flex justify-between font-mono text-xs text-muted-foreground uppercase">
              <span>Original: {selectedSession.original_tokens} tk</span>
              <span>Compressed: {selectedSession.compressed_tokens} tk</span>
              <span>Saved: {selectedSession.original_tokens - selectedSession.compressed_tokens} tk</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
