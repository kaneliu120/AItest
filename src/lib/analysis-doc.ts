import fs from 'fs';
import path from 'path';
import { getMissionTask, listMissionTasks, listResources } from '@/lib/mission-task-store';

export async function generateAnalysisDoc(taskId: string): Promise<{ filePath: string; downloadUrl: string }> {
  const task = await getMissionTask(taskId);
  if (!task) throw new Error('任务不存在');

  const all = await listMissionTasks();
  const subtasks = all.filter(t => t.parentId === taskId);
  const resources = await listResources(taskId);

  const md = [
    `# 技术需求分析文档`,
    ``,
    `- 任务ID: ${task.id}`,
    `- 标题: ${task.title}`,
    `- 层级: L${task.level}`,
    `- 当前状态: ${task.status}`,
    `- 流程阶段: ${task.workflowStage || 'draft'}`,
    `- 目标价格: ${task.targetPrice ?? '—'} ${task.currency || 'PHP'}`,
    `- 负责人: ${task.owner || '—'}`,
    `- 生成时间: ${new Date().toISOString()}`,
    ``,
    `## 任务描述`,
    `${task.description || '（无）'}`,
    ``,
    `## 子任务清单`,
    ...(subtasks.length ? subtasks.map((s, i) => `${i + 1}. [${s.status}] ${s.title} (${s.progress}%)`) : ['- （无）']),
    ``,
    `## 资源清单`,
    ...(resources.length
      ? resources.map((r, i) => `${i + 1}. ${r.name} | ${r.resourceType} | ${r.url || r.filePath || '—'}`)
      : ['- （无）']),
    ``,
    `## 实施建议`,
    `1. 明确验收标准与交付边界`,
    `2. 按子任务逐项推进并记录证据`,
    `3. 测试通过后再推进发布与财务入账`,
    ``,
  ].join('\n');

  const dir = path.join(process.cwd(), 'data', 'analysis-docs');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${taskId}.md`);
  fs.writeFileSync(filePath, md, 'utf-8');

  return { filePath, downloadUrl: `/api/task-hierarchy/${taskId}/analysis-doc` };
}

export function readAnalysisDoc(taskId: string): string {
  const filePath = path.join(process.cwd(), 'data', 'analysis-docs', `${taskId}.md`);
  if (!fs.existsSync(filePath)) throw new Error('分析文档不存在');
  return fs.readFileSync(filePath, 'utf-8');
}
