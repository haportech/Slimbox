import db from '@/lib/db';
import { TerminalSquare, Activity, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function saveSettings(formData: FormData) {
  'use server';
  
  const url = formData.get('HEADROOM_API_URL') as string;
  const key = formData.get('HEADROOM_API_KEY') as string;
  
  if (url !== null) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('HEADROOM_API_URL', url);
  }
  if (key !== null) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('HEADROOM_API_KEY', key);
  }
  
  revalidatePath('/settings');
  revalidatePath('/api/proxy/[...path]');
}

export default async function SettingsPage() {
  const urlRow = db.prepare("SELECT value FROM settings WHERE key = 'HEADROOM_API_URL'").get() as { value: string } | undefined;
  const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'HEADROOM_API_KEY'").get() as { value: string } | undefined;
  
  const headroomUrl = urlRow?.value || process.env.HEADROOM_API_URL || '';
  const headroomKey = keyRow?.value || process.env.HEADROOM_API_KEY || '';

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
            <Link href="/sessions" className="font-bold border-2 border-transparent px-4 py-2 hover:border-foreground transition-colors">
              _SESSIONS
            </Link>
            <Link href="/settings" className="font-bold border-2 border-foreground bg-primary text-primary-foreground px-4 py-2 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_#F8FAFC] transition-all">
              [SETTINGS]
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
            <h2 className="text-3xl font-bold uppercase tracking-tight">System Settings</h2>
            <p className="text-muted-foreground mt-1">Configure Headroom API connection.</p>
          </div>
          <Badge className="brutalist-button rounded-none bg-accent text-accent-foreground px-3 py-1">
            <Activity className="w-4 h-4 mr-2 inline" /> ACTIVE
          </Badge>
        </header>
        
        <Card className="brutalist-card rounded-none max-w-2xl bg-card border-2 border-foreground shadow-[8px_8px_0px_0px_#334155]">
          <CardContent className="p-8">
            <form action={saveSettings} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-foreground">HEADROOM_API_URL</label>
                <input 
                  type="text" 
                  name="HEADROOM_API_URL"
                  defaultValue={headroomUrl}
                  className="w-full bg-background border-2 border-foreground p-3 font-mono text-sm focus:ring-0 focus:outline-none focus:border-accent transition-colors"
                  placeholder="https://api.headroom.ai/v1/compress"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-foreground">HEADROOM_API_KEY</label>
                <input 
                  type="password" 
                  name="HEADROOM_API_KEY"
                  defaultValue={headroomKey}
                  className="w-full bg-background border-2 border-foreground p-3 font-mono text-sm focus:ring-0 focus:outline-none focus:border-accent transition-colors"
                  placeholder="sk-..."
                />
              </div>

              <div className="pt-4 border-t-2 border-border">
                <button type="submit" className="flex items-center gap-2 bg-accent text-accent-foreground font-bold uppercase tracking-widest px-6 py-3 border-2 border-foreground hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_#F8FAFC] transition-all">
                  <Save className="w-5 h-5" /> Save Configuration
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
