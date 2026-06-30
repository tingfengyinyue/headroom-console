"use client";

import { useState } from "react";
import { useHeadroomContext } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plug, Circle, RefreshCw, ExternalLink, Terminal, Settings } from "lucide-react";

export default function SettingsPage() {
  const { proxyUrl, setProxyUrl, connected, mode, refresh, health } = useHeadroomContext();
  const [urlInput, setUrlInput] = useState(proxyUrl);
  const [testing, setTesting] = useState(false);

  const handleConnect = async () => {
    setTesting(true);
    setProxyUrl(urlInput);
    setTimeout(async () => { await refresh(); setTesting(false); }, 500);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Configure Headroom Console connection</p></div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" />Proxy Connection</CardTitle>
          <CardDescription>Connect to a running Headroom proxy instance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Circle className={`h-3 w-3 fill-current ${connected ? "text-emerald-500" : "text-red-500"}`} />
            <span className="text-sm font-medium">{connected ? "Connected" : "Disconnected"}</span>
            <Badge variant={mode === "live" ? "default" : "secondary"}>{mode === "live" ? "Live" : "Demo"}</Badge>
          </div>

          <div className="flex gap-2">
            <Input placeholder="http://localhost:8787" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="font-mono" />
            <Button onClick={handleConnect} disabled={testing}>{testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Connect"}</Button>
          </div>

          {connected && health && (
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className="text-emerald-500">{health.status ?? "unknown"}</Badge></div>
              {health.version && <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-mono">{health.version}</span></div>}
              {health.config?.backend && <div className="flex justify-between"><span className="text-muted-foreground">Backend</span><span>{health.config.backend}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Optimize</span><span>{health.config?.optimize ? "Enabled" : "Disabled"}</span></div>
              {health.uptime_seconds != null && <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span className="font-mono">{formatUptime(health.uptime_seconds)}</span></div>}
            </div>
          )}

          {!connected && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Not connected to Headroom proxy</p>
              <p className="text-sm text-muted-foreground">The console is showing demo data. Start a Headroom proxy to see live data:</p>
              <div className="rounded-md bg-muted p-3 font-mono text-sm flex items-center gap-2"><Terminal className="h-4 w-4 text-muted-foreground" /><code>headroom proxy --port 8787</code></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" />About</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Console Version</span><span className="font-mono">0.1.0</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Headroom</span><a href="https://github.com/headroomlabs-ai/headroom" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">GitHub <ExternalLink className="h-3 w-3" /></a></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Docs</span><a href="https://headroomlabs-ai.github.io/headroom/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">Documentation <ExternalLink className="h-3 w-3" /></a></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
