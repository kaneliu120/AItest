import { promises as fs } from 'fs';
import path from 'path';

export type McpStatus = 'active' | 'disabled' | 'error';

export interface MarketplaceItem {
  slug: string;
  name: string;
  description: string;
  version: string;
  downloads: number;
  rating: number;
  author: string;
  tags: string[];
  lastUpdated: string;
  license?: string;
  repository?: string;
}

export interface InstalledItem {
  slug: string;
  name: string;
  version: string;
  description: string;
  location: string;
  status: McpStatus;
  lastUsed: string;
  usageCount: number;
  author?: string;
  license?: string;
  repository?: string;
  installedAt: string;
}

interface McpStoreShape {
  marketplace: MarketplaceItem[];
  installed: InstalledItem[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'mcp', 'registry.json');

const defaultMarketplace: MarketplaceItem[] = [
  { slug: 'github', name: 'GitHub 集成', description: 'GitHub API 集成, 支持 PR, Issue, CI/CD Monitoring', version: '2.1.0', downloads: 1245, rating: 4.8, author: 'openclaw', tags: ['github', 'ci-cd', 'automation'], lastUpdated: '2026-02-20T10:30:00Z', license: 'MIT' },
  { slug: 'discord', name: 'Discord 机器人', description: 'Discord 聊d机器人, 支持命令, Notification, Automation', version: '1.5.2', downloads: 892, rating: 4.6, author: 'openclaw', tags: ['discord', 'chat', 'automation'], lastUpdated: '2026-02-18T14:20:00Z', license: 'MIT' },
  { slug: 'openai', name: 'OpenAI 集成', description: 'GPT, Whisper, DALL-E API 集成', version: '3.0.1', downloads: 2103, rating: 4.9, author: 'openai', tags: ['ai', 'gpt', 'image'], lastUpdated: '2026-02-22T09:15:00Z', license: 'MIT' },
  { slug: 'weather', name: 'd气servervice', description: 'All球d气data, 支持预报和Alert', version: '1.0.1', downloads: 432, rating: 4.2, author: 'openclaw', tags: ['weather', 'api'], lastUpdated: '2026-02-14T10:15:00Z', license: 'MIT' },
  { slug: 'apple-reminders', name: 'Apple 提醒', description: 'Apple Reminders 集成, 支持Tasksync和管理', version: '1.2.0', downloads: 321, rating: 4.5, author: 'openclaw', tags: ['apple', 'productivity'], lastUpdated: '2026-02-17T15:30:00Z', license: 'MIT' },
];

const defaultInstalled: InstalledItem[] = [
  { slug: 'github', name: 'GitHub 集成', version: '2.1.0', description: 'GitHub API 集成', location: '/opt/homebrew/lib/node_modules/openclaw/skills/github', status: 'active', lastUsed: '2026-02-24T10:30:00Z', usageCount: 42, installedAt: '2026-01-15T14:20:00Z' },
  { slug: 'discord', name: 'Discord 机器人', version: '1.5.2', description: 'Discord 聊d机器人', location: '/opt/homebrew/lib/node_modules/openclaw/skills/discord', status: 'active', lastUsed: '2026-02-24T14:20:00Z', usageCount: 28, installedAt: '2026-01-10T09:15:00Z' },
  { slug: 'weather', name: 'd气servervice', version: '1.0.1', description: 'All球d气data', location: '/opt/homebrew/lib/node_modules/openclaw/skills/weather', status: 'disabled', lastUsed: '2026-02-20T09:15:00Z', usageCount: 12, installedAt: '2026-01-20T16:45:00Z' },
];

async function ensureStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    const init: McpStoreShape = { marketplace: defaultMarketplace, installed: defaultInstalled };
    await fs.writeFile(STORE_PATH, JSON.stringify(init, null, 2), 'utf-8');
  }
}

async function readStore(): Promise<McpStoreShape> {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as McpStoreShape;
  return {
    marketplace: parsed.marketplace ?? defaultMarketplace,
    installed: parsed.installed ?? defaultInstalled,
  };
}

async function writeStore(data: McpStoreShape) {
  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function listMarketplace() {
  return (await readStore()).marketplace;
}

export async function listInstalled() {
  return (await readStore()).installed;
}

export async function installSkill(slug: string, version?: string) {
  const store = await readStore();
  const m = store.marketplace.find((x) => x.slug === slug);
  if (!m) throw new Error('Skilldoes not exist');
  if (!store.installed.find((x) => x.slug === slug)) {
    store.installed.push({
      slug,
      name: m.name,
      version: version || m.version,
      description: m.description,
      location: `/opt/homebrew/lib/node_modules/openclaw/skills/${slug}`,
      status: 'active',
      lastUsed: new Date().toISOString(),
      usageCount: 0,
      installedAt: new Date().toISOString(),
    });
  }
  await writeStore(store);
  return { slug, version: version || m.version };
}

export async function uninstallSkill(slug: string) {
  const store = await readStore();
  const before = store.installed.length;
  store.installed = store.installed.filter((x) => x.slug !== slug);
  if (store.installed.length === before) throw new Error('Skilldoes not exist');
  await writeStore(store);
}

export async function toggleInstalledStatus(slug: string, status?: McpStatus) {
  const store = await readStore();
  const item = store.installed.find((x) => x.slug === slug);
  if (!item) throw new Error('Skilldoes not exist');
  const next: McpStatus = status ?? (item.status === 'active' ? 'disabled' : 'active');
  item.status = next;
  item.lastUsed = new Date().toISOString();
  await writeStore(store);
  return item;
}

export async function updateInstalledSkill(slug: string, version?: string) {
  const store = await readStore();
  const item = store.installed.find((x) => x.slug === slug);
  if (!item) throw new Error('Skilldoes not exist');
  const market = store.marketplace.find((x) => x.slug === slug);
  const fromVersion = item.version;
  const toVersion = version || market?.version || item.version;
  item.version = toVersion;
  item.lastUsed = new Date().toISOString();
  await writeStore(store);
  return { ...item, fromVersion, toVersion, updated: compareSemver(toVersion, fromVersion) !== 0 };
}

function parseSemver(v: string): [number, number, number] {
  const clean = (v || '').trim().replace(/^v/i, '');
  const [major, minor, patch] = clean.split('.').map((x) => Number(x || 0));
  return [major || 0, minor || 0, patch || 0];
}

function compareSemver(a: string, b: string): number {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (av[i] > bv[i]) return 1;
    if (av[i] < bv[i]) return -1;
  }
  return 0;
}

export async function listUpdateCandidates() {
  const store = await readStore();
  return store.installed
    .map((ins) => {
      const market = store.marketplace.find((m) => m.slug === ins.slug);
      if (!market) return null;
      return {
        slug: ins.slug,
        name: ins.name,
        currentVersion: ins.version,
        latestVersion: market.version,
        hasUpdate: compareSemver(market.version, ins.version) > 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}
