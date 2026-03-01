/**
 * /api/tools/installed — 已安装技能 API
 * 管理本地已安装的 OpenClaw 技能
 */
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 模拟已安装技能数据（实际应读取本地技能目录）
const MOCK_INSTALLED_SKILLS = [
  {
    slug: 'github',
    name: 'GitHub 集成',
    version: '2.1.0',
    description: 'GitHub API 集成，支持 PR、Issue、CI/CD 监控',
    location: '/opt/homebrew/lib/node_modules/openclaw/skills/github',
    status: 'active' as const,
    lastUsed: '2026-02-24T10:30:00Z',
    usageCount: 42,
    author: 'openclaw',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/github',
    installedAt: '2026-01-15T14:20:00Z',
  },
  {
    slug: 'discord',
    name: 'Discord 机器人',
    version: '1.5.2',
    description: 'Discord 聊天机器人，支持命令、通知、自动化',
    location: '/opt/homebrew/lib/node_modules/openclaw/skills/discord',
    status: 'active' as const,
    lastUsed: '2026-02-24T14:20:00Z',
    usageCount: 28,
    author: 'openclaw',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/discord',
    installedAt: '2026-01-10T09:15:00Z',
  },
  {
    slug: 'clawhub',
    name: 'ClawHub CLI',
    version: '1.0.0',
    description: '技能市场 CLI，支持技能搜索、安装、更新',
    location: '/opt/homebrew/lib/node_modules/openclaw/skills/clawhub',
    status: 'active' as const,
    lastUsed: '2026-02-23T16:45:00Z',
    usageCount: 5,
    author: 'openclaw',
    license: 'MIT',
    repository: 'https://github.com/openclaw/clawhub',
    installedAt: '2026-02-01T11:30:00Z',
  },
  {
    slug: 'weather',
    name: '天气服务',
    version: '1.0.1',
    description: '全球天气数据，支持预报和警报',
    location: '/opt/homebrew/lib/node_modules/openclaw/skills/weather',
    status: 'disabled' as const,
    lastUsed: '2026-02-20T09:15:00Z',
    usageCount: 12,
    author: 'openclaw',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/weather',
    installedAt: '2026-01-20T16:45:00Z',
  },
  {
    slug: 'apple-reminders',
    name: 'Apple 提醒',
    version: '1.2.0',
    description: 'Apple Reminders 集成，支持任务同步和管理',
    location: '/opt/homebrew/lib/node_modules/openclaw/skills/apple-reminders',
    status: 'active' as const,
    lastUsed: '2026-02-24T08:45:00Z',
    usageCount: 18,
    author: 'openclaw',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/apple-reminders',
    installedAt: '2026-01-25T13:20:00Z',
  },
  {
    slug: '1password',
    name: '1Password CLI',
    version: '1.0.0',
    description: '1Password CLI 集成，支持密码管理和注入',
    location: '/opt/homebrew/lib/node_modules/openclaw/skills/1password',
    status: 'active' as const,
    lastUsed: '2026-02-22T15:30:00Z',
    usageCount: 8,
    author: 'openclaw',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/1password',
    installedAt: '2026-02-05T10:15:00Z',
  },
  {
    slug: 'obsidian',
    name: 'Obsidian 集成',
    version: '1.1.0',
    description: 'Obsidian 笔记集成，支持笔记管理和自动化',
    location: '/opt/homebrew/lib/node_modules/openclaw/skills/obsidian',
    status: 'error' as const,
    lastUsed: '2026-02-18T11:45:00Z',
    usageCount: 15,
    author: 'openclaw',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/obsidian',
    installedAt: '2026-01-30T14:30:00Z',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'usage';

  let data = [...MOCK_INSTALLED_SKILLS];

  // 状态过滤
  if (status) {
    data = data.filter(skill => skill.status === status);
  }

  // 排序
  if (sort === 'usage') {
    data.sort((a, b) => b.usageCount - a.usageCount);
  } else if (sort === 'recent') {
    data.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
  } else if (sort === 'name') {
    data.sort((a, b) => a.name.localeCompare(b.name));
  }

  // 统计
  const stats = {
    total: data.length,
    active: data.filter(s => s.status === 'active').length,
    disabled: data.filter(s => s.status === 'disabled').length,
    error: data.filter(s => s.status === 'error').length,
    totalUsage: data.reduce((sum, skill) => sum + skill.usageCount, 0),
    avgUsage: data.length > 0 ? Math.round(data.reduce((sum, skill) => sum + skill.usageCount, 0) / data.length) : 0,
  };

  // 使用趋势（最近7天）
  const usageTrend = [
    { date: '2026-02-18', count: 12 },
    { date: '2026-02-19', count: 18 },
    { date: '2026-02-20', count: 15 },
    { date: '2026-02-21', count: 22 },
    { date: '2026-02-22', count: 19 },
    { date: '2026-02-23', count: 25 },
    { date: '2026-02-24', count: 20 },
  ];

  // 分类统计
  const categoryStats = [
    { category: 'AI与自动化', count: 3, usage: 75 },
    { category: '系统核心', count: 2, usage: 58 },
    { category: '业务系统', count: 1, usage: 42 },
    { category: '基础设施', count: 1, usage: 28 },
  ];

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    action,
    stats,
    skills: data,
    usageTrend,
    categoryStats,
    pagination: {
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, slug, status } = body;

    if (action === 'toggle-status') {
      const skill = MOCK_INSTALLED_SKILLS.find(s => s.slug === slug);
      if (!skill) {
        return NextResponse.json({ success: false, error: '技能不存在' }, { status: 404 });
      }

      const newStatus = status || (skill.status === 'active' ? 'disabled' : 'active');
      
      // 模拟状态切换延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      return NextResponse.json({
        success: true,
        message: `技能 "${skill.name}" 状态已更新为 ${newStatus === 'active' ? '活跃' : '禁用'}`,
        data: {
          ...skill,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    if (action === 'update') {
      const skill = MOCK_INSTALLED_SKILLS.find(s => s.slug === slug);
      if (!skill) {
        return NextResponse.json({ success: false, error: '技能不存在' }, { status: 404 });
      }

      // 模拟更新过程（实际应调用 clawhub update）
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newVersion = `${parseFloat(skill.version) + 0.1}`.slice(0, 4);

      return NextResponse.json({
        success: true,
        message: `技能 "${skill.name}" 更新成功 (${skill.version} → ${newVersion})`,
        data: {
          ...skill,
          version: newVersion,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    if (action === 'diagnose') {
      const skill = MOCK_INSTALLED_SKILLS.find(s => s.slug === slug);
      if (!skill) {
        return NextResponse.json({ success: false, error: '技能不存在' }, { status: 404 });
      }

      // 模拟诊断过程
      await new Promise(resolve => setTimeout(resolve, 1500));

      const issues = skill.status === 'error' ? [
        '配置文件缺失或格式错误',
        '依赖包版本不兼容',
        '权限不足无法访问资源',
      ] : skill.status === 'disabled' ? [
        '技能已被手动禁用',
        '配置文件中 disabled 设置为 true',
      ] : [
        '技能运行正常',
        '所有依赖包已安装',
        '配置文件有效',
      ];

      return NextResponse.json({
        success: true,
        message: `技能 "${skill.name}" 诊断完成`,
        data: {
          skill: skill.slug,
          status: skill.status,
          issues,
          recommendations: skill.status === 'error' ? [
            '检查配置文件格式',
            '更新依赖包版本',
            '检查文件权限',
          ] : skill.status === 'disabled' ? [
            '在配置文件中启用技能',
            '检查技能依赖关系',
          ] : [
            '继续保持当前状态',
            '定期检查更新',
          ],
          healthScore: skill.status === 'active' ? 95 : skill.status === 'disabled' ? 60 : 30,
        },
      });
    }

    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
