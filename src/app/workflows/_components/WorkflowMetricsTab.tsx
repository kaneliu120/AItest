'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import type {
  WorkflowMetrics, TrendPoint, DlqItem, DlqStats, DiagnosticHistoryItem,
} from './types';

interface WorkflowMetricsTabProps {
  metrics: WorkflowMetrics | null;
  metricsWindow: '1h' | '24h' | '7d';
  trendPoints: TrendPoint[];
  dlqItems: DlqItem[];
  dlqStats: DlqStats | null;
  dlqPage: number;
  setDlqPage: React.Dispatch<React.SetStateAction<number>>;
  dlqQuery: string;
  setDlqQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedDlq: Record<string, boolean>;
  setSelectedDlq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  diagHistory: DiagnosticHistoryItem[];
  diagKindFilter: 'all' | 'telegram-env' | 'discord-env' | 'network-check' | 'generic-env';
  setDiagKindFilter: React.Dispatch<React.SetStateAction<'all' | 'telegram-env' | 'discord-env' | 'network-check' | 'generic-env'>>;
  diagHoursFilter: '24' | '72' | '168';
  setDiagHoursFilter: React.Dispatch<React.SetStateAction<'24' | '72' | '168'>>;
  replayDlq: (id?: string) => void;
  fetchDlq: () => void;
  clearDlq: (opts: { ids?: string[]; all?: boolean }) => void;
  fetchDiagHistory: (kind?: 'all' | 'telegram-env' | 'discord-env' | 'network-check' | 'generic-env', hours?: '24' | '72' | '168') => void;
  copyDiagnostic: (errorText: string) => void;
  runDiagnostic: (errorText: string) => void;
}

