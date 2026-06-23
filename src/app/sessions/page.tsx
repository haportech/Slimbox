import db from '@/lib/db';
import SessionsClient, { Session } from './SessionsClient';
import { TerminalSquare, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SessionsPage() {
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50').all() as Session[];

  return (
    <div className="flex h-screen w-full bg-background text-foreground flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b-2 md:border-b-0 md:border-r-2 border-foreground bg-card flex flex-col justify-between p-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <TerminalSquare className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-bold tracking-tighter uppercase">Slimbox</h1>
          </div>
          <nav className="flex flex-col gap-4">
            <Link href="/" className="font-bold border-2 border-transparent px-4 py-2 hover:border-foreground transition-colors">
              _DASHBOARD
            </Link>
            <Link href="/sessions" className="font-bold border-2 border-foreground bg-primary text-primary-foreground px-4 py-2 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_#F8FAFC] transition-all">
              [SESSIONS]
            </Link>
            <Link href="/settings" className="font-bold border-2 border-transparent px-4 py-2 hover:border-foreground transition-colors">
              _SETTINGS
            </Link>
          </nav>
        </div>
        <div className="text-xs text-muted-foreground mt-8">
          <p>SYSTEM STATUS: <span className="text-accent font-bold">ONLINE</span></p>
          <p>PROXY: localhost:3000/api/proxy</p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-8 border-b-2 border-border pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tight">Recorded Sessions</h2>
            <p className="text-muted-foreground mt-1">Review original and compressed prompt diffs.</p>
          </div>
          <Badge className="brutalist-button rounded-none bg-accent text-accent-foreground px-3 py-1">
            <Activity className="w-4 h-4 mr-2 inline" /> ACTIVE
          </Badge>
        </header>
        
        <div className="h-[calc(100vh-200px)]">
          <SessionsClient sessions={sessions} />
        </div>
      </main>
    </div>
  );
}
