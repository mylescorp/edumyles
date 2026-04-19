"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavItem } from "@/lib/routes";

interface MobileNavProps {
  navItems: NavItem[];
  installedModules?: string[];
}

export function MobileNav({ navItems, installedModules }: MobileNavProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => {
    if (!item.module) return true;
    if (!installedModules) return true;
    return installedModules.includes(item.module);
  });

  return (
    <Sheet>
      <SheetTrigger className="p-4 md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <div className="flex h-16 items-center gap-2.5 border-b px-4" style={{ background: "linear-gradient(135deg,#061A12,#0C3020)" }}>
          <Image src="/logo-icon.svg" alt="EduMyles" width={32} height={32} className="h-auto w-auto flex-shrink-0" priority />
          <span className="text-sm font-bold" style={{ color: "#D4AF37" }}>EduMyles</span>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="flex flex-col gap-1 p-4">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
