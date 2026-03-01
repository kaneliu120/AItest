"use client";

import { Search, Bell, HelpCircle, Plus, Filter, Menu, Globe } from "lucide-react";
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
import { useLang } from "@/contexts/language-context";

interface HeaderProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function Header({ showMenuButton = false, onMenuClick }: HeaderProps) {
  const { t, lang, setLang } = useLang();

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
            placeholder={t("searchPlaceholder")}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          {t("filter")}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              {t("quickAdd")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("addNewItem")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t("newMCP")}</DropdownMenuItem>
            <DropdownMenuItem>{t("createWorkflow")}</DropdownMenuItem>
            <DropdownMenuItem>{t("addTask")}</DropdownMenuItem>
            <DropdownMenuItem>{t("recordIncome")}</DropdownMenuItem>
            <DropdownMenuItem>{t("freelanceProject")}</DropdownMenuItem>
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
            <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{t("freelanceUpdate")}</span>
                <span className="text-xs text-muted-foreground">just now</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("newProjectMatchesSkills")}
              </p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{t("financeAlert")}</span>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("monthlyGoalProgress")}
              </p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{t("systemUpdate")}</span>
                <span className="text-xs text-muted-foreground">1d ago</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Mission Control v1.0 is live
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              {t("viewAllNotifications")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title={t("language")}>
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLang("en")}
              className={lang === "en" ? "bg-accent" : ""}
            >
              🇺🇸 {t("english")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLang("zh")}
              className={lang === "zh" ? "bg-accent" : ""}
            >
              🇨🇳 {t("chinese")}
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
          {t("systemRunning")}
        </Badge>
      </div>
    </header>
  );
}