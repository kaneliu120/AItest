export type TemplateNode = { level: 2 | 3; title: string; children?: TemplateNode[] };
export type TaskTemplate = { key: string; goalTitle: string; nodes: TemplateNode[] };

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: 'goal-1',
    goalTitle: 'AI Agent Installation & Deployment Business - Philippines',
    nodes: [
      { level: 2, title: 'Individual Services', children: [{ level: 3, title: 'Individual Client Installation Template' }] },
      { level: 2, title: 'Enterprise Services', children: [{ level: 3, title: 'Enterprise Deployment Implementation Template' }] },
    ],
  },
  {
    key: 'goal-2',
    goalTitle: 'MySkillStore Trading Platform Development & Operations',
    nodes: [
      { level: 2, title: 'Platform Progress', children: [{ level: 3, title: 'Version Milestone Tracking' }] },
      { level: 2, title: 'Platform Operations Plan', children: [{ level: 3, title: 'Marketing & Growth Experiments' }] },
    ],
  },
  {
    key: 'goal-3',
    goalTitle: 'Seeking Business & Institutional Investment',
    nodes: [
      { level: 2, title: 'Corporate', children: [{ level: 3, title: 'Business Partnership Opportunities' }] },
      { level: 2, title: 'VC & Funds', children: [{ level: 3, title: 'VC/Fund Engagement List' }] },
      { level: 2, title: 'Government/Individual/NGO', children: [{ level: 3, title: 'Public & Non-profit Collaboration' }] },
    ],
  },
  {
    key: 'goal-4',
    goalTitle: 'Job Search',
    nodes: [
      { level: 2, title: 'Product Roles', children: [{ level: 3, title: 'Product Role Applications & Tracking' }] },
      { level: 2, title: 'Engineering Roles', children: [{ level: 3, title: 'Engineering Applications & Interview Prep' }] },
      { level: 2, title: 'AI Roles', children: [{ level: 3, title: 'AI Portfolio & Applications' }] },
    ],
  },
  {
    key: 'goal-5',
    goalTitle: 'AI System & Feature Evolution',
    nodes: [
      { level: 2, title: 'Mission Control Optimization', children: [{ level: 3, title: 'Feature Stability & Workflow Optimization' }] },
      { level: 2, title: 'Knowledge Management Optimization', children: [{ level: 3, title: 'Knowledge Extraction & Retrieval Optimization' }] },
      { level: 2, title: 'Tool Management & Installation', children: [{ level: 3, title: 'Tool Service Governance Checklist' }] },
      { level: 2, title: 'Skill Management & Installation', children: [{ level: 3, title: 'Skill Templates & Release Process' }] },
    ],
  },
  {
    key: 'goal-6',
    goalTitle: 'Freelance Platform Orders',
    nodes: [
      { level: 2, title: 'Reddit' }, { level: 2, title: 'Upwork' }, { level: 2, title: 'Arbeitnow' },
      { level: 2, title: 'HackerNews' }, { level: 2, title: 'Himalayas' }, { level: 2, title: 'Jobicy' },
      { level: 2, title: 'RemoteOK' }, { level: 2, title: 'Remotive' }, { level: 2, title: 'WeWorkRemotely' }, { level: 2, title: 'WorkingNomads' },
    ],
  },
];
