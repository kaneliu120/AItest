import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-background text-foreground`}>
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