import { test, expect } from '@playwright/test';

test('skill-management redirect works', async ({ page }) => {
  await page.goto('/skill-management');
  await expect(page).toHaveURL(/\/skill-evaluator$/);
});

test('skill-evaluator modals open and close', async ({ page }) => {
  await page.goto('/skill-evaluator');

  await page.getByRole('button', { name: '新增技能' }).click();
  await expect(page.getByRole('heading', { name: '新增技能' })).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();

  await page.getByRole('button', { name: '合并技能' }).click();
  await expect(page.getByRole('heading', { name: '合并技能（同类型）' })).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();
});

test('skill-evaluator batch mode toggle visible', async ({ page }) => {
  await page.goto('/skill-evaluator');
  await page.getByRole('button', { name: '批量归档模式' }).click();
  await expect(page.getByRole('button', { name: /执行批量评估|批量评估中/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '执行批量归档' })).toBeVisible();
});

test('tools api pagination works', async ({ request, page }) => {
  const resp = await request.get('/api/tools?page=1&pageSize=2&status=all&category=all&search=');
  expect(resp.ok()).toBeTruthy();
  const json = await resp.json();
  expect(json.success).toBeTruthy();
  expect(Array.isArray(json.tools)).toBeTruthy();
  expect(json.tools.length).toBeLessThanOrEqual(2);
  expect(json.pagination.pageSize).toBe(2);

  await page.goto('/tools');
  await expect(page.locator('body')).toContainText(/加载MCP数据中|MCP管理|数据加载失败/);
});

test('tools installed update + batch endpoints work', async ({ request }) => {
  const installed = await request.get('/api/tools/installed');
  expect(installed.ok()).toBeTruthy();
  const data = await installed.json();
  expect(data.success).toBeTruthy();
  expect(Array.isArray(data.updateCandidates)).toBeTruthy();

  const install = await request.post('/api/tools', { data: { action: 'install-skill', slug: 'openai' } });
  expect(install.ok()).toBeTruthy();

  const toggle = await request.post('/api/tools', { data: { action: 'toggle-skill-status', slug: 'openai', status: 'disabled' } });
  expect(toggle.ok()).toBeTruthy();

  const uninstall = await request.post('/api/tools', { data: { action: 'uninstall-skill', slug: 'openai' } });
  expect(uninstall.ok()).toBeTruthy();
});
