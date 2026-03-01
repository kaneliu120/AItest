'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Target, 
  Users, 
  Shield, 
  Zap, 
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface VisualizationProps {
  analysis: any;
  aiEnhancedAnalysis?: any;
}

export function VisualizationDashboard({ analysis, aiEnhancedAnalysis }: VisualizationProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'risks' | 'trends'>('overview');
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (analysis) {
      prepareChartData();
    }
  }, [analysis]);

  const prepareChartData = () => {
    if (!analysis) return;

    const data = {
      featurePriorities: analysis.categories.functional.map((req: any) => ({
        name: req.id,
        priority: req.priority === 'high' ? 3 : req.priority === 'medium' ? 2 : 1,
        complexity: req.complexity === 'complex' ? 3 : req.complexity === 'medium' ? 2 : 1,
        effort: req.estimatedEffort,
      })),
      
      effortBreakdown: {
        analysis: analysis.effortEstimation.breakdown.analysis,
        design: analysis.effortEstimation.breakdown.design,
        development: analysis.effortEstimation.breakdown.development,
        testing: analysis.effortEstimation.breakdown.testing,
        deployment: analysis.effortEstimation.breakdown.deployment,
        documentation: analysis.effortEstimation.breakdown.documentation,
      },
      
      complexityScores: {
        overall: analysis.complexity.overall,
        technical: analysis.complexity.technical.score,
        business: analysis.complexity.business.score,
        integration: analysis.complexity.integration.score,
      },
      
      techStackSuitability: analysis.techStack.frontend.map((tech: any) => ({
        name: tech.framework,
        suitability: tech.suitability,
      })),
    };

    setChartData(data);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (score: number) => {
    if (score >= 8) return 'text-red-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskColor = (probability: string, impact: string) => {
    if (probability === 'high' && impact === 'high') return 'bg-red-50 border-red-200';
    if (probability === 'high' || impact === 'high') return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  if (!analysis || !chartData) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-700 font-medium">Preparing visualization data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          className={`flex items-center px-4 py-3 font-medium text-sm transition-colors ${
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
          className={`flex items-center px-4 py-3 font-medium text-sm transition-colors ${
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
          className={`flex items-center px-4 py-3 font-medium text-sm transition-colors ${
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
          className={`flex items-center px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === 'trends'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trend Analysis
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
                <span className="text-sm font-medium text-slate-700">Requirements</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {analysis.categories.functional.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">core features</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Total Hours</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {analysis.effortEstimation.totalHours}
              </div>
              <div className="text-xs text-slate-500 mt-1">hours</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Team Size</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {analysis.effortEstimation.teamSize}
              </div>
              <div className="text-xs text-slate-500 mt-1">people</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-slate-700">Complexity</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {analysis.complexity.overall}/10
              </div>
              <div className="text-xs text-slate-500 mt-1">overall score</div>
            </div>
          </div>

          {/* Complexity radar chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Complexity Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(chartData.complexityScores).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center">
                  <div className={`text-3xl font-bold ${getComplexityColor(value)}`}>
                    {value}
                  </div>
                  <div className="text-sm text-slate-600 mt-1 capitalize">
                    {key === 'overview' ? 'Overall' : 
                     key === 'technical' ? 'Technical' :
                     key === 'business' ? 'Business' : 'Integration'}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${value * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack suitability */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Tech Stack Suitability</h3>
            <div className="space-y-4">
              {chartData.techStackSuitability.map((tech: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-700">{tech.name}</span>
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
          {/* Feature Priority Matrix */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Feature Priority Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Feature ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Priority</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Complexity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Est. Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.categories.functional.map((req: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-slate-900">{req.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-700 line-clamp-2">{req.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(req.priority)}`}>
                          {req.priority === 'high' ? 'High' : req.priority === 'medium' ? 'Medium' : 'Low'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700">
                          {req.complexity === 'complex' ? 'Complex' : req.complexity === 'medium' ? 'Medium' : 'Simple'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-slate-900">{req.estimatedEffort}h</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Effort Breakdown pie chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Effort Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(chartData.effortBreakdown).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{value}</div>
                  <div className="text-sm text-slate-600 mt-1 capitalize">
                    {key === 'analysis' ? 'Analysis' :
                     key === 'design' ? 'Design' :
                     key === 'development' ? 'Development' :
                     key === 'testing' ? 'Testing' :
                     key === 'deployment' ? 'Deployment' : 'Docs'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.round(value / analysis.effortEstimation.totalHours * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Enhanced Analysis (if available) */}
          {aiEnhancedAnalysis && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center mb-4">
                <Zap className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">AI Enhanced Analysis</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Business Goals</h4>
                  <ul className="space-y-1">
                    {aiEnhancedAnalysis.semanticUnderstanding.businessGoals.slice(0, 3).map((goal: string, index: number) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Key Value Propositions</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiEnhancedAnalysis.semanticUnderstanding.keyValuePropositions.slice(0, 3).map((prop: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {prop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Assessment tab */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          {/* Risk Matrix */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-4">Risk Matrix</h3>
            
            {analysis.risks.length > 0 ? (
              <div className="space-y-4">
                {analysis.risks.map((risk: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getRiskColor(risk.probability, risk.impact)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-slate-900">{risk.id}: {risk.description}</span>
                        <div className="flex items-center mt-1 space-x-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            Probability: {risk.probability === 'high' ? 'High' : risk.probability === 'medium' ? 'Medium' : 'Low'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            Impact: --
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
