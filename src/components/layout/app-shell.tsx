"use client";

import * as React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/logo";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import Link from "next/link";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4 items-center flex">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
            <div className="md:hidden">
                 <SidebarTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SidebarTrigger>
            </div>
            <div className="flex-1">
              {/* Placeholder for potential header content like search or user menu */}
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <SidebarRail />
    </SidebarProvider>
  );
}
