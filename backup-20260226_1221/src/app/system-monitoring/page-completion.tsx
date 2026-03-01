'use client';

// 这是系统监控页面的完成部分，需要合并到主文件中

// 在文件末尾添加以下内容

                  {/* 告警标签页 */}
                  <TabsContent value="alerts" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-medium">系统告警</CardTitle>
                            <CardDescription>
                              实时监控系统告警和通知
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">
                              {data.summary.criticalAlerts} 严重
                            </Badge>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                              {data.summary.warningAlerts} 警告
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {data.alerts.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
                            <h3 className="mt-4 font-medium">无活跃告警</h3>
                            <p className="text-sm text-slate-500 mt-1">所有系统组件运行正常</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {data.alerts.map((alert) => (
                              <div
                                key={alert.id}
                                className={`p-4 rounded-lg border ${
                                  alert.severity === 'critical'
                                    ? 'bg-rose-50 border-rose-200'
                                    : 'bg-amber-50 border-amber-200'
                                } ${
                                  acknowledgedAlerts.includes(alert.id) ? 'opacity-60' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    {alert.severity === 'critical' ? (
                                      <AlertOctagon className="h-5 w-5 text-rose-600 mt-0.5" />
                                    ) : (
                                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    )}
                                    <div>
                                      <div className="font-medium">{alert.message}</div>
                                      <div className="text-sm text-slate-600 mt-1">
                                        组件: {alert.componentId} | 指标: {alert.metric}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-2">
                                        {new Date(alert.timestamp).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!acknowledgedAlerts.includes(alert.id) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => acknowledgeAlert(alert.id)}
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        确认
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <div className="text-slate-500">当前值</div>
                                      <div className="font-medium">{alert.currentValue}</div>
                                    </div>
                                    <div>
                                      <div className="text-slate-500">阈值</div>
                                      <div className="font-medium">{alert.threshold}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-sm text-slate-500">
                            共 {data.alerts.length} 个告警 ({data.summary.criticalAlerts} 严重, {data.summary.warningAlerts} 警告)
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Filter className="h-3 w-3 mr-1" />
                              筛选
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              导出
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          );
        }

        // 需要导入 os 模块
        import os from 'os';

        // 在文件顶部添加以下导入
        // import os from 'os';

        // 注意：需要将这段代码合并到主文件的相应位置