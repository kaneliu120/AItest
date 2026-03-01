'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
        setIsSidebarOpen(false); // 移动端默认关闭侧边栏
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
        setIsSidebarOpen(true); // 桌面端默认打开侧边栏
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 移动端点击外部关闭侧边栏
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isSidebarOpen && screenSize === 'mobile' && 
          !target.closest('.sidebar-container') && 
          !target.closest('.menu-button')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen, screenSize]);

  // 获取屏幕尺寸图标
  const getScreenIcon = () => {
    switch (screenSize) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 移动端菜单按钮 */}
      {screenSize === 'mobile' && (
        <div className="fixed bottom-6 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="menu-button h-12 w-12 rounded-full shadow-lg bg-background/90 backdrop-blur-sm border-slate-200"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {/* 屏幕尺寸指示器（仅开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm">
          {getScreenIcon()}
          <span className="capitalize">{screenSize}</span>
        </div>
      )}

      <div className="flex">
        {/* 侧边栏 */}
        <div className={`
          sidebar-container
          ${screenSize === 'mobile' 
            ? 'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out'
            : 'relative'
          }
          ${isSidebarOpen || screenSize !== 'mobile' ? 'translate-x-0' : '-translate-x-full'}
          ${screenSize === 'mobile' ? 'w-64' : screenSize === 'tablet' ? 'w-56' : 'w-64'}
        `}>
          <Sidebar 
            onClose={() => screenSize === 'mobile' && setIsSidebarOpen(false)}
            compact={screenSize === 'tablet'}
          />
        </div>

        {/* 主内容区域 */}
        <div className={`
          flex-1 flex flex-col
          ${screenSize === 'mobile' && isSidebarOpen ? 'ml-0' : ''}
          ${screenSize === 'mobile' ? 'min-h-screen' : ''}
        `}>
          {/* 移动端遮罩 */}
          {isSidebarOpen && screenSize === 'mobile' && (
            <div 
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <Header 
            showMenuButton={screenSize === 'mobile'}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          
          <main className={`
            flex-1 overflow-auto
            ${screenSize === 'mobile' ? 'p-4' : 'p-6'}
            ${screenSize === 'tablet' ? 'p-4' : ''}
          `}>
            {/* 响应式容器 */}
            <div className={`
              mx-auto
              ${screenSize === 'mobile' ? 'w-full max-w-full' : ''}
              ${screenSize === 'tablet' ? 'w-full max-w-5xl' : ''}
              ${screenSize === 'desktop' ? 'w-full max-w-7xl' : ''}
            `}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// 响应式工具组件
export function ResponsiveContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`
      w-full mx-auto
      px-4 sm:px-6 lg:px-8
      ${className}
    `}>
      {children}
    </div>
  );
}

export function ResponsiveGrid({ 
  children, 
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}: { 
  children: React.ReactNode;
  className?: string;
  cols?: { mobile: number; tablet: number; desktop: number };
}) {
  return (
    <div className={`
      grid gap-4
      grid-cols-${cols.mobile}
      sm:grid-cols-${cols.tablet}
      lg:grid-cols-${cols.desktop}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function ResponsiveCard({ 
  children, 
  className = '',
  padding = 'default'
}: { 
  children: React.ReactNode;
  className?: string;
  padding?: 'default' | 'compact' | 'none';
}) {
  const paddingClasses = {
    default: 'p-4 sm:p-6',
    compact: 'p-3 sm:p-4',
    none: 'p-0',
  };

  return (
    <div className={`
      rounded-lg border bg-card text-card-foreground shadow-sm
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function ResponsiveText({
  children,
  size = 'default',
  className = '',
}: {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    default: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}

// 移动端优化钩子
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, isTablet, isDesktop };
}