"use client";

import { useState } from "react";
import { useHeadroomContext } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Coins, Zap } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { formatTokens, formatUSD } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(221,83%,53%)", "hsl(160,60%,45%)", "hsl(43,96%,56%)", "hsl(350,89%,60%)", "hsl(280,65%,60%)", "hsl(200,70%,50%)"];

export default function ProjectsPage() {
  const { data, loading } = useHeadroomContext();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const projects = data.projects ?? [];
  const totalTokens = projects.reduce((s, p) => s + p.tokensSaved, 0);
  const totalSavings = projects.reduce((s, p) => s + p.savingsUsd, 0);
  const totalRequests = projects.reduce((s, p) => s + p.requests, 0);
  const pieData = projects.map((p) => ({ name: p.name, value: p.tokensSaved }));

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[500px]" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Projects & Agents</h1><p className="text-muted-foreground">Per-project savings breakdown</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Projects" value={projects.length.toString()} icon={FolderKanban} />
        <StatsCard title="Total Tokens Saved" value={formatTokens(totalTokens)} subtitle={`across ${totalRequests.toLocaleString()} requests`} icon={Zap} color="text-blue-500" />
        <StatsCard title="Total Cost Saved" value={formatUSD(totalSavings)} icon={Coins} color="text-emerald-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Savings by Project</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projects}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatTokens(v)} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatTokens(v), "Tokens Saved"]} />
                  <Bar dataKey="tokensSaved" name="Tokens Saved" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Token Share</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [formatTokens(v), "Tokens"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {projects.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={selectedProject ?? projects[0]?.name ?? ""} onValueChange={setSelectedProject}>
              <TabsList className="mb-4">{projects.map((p) => <TabsTrigger key={p.name} value={p.name} className="text-xs">{p.name}</TabsTrigger>)}</TabsList>
              {projects.map((project) => (
                <TabsContent key={project.name} value={project.name}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4 text-center"><p className="text-sm text-muted-foreground">Tokens Saved</p><p className="text-2xl font-bold">{formatTokens(project.tokensSaved)}</p></div>
                    <div className="rounded-lg border p-4 text-center"><p className="text-sm text-muted-foreground">Cost Saved</p><p className="text-2xl font-bold">{formatUSD(project.savingsUsd)}</p></div>
                    <div className="rounded-lg border p-4 text-center"><p className="text-sm text-muted-foreground">Requests</p><p className="text-2xl font-bold">{project.requests.toLocaleString()}</p></div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
