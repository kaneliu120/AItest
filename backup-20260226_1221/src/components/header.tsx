"use client";

import { Search, Bell, HelpCircle, Plus, Filter, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function Header({ showMenuButton = false, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6 shadow-[0_1px_0_rgba(0,0,0,.05)]">
      {/* Menu Button (Mobile) */}
      {showMenuButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索工具、工作流或数据..."
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          筛选
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              快速添加
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>添加新项目</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>新建工具</DropdownMenuItem>
            <DropdownMenuItem>创建工作流</DropdownMenuItem>
            <DropdownMenuItem>添加任务</DropdownMenuItem>
            <DropdownMenuItem>记录收入</DropdownMenuItem>
            <DropdownMenuItem>外包项目</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>通知</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">外包项目更新</span>
                <span className="text-xs text-muted-foreground">刚刚</span>
              </div>
              <p className="text-sm text-muted-foreground">
                有新的AI开发项目匹配您的技能
              </p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">财务提醒</span>
                <span className="text-xs text-muted-foreground">2小时前</span>
              </div>
              <p className="text-sm text-muted-foreground">
                本月收入目标完成 45%
              </p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">系统更新</span>
                <span className="text-xs text-muted-foreground">1天前</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Mission Control v1.0 已上线
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              查看所有通知
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* Status Badge */}
        <Badge variant="outline" className="gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          系统运行中
        </Badge>
      </div>
    </header>
  );
}