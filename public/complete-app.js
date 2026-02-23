/**
 * Mission Control 完整前端应用
 * 智能需求分析系统用户界面
 */

const API_BASE = 'http://localhost:3001/api';

// 工具函数
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatTime(seconds) {
    if (seconds < 60) return `${Math.floor(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
    return `${Math.floor(seconds / 86400)}天`;
}

// 主应用类
class MissionControlApp {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.startMonitoring();
    }

    initElements() {
        this.elements = {
            requirementText: document.getElementById('requirementText'),
            generateDocs: document.getElementById('generateDocs'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            resultArea: document.getElementById('resultArea'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            responseTimeDisplay: document.getElementById('responseTimeDisplay'),
            uptimeDisplay: document.getElementById('uptimeDisplay'),
            apiStatus: document.getElementById('apiStatus'),
            responseTime: document.getElementById('responseTime'),
            uptime: document.getElementById('uptime'),
            healthBtn: document.querySelector('button[onclick="checkHealth()"]'),
            testApiBtn: document.querySelector('button[onclick="testAPI()"]')
        };
    }

    initEventListeners() {
        // 移除内联事件监听器，改用事件委托
        document.addEventListener('click', (e) => {
            if (e.target.closest('button[onclick="checkHealth()"]')) {
                this.checkHealth();
            } else if (e.target.closest('button[onclick="testAPI()"]')) {
                this.testAPI();
            } else if (e.target.closest('button[onclick="showAnalyzeSection()"]')) {
                this.showAnalyzeSection();
            } else if (e.target.closest('button[onclick="analyzeRequirements()"]')) {
                this.analyzeRequirements();
            } else if (e.target.closest('button[onclick="loadExample()"]')) {
                this.loadExample();
            }
        });
    }

    async checkHealth() {
        try {
            const startTime = Date.now();
            const response = await fetch(`${API_BASE}/health`);
            const data = await response.json();
            const responseTime = Date.now() - startTime;

            if (data.success) {
                this.showNotification('✅ 系统健康检查通过', 'success');
                this.updateStatus('健康', 'green');
                this.updateResponseTime(responseTime);
                this.updateUptime(data.data.timestamp);
            } else {
                this.showNotification('❌ 系统健康检查失败', 'error');
                this.updateStatus('异常', 'red');
            }
        } catch (error) {
            console.error('健康检查失败:', error);
            this.showNotification('❌ 无法连接到服务器', 'error');
            this.updateStatus('离线', 'red');
        }
    }

    async analyzeRequirements() {
        const text = this.elements.requirementText.value.trim();
        const generateDocs = this.elements.generateDocs.checked;

        if (!text) {
            this.showNotification('请输入需求文本', 'warning');
            return;
        }

        // 显示加载状态
        this.elements.loadingIndicator.classList.remove('hidden');
        this.elements.analyzeBtn.disabled = true;
        this.elements.analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析中...';

        try {
            const formData = new FormData();
            formData.append('text', text);
            formData.append('generateDocs', generateDocs.toString());

            const startTime = Date.now();
            const response = await fetch(`${API_BASE}/requirements-analysis`, {
                method: 'POST',
                body: formData
            });
            const responseTime = Date.now() - startTime;

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // 更新性能指标
            this.updateResponseTime(responseTime);

            if (data.success) {
                this.showNotification('✅ 需求分析完成', 'success');
                this.displayAnalysisResult(data.data);
            } else {
                this.showNotification(`❌ 分析失败: ${data.error?.message || '未知错误'}`, 'error');
                this.displayError(data.error);
            }
        } catch (error) {
            console.error('分析失败:', error);
            this.showNotification('❌ 分析请求失败，请检查网络连接', 'error');
            this.displayError({ message: error.message });
        } finally {
            // 恢复按钮状态
            this.elements.loadingIndicator.classList.add('hidden');
            this.elements.analyzeBtn.disabled = false;
            this.elements.analyzeBtn.innerHTML = '<i class="fas fa-play mr-2"></i>开始分析';
        }
    }

    displayAnalysisResult(data) {
        const { document, analysis, documents } = data;
        
        let html = `
            <div class="space-y-6">
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">📄 文档信息</h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">${document.filename}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">文档ID:</span>
                            <span class="font-medium ml-2">${document.id}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">字数:</span>
                            <span class="font-medium ml-2">${document.metadata.wordCount}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">语言:</span>
                            <span class="font-medium ml-2">${document.metadata.language}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">大小:</span>
                            <span class="font-medium ml-2">${formatBytes(document.metadata.size)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 分析结果</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-700">${analysis.categories.functional.length}</div>
                            <div class="text-sm text-gray-600">功能需求</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-2xl font-bold text-green-700">${analysis.categories.nonFunctional.length}</div>
                            <div class="text-sm text-gray-600">非功能需求</div>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <div class="text-2xl font-bold text-purple-700">${analysis.categories.business.length}</div>
                            <div class="text-sm text-gray-600">业务需求</div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-medium text-gray-700 mb-2">📊 复杂度评估</h4>
                        <div class="flex items-center">
                            <div class="flex-1 bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${analysis.complexity.overall * 10}%"></div>
                            </div>
                            <span class="ml-3 font-medium">${analysis.complexity.overall}/10</span>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-medium text-gray-700 mb-2">⏱️ 工作量估算</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <span class="text-gray-500">总工时:</span>
                                <span class="font-medium ml-2">${analysis.effortEstimation.totalHours} 小时</span>
                            </div>
                            <div>
                                <span class="text-gray-500">团队规模:</span>
                                <span class="font-medium ml-2">${analysis.effortEstimation.teamSize} 人</span>
                            </div>
                            <div>
                                <span class="text-gray-500">乐观时间:</span>
                                <span class="font-medium ml-2">${analysis.effortEstimation.timeline.optimistic} 天</span>
                            </div>
                            <div>
                                <span class="text-gray-500">实际时间:</span>
                                <span class="font-medium ml-2">${analysis.effortEstimation.timeline.realistic} 天</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">⚙️ 技术栈推荐</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        `;
        
        // 技术栈推荐
        Object.entries(analysis.techStack).forEach(([category, items]) => {
            if (items && items.length > 0) {
                items.forEach(item => {
                    const framework = item.framework || item.type;
                    html += `
                        <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                                <i class="fas fa-code text-blue-600"></i>
                            </div>
                            <div class="flex-1">
                                <div class="font-medium">${framework}</div>
                                <div class="text-sm text-gray-500">${category}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold">${item.suitability}%</div>
                                <div class="text-xs text-gray-500">适用性</div>
                            </div>
                        </div>
                    `;
                });
            }
        });
        
        html += `
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">⚠️ 风险评估</h3>
                    <div class="space-y-3">
        `;
        
        // 风险评估
        if (analysis.risks && analysis.risks.length > 0) {
            analysis.risks.forEach(risk => {
                const probabilityColor = risk.probability === 'high' ? 'red' : 
                                       risk.probability === 'medium' ? 'yellow' : 'green';
                const impactColor = risk.impact === 'high' ? 'red' : 
                                  risk.impact === 'medium' ? 'yellow' : 'green';
                
                html += `
                    <div class="p-3 border-l-4 border-${probabilityColor}-500 bg-${probabilityColor}-50">
                        <div class="flex justify-between items-start mb-1">
                            <div class="font-medium">${risk.description}</div>
                            <div class="flex space-x-2">
                                <span class="px-2 py-1 text-xs rounded-full bg-${probabilityColor}-100 text-${probabilityColor}-800">
                                    概率: ${risk.probability}
                                </span>
                                <span class="px-2 py-1 text-xs rounded-full bg-${impactColor}-100 text-${impactColor}-800">
                                    影响: ${risk.impact}
                                </span>
                            </div>
                        </div>
                        <div class="text-sm text-gray-600">${risk.mitigation}</div>
                    </div>
                `;
            });
        } else {
            html += `<div class="text-gray-500 text-center py-4">未识别到重大风险</div>`;
        }
        
        html += `
                    </div>
                </div>
        `;
        
        // 生成的文档
        if (documents) {
            html += `
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">📄 生成的文档</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            `;
            
            Object.entries(documents).forEach(([type, doc]) => {
                const typeNames = {
                    srs: '软件需求规格说明书',
                    tdd: '测试驱动开发文档',
                    projectPlan: '项目计划',
                    deployment: '部署指南'
                };
                
                html += `
                    <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                            <i class="fas fa-file-alt text-green-600"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-medium">${typeNames[type] || type}</div>
                            <div class="text-sm text-gray-500">${doc.filename}</div>
                        </div>
                        <button onclick="app.viewDocument('${type}')" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            查看
                        </button>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        
        this.elements.resultArea.innerHTML = html;
    }

    displayError(error) {
        const html = `
            <div class="bg-red-50 border-l-4 border-red-500 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-red-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">分析失败</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p>${error.message || '未知错误'}</p>
                            ${error.code ? `<p class="mt-1">错误代码: ${error.code}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.resultArea.innerHTML = html;
    }

    loadExample() {
        const example = `# 电商平台项目需求

## 业务目标
建立完整的B2C电商平台，支持商品销售、用户管理、订单处理、支付集成。

## 核心功能模块
### 1. 用户系统
- 注册、登录、个人资料管理
- 地址簿管理
- 订单历史查看

### 2. 商品系统
- 商品分类和搜索
- 商品详情展示
- 库存管理
- 评价和评分

### 3. 购物车和订单
- 购物车管理
- 订单创建和支付
- 订单状态跟踪
- 退款和退货

### 4. 支付系统
- 多种支付方式集成
- 支付安全
- 交易记录

### 5. 后台管理
- 商品管理
- 订单管理
- 用户管理
- 数据统计

## 非功能需求
- 响应时间 < 2秒
- 支持5000并发用户
- 99.9%可用性
- 数据安全加密
- 移动端优先设计

## 技术约束
- 使用现代Web技术栈
- 支持云部署
- 易于扩展和维护
- 良好的开发体验`;
        
        this.elements.requirementText.value = example;
        this.showNotification('📋 示例需求已加载', 'info');
    }

    async testAPI() {
        try {
            const response = await fetch(`${API_BASE}/requirements-analysis?action=status`);
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`✅ API测试通过: ${data.data.service} v${data.data.version}`, 'success');
                
                // 显示服务能力
                const capabilities = data.data.capabilities.join(', ');
                const formats = data.data.supportedFormats.join(', ');
                
                const html = `
                    <div class="bg-green-50 border-l-4 border-green-500 p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-check-circle text-green-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-green-800">API测试通过</h3>
                                <div class="mt-2 text-sm text-green-700">
                                    <p><strong>服务:</strong> ${data.data.service}</p>
                                    <p><strong>版本:</strong> ${data.data.version}</p>
                                    <p><strong>状态:</