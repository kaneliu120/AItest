import React from 'react';
import { Tool } from '../types';
import { toolService } from '../services/tool.service';

interface ToolCardProps {
  tool: Tool;
  onConfigure?: (toolId: string) => void;
  onTest?: (toolId: string) => void;
  onStatusChange?: (toolId: string, status: string) => void;
  compact?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onConfigure,
  onTest,
  onStatusChange,
  compact = false,
}) => {
  const {
    id,
    name,
    description,
    category,
    status,
    icon,
    color,
    configuration,
    usage,
    health,
    metadata,
  } = tool;

  // Status color mapping
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    deprecated: 'bg-orange-100 text-orange-800 border-orange-200',
    experimental: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  // Health status color mapping
  const healthColors: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
  };

  // Usage frequency color mapping
  const getUsageColor = (count: number) => {
    if (count > 1000) return 'text-green-600';
    if (count > 100) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle configure click
  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure(id);
    }
  };

  // Handle test click
  const handleTest = () => {
    if (onTest) {
      onTest(id);
    }
  };

  // Handle status toggle
  const handleStatusToggle = () => {
    if (onStatusChange) {
      const newStatus = status === 'active' ? 'inactive' : 'active';
      onStatusChange(id, newStatus);
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: color || '#4F46E5' }}
              >
                <span className="text-lg">{icon}</span>
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500">{toolService.formatToolCategory(category)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[status] || statusColors.inactive}`}>
              {toolService.formatToolStatus(status)}
            </span>
            <div className={`w-3 h-3 rounded-full ${healthColors[health.status] || healthColors.unhealthy}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {icon && (
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: color || '#4F46E5' }}
            >
              <span className="text-2xl">{icon}</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusColors[status] || statusColors.inactive}`}>
            {toolService.formatToolStatus(status)}
          </span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${healthColors[health.status] || healthColors.unhealthy}`} />
            <span className="text-sm text-gray-500 capitalize">{health.status}</span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Category</p>
          <p className="text-gray-900">{toolService.formatToolCategory(category)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Version</p>
          <p className="text-gray-900">{metadata.version}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total Uses</p>
          <p className={`font-medium ${getUsageColor(usage.totalUses)}`}>
            {usage.totalUses.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Success Rate</p>
          <p className="text-gray-900">{usage.successRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Configuration status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-500">Configuration</p>
          <span className={`text-sm ${configuration.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
            {configuration.isConfigured ? 'Configured' : 'Not Configured'}
          </span>
        </div>
        {configuration.lastConfigured && (
          <p className="text-sm text-gray-500">
            Last configured: {formatDate(configuration.lastConfigured)} at {formatTime(configuration.lastConfigured)}
          </p>
        )}
      </div>

      {/* Usage info */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Recent Activity</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Last used: {usage.lastUsed ? formatDate(usage.lastUsed) : 'Never'}
          </span>
          <span className="text-gray-600">
            Avg. response: {usage.averageResponseTime}ms
          </span>
        </div>
      </div>

      {/* Health status */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Health Status</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${healthColors[health.status] || healthColors.unhealthy}`} />
            <span className="text-sm text-gray-700 capitalize">{health.status}</span>
            {health.errorMessage && (
              <span className="text-sm text-red-600">({health.errorMessage})</span>
            )}
          </div>
          <span className="text-sm text-gray-500">Uptime: {health.uptime.toFixed(1)}%</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={handleConfigure}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              configuration.isConfigured
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {configuration.isConfigured ? 'Reconfigure' : 'Configure'}
          </button>
          <button
            onClick={handleTest}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={!configuration.isConfigured}
          >
            Test
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              status === 'active'
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Details
          </button>
        </div>
      </div>

      {/* Tags */}
      {metadata.tags && metadata.tags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCard;