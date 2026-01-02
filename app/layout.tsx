import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/SideBar";
import { Toaster } from "@/components/ui/sonner";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DMD Co-working Space & Study Hub",
  description: "Develop Minds Daily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap children with AuthProvider */}
        <AuthProvider>
           <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}