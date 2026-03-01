'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Target, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Users,
  Star,
  Zap,
  CheckCircle,
  XCircle,
  PieChart,
  BarChart
} from 'lucide-react';

interface VisualDashboardProps {
  analysis: any;
  aiEnhancedAnalysis?: any;
}

export const VisualDashboard = ({ analysis, aiEnhancedAnalysis }: VisualDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'risks' | 'trends'>('overview');

  const metrics = useMemo(() => {
    if (!analysis) return null;

    const functionalReqs = analysis.categories.functional;

    return {
      totalFeatures: functionalReqs.length,
      highPriorityFeatures: functionalReqs.filter((r: any) => r.priority === 'high').length,
      mediumPriorityFeatures: functionalReqs.filter((r: any) => r.priority === 'medium').length,
      lowPriorityFeatures: functionalReqs.filter((r: any) => r.priority === 'low').length,
      simpleFeatures: functionalReqs.filter((r: any) => r.complexity === 'simple').length,
      mediumFeatures: functionalReqs.filter((r: any) => r.complexity === 'medium').length,
      complexFeatures: functionalReqs.filter((r: any) => r.complexity === 'complex').length,
      effortByPriority: {
        high: functionalReqs.filter((r: any) => r.priority === 'high').reduce((sum: number, r: any) => sum + r.estimatedEffort, 0),
        medium: functionalReqs.filter((r: any) => r.priority === 'medium').reduce((sum: number, r: any) => sum + r.estimatedEffort, 0),
        low: functionalReqs.filter((r: any) => r.priority === 'low').reduce((sum: number, r: any) => sum + r.estimatedEffort, 0),
      },
      totalRisks: analysis.risks.length,
      highRisks: analysis.risks.filter((r: any) => r.probability === 'high' && r.impact === 'high').length,
      mediumRisks: analysis.risks.filter((r: any) =>
        (r.probability === 'medium' && r.impact === 'high') ||
        (r.probability === 'high' && r.impact === 'medium')
      ).length,
      lowRisks: analysis.risks.filter((r: any) => r.probability === 'low' || r.impact === 'low').length,
    };
  }, [analysis]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'complex': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'simple': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevel = (risk: any) => {
    if (risk.probability === 'high' && risk.impact === 'high') return 'critical';
    if (risk.probability === 'high' || risk.impact === 'high') return 'high';
    return 'medium';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!analysis || !metrics) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-slate-700 font-medium">Loading visualization data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-200">
        <button
          className={`flex items-center px-4 py-3 font-medium text-sm ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </button>
        <button
          className={`flex items-center px-4 py-3 font-medium text-sm ${
            activeTab === 'features'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('features')}
        >
          <Target className="w-4 h-4 mr-2" />
          Feature Analysis
        </button>
        <button
          className={`flex items-center px-4 py-3 font-medium text-sm ${
            activeTab === 'risks'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('risks')}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Risk Assessment
        </button>
        <button
          className={`flex items-center px-4 py-3 font-medium text-sm ${
            activeTab === 'trends'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trends \& Insights
        </button>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Total Features</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {metrics.totalFeatures}
              </div>
              <div className="text-xs text-slate-500">core features</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Total Hours</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {analysis.effortEstimation.totalHours}
              </div>
              <div className="text-xs text-slate-500">hours</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Team Size</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {analysis.effortEstimation.teamSize}
              </div>
              <div className="text-xs text-slate-500">people</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Complexity</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {analysis.complexity.overall}/10
              </div>
              <div className="text-xs text-slate-500">overall score</div>
            </div>
          </div>

          {/* Complexity radar chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Complexity Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {analysis.complexity.overall}
                </div>
                <div className="text-sm text-slate-600 mt-1">Overall</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analysis.complexity.overall * 10}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {analysis.complexity.technical.score}
                </div>
                <div className="text-sm text-slate-600 mt-1">Technical</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analysis.complexity.technical.score * 10}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {analysis.complexity.business.score}
                </div>
                <div className="text-sm text-slate-600 mt-1">Business</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${analysis.complexity.business.score * 10}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {analysis.complexity.integration.score}
                </div>
                <div className="text-sm text-slate-600 mt-1">Integration</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${analysis.complexity.integration.score * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tech stack suitability */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Tech Stack Suitability</h3>
            <div className="space-y-4">
              {analysis.techStack.frontend.map((tech: any, index: number) => (
                <div key={`item-${index}`} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-700">{tech.framework}</span>
                    <span className="text-sm font-medium text-slate-900">{tech.suitability}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        tech.suitability >= 80 ? 'bg-green-600' :
                        tech.suitability >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${tech.suitability}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature Analysis tab */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Feature Priority Distribution */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Feature Priority Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-700">{metrics.highPriorityFeatures}</div>
                <div className="text-sm text-red-600">High Priority</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <div className="text-2xl font-bold text-yellow-700">{metrics.mediumPriorityFeatures}</div>
                <div className="text-sm text-yellow-600">Medium Priority</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-700">{metrics.lowPriorityFeatures}</div>
                <div className="text-sm text-green-600">Low Priority</div>
              </div>
            </div>
          </div>

          {/* Feature Complexity Distribution */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Feature Complexity Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-700">{metrics.simpleFeatures}</div>
                <div className="text-sm text-green-600">Simple</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <div className="text-2xl font-bold text-yellow-700">{metrics.mediumFeatures}</div>
                <div className="text-sm text-yellow-600">Medium</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-700">{metrics.complexFeatures}</div>
                <div className="text-sm text-red-600">Complex</div>
              </div>
            </div>
          </div>

          {/* Feature List */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Feature Detail List</h3>
            <div className="space-y-3">
              {analysis.categories.functional.map((req: any, index: number) => (
                <div key={`item-${index}`} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="font-mono text-sm text-slate-900 mr-2">{req.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(req.priority)} text-white`}>
                          {req.priority === 'high' ? 'High' : req.priority === 'medium' ? 'Medium' : 'Low'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2 ${getComplexityColor(req.complexity)} text-white`}>
                          {req.complexity === 'complex' ? 'Complex' : req.complexity === 'medium' ? 'Medium' : 'Simple'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{req.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">{req.estimatedEffort} hours</div>
                      <div className="text-xs text-slate-500">Estimated Hours</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment tab */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          {/* Risk Distribution */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
