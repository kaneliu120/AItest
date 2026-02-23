/**
 * Mission Control 简化前端应用
 */

const API_BASE = 'http://localhost:3001/api';

// 工具函数
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-100 border-green-400 text-green-800' :
        type === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
        type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' :
        'bg-blue-100 border-blue-400 text-blue-800'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${
                type === 'success' ? 'check-circle' :
                type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' : 'info-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 10);
    
    // 自动消失
    setTimeout(() => {
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 主应用
class SimpleMissionControl {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🚀 Mission Control 前端应用初始化');
        
        // 绑定事件
        this.bindEvents();
        
        // 初始检查
        this.checkHealth();
        
        // 加载示例
        this.loadExample();
    }
    
    bindEvents() {
        // 健康检查按钮
        const healthBtn = document.querySelector('button[onclick*="checkHealth"]');
        if (healthBtn) {
            healthBtn.onclick = () => this.checkHealth();
        }
        
        // 测试API按钮
        const testBtn = document.querySelector('button[onclick*="testAPI"]');
        if (testBtn) {
            testBtn.onclick = () => this.testAPI();
        }
        
        // 分析按钮
        const analyzeBtn = document.querySelector('button[onclick*="analyzeRequirements"]');
        if (analyzeBtn) {
            analyzeBtn.onclick = () => this.analyzeRequirements();
        }
        
        // 加载示例按钮
        const exampleBtn = document.querySelector('button[onclick*="loadExample"]');
        if (exampleBtn) {
            exampleBtn.onclick = () => this.loadExample();
        }
        
        // 显示分析区域按钮
        const showAnalyzeBtn = document.querySelector('button[onclick*="showAnalyzeSection"]');
        if (showAnalyzeBtn) {
            showAnalyzeBtn.onclick = () => this.showAnalyzeSection();
        }
    }
    
    async checkHealth() {
        try {
            const startTime = Date.now();
            const response = await fetch(`${API_BASE}/health`);
            const data = await response.json();
            const responseTime = Date.now() - startTime;
            
            if (data.success) {
                showNotification('✅ 系统健康检查通过', 'success');
                this.updateStatus('健康', 'green');
                this.updateResponseTime(responseTime);
            } else {
                showNotification('❌ 系统健康检查失败', 'error');
                this.updateStatus('异常', 'red');
            }
        } catch (error) {
            console.error('健康检查失败:', error);
            showNotification('❌ 无法连接到服务器', 'error');
            this.updateStatus('离线', 'red');
        }
    }
    
    async analyzeRequirements() {
        const textarea = document.getElementById('requirementText');
        const checkbox = document.getElementById('generateDocs');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const resultArea = document.getElementById('resultArea');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        if (!textarea || !checkbox || !analyzeBtn || !resultArea) {
            showNotification('❌ 页面元素加载失败', 'error');
            return;
        }
        
        const text = textarea.value.trim();
        const generateDocs = checkbox.checked;
        
        if (!text) {
            showNotification('请输入需求文本', 'warning');
            return;
        }
        
        // 显示加载状态
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析中...';
        
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
                showNotification('✅ 需求分析完成', 'success');
                this.displayAnalysisResult(data.data, resultArea);
            } else {
                showNotification(`❌ 分析失败: ${data.error?.message || '未知错误'}`, 'error');
                this.displayError(data.error, resultArea);
            }
        } catch (error) {
            console.error('分析失败:', error);
            showNotification('❌ 分析请求失败，请检查网络连接', 'error');
            this.displayError({ message: error.message }, resultArea);
        } finally {
            // 恢复按钮状态
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-play mr-2"></i>开始分析';
        }
    }
    
    displayAnalysisResult(data, resultArea) {
        const { document, analysis, documents } = data;
        
        let html = `
            <div class="space-y-4">
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">📄 文档信息</h3>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><span class="text-gray-500">文档:</span> <span class="font-medium">${document.filename}</span></div>
                        <div><span class="text-gray-500">字数:</span> <span class="font-medium">${document.metadata.wordCount}</span></div>
                        <div><span class="text-gray-500">语言:</span> <span class="font-medium">${document.metadata.language}</span></div>
                        <div><span class="text-gray-500">大小:</span> <span class="font-medium">${formatBytes(document.metadata.size)}</span></div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">🔍 分析概览</h3>
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="text-center p-3 bg-blue-50 rounded-lg">
                            <div class="text-xl font-bold text-blue-700">${analysis.categories.functional.length}</div>
                            <div class="text-xs text-gray-600">功能需求</div>
                        </div>
                        <div class="text-center p-3 bg-green-50 rounded-lg">
                            <div class="text-xl font-bold text-green-700">${analysis.categories.nonFunctional.length}</div>
                            <div class="text-xs text-gray-600">非功能需求</div>
                        </div>
                        <div class="text-center p-3 bg-purple-50 rounded-lg">
                            <div class="text-xl font-bold text-purple-700">${analysis.categories.business.length}</div>
                            <div class="text-xs text-gray-600">业务需求</div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">复杂度评估</span>
                            <span class="font-medium">${analysis.complexity.overall}/10</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${analysis.complexity.overall * 10}%"></div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">⏱️ 工作量估算</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-gray-500">总工时:</span> <span class="font-medium">${analysis.effortEstimation.totalHours} 小时</span></div>
                            <div><span class="text-gray-500">团队规模:</span> <span class="font-medium">${analysis.effortEstimation.teamSize} 人</span></div>
                            <div><span class="text-gray-500">乐观时间:</span> <span class="font-medium">${analysis.effortEstimation.timeline.optimistic} 天</span></div>
                            <div><span class="text-gray-500">实际时间:</span> <span class="font-medium">${analysis.effortEstimation.timeline.realistic} 天</span></div>
                        </div>
                    </div>
                </div>
        `;
        
        // 技术栈推荐
        if (analysis.techStack) {
            html += `
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">⚙️ 技术栈推荐</h3>
                    <div class="space-y-3">
            `;
            
            Object.entries(analysis.techStack).forEach(([category, items]) => {
                if (items && items.length > 0) {
                    items.forEach(item => {
                        const framework = item.framework || item.type;
                        html += `
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center mr-2">
                                        <i class="fas fa-code text-blue-600 text-sm"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium">${framework}</div>
                                        <div class="text-xs text-gray-500">${category}</div>
                                    </div>
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
            
            html += `</div></div>`;
        }
        
        // 风险评估
        if (analysis.risks && analysis.risks.length > 0) {
            html += `
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">⚠️ 风险评估</h3>
                    <div class="space-y-3">
            `;
            
            analysis.risks.forEach(risk => {
                html += `
                    <div class="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                        <div class="font-medium mb-1">${risk.description}</div>
                        <div class="flex text-sm mb-2">
                            <span class="mr-3"><span class="text-gray-500">概率:</span> <span class="font-medium">${risk.probability}</span></span>
                            <span><span class="text-gray-500">影响:</span> <span class="font-medium">${risk.impact}</span></span>
                        </div>
                        <div class="text-sm text-gray-600">${risk.mitigation}</div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        // 生成的文档
        if (documents) {
            html += `
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">📄 生成的文档</h3>
                    <div class="grid grid-cols-2 gap-3">
            `;
            
            Object.entries(documents).forEach(([type, doc]) => {
                const typeNames = {
                    srs: 'SRS文档',
                    tdd: 'TDD文档',
                    projectPlan: '项目计划',
                    deployment: '部署指南'
                };
                
                html += `
                    <div class="flex items-center p-2 bg-gray-50 rounded">
                        <div class="w-8 h-8 rounded bg-green-100 flex items-center justify-center mr-2">
                            <i class="fas fa-file-alt text-green-600 text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-sm">${typeNames[type] || type}</div>
                            <div class="text-xs text-gray-500 truncate">${doc.filename}</div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        html += `</div>`;
        resultArea.innerHTML = html;
    }
    
    displayError(error, resultArea) {
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
        
        resultArea.innerHTML = html;
    }
    
    loadExample() {
        const textarea = document.getElementById('requirementText');
        if (!textarea) return;
        
        const example = `# 电商平台项目需求

## 核心功能
1. 用户注册和登录系统
2. 商品浏览和搜索功能
3. 购物车和订单管理
4. 支付系统集成
5. 用户评价和反馈

## 技术要求
- 响应时间 < 2秒
- 支持1000并发用户
- 数据安全加密
- 移动端适配`;
        
        textarea.value = example;
        showNotification('📋 示例需求已加载', 'info');
    }
    
    async testAPI() {
        try {
            const response = await fetch(`${API_BASE}/requirements-analysis?action=status`);
            const data = await response.json();
            
            if (data.success) {
                showNotification(`✅ API测试通过: ${data.data.service} v${data.data.version}`, 'success');
                
                const resultArea = document.getElementById('resultArea');
                if (resultArea) {
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
                                        <p><strong>状态:</strong> ${data.data.status}</p>
                                        <p><strong>能力:</strong> ${capabilities}</p>
                                        <p><strong>支持格式:</strong> ${formats}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    resultArea.innerHTML = html;
                }
            } else {
                showNotification('❌ API测试失败', 'error');
            }
        } catch (error) {
            console.error('API测试失败:', error);
            showNotification('❌ API测试失败，请检查网络连接', 'error');
        }
    }
    
    showAnalyzeSection() {
        const analyzeSection = document.getElementById('analyze');
        if (analyzeSection) {
            analyzeSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    updateStatus(status, color) {
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            apiStatus.textContent = status;
