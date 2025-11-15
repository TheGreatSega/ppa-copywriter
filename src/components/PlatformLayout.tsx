import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
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
import { Menu } from "lucide-react";

const platforms = [
  { title: "Google Ads", url: "/dashboard/google-ads", iconUrl: "/icons/google-ads.png" },
  { title: "Meta Ads", url: "/dashboard/meta", iconUrl: "/icons/meta.png" },
  { title: "X (Twitter)", url: "/dashboard/x", iconUrl: "/icons/x.png" },
  { title: "TikTok", url: "/dashboard/tiktok", iconUrl: "/icons/tiktok.png" },
];

function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <div className="p-3 border-b flex items-center justify-start">
        <SidebarTrigger className="h-6 w-6">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platforms</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platforms.map((platform) => (
                <SidebarMenuItem key={platform.title}>
                  <SidebarMenuButton asChild size="sm" className="!p-1 group-data-[collapsible=icon]:justify-center">
                    <NavLink
                      to={platform.url}
                      className={({ isActive }) =>
                        isActive ? "bg-accent text-accent-foreground font-medium" : ""
                      }
                    >
                      <img 
                        src={platform.iconUrl} 
                        alt={platform.title}
                        className="size-5 group-data-[collapsible=icon]:size-4 object-contain shrink-0 rounded"
                      />
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
  const location = useLocation();
  
  const currentPlatform = platforms.find(p => location.pathname.includes(p.url));
  const platformIcon = currentPlatform?.iconUrl || "/icons/google-ads.png";
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
            <div className="px-4 py-3 flex items-center gap-3">
              <img 
                src={platformIcon} 
                alt="Platform logo" 
                className="h-8 w-8 rounded-xl object-contain"
              />
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
