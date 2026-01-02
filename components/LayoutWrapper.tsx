"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/SideBar"; 
import { Toaster } from "@/components/ui/sonner";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // CASE 1: Login Page (Render content + Toaster, NO Sidebar)
  if (isLoginPage) {
    return (
      <main className="w-full min-h-screen bg-slate-100 flex items-center justify-center">
        {children}
        <Toaster position="top-center" />
      </main>
    );
  }

  // CASE 2: Internal Pages (Render Sidebar + Content + Toaster)
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full min-h-screen bg-slate-50">
        <div className="p-4 flex items-center gap-2 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm">
          <SidebarTrigger />
          <span className="text-sm text-slate-400 md:hidden">Menu</span>
        </div>
        {children}
      </main>
      <Toaster position="top-center" />
    </SidebarProvider>
  );
}