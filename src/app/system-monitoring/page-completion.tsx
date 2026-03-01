'use client';

// This is the completion section of the system monitoring page, to be merged into the main file

// Add the following content at the end of the file

                  {/* Alerts tab */}
                  <TabsContent value="alerts" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                            <CardDescription>
                              Real-time system alert and notification monitoring
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">
                              {data.summary.criticalAlerts} Critical
                            </Badge>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                              {data.summary.warningAlerts} Warning
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {data.alerts.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
                            <h3 className="mt-4 font-medium">No Active Alerts</h3>
                            <p className="text-sm text-slate-500 mt-1">All system components are running normally</p>
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
                                        Component: {alert.componentId} | Metric: {alert.metric}
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
                                        Acknowledge
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
                                      <div className="text-slate-500">Current Value</div>
                                      <div className="font-medium">{alert.currentValue}</div>
                                    </div>
                                    <div>
                                      <div className="text-slate-500">Threshold</div>
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
                            Total {data.alerts.length} alerts ({data.summary.criticalAlerts} critical, {data.summary.warningAlerts} warning)
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Filter className="h-3 w-3 mr-1" />
                              Filter
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              Export
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

        // Need to import os module
        import os from 'os';

        // Add the following import at the top of the file
        // import os from 'os';

        // Note: This code needs to be merged into the corresponding location in the main file