import fs from 'fs';
import path from 'path';
import { getMissionTask, listMissionTasks, listResources } from '@/lib/mission-task-store';

export async function generateAnalysisDoc(taskId: string): Promise<{ filePath: string; downloadUrl: string }> {
  const task = await getMissionTask(taskId);
  if (!task) throw new Error('Task not found');

  const all = await listMissionTasks();
  const subtasks = all.filter(t => t.parentId === taskId);
  const resources = await listResources(taskId);

  const md = [
    `# Technical Requirements Analysis`,
    ``,
    `- Task ID: ${task.id}`,
    `- Title: ${task.title}`,
    `- Level: L${task.level}`,
    `- Status: ${task.status}`,
    `- Workflow Stage: ${task.workflowStage || 'draft'}`,
    `- Target Price: ${task.targetPrice ?? '—'} ${task.currency || 'PHP'}`,
    `- Owner: ${task.owner || '—'}`,
    `- Generated: ${new Date().toISOString()}`,
    ``,
    `## Task Description`,
    `${task.description || '(none)'}`,
    ``,
    `## Subtasks`,
    ...(subtasks.length ? subtasks.map((s, i) => `${i + 1}. [${s.status}] ${s.title} (${s.progress}%)`) : ['- (none)']),
    ``,
    `## Resources`,
    ...(resources.length
      ? resources.map((r, i) => `${i + 1}. ${r.name} | ${r.resourceType} | ${r.url || r.filePath || '—'}`)
      : ['- (none)']),
    ``,
    `## Implementation Recommendations`,
    `1. Clarify acceptance criteria and delivery scope`,
    `2. Progress through subtasks one by one and record evidence`,
    `3. Ensure tests pass before proceeding to release and financial recording`,
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
  if (!fs.existsSync(filePath)) throw new Error('Analysis document not found');
  return fs.readFileSync(filePath, 'utf-8');
}
