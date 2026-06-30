"use client";

import { useHeadroomContext } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Eye } from "lucide-react";

export function Header() {
  const { mode, connected, liveHasData, showingDemo, toggleDemo, proxyUrl, refresh, loading } = useHeadroomContext();

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <code className="text-xs text-muted-foreground font-mono">{proxyUrl}</code>
        <Badge variant={connected ? "default" : "secondary"} className="text-[10px]">
          {connected ? "CONNECTED" : "OFFLINE"}
        </Badge>
        {showingDemo && (
          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
            DEMO DATA
          </Badge>
        )}
        {connected && !liveHasData && (
          <span className="text-[11px] text-muted-foreground">
            Proxy has no traffic yet
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {connected && (
          <Button variant="ghost" size="sm" onClick={toggleDemo} className="text-xs gap-1.5 h-8">
            <Eye className="h-3.5 w-3.5" />
            {showingDemo ? "Show Live" : "Show Demo"}
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <a href="https://github.com/headroomlabs-ai/headroom" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
        </a>
      </div>
    </header>
  );
}
