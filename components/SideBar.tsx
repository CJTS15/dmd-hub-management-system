"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Heart,
  Tag,
  LogOut,
  Gem,
  Crown,
  Settings2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Hub",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Exclusive",
    url: "/exclusive",
    icon: Gem,
  },
  {
    title: "Flexi",
    url: "/flexi",
    icon: Crown,
  },
  {
    title: "Pantry",
    url: "/pantry",
    icon: ShoppingCart,
  },
  {
    title: "Loyalty",
    url: "/loyalty",
    icon: Heart,
  },
  {
    title: "Packages",
    url: "/package",
    icon: Tag,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 bg-white border-b">
        <Link href="/">
          {/* 2. Conditional Rendering for Logo based on state */}
          {state === "expanded" ? (
            <div className="flex items-center gap-2 transition-all duration-300">
              <Image
                src="/dmd-logo-trans.webp"
                alt="DMD Hub"
                width={180}
                height={40}
                className="w-auto h-16 object-contain"
                priority
              />
            </div>
          ) : (
            // Small Icon when collapsed (You can use a small logo image here if you have one)
            <div className="flex items-center justify-center w-full transition-all duration-300">
               <Settings2 className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    className="h-12 text-slate-600 hover:text-blue-600 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 font-medium transition-all duration-200"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-6 w-6" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-white border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
                asChild 
                tooltip="Sign Out" 
                onClick={handleLogout}
                className="h-10 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
            >
              <span>
                <LogOut className="mr-2 h-6 w-6" /> 
                {/* The text inside span automatically hides when collapsed because of SidebarMenuButton logic */}
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}