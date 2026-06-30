"use client";

import { useState, useMemo } from "react";
import { useHeadroomContext } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowDownRight, Clock, Layers } from "lucide-react";
import { format } from "date-fns";
import { formatTokens } from "@/lib/format";
import type { DisplayRequest } from "@/lib/adapters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function RequestsPage() {
  const { requests, loading } = useHeadroomContext();
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selected, setSelected] = useState<DisplayRequest | null>(null);

  const models = useMemo(() => [...new Set(requests.map((r) => r.model))], [requests]);
  const projects = useMemo(() => [...new Set(requests.map((r) => r.project).filter(Boolean))], [requests]);

  const filtered = useMemo(() => requests.filter((r) => {
    if (modelFilter !== "all" && r.model !== modelFilter) return false;
    if (projectFilter !== "all" && r.project !== projectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.model.toLowerCase().includes(q) || r.project.toLowerCase().includes(q) || r.strategies.toLowerCase().includes(q);
    }
    return true;
  }), [requests, search, modelFilter, projectFilter]);

  const compressionDist = useMemo(() => {
    const buckets: Record<string, number> = { "0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0 };
    filtered.forEach((r) => {
      const red = (1 - r.compression_ratio) * 100;
      if (red < 20) buckets["0-20%"]++;
      else if (red < 40) buckets["20-40%"]++;
      else if (red < 60) buckets["40-60%"]++;
      else if (red < 80) buckets["60-80%"]++;
      else buckets["80-100%"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [filtered]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[600px]" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Request Explorer</h1><p className="text-muted-foreground">Inspect individual compression requests</p></div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Compression Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compressionDist}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center"><p className="text-sm text-muted-foreground">Avg Compression</p><p className="text-4xl font-bold">{filtered.length > 0 ? `${((1 - filtered.reduce((s, r) => s + r.compression_ratio, 0) / filtered.length) * 100).toFixed(1)}%` : "—"}</p></div>
            <div className="text-center"><p className="text-sm text-muted-foreground">Avg Latency</p><p className="text-4xl font-bold">{filtered.length > 0 ? `${(filtered.reduce((s, r) => s + r.latency_ms, 0) / filtered.length).toFixed(1)}ms` : "—"}</p></div>
            <div className="text-center"><p className="text-sm text-muted-foreground">Total Filtered</p><p className="text-4xl font-bold">{filtered.length}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Requests</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." className="pl-9 w-[200px]" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <Select value={modelFilter} onValueChange={(v) => setModelFilter(v ?? "all")}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Model" /></SelectTrigger><SelectContent><SelectItem value="all">All Models</SelectItem>{models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
              <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v ?? "all")}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Project" /></SelectTrigger><SelectContent><SelectItem value="all">All Projects</SelectItem>{projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Time</TableHead><TableHead>Model</TableHead><TableHead>Project</TableHead>
                <TableHead className="text-right">Before</TableHead><TableHead className="text-right">After</TableHead>
                <TableHead className="text-right">Saved</TableHead><TableHead className="text-right">Reduction</TableHead><TableHead>Strategies</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((req) => {
                  const reduction = (1 - req.compression_ratio) * 100;
                  return (
                    <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(req)}>
                      <TableCell className="font-mono text-xs">{format(new Date(req.timestamp), "HH:mm:ss")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs font-mono">{req.model}</Badge></TableCell>
                      <TableCell className="text-sm">{req.project || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatTokens(req.tokens_before)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatTokens(req.tokens_after)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-500">-{formatTokens(req.tokens_saved)}</TableCell>
                      <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Progress value={reduction} className="w-16 h-2" /><span className="text-xs font-mono w-12 text-right">{reduction.toFixed(0)}%</span></div></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{req.strategies}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DI icon={Clock} label="Timestamp" value={format(new Date(selected.timestamp), "yyyy-MM-dd HH:mm:ss")} />
                <DI icon={Layers} label="Model" value={selected.model} />
                <DI icon={ArrowDownRight} label="Compression" value={`${((1 - selected.compression_ratio) * 100).toFixed(1)}%`} />
                <DI icon={Clock} label="Latency" value={`${selected.latency_ms}ms`} />
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-medium">Token Comparison</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Before</span><span className="font-mono">{selected.tokens_before.toLocaleString()} tokens</span></div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} /></div>
                  <div className="flex justify-between text-sm"><span>After</span><span className="font-mono">{selected.tokens_after.toLocaleString()} tokens</span></div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selected.compression_ratio * 100}%` }} /></div>
                </div>
                <p className="text-sm text-emerald-500 font-medium">Saved {selected.tokens_saved.toLocaleString()} tokens</p>
              </div>
              {selected.strategies && (
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-2">Strategies</h4>
                  <div className="flex flex-wrap gap-2">{selected.strategies.split(",").map((t, i) => <Badge key={i} variant="secondary" className="font-mono text-xs">{t.trim()}</Badge>)}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DI({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-lg border p-3"><Icon className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div></div>;
}
