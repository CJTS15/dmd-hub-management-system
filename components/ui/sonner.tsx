"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // 1. Base Toast Style (White background, shadow, border)
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          
          // 2. Text Styles
          description: "group-[.toast]:text-slate-500",
          
          // 3. Button Styles
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500",

          // 4. State Specific Styles (Add these!)
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-700",
          success: "group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-700",
          warning: "group-[.toaster]:bg-orange-50 group-[.toaster]:border-orange-200 group-[.toaster]:text-orange-700",
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-700",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
