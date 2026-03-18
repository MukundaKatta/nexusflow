"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  History,
  Key,
  BookTemplate,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/executions", label: "Executions", icon: History },
  { href: "/credentials", label: "Credentials", icon: Key },
  { href: "/templates", label: "Templates", icon: BookTemplate },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">NexusFlow</span>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t p-4">
          <div className="rounded-lg bg-primary/5 p-4">
            <h4 className="text-sm font-semibold">NexusFlow v1.0</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Open-source workflow automation with AI capabilities
            </p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
