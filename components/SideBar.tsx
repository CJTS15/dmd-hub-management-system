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
  Crown
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 bg-white border-b">
        <Link href="/">
          <div className="flex items-center gap-2">
            <Image
              src="/dmd-logo-trans.webp"
              alt="DMD Hub"
              width={180}
              height={40}
              className=""
              priority
            />
          </div>
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
                    isActive={pathname === item.url}
                    className="h-12 text-slate-600 hover:text-blue-600 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 font-medium transition-all duration-200"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-white p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
                asChild 
                onClick={handleLogout}
                className="h-10 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
            >
              <span>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}