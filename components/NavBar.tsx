"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Heart,
  Tag,
  LogOut,
  Menu,
  Gem,
  Crown
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Define navigation items in one place to avoid duplication
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/exclusive", label: "Exclusive", icon: Gem },
    { href: "/flexi", label: "Reports", icon: Crown },
    { href: "/pantry", label: "Pantry", icon: ShoppingCart },
    { href: "/loyalty", label: "Loyalty", icon: Heart },
    { href: "/package", label: "Package", icon: Tag },
    { href: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <nav className="border-b bg-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Logo Area */}
        <Link href="/">
          <Image
            src="/dmd-logo-trans.webp"
            alt="DMD Hub"
            width={180}
            height={40}
            className="rounded-lg w-auto h-auto"
            priority // Changed from 'loading="eager"' to 'priority' for Next.js best practice
          />
        </Link>

        {/* --- DESKTOP MENU (Hidden on Mobile) --- */}
        <div className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              <item.icon size={16} /> {item.label}
            </Link>
          ))}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut size={16} className="mr-2" /> Sign Out
          </Button>
        </div>

        {/* --- MOBILE MENU (Hamburger) --- */}
        <div className="lg:hidden p-8">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-slate-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="text-left p-8">Menu</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-4 px-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)} // Close menu on click
                    className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                  >
                    <item.icon size={18} /> {item.label}
                  </Link>
                ))}

                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }} 
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                >
                  <LogOut size={18} className="mr-3" /> Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  );
}