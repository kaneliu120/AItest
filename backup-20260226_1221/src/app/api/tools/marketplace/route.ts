/**
 * /api/tools/marketplace — 工具市场 API
 * 集成 ClawHub.com 技能市场数据
 */
import { NextResponse } from 'next/server';

// 模拟 ClawHub 市场数据（实际应调用 ClawHub API）
const MOCK_MARKETPLACE = [
  {
    slug: 'github',
    name: 'GitHub 集成',
    description: 'GitHub API 集成，支持 PR、Issue、CI/CD 监控',
    version: '2.1.0',
    downloads: 1245,
    rating: 4.8,
    author: 'openclaw',
    tags: ['github', 'ci-cd', 'automation'],
    installed: true,
    installedVersion: '2.1.0',
    lastUpdated: '2026-02-20T10:30:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/github',
  },
  {
    slug: 'discord',
    name: 'Discord 机器人',
    description: 'Discord 聊天机器人，支持命令、通知、自动化',
    version: '1.5.2',
    downloads: 892,
    rating: 4.6,
    author: 'openclaw',
    tags: ['discord', 'chat', 'automation'],
    installed: true,
    installedVersion: '1.5.2',
    lastUpdated: '2026-02-18T14:20:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/discord',
  },
  {
    slug: 'openai',
    name: 'OpenAI 集成',
    description: 'GPT、Whisper、DALL-E API 集成，支持对话和图像生成',
    version: '3.0.1',
    downloads: 2103,
    rating: 4.9,
    author: 'openai',
    tags: ['ai', 'gpt', 'image'],
    installed: false,
    lastUpdated: '2026-02-22T09:15:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/openai',
  },
  {
    slug: 'google-ads',
    name: 'Google Ads',
    description: 'Google Ads API 集成，支持广告数据分析和优化',
    version: '1.2.0',
    downloads: 567,
    rating: 4.3,
    author: 'google',
    tags: ['ads', 'analytics', 'marketing'],
    installed: false,
    lastUpdated: '2026-02-15T16:45:00Z',
    license: 'Apache-2.0',
    repository: 'https://github.com/openclaw/skills/google-ads',
  },
  {
    slug: 'slack',
    name: 'Slack 集成',
    description: 'Slack 工作区集成，支持消息发送和自动化',
    version: '1.8.0',
    downloads: 743,
    rating: 4.5,
    author: 'slack',
    tags: ['slack', 'chat', 'automation'],
    installed: false,
    lastUpdated: '2026-02-19T11:30:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/slack',
  },
  {
    slug: 'notion',
    name: 'Notion 集成',
    description: 'Notion API 集成，支持页面、数据库同步',
    version: '2.0.0',
    downloads: 987,
    rating: 4.7,
    author: 'notion',
    tags: ['notion', 'productivity', 'database'],
    installed: false,
    lastUpdated: '2026-02-21T13:20:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/notion',
  },
  {
    slug: 'calendar',
    name: '日历集成',
    description: 'Google Calendar、Apple Calendar 集成，支持事件管理',
    version: '1.3.0',
    downloads: 654,
    rating: 4.4,
    author: 'openclaw',
    tags: ['calendar', 'productivity'],
    installed: false,
    lastUpdated: '2026-02-16T08:45:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/calendar',
  },
  {
    slug: 'weather',
    name: '天气服务',
    description: '全球天气数据，支持预报和警报',
    version: '1.0.1',
    downloads: 432,
    rating: 4.2,
    author: 'openclaw',
    tags: ['weather', 'api'],
    installed: true,
    installedVersion: '1.0.1',
    lastUpdated: '2026-02-14T10:15:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/weather',
  },
  {
    slug: 'apple-reminders',
    name: 'Apple 提醒',
    description: 'Apple Reminders 集成，支持任务同步和管理',
    version: '1.2.0',
    downloads: 321,
    rating: 4.5,
    author: 'openclaw',
    tags: ['apple', 'reminders', 'productivity'],
    installed: true,
    installedVersion: '1.2.0',
    lastUpdated: '2026-02-17T15:30:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/skills/apple-reminders',
  },
  {
    slug: 'clawhub',
    name: 'ClawHub CLI',
    description: '技能市场 CLI，支持技能搜索、安装、更新',
    version: '1.0.0',
    downloads: 789,
    rating: 4.8,
    author: 'openclaw',
    tags: ['cli', 'marketplace', 'skills'],
    installed: true,
    installedVersion: '1.0.0',
    lastUpdated: '2026-02-23T16:45:00Z',
    license: 'MIT',
    repository: 'https://github.com/openclaw/clawhub',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'downloads';

  let data = [...MOCK_MARKETPLACE];

  // 搜索过滤
  if (search) {
    data = data.filter(skill =>
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.description.toLowerCase().includes(search.toLowerCase()) ||
      skill.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // 分类过滤
  if (category) {
    data = data.filter(skill => skill.tags.includes(category));
  }

  // 排序
  if (sort === 'downloads') {
    data.sort((a, b) => b.downloads - a.downloads);
  } else if (sort === 'rating') {
    data.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'recent') {
    data.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  // 统计
  const stats = {
    total: data.length,
    installed: data.filter(s => s.installed).length,
    totalDownloads: data.reduce((sum, skill) => sum + skill.downloads, 0),
    avgRating: data.length > 0 ? data.reduce((sum, skill) => sum + skill.rating, 0) / data.length : 0,
    categories: Array.from(new Set(data.flatMap(skill => skill.tags))),
  };

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    action,
    stats,
    skills: data,
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
    const { action, slug, version } = body;

    if (action === 'install') {
      // 模拟安装过程
      const skill = MOCK_MARKETPLACE.find(s => s.slug === slug);
      if (!skill) {
        return NextResponse.json({ success: false, error: '技能不存在' }, { status: 404 });
      }

      // 模拟安装延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message: `技能 "${skill.name}" 安装成功`,
        data: {
          ...skill,
          installed: true,
          installedVersion: version || skill.version,
          installedAt: new Date().toISOString(),
        },
      });
    }

    if (action === 'uninstall') {
      // 模拟卸载过程
      const skill = MOCK_MARKETPLACE.find(s => s.slug === slug);
      if (!skill) {
        return NextResponse.json({ success: false, error: '技能不存在' }, { status: 404 });
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      return NextResponse.json({
        success: true,
        message: `技能 "${skill.name}" 卸载成功`,
        data: {
          ...skill,
          installed: false,
          installedVersion: undefined,
        },
      });
    }

    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
