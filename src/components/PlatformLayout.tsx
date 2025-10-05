import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Search, Facebook, Twitter, Music } from "lucide-react";

const platforms = [
  { title: "Google Ads", url: "/dashboard/google-ads", icon: Search },
  { title: "Meta Ads", url: "/dashboard/meta", icon: Facebook },
  { title: "X (Twitter)", url: "/dashboard/x", icon: Twitter },
  { title: "TikTok", url: "/dashboard/tiktok", icon: Music },
];

function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platforms</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platforms.map((platform) => (
                <SidebarMenuItem key={platform.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={platform.url}
                      className={({ isActive }) =>
                        isActive ? "bg-accent text-accent-foreground font-medium" : ""
                      }
                    >
                      <platform.icon className="h-4 w-4" />
                      {open && <span>{platform.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function PlatformLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
            <div className="px-4 py-3 flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500" />
              <div>
                <h1 className="text-lg font-semibold leading-tight">AI Ad Copy Generator</h1>
                <p className="text-xs text-muted-foreground">Multi-platform ad copy generation powered by AI</p>
              </div>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
