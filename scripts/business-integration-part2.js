-800 hover:bg-red-100">❌ {status}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">❓ {status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载业务集成状态...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">业务集成中心</h1>
        <p className="text-gray-600 mt-2">
          连接和管理所有业务系统，实现自动化工作流
        </p>
      </div>

      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList>
          <TabsTrigger value="systems">系统状态</TabsTrigger>
          <TabsTrigger value="workflows">工作流</TabsTrigger>
          <TabsTrigger value="results">执行结果</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                业务系统状态
              </CardTitle>
              <CardDescription>
                所有连接的业务系统及其当前状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems.map((system, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSystemIcon(system.name)}
                          <CardTitle className="text-lg">{system.name}</CardTitle>
                        </div>
                        {getStatusBadge(system.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>路径:</span>
                          <span className="font-mono text-xs truncate max-w-[200px]">
                            {system.path || '未配置'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>API:</span>
                          <span className="font-mono text-xs truncate max-w-[200px]">
                            {system.api || '未配置'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>API状态:</span>
                          <span className={system.apiStatus === '健康' ? 'text-green-600' : 'text-red-600'}>
                            {system.apiStatus || '未知'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>集成端点</CardTitle>
              <CardDescription>可用的集成API端点</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">核心系统</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>统一API网关:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v1/unified</code>
                    </div>
                    <div className="flex justify-between">
                      <span>智能任务分发:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v2/dispatcher</code>
                    </div>
                    <div className="flex justify-between">
                      <span>知识增强开发:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v4/knowledge-dev</code>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">优化系统</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>自动化效率优化:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v5/automation</code>
                    </div>
                    <div className="flex justify-between">
                      <span>统一监控告警:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v6/monitoring</code>
                    </div>
                    <div className="flex justify-between">
                      <span>业务集成:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/integration</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                自动化工作流
              </CardTitle>
              <CardDescription>
                预定义的业务自动化工作流，一键执行
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 外包项目管理 */}
                <Card className="border-2 border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      外包项目管理
                    </CardTitle>
                    <CardDescription>
                      从外包平台获取项目 → 任务分配 → 知识库记录 → 财务跟踪
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">涉及系统:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">外包系统</Badge>
                        <Badge variant="outline">任务系统</Badge>
                        <Badge variant="outline">知识管理</Badge>
                        <Badge variant="outline">财务系统</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">工作流步骤:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>搜索外包平台项目</li>
                        <li>创建任务和分配</li>
                        <li>知识库归档记录</li>
                        <li>财务跟踪和报告</li>
                      </ol>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => executeWorkflow('outsource-project', {
                        projectTitle: '网站开发项目',
                        budget: 5000,
                        deadline: '2026-03-15'
                      })}
                      disabled={executing === 'outsource-project'}
                    >
                      {executing === 'outsource-project' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          执行中...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          执行工作流
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* 产品开发流程 */}
                <Card className="border-2 border-green-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      产品开发流程
                    </CardTitle>
                    <CardDescription>
                      需求分析 → 知识增强 → 任务分发 → 自动化测试
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">涉及系统:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">知识管理</Badge>
                        <Badge variant="outline">任务分发</Badge>
                        <Badge variant="outline">自动化优化</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">工作流步骤:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>需求分析和规划</li>
                        <li>知识增强和最佳实践</li>
                        <li>智能任务分发</li>
                        <li>自动化测试和部署</li>
                      </ol>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => executeWorkflow('product-development', {
                        feature: '用户认证系统',
                        requirements: '支持OAuth2、JWT、多因素认证'
                      })}
                      disabled={executing === 'product-development'}
                    >
                      {executing === 'product-development' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          执行中...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          执行工作流
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* 财务监控分析 */}
                <Card className="border-2 border-purple-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      财务监控分析
                    </CardTitle>
                    <CardDescription>
                      收入跟踪 → 成本分析 → 报告生成 → 知识归档
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">涉及系统:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">财务系统</Badge>
                        <Badge variant="outline">知识管理</Badge>
                        <Badge variant="outline">监控告警</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">工作流步骤:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>收集财务数据</li>
                        <li>分析和计算指标</li>
                        <li>生成报告和可视化</li>
                        <li>知识库归档和告警</li>
                      </ol>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => executeWorkflow('finance-monitoring', {
                        period: 'monthly',
                        metrics: ['revenue', 'expenses', 'profit']
                      })}
                      disabled={executing === 'finance-monitoring'}
                    >
                      {executing === 'finance-monitoring' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          执行中...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          执行工作流
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>工作流执行结果</CardTitle>
              <CardDescription>
                最近执行的工作流结果和历史记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflowResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>暂无执行结果</p>
                  <p className="text-sm mt-2">请先执行一个工作流</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflowResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {result.workflow === 'outsource-project' && '外包项目管理'}
                            {result.workflow === 'product-development' && '产品开发流程'}
                            {result.workflow === 'finance-monitoring' && '财务监控分析'}
                          </CardTitle>
                          <Badge className="bg-blue-100 text-blue-800">
                            {new Date(result.timestamp).toLocaleString('zh-CN')}
                          </Badge>
                        </div>
                        <CardDescription>
                          步骤: {result.steps.join(' → ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">执行时间:</span>
                            <span>{new Date(result.timestamp).toLocaleTimeString('zh-CN')}</span>
                          </div>
                          {result.analysis && (
                            <div className="flex justify-between">
                              <span className="font-medium">分析结果:</span>
                              <span className="text-green-600">✅ 完成</span>
                            </div>
                          )}
                          {result.dispatch && (
                            <div className="flex justify-between">
                              <span className="font-medium">任务分发:</span>
                              <span className="text-green-600">✅ 完成</span>
                            </div>
                          )}
                          {result.optimization && (
                            <div className="flex justify-between">
                              <span className="font-medium">效率优化:</span>
                              <span className="text-green-600">✅ 完成</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                集成分析
              </CardTitle>
              <CardDescription>
                业务集成系统的性能和使用情况分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">健康系统</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {systems.filter(s => s.status === '运行中' || s.status === '生产运行').length}
                      <span className="text-sm text-gray-500 ml-1">/ {systems.length}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">运行中的业务系统</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">API可用性</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {systems.filter(s => s.apiStatus === '健康' || s.apiStatus === '可访问').length}
                      <span className="text-sm text-gray-500 ml-1">/ {systems.length}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">可用的API端点</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">工作流执行</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workflowResults.length}</div>
                    <p className="text-xs text-gray-500 mt-1">已执行的工作流</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">集成度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((systems.filter(s => s.status === '运行中' || s.status === '生产运行').length / systems.length) * 100)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">整体集成完成度</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3