export function WorkflowMetricsTab({
  metrics, metricsWindow, trendPoints,
  dlqItems, dlqStats, dlqPage, setDlqPage, dlqQuery, setDlqQuery, selectedDlq, setSelectedDlq,
  diagHistory, diagKindFilter, setDiagKindFilter, diagHoursFilter, setDiagHoursFilter,
  replayDlq, fetchDlq, clearDlq, fetchDiagHistory, copyDiagnostic, runDiagnostic,
}: WorkflowMetricsTabProps) {
  const filteredDlq = dlqItems.filter(item => {
    const q = dlqQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.message.toLowerCase().includes(q) ||
      item.stepId.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });
  const dlqPageSize = 10;
  const dlqTotalPages = Math.max(1, Math.ceil(filteredDlq.length / dlqPageSize));
  const safeDlqPage = Math.min(dlqPage, dlqTotalPages);
  const pagedDlq = filteredDlq.slice((safeDlqPage - 1) * dlqPageSize, safeDlqPage * dlqPageSize);

  return (
    <TabsContent value="metrics">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Metrics</CardTitle>
          <CardDescription>Detailed workflow execution metrics and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <div className="space-y-6">
              {/* Overall Metrics */}
              <div className="text-xs text-gray-500 mb-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                Metrics window: {metricsWindow} · Source: {(metrics as any)?.source || 'unknown'}
              </div>
              {metrics.alerts && metrics.alerts.length > 0 && (
                <div className="mb-3 space-y-2">
                  {metrics.alerts.map((a) => (
                    <div
                      key={`${a.code}-${a.message}`}
                      className={`text-sm border rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${a.level === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : a.level === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                    >
                      <div>
                        <span className="font-medium mr-2">[{a.code}]</span>
                        {a.message}
                      </div>
                      {(a.code === 'DLQ_BACKLOG' || a.code === 'DLQ_BACKLOG_HIGH') && (
                        <Button size="sm" className="rounded-lg" onClick={() => replayDlq()}>Replay All DLQ</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Execution Stats</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Total:</span><span className="font-bold">{metrics.totalWorkflows}</span></div>
                      <div className="flex justify-between"><span>Success:</span><span className="font-bold text-green-600">{metrics.completedWorkflows}</span></div>
                      <div className="flex justify-between"><span>Failed:</span><span className="font-bold text-red-600">{metrics.failedWorkflows}</span></div>
                      <div className="flex justify-between"><span>Running:</span><span className="font-bold text-blue-600">{metrics.runningWorkflows}</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Performance Metrics</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Success Rate:</span><span className="font-bold">{metrics.successRate.toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span>Avg Time:</span><span className="font-bold">{Math.round(metrics.averageExecutionTime / 1000)}s</span></div>
                      <div className="flex justify-between">
                        <span>StepsSuccess Rate:</span>
                        <span className="font-bold">
                          {Object.keys(metrics.stepSuccessRate).length > 0
                            ? `${(Object.values(metrics.stepSuccessRate).reduce((a, b) => a + b, 0) / Object.values(metrics.stepSuccessRate).length).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Module Usage (Runtime)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(metrics.moduleUsageRuntime || metrics.moduleUsage)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([module, count]) => (
                          <div key={module} className="flex justify-between">
                            <span className="capitalize">{module}:</span>
                            <span className="font-bold">{count}</span>
                          </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Falls back to Design usage if no Runtime data</div>
                  </CardContent>
                </Card>
              </div>

              {/* Trend Charts */}
              <Card className="rounded-2xl shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 tracking-tight">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Metrics Trend ({metricsWindow}）
                  </CardTitle>
                  <CardDescription>Success Rate and average duration time series</CardDescription>
                </CardHeader>
                <CardContent>
                  {trendPoints.length === 0 ? (
                    <div className="text-sm text-slate-500">No trend data available</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs text-slate-500 mb-2">Success Rate Trend</div>
                        <div className="space-y-2">
                          {trendPoints.slice(-8).map((p) => (
                            <div key={`${p.bucket}-sr`}>
                              <div className="flex justify-between text-xs mb-1">
                                <span>{new Date(p.bucket).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{p.successRate.toFixed(1)}%</span>
                              </div>
                              <Progress value={Math.min(100, Math.max(0, p.successRate))} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-2">Avg Duration Trend (ms)</div>
                        <div className="space-y-2">
                          {trendPoints.slice(-8).map((p) => (
                            <div key={`${p.bucket}-avg`}>
                              <div className="flex justify-between text-xs mb-1">
                                <span>{new Date(p.bucket).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{Math.round(p.averageExecutionTime)}ms</span>
                              </div>
                              <Progress value={Math.min(100, p.averageExecutionTime / 300)} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* StepsSuccess Rate */}
              <Card>
                <CardHeader><CardTitle>StepsSuccess Rate</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.stepSuccessRate)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([stepKey, successRate]) => (
                        <div key={stepKey}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="truncate">{stepKey}</span>
                            <span>{successRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={successRate} className="h-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Module Failed Top N */}
              <Card>
                <CardHeader>
                  <CardTitle>Module Failed Top N</CardTitle>
                  <CardDescription>Based on real execution failure statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.moduleFailureTopN && metrics.moduleFailureTopN.length > 0 ? (
                    <div className="space-y-2 text-sm">
                      {metrics.moduleFailureTopN.slice(0, 10).map((x) => (
                        <div key={x.module} className="flex justify-between">
                          <span>{x.module}</span>
                          <span className="text-red-600 font-medium">{x.failures}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No failure data</div>
                  )}
                </CardContent>
              </Card>

              {/* Notification DLQ Panel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle>Notification Dead Letter Queue (DLQ)</CardTitle>
                      <CardDescription>Failed notifications can be searched, paged, replayed, or cleared</CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => fetchDlq()}>RefreshDLQ</Button>
                      <Button size="sm" onClick={() => replayDlq()}>Batch Replay (10)</Button>
                      <Button size="sm" variant="outline" onClick={() => clearDlq({ ids: Object.keys(selectedDlq).filter(id => selectedDlq[id]) })}>Clear Selected</Button>
                      <Button size="sm" variant="outline" onClick={() => clearDlq({ all: true })}>Clear All DLQ</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dlqStats && (
                    <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="border rounded p-2">
                        <div className="font-medium mb-1">Error Top 5</div>
                        {dlqStats.topErrors.slice(0, 5).map((e) => (
                          <div key={e.error} className="flex items-center justify-between gap-2">
                            <span className="truncate" title={e.error}>{e.error}</span>
                            <div className="flex items-center gap-2">
                              <span>{e.count}</span>
                              <Button size="sm" variant="outline" onClick={() => copyDiagnostic(e.error)}>Copy Diagnostic</Button>
                              <Button size="sm" onClick={() => runDiagnostic(e.error)}>Run Diagnostic</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border rounded p-2">
                        <div className="font-medium mb-1">Actions Top 5</div>
                        {dlqStats.topActions.slice(0, 5).map((a) => (
                          <div key={a.action} className="flex justify-between gap-2">
                            <span>{a.action}</span>
                            <span>{a.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <input
                      value={dlqQuery}
                      onChange={(e) => { setDlqQuery(e.target.value); setDlqPage(1); }}
                      placeholder="Search title/message/stepId/jobId..."
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>

                  {filteredDlq.length === 0 ? (
                    <div className="text-sm text-gray-500">No matching dead letter messages</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {pagedDlq.map((item) => (
                          <div key={item.id} className="border rounded p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!selectedDlq[item.id]}
                                  onChange={(e) => setSelectedDlq(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                />
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  <div className="text-xs text-gray-500">{item.stepId} · attempts: {item.attempts || 0} · {item.id}</div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => replayDlq(item.id)}>Replay</Button>
                            </div>
                            <div className="text-sm mt-2">{item.message}</div>
                            {item.lastError && (
                              <div className="text-xs text-red-600 mt-1">Error: {item.lastError}</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div>Page {safeDlqPage}/{dlqTotalPages} · Total {filteredDlq.length}</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={safeDlqPage <= 1} onClick={() => setDlqPage(p => Math.max(1, p - 1))}>Previous</Button>
                          <Button size="sm" variant="outline" disabled={safeDlqPage >= dlqTotalPages} onClick={() => setDlqPage(p => Math.min(dlqTotalPages, p + 1))}>Next</Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Diagnostic History */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                      <div className="font-medium text-sm">Diagnostic History (filtered)</div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <select
                          value={diagKindFilter}
                          onChange={(e) => {
                            const v = e.target.value as typeof diagKindFilter;
                            setDiagKindFilter(v);
                            fetchDiagHistory(v, diagHoursFilter);
                          }}
                          className="border rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="all">All Types</option>
                          <option value="telegram-env">telegram-env</option>
                          <option value="discord-env">discord-env</option>
                          <option value="network-check">network-check</option>
                          <option value="generic-env">generic-env</option>
                        </select>
                        <select
                          value={diagHoursFilter}
                          onChange={(e) => {
                            const v = e.target.value as typeof diagHoursFilter;
                            setDiagHoursFilter(v);
                            fetchDiagHistory(diagKindFilter, v);
                          }}
                          className="border rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="24">Last 24h</option>
                          <option value="72">Last 72h</option>
                          <option value="168">Last 7d</option>
                        </select>
                        <Button size="sm" variant="outline" onClick={() => fetchDiagHistory(diagKindFilter, diagHoursFilter)}>RefreshHistory</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(JSON.stringify(diagHistory, null, 2));
                              alert('Diagnostic history copied (JSON)');
                            } catch {
                              alert('Copy failed');
                            }
                          }}
                        >ExportJSON</Button>
                      </div>
                    </div>
                    {diagHistory.length === 0 ? (
                      <div className="text-xs text-gray-500">No diagnostic history</div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {diagHistory.map((h) => (
                          <div key={h.id} className="border rounded p-2 text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium">{h.kind}</span>
                              <span className="text-gray-500">{new Date(h.createdAt).toLocaleString('zh-CN')}</span>
                            </div>
                            <div className="text-gray-600">{h.command}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No metrics data</div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
