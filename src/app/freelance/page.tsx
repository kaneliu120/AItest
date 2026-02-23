'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FileText, TrendingUp, Clock, CheckCircle, XCircle, Plus, Search, Filter } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function FreelancePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取项目列表
      const projectsRes = await fetch('/api/freelance?action=projects');
      const projectsData = await projectsRes.json();
      setProjects(projectsData.data.projects || []);

      // 获取提案列表
      const proposalsRes = await fetch('/api/freelance?action=proposals');
      const proposalsData = await proposalsRes.json();
      setProposals(proposalsData.data.proposals || []);

      // 获取客户列表
      const clientsRes = await fetch('/api/freelance?action=clients');
      const clientsData = await clientsRes.json();
      setClients(clientsData.data.clients || []);
    } catch (error) {
      console.error('获取外包数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'accepted': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载外包数据...</p>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const pendingProposals = proposals.filter(p => p.status === 'pending').length;
  const totalClients = clients.length;
  const totalRevenue = projects
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">外包平台</h1>
            <p className="text-muted-foreground">管理和跟踪外包项目与提案</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              搜索项目
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加项目
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">活跃项目</p>
                  <p className="text-2xl font-bold">{activeProjects}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">待处理提案</p>
                  <p className="text-2xl font-bold">{pendingProposals}</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总客户数</p>
                  <p className="text-2xl font-bold">{totalClients}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总收入</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 活跃项目 */}
        <Card>
          <CardHeader>
            <CardTitle>活跃项目</CardTitle>
            <CardDescription>当前正在进行的外包项目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.filter(p => p.status === 'active').slice(0, 3).map((project) => (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{project.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                          {project.status === 'active' ? '进行中' : project.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {project.deadline}
                        </span>
                        <span className="font-medium">{formatCurrency(project.budget)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">查看详情</Button>
                      <Button size="sm">更新进度</Button>
                    </div>
                  </div>
                  {project.progress !== undefined && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>项目进度</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {activeProjects === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无活跃项目</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 提案状态 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>提案状态</CardTitle>
              <CardDescription>最近提交的提案</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposals.slice(0, 5).map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{proposal.projectTitle}</p>
                      <p className="text-sm text-muted-foreground">提交于 {proposal.submittedDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getProposalStatusColor(proposal.status)}`}>
                        {proposal.status === 'submitted' ? '已提交' : 
                         proposal.status === 'accepted' ? '已接受' :
                         proposal.status === 'rejected' ? '已拒绝' : '待处理'}
                      </span>
                      {proposal.status === 'accepted' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : proposal.status === 'rejected' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              {proposals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无提案记录</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 客户列表 */}
          <Card>
            <CardHeader>
              <CardTitle>客户列表</CardTitle>
              <CardDescription>最近合作的客户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.company || '独立客户'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(client.totalSpent || 0)}</p>
                      <p className="text-xs text-muted-foreground">{client.projectsCount || 0} 个项目</p>
                    </div>
                  </div>
                ))}
              </div>
              {clients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无客户记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4">
            <Search className="h-4 w-4 mr-2" />
            搜索新项目
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <FileText className="h-4 w-4 mr-2" />
            创建新提案
          </Button>
          <Button className="h-auto py-4">
            <Plus className="h-4 w-4 mr-2" />
            添加新客户
          </Button>
        </div>
      </div>
    </div>
  );
}