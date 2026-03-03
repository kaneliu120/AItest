export type TemplateNode = { level: 2 | 3; title: string; children?: TemplateNode[] };
export type TaskTemplate = { key: string; goalTitle: string; nodes: TemplateNode[] };

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: 'goal-1',
    goalTitle: 'AI智能体菲律宾市场的个人和企业安装和部署业务',
    nodes: [
      { level: 2, title: '个人服务', children: [{ level: 3, title: '个人客户安装任务模板' }] },
      { level: 2, title: '企业服务', children: [{ level: 3, title: '企业部署实施模板' }] },
    ],
  },
  {
    key: 'goal-2',
    goalTitle: 'MySkillStore交易平台的开发与运营',
    nodes: [
      { level: 2, title: '交易平台目前进度', children: [{ level: 3, title: '版本里程碑跟踪' }] },
      { level: 2, title: '交易平台运营计划', children: [{ level: 3, title: '运营投放与增长实验' }] },
    ],
  },
  {
    key: 'goal-3',
    goalTitle: '寻找商业与机构投资',
    nodes: [
      { level: 2, title: '商业公司', children: [{ level: 3, title: '商业合作机会池' }] },
      { level: 2, title: '风险投资和基金', children: [{ level: 3, title: 'VC/Fund 对接清单' }] },
      { level: 2, title: '政府/个人/NGO等非营利组织', children: [{ level: 3, title: '公共与非营利项目合作' }] },
    ],
  },
  {
    key: 'goal-4',
    goalTitle: '求职',
    nodes: [
      { level: 2, title: '产品岗位', children: [{ level: 3, title: '产品岗位投递与跟踪' }] },
      { level: 2, title: '技术开发岗位', children: [{ level: 3, title: '技术岗位投递与面试准备' }] },
      { level: 2, title: 'AI工作岗位', children: [{ level: 3, title: 'AI岗位作品集与投递' }] },
    ],
  },
  {
    key: 'goal-5',
    goalTitle: 'AI系统和功能进化',
    nodes: [
      { level: 2, title: 'Mission Control 优化', children: [{ level: 3, title: '功能稳定性与流程优化' }] },
      { level: 2, title: '知识管理系统优化', children: [{ level: 3, title: '知识抽取与检索优化' }] },
      { level: 2, title: '工具管理安装', children: [{ level: 3, title: '工具服务治理清单' }] },
      { level: 2, title: '技能管理和安装', children: [{ level: 3, title: '技能模板与发布流程' }] },
    ],
  },
  {
    key: 'goal-6',
    goalTitle: '外包平台接单任务',
    nodes: [
      { level: 2, title: 'Reddit' }, { level: 2, title: 'Upwork' }, { level: 2, title: 'Arbeitnow' },
      { level: 2, title: 'HackerNews' }, { level: 2, title: 'Himalayas' }, { level: 2, title: 'Jobicy' },
      { level: 2, title: 'RemoteOK' }, { level: 2, title: 'Remotive' }, { level: 2, title: 'WeWorkRemotely' }, { level: 2, title: 'WorkingNomads' },
    ],
  },
];
