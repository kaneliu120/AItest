import React, { useState, useEffect } from 'react';
import { Tool, ToolCategory, ToolStatus } from '../types';
import { toolService } from '../services/tool.service';
import ToolCard from './ToolCard';
import ToolStats from './ToolStats';
import ToolFilters from './ToolFilters';

interface EcosystemDashboardProps {
  showStats?: boolean;
  showFilters?: boolean;
  compactMode?: boolean;
  onToolSelect?: (tool: Tool) => void;
}

const EcosystemDashboard: React.FC<EcosystemDashboardProps> = ({
  showStats = true,
  showFilters = true,
  compactMode = false,
  onToolSelect,
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // 过滤器状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ToolStatus | 'all'>('all');
  const [showConfiguredOnly, setShowConfiguredOnly] = useState(false);

  // 加载工具数据
  useEffect(() => {
    loadTools();
    loadStatistics();
  }, []);

  // 应用过滤器
  useEffect(() => {
    applyFilters();
  }, [tools, searchQuery, selectedCategory, selectedStatus, showConfiguredOnly]);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 在实际应用中，这里会调用API
      // const response = await toolService.getTools();
      // setTools(response.tools);
      
      // 暂时使用模拟数据
      const mockTools = toolService.getMockTools();
      setTools(mockTools);
      setFilteredTools(mockTools);
    } catch (err) {
      setError('Failed to load tools. Please try again.');
      console.error('Error loading tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // 在实际应用中，这里会调用API
      // const response = await toolService.getToolStatistics();
      // setStatistics(response.statistics);
      
      // 暂时使用模拟数据
      const mockStats = toolService.getMockStatistics();
      setStatistics(mockStats);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...tools];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.metadata.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((tool) => tool.category === selectedCategory);
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((tool) => tool.status === selectedStatus);
    }

    // 配置状态过滤
    if (showConfiguredOnly) {
      filtered = filtered.filter((tool) => tool.configuration.isConfigured);
    }

    setFilteredTools(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: ToolCategory | 'all') => {
    setSelectedCategory(category);
  };

  const handleStatusChange = (status: ToolStatus | 'all') => {
    setSelectedStatus(status);
  };

  const handleConfiguredToggle = (configured: boolean) => {
    setShowConfiguredOnly(configured);
  };

  const handleToolConfigure = (toolId: string) => {
    const tool = tools.find((t) => t.id === toolId);
    if (tool && onToolSelect) {
      onToolSelect(tool);
    }
    // 在实际应用中，这里会打开配置对话框
    console.log('Configure tool:', toolId);
  };

  const handleToolTest = (toolId: string) => {
    // 在实际应用中，这里会执行工具测试
    console.log('Test tool:', toolId);
  };

  const handleToolStatusChange = (toolId: string, status: string) => {
    // 在实际应用中，这里会更新工具状态
    console.log('Change tool status:', toolId, 'to', status);
  };

  const handleRefresh = () => {
    loadTools();
    loadStatistics();
  };

  const handleExport = () => {
    // 在实际应用中，这里会导出工具配置
    console.log('Export tools');
  };

  const handleImport = () => {
    // 在实际应用中，这里会导入工具配置
    console.log('Import tools');
  };

  // 重置过滤器
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setShowConfiguredOnly(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading tools</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadTools}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tool Ecosystem</h1>
          <p className="text-gray-600">Manage and monitor all your integrated tools</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleImport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Export
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      {showStats && statistics && (
        <ToolStats statistics={statistics} />
      )}

      {/* 过滤器 */}
      {showFilters && (
        <ToolFilters
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          showConfiguredOnly={showConfiguredOnly}
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          onStatusChange={handleStatusChange}
          onConfiguredToggle={handleConfiguredToggle}
          onReset={resetFilters}
        />
      )}

      {/* 工具数量信息 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredTools.length}</span> of{' '}
            <span className="font-medium">{tools.length}</span> tools
          </p>
          {filteredTools.length === 0 && searchQuery && (
            <p className="text-sm text-gray-500 mt-1">
              No tools found matching "{searchQuery}". Try a different search term.
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">View:</span>
          <button
            onClick={() => {}}
            className={`px-3 py-1 text-sm rounded-lg ${!compactMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Detailed
          </button>
          <button
            onClick={() => {}}
            className={`px-3 py-1 text-sm rounded-lg ${compactMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Compact
          </button>
        </div>
      </div>

      {/* 工具网格 */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              compact={compactMode}
              onConfigure={handleToolConfigure}
              onTest={handleToolTest}
              onStatusChange={handleToolStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search or filter to find what you\'re looking for.'
              : 'No tools are currently available. Add some tools to get started.'}
          </p>
          <div className="mt-6">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* 分页 */}
      {filteredTools.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{filteredTools.length}</span> of{' '}
                <span className="font-medium">{filteredTools.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  2
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcosystemDashboard;