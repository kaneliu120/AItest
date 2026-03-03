'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Settings, Sun, Moon, Globe, Database, Server, Activity,
  RefreshCw, CheckCircle, AlertTriangle,
} from 'lucide-react';

interface HealthData {
  overallHealth: number;
  components: Array<{ name: string; status: string; description: string; uptime: string }>;
  metrics: { cpuUsage: number; memoryUsage: number; heapUsedMB: number; heapTotalMB: number; uptimeSec: number };
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedLang = localStorage.getItem('mc-lang') as 'en' | 'zh' | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);

    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.success) setHealth(data.data);
    } catch { /* health check best-effort */ }
    setLoading(false);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const switchLanguage = (lang: 'en' | 'zh') => {
    setLanguage(lang);
    localStorage.setItem('mc-lang', lang);
    window.location.reload();
  };

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const t = language === 'en'
    ? {
        title: 'Settings',
        subtitle: 'Application preferences and system information',
        appearance: 'Appearance',
        appearanceDesc: 'Customize the look and feel',
        themeLabel: 'Theme',
        light: 'Light',
        dark: 'Dark',
        languageLabel: 'Language',
        system: 'System Information',
        systemDesc: 'Runtime environment and health status',
        version: 'Version',
        environment: 'Environment',
        database: 'Database',
        uptime: 'Uptime',
        cpu: 'CPU',
        memory: 'Memory',
        heap: 'Heap',
        healthScore: 'Health Score',
        components: 'Components',
        refresh: 'Refresh',
      }
    : {
        title: 'Settings',
        subtitle: 'Application preferences and system information',
        appearance: 'Appearance',
        appearanceDesc: 'Customize interface style',
        themeLabel: 'Theme',
        light: 'Light',
        dark: 'Dark',
        languageLabel: 'Language',
        system: 'System Information',
        systemDesc: 'Runtime environment and health status',
        version: 'Version',
        environment: 'Environment',
        database: 'Database',
        uptime: 'Uptime',
        cpu: 'CPU',
        memory: 'Memory',
        heap: 'Heap',
        healthScore: 'Health Score',
        components: 'Components',
        refresh: 'Refresh',
      };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-8 h-8 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5" />
            {t.appearance}
          </CardTitle>
          <CardDescription>{t.appearanceDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.themeLabel}</span>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
              {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'light' ? t.light : t.dark}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.languageLabel}</span>
            <div className="flex gap-2">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchLanguage('en')}
                className="gap-1"
              >
                <Globe className="w-4 h-4" /> English
              </Button>
              <Button
                variant={language === 'zh' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchLanguage('zh')}
                className="gap-1"
              >
                <Globe className="w-4 h-4" /> ZH
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                {t.system}
              </CardTitle>
              <CardDescription>{t.systemDesc}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchHealth} className="gap-1">
              <RefreshCw className="w-4 h-4" /> {t.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : health ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard label={t.version} value="2.0.0" />
                <InfoCard label={t.environment} value={process.env.NODE_ENV || 'development'} />
                <InfoCard label={t.database} value="PostgreSQL" icon={<Database className="w-4 h-4 text-blue-500" />} />
                <InfoCard label={t.uptime} value={formatUptime(health.metrics.uptimeSec)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label={t.cpu} value={health.metrics.cpuUsage} unit="%" warn={80} />
                <MetricCard label={t.memory} value={health.metrics.memoryUsage} unit="%" warn={80} />
                <MetricCard
                  label={t.heap}
                  value={health.metrics.heapUsedMB}
                  unit={`/ ${health.metrics.heapTotalMB} MB`}
                  warn={health.metrics.heapTotalMB * 0.9}
                />
                <InfoCard
                  label={t.healthScore}
                  value={`${health.overallHealth}/100`}
                  icon={
                    health.overallHealth >= 80
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  }
                />
              </div>

              {/* Components */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Activity className="w-4 h-4" /> {t.components}
                </h3>
                <div className="space-y-1">
                  {health.components.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                      <span>{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{c.description}</span>
                        <Badge variant={c.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Unable to fetch system health</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, warn }: { label: string; value: number; unit: string; warn: number }) {
  const isWarning = value >= warn;
  return (
    <div className={`rounded-lg p-3 ${isWarning ? 'bg-yellow-50' : 'bg-slate-50'}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <span className={`text-sm font-semibold ${isWarning ? 'text-yellow-700' : ''}`}>
        {Math.round(value)}{unit}
      </span>
    </div>
  );
}
