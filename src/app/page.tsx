import db from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TerminalSquare, Zap, Activity, DollarSign, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  // Fetch KPIs
  const sessions = db.prepare('SELECT SUM(original_tokens) as orig, SUM(compressed_tokens) as comp, AVG(latency_ms) as lat FROM sessions').get() as { orig: number | null, comp: number | null, lat: number | null };
  const origTokens = sessions?.orig || 0;
  const compTokens = sessions?.comp || 0;
  const savedTokens = origTokens - compTokens;
  const compRatio = origTokens > 0 ? ((savedTokens / origTokens) * 100).toFixed(1) : '0';
  const avgLatency = sessions?.lat ? Math.round(sessions.lat) : 0;
  
  // Estimate dollars saved (assume $0.50 per 1M tokens)
  const estDollars = (savedTokens / 1000000) * 0.50;

  // Fetch recent requests
  const recentRequests = db.prepare(`
    SELECT r.id, r.payload_diff, r.routing_decision, r.created_at, s.agent_id
    FROM requests r
    JOIN sessions s ON r.session_id = s.id
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all() as any[];

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
            <a href="#" className="font-bold border-2 border-foreground bg-primary text-primary-foreground px-4 py-2 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_#F8FAFC] transition-all">
              [DASHBOARD]
            </a>
            <a href="#" className="font-bold border-2 border-transparent px-4 py-2 hover:border-foreground transition-colors">
              _SESSIONS
            </a>
            <a href="#" className="font-bold border-2 border-transparent px-4 py-2 hover:border-foreground transition-colors">
              _SETTINGS
            </a>
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
            <h2 className="text-3xl font-bold uppercase tracking-tight">System Metrics</h2>
            <p className="text-muted-foreground mt-1">Real-time overview of Headroom compression.</p>
          </div>
          <Badge className="brutalist-button rounded-none bg-accent text-accent-foreground px-3 py-1">
            <Activity className="w-4 h-4 mr-2 inline" /> ACTIVE
          </Badge>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="brutalist-card rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-muted-foreground flex justify-between">
                Tokens Saved <Zap className="w-4 h-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{savedTokens.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="brutalist-card rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-muted-foreground">
                Compression Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">{compRatio}%</div>
            </CardContent>
          </Card>
          <Card className="brutalist-card rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-muted-foreground">
                Latency Overhead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{avgLatency}ms</div>
            </CardContent>
          </Card>
          <Card className="brutalist-card rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-muted-foreground flex justify-between">
                Est. Dollars Saved <DollarSign className="w-4 h-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">${estDollars.toFixed(4)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Live Feed */}
        <div>
          <h3 className="text-xl font-bold uppercase border-b-2 border-foreground inline-block mb-4 pr-4">
            Live Feed &gt; _
          </h3>
          <Card className="brutalist-card rounded-none bg-background">
            <ScrollArea className="h-[400px] w-full p-4">
              {recentRequests.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground p-10 text-center">
                  <p>No sessions intercepted yet.<br/>Point your agent's API URL to <code>localhost:3000/api/proxy</code> to begin.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentRequests.map((req) => (
                    <div key={req.id} className="border border-border p-3 flex flex-col md:flex-row md:justify-between md:items-center bg-card hover:border-accent transition-colors gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-accent font-bold text-sm">[{req.agent_id}]</span>
                          <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-sm font-mono text-foreground break-all">
                          {req.id.split('-')[0]}... <ArrowRight className="inline w-3 h-3 mx-1" /> {req.routing_decision}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-accent text-accent rounded-none bg-transparent">
                          {req.payload_diff}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </main>
    </div>
  );
}
