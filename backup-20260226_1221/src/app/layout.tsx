import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Toaster } from "@/components/ui/toaster";

// 使用系统字体栈替代 next/font/google（解决 Turbopack 工作区根目录检测问题）
const inter = { className: 'font-sans' };

export const metadata: Metadata = {
  title: "Mission Control - 智能工具中心",
  description: "一个中心，无限扩展：可视化监控 + 智能工具开发 + 自动化工作流",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ResponsiveLayout>
            {children}
          </ResponsiveLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}