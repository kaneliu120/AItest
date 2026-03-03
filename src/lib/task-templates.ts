export type TemplateNode = { level: 2 | 3; title: string; children?: TemplateNode[] };
export type TaskTemplate = { key: string; goalTitle: string; nodes: TemplateNode[] };

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: 'goal-1',
    goalTitle: 'AI Services for Philippine Market - Individual and Enterprise Installation and Deployment',
    nodes: [
      { level: 2, title: 'Individual Services', children: [{ level: 3, title: 'Individual Client Installation Task Template' }] },
      { level: 2, title: 'Enterprise Services', children: [{ level: 3, title: 'Enterprise Deployment Implementation Template' }] },
    ],
  },
  {
    key: 'goal-2',
    goalTitle: 'MySkillStore Trading Platform Development and Operations',
    nodes: [
      { level: 2, title: 'Trading Platform Current Progress', children: [{ level: 3, title: 'Version Milestone Tracking' }] },
      { level: 2, title: 'Trading Platform Operations Plan', children: [{ level: 3, title: 'Operations Launch and Growth Experiments' }] },
    ],
  },
  {
    key: 'goal-3',
    goalTitle: 'Seeking Commercial and Institutional Investment',
    nodes: [
      { level: 2, title: 'Commercial Companies', children: [{ level: 3, title: 'Commercial Partnership Opportunity Pool' }] },
      { level: 2, title: 'Venture Capital and Funds', children: [{ level: 3, title: 'VC/Fund Contact List' }] },
      { level: 2, title: 'Government/Individual/NGO Non-profits', children: [{ level: 3, title: 'Public and Non-profit Project Collaboration' }] },
    ],
  },
  {
    key: 'goal-4',
    goalTitle: 'Job Search',
    nodes: [
      { level: 2, title: 'Product Roles', children: [{ level: 3, title: 'Product Role Applications and Tracking' }] },
      { level: 2, title: 'Technical Development Roles', children: [{ level: 3, title: 'Technical Role Applications and Interview Preparation' }] },
      { level: 2, title: 'AI Work Roles', children: [{ level: 3, title: 'AI Role Portfolio and Applications' }] },
    ],
  },
  {
    key: 'goal-5',
    goalTitle: 'AI System and Feature Evolution',
    nodes: [
      { level: 2, title: 'Mission Control Optimization', children: [{ level: 3, title: 'Feature Stability and Process Optimization' }] },
      { level: 2, title: 'Knowledge Management System Optimization', children: [{ level: 3, title: 'Knowledge Extraction and Retrieval Optimization' }] },
      { level: 2, title: 'Tool Management and Installation', children: [{ level: 3, title: 'Tool Service Governance Checklist' }] },
      { level: 2, title: 'Skill Management and Installation', children: [{ level: 3, title: 'Skill Templates and Release Process' }] },
    ],
  },
  {
    key: 'goal-6',
    goalTitle: 'Outsource Platform Order Tasks',
    nodes: [
      { level: 2, title: 'Reddit' }, { level: 2, title: 'Upwork' }, { level: 2, title: 'Arbeitnow' },
      { level: 2, title: 'HackerNews' }, { level: 2, title: 'Himalayas' }, { level: 2, title: 'Jobicy' },
      { level: 2, title: 'RemoteOK' }, { level: 2, title: 'Remotive' }, { level: 2, title: 'WeWorkRemotely' }, { level: 2, title: 'WorkingNomads' },
    ],
  },
];
