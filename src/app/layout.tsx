import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/language-context";

// 使用系统字体栈替代 next/font/google（解决 Turbopack 工作区根目录检测问题）
const inter = { className: 'font-sans' };

export const metadata: Metadata = {
  title: "Mission Control - Intelligent MCP Hub",
  description: "One hub, infinite scale: Visual monitoring + Intelligent MCP development + Automated workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            <ResponsiveLayout>
              {children}
            </ResponsiveLayout>
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}