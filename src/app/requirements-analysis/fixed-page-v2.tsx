                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    正常
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">需求分析</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    正常
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">技术栈推荐</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    正常
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：分析结果 */}
          <div className="lg:col-span-2">
            {isAnalyzing ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-4 text-slate-700 font-medium">正在智能分析需求文档...</p>
                <p className="text-slate-500 text-sm mt-2">AI正在处理您的需求，这可能需要几秒钟时间</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                {/* 文档信息 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-900">文档信息</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <FileText className="w-4 h-4 mr-1" />
                      {analysisResult.document.fileType?.toUpperCase() || 'TEXT'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900">
                        {analysisResult.document.metadata?.wordCount || 0}
                      </div>
                      <div className="text-sm text-slate-600">单词数</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900">
                        {formatFileSize(analysisResult.document.metadata?.size || 0)}
                      </div>
                      <div className="text-sm text-slate-600">文件大小</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900">
                        {analysisResult.document.sections?.length || 1}
                      </div>
                      <div className="text-sm text-slate-600">章节数</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900">
                        {analysisResult.analysis.categories?.functional?.length || 0}
                      </div>
                      <div className="text-sm text-slate-600">功能需求</div>
                    </div>
                  </div>
                </div>

                {/* 复杂度评估 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">复杂度评估</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">总体复杂度</span>
                        <span className="text-sm font-medium text-slate-900">
                          {analysisResult.analysis.complexity?.overall || 0}/10
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(analysisResult.analysis.complexity?.overall || 0) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <div className="text-xl font-bold text-blue-700">
                          {analysisResult.analysis.complexity?.technical?.score || 0}
                        </div>
                        <div className="text-sm text-blue-600">技术复杂度</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <div className="text-xl font-bold text-green-700">
                          {analysisResult.analysis.complexity?.business?.score || 0}
                        </div>
                        <div className="text-sm text-green-600">业务复杂度</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <div className="text-xl font-bold text-purple-700">
                          {analysisResult.analysis.complexity?.integration?.score || 0}
                        </div>
                        <div className="text-sm text-purple-600">集成复杂度</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 工作量估算 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">工作量估算</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-700">
                        {analysisResult.analysis.effortEstimation?.totalHours || 0}
                      </div>
                      <div className="text-sm text-orange-600">总工时</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-700">
                        {analysisResult.analysis.effortEstimation?.teamSize || 0}
                      </div>
                      <div className="text-sm text-blue-600">建议团队规模</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <BarChart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-700">
                        {analysisResult.analysis.effortEstimation?.timeline?.realistic || 0}
                      </div>
                      <div className="text-sm text-green-600">预计天数</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <Code className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-700">
                        {analysisResult.analysis.categories?.functional?.length || 0}
                      </div>
                      <div className="text-sm text-purple-600">功能需求数</div>
                    </div>
                  </div>
                </div>

                {/* 技术栈推荐 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">技术栈推荐</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {analysisResult.analysis.techStack?.frontend?.map((tech: any, index: number) => (
                      <div key={`item-${index}`} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-slate-900">{tech.framework}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {tech.suitability}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{tech.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 文档生成区域 */}
                {analysisResult.documents && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="font-medium text-slate-900 mb-4">生成的技术文档</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(analysisResult.documents).map(([key, doc]: [string, any]) => (
                        <div key={key} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">
                              {doc.type === 'srs' ? '需求规格说明书' : 
                               doc.type === 'tdd' ? '技术设计文档' :
                               doc.type === 'project-plan' ? '项目计划' : '部署文档'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {doc.metadata?.wordCount || 0} 字
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {doc.title}
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadDocument(doc, 'markdown')}
                              className="flex-1 py-2 px-3 text-sm bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              下载MD
                            </button>
                            <button
                              onClick={() => downloadDocument(doc, 'text')}
                              className="flex-1 py-2 px-3 text-sm bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors"
                            >
                              下载TXT
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 font-medium rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    重新分析
                  </button>
                  <button
                    onClick={() => {
                      if (activeTab === 'upload') {
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput?.files?.[0]) {
                          analyzeFile(fileInput.files[0], true);
                        }
                      } else {
                        analyzeText(true);
                      }
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-colors shadow-md"
                  >
                    生成技术文档
                  </button>
                  <button className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-colors shadow-md">
                    创建GitHub仓库
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
                <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">等待智能分析</h3>
                <p className="text-slate-600 mb-6">
                  上传需求文档或输入文本开始AI智能分析
                </p>
                <div className="inline-flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-500">AI服务就绪，等待输入...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementsAnalysisPage;