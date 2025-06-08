"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface SidebarMenuItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  submenu?: SidebarMenuItemProps[];
  className?: string;
  target?: string;
}

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  tooltip,
  className,
  target,
}: SidebarMenuItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <SidebarMenuItem className={cn(className)}>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={tooltip || label}
      >
        <Link href={href} target={target}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
