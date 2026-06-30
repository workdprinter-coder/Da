import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, Settings, Database, Wrench, FileText,
  ChevronLeft, ChevronRight, CircleDot, Waves, Triangle, Cog, Menu,
  Hexagon, ArrowRightLeft, Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalculator } from "@/context/calculator-context";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/spur-gear", label: "Spur Gear", icon: Cog },
  { href: "/helical-gear", label: "Helical Gear", icon: CircleDot },
  { href: "/worm-gear", label: "Worm Gear", icon: Waves },
  { href: "/straight-bevel", label: "Straight Bevel", icon: Hexagon },
  { href: "/spiral-bevel", label: "Spiral Bevel", icon: Triangle },
  { href: "/rack-pinion", label: "Rack & Pinion", icon: ArrowRightLeft },
  { href: "/lead-calc", label: "Lead Calculator", icon: Calculator },
  { href: "/materials", label: "Materials", icon: Database },
  { href: "/tools", label: "Eng. Tools", icon: Wrench },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const BADGE_MAP: Record<string, string> = {
  "/spur-gear": "spur",
  "/helical-gear": "helical",
  "/worm-gear": "worm",
  "/straight-bevel": "straight-bevel",
  "/spiral-bevel": "spiral-bevel",
  "/rack-pinion": "rack-pinion",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { storedCalcs } = useCalculator();

  const getBadge = (href: string) => {
    const key = BADGE_MAP[href];
    if (key && storedCalcs[key]) return "•";
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative z-30 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 h-full",
          collapsed ? "w-14" : "w-52",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-3 h-14 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <span className="text-xs font-semibold tracking-widest uppercase text-sidebar-foreground/60 truncate">
              Gear Calc
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto p-1 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors hidden md:flex items-center justify-center"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href !== "/" && location.startsWith(href));
            const badge = getBadge(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded text-sm transition-colors relative",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
                {badge && !collapsed && (
                  <span className="ml-auto text-primary text-lg leading-none">{badge}</span>
                )}
                {badge && collapsed && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="px-3 py-2 border-t border-sidebar-border">
            <p className="text-[10px] text-sidebar-foreground/30 leading-tight">Engineering Calculator</p>
            <p className="text-[10px] text-sidebar-foreground/20">v2.0 — Metric & Imperial</p>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 h-12 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-foreground">Gear Engineering Calculator</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
