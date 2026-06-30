"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHeadroomContext } from "@/components/providers";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Search, Database, Layers, FolderKanban, Settings, Circle, Zap } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Requests", icon: Search },
  { href: "/cache", label: "Cache", icon: Database },
  { href: "/transforms", label: "Transforms", icon: Layers },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected, showingDemo } = useHeadroomContext();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold">Headroom Console</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Circle className={`h-2.5 w-2.5 fill-current ${connected ? "text-emerald-500" : "text-amber-500"}`} />
          <span className="text-xs text-muted-foreground">{connected ? "Connected" : "Disconnected"}</span>
          {showingDemo && <Badge variant="secondary" className="ml-auto text-[10px]">DEMO</Badge>}
        </div>
      </div>
    </aside>
  );
}
