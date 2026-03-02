"use client";

import { ComponentProps, useMemo } from "react";
import { HomeIcon, LogOutIcon, SchoolIcon, MapPinIcon } from "lucide-react";
import { useAuth } from "@/providers/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVIGATION_ITEMS = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Trips",
    url: "/trips",
    icon: MapPinIcon,
  },
];

const SUPER_USER_NAVIGATION_ITEMS = [
  {
    title: "Schools",
    url: "/schools",
    icon: SchoolIcon,
  },
];

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const items = useMemo(
    () => [
      ...NAVIGATION_ITEMS,
      ...(user?.is_superuser ? SUPER_USER_NAVIGATION_ITEMS : []),
    ],
    [user?.is_superuser],
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <SchoolIcon />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Schooly</span>
                  <span className="truncate text-xs">Payments</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu className="space-y-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="text-destructive hover:text-destructive"
            >
              <LogOutIcon />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
