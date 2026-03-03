import fs from 'fs';
import path from 'path';
import { getMissionTask, listMissionTasks, listResources } from '@/lib/mission-task-store';

export async function generateAnalysisDoc(taskId: string): Promise<{ filePath: string; downloadUrl: string }> {
  const task = await getMissionTask(taskId);
  if (!task) throw new Error('Taskdoes not exist');

  const all = await listMissionTasks();
  const subtasks = all.filter(t => t.parentId === taskId);
  const resources = await listResources(taskId);

  const md = [
    `# 技术Requirements Analysisdocument`,
    ``,
    `- TaskID: ${task.id}`,
    `- title: ${task.title}`,
    `- 层级: L${task.level}`,
    `- CurrentStatus: ${task.status}`,
    `- ProcessStage: ${task.workflowStage || 'draft'}`,
    `- 目标价格: ${task.targetPrice ?? '-'} ${task.currency || 'PHP'}`,
    `- Assignee: ${task.owner || '-'}`,
    `- Generatetime: ${new Date().toISOString()}`,
    ``,
    `## TaskDescription`,
    `${task.description || '(None)'}`,
    ``,
    `## 子Task清单`,
    ...(subtasks.length ? subtasks.map((s, i) => `${i + 1}. [${s.status}] ${s.title} (${s.progress}%)`) : ['- (None)']),
    ``,
    `## resource清单`,
    ...(resources.length
      ? resources.map((r, i) => `${i + 1}. ${r.name} | ${r.resourceType} | ${r.url || r.filePath || '-'}`)
      : ['- (None)']),
    ``,
    `## 实施建议`,
    `1. 明确acceptancestandardanddeliveryEdge界`,
    `2. by子Task逐项推进andLog证据`,
    `3. Testthrough后再推进ReleaseandFinance入账`,
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
  if (!fs.existsSync(filePath)) throw new Error('Analyticsdocumentdoes not exist');
  return fs.readFileSync(filePath, 'utf-8');
}
