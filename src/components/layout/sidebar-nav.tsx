"use client";

import { siteConfig } from "@/config/site";
import { SidebarMenu, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { SidebarNavItem } from "./sidebar-nav-item";

export function SidebarNav() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {siteConfig.mainNav.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            tooltip={item.tooltip}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
