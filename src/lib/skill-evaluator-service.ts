import fs from 'fs';
import path from 'path';
import pool from '@/shared/db/client';
import { getSkillEvalWeights } from './skill-evaluator-config';

export interface EvaluationCategory {
  name: string;
  score: number;
  weight: number;
  details: string[];
}

export interface EvaluationReport {
  id: string;
  skillName: string;
  skillPath: string;
  overallScore: number;
  grade: string;
  evaluationDate: string;
  categories: EvaluationCategory[];
  recommendations: string[];
  issues: string[];
  runId?: string | null;
}

export interface EvaluationStats {
  status: string;
  version: string;
  uptime: string;
  lastEvaluation: string;
  totalEvaluations: number;
  averageScore: number;
  grade: string;
  recentReports: Array<{
    id: string;
    name: string;
    score: number;
    grade: string;
    timestamp: string;
  }>;
}

const SKILL_ALLOWED_ROOT = process.env.SKILL_EVAL_ALLOWED_ROOT || '/Users/kane/.openclaw/workspace/skills';

class SkillEvaluatorService {
  private startedAt = Date.now();
  private registryFile = path.join(process.cwd(), 'data', 'skills', 'registry.json');

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private validateSkillPath(skillPath: string): { ok: boolean; reason?: string; resolved?: string } {
    if (!skillPath || skillPath.length > 500) return { ok: false, reason: 'Invalid path parameter' };
    const resolved = path.resolve(skillPath.replace(/^~\//, `${process.env.HOME || ''}/`));
    const allowed = path.resolve(SKILL_ALLOWED_ROOT.replace(/^~\//, `${process.env.HOME || ''}/`));
    if (!resolved.startsWith(allowed)) return { ok: false, reason: `Path outside allowed range: ${allowed}` };
    return { ok: true, resolved };
  }

  private ensureRegistryStorage() {
    const dir = path.dirname(this.registryFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.registryFile)) {
      fs.writeFileSync(this.registryFile, JSON.stringify({ items: [], updatedAt: new Date().toISOString() }, null, 2));
    }
  }

  private getSkillType(skillPath: string): string {
    const base = path.resolve(SKILL_ALLOWED_ROOT.replace(/^~\//, `${process.env.HOME || ''}/`));
    const rel = path.relative(base, skillPath).replace(/\\/g, '/');

    // rel: category[/subcategory]/skill-name
    // requirement: only show top-level category, missing -> other
    const parent = path.dirname(rel).replace(/\\/g, '/');
    if (parent === '.' || parent === '') return 'other';

    const parts = parent.split('/').filter((p) => p && p !== '.');
    if (parts.length >= 1) return parts[0];
    return 'other';
  }

  private readRegistry(): Array<{ skillName: string; skillPath: string; status: 'active' | 'archived'; createdAt: string; updatedAt: string; mergedInto?: string; mergedAt?: string }> {
    this.ensureRegistryStorage();
    try {
      const data = JSON.parse(fs.readFileSync(this.registryFile, 'utf-8'));
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  }

  private writeRegistry(items: Array<{ skillName: string; skillPath: string; status: 'active' | 'archived'; createdAt: string; updatedAt: string; mergedInto?: string; mergedAt?: string }>) {
    this.ensureRegistryStorage();
    fs.writeFileSync(this.registryFile, JSON.stringify({ items, updatedAt: new Date().toISOString() }, null, 2));
  }

  private evaluateByRules(skillPath: string): { categories: EvaluationCategory[]; recommendations: string[]; issues: string[]; overallScore: number; grade: string } {
    const categories: EvaluationCategory[] = [];
    const recommendations: string[] = [];
    const issues: string[] = [];
    const weights = getSkillEvalWeights();

    const skillMd = path.join(skillPath, 'SKILL.md');
    const readme = path.join(skillPath, 'README.md');
    const hasSkillMd = fs.existsSync(skillMd);
    const hasReadme = fs.existsSync(readme);

    const files: string[] = [];
    if (fs.existsSync(skillPath)) {
      for (const entry of fs.readdirSync(skillPath)) files.push(entry);
    }

    const hasTests = files.some((f) => /test|spec/i.test(f)) || fs.existsSync(path.join(skillPath, '__tests__'));
    const hasScripts = files.some((f) => /\.sh$|\.js$|\.ts$/.test(f));

    const docScore = hasSkillMd && hasReadme ? 92 : hasSkillMd || hasReadme ? 75 : 45;
    categories.push({
      name: 'Documentation Completeness',
      score: docScore,
      weight: weights.documentation,
      details: [
        hasSkillMd ? 'SKILL.md exists' : 'Missing SKILL.md',
        hasReadme ? 'README.md exists' : 'Missing README.md',
      ],
    });

    const structureScore = fs.existsSync(skillPath) ? (files.length >= 3 ? 85 : 68) : 0;
    categories.push({
      name: 'Structural Integrity',
      score: structureScore,
      weight: weights.structure,
      details: [
        fs.existsSync(skillPath) ? `Directory exists, files: ${files.length}` : 'Directory not found',
        hasScripts ? 'Executable scripts/code files present' : 'Missing scripts or code files',
      ],
    });

    const testScore = hasTests ? 80 : 55;
    categories.push({
      name: 'Test Coverage',
      score: testScore,
      weight: weights.testing,
      details: [hasTests ? 'Test-related files detected' : 'No test-related files detected'],
    });

    const securityScore = path.isAbsolute(skillPath) ? 78 : 60;
    categories.push({
      name: 'Security & Standards',
      score: securityScore,
      weight: weights.security,
      details: ['Path whitelist validation done', 'Basic input validation executed'],
    });

    const maintainScore = files.length > 5 ? 82 : 70;
    categories.push({
      name: 'Maintainability',
      score: maintainScore,
      weight: weights.maintainability,
      details: ['Maintainability estimated from directory structure'],
    });

    const overallScore = Math.round(categories.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0));
    const grade = this.calculateGrade(overallScore);

    for (const c of categories) {
      if (c.score < 70) recommendations.push(`${c.name} is recommended for priority optimization (${c.score} pts)`);
      if (c.score < 60) issues.push(`${c.name} has significant weaknesses (${c.score} pts)`);
    }
    if (!hasSkillMd) issues.push('Missing SKILL.md (required)');
    if (!hasReadme) recommendations.push('Add README.md with installation and usage instructions');

    return {
      categories,
      recommendations: recommendations.slice(0, 8),
      issues: issues.slice(0, 8),
      overallScore,
      grade,
    };
  }

  private async saveReport(report: EvaluationReport): Promise<void> {
    await pool.query(
      `INSERT INTO skill_evaluations
      (id, run_id, skill_name, skill_path, overall_score, grade, evaluation_date, recommendations, issues)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        report.id,
        report.runId || null,
        report.skillName,
        report.skillPath,
        report.overallScore,
        report.grade,
        report.evaluationDate,
        JSON.stringify(report.recommendations || []),
        JSON.stringify(report.issues || []),
      ]
    );

    for (const cat of report.categories) {
      await pool.query(
        `INSERT INTO skill_evaluation_items (id, evaluation_id, category_name, score, weight, details)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          `sei-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          report.id,
          cat.name,
          cat.score,
          cat.weight,
          JSON.stringify(cat.details || []),
        ]
      );
    }
  }

  async getEvaluationStats(): Promise<EvaluationStats> {
    const [agg, latest, recent] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COALESCE(AVG(overall_score),0)::float AS avg_score
         FROM skill_evaluations`
      ),
      pool.query(`SELECT evaluation_date FROM skill_evaluations ORDER BY evaluation_date DESC LIMIT 1`),
      pool.query(`SELECT id, skill_name, overall_score, grade, evaluation_date FROM skill_evaluations ORDER BY evaluation_date DESC LIMIT 5`),
    ]);

    const total = Number(agg.rows[0]?.total || 0);
    const avg = Math.round(Number(agg.rows[0]?.avg_score || 0));

    return {
      status: 'running',
      version: '2.0.0',
      uptime: `${Math.floor((Date.now() - this.startedAt) / 1000)}s`,
      lastEvaluation: latest.rows[0]?.evaluation_date || new Date(0).toISOString(),
      totalEvaluations: total,
      averageScore: avg,
      grade: this.calculateGrade(avg),
      recentReports: recent.rows.map((r) => ({
        id: r.id,
        name: r.skill_name,
        score: Number(r.overall_score),
        grade: r.grade,
        timestamp: r.evaluation_date,
      })),
    };
  }

  async getEvaluationReports(limit = 50, filters?: { grade?: string; minScore?: number; hours?: number }): Promise<EvaluationReport[]> {
    const where: string[] = [];
    const vals: any[] = [];

    if (filters?.grade) {
      vals.push(filters.grade);
      where.push(`grade = $${vals.length}`);
    }
    if (typeof filters?.minScore === 'number') {
      vals.push(filters.minScore);
      where.push(`overall_score >= $${vals.length}`);
    }
    if (typeof filters?.hours === 'number' && filters.hours > 0) {
      vals.push(String(filters.hours));
      where.push(`evaluation_date >= now() - ($${vals.length}::text || ' hours')::interval`);
    }

    vals.push(limit);

    const rs = await pool.query(
      `SELECT id, run_id, skill_name, skill_path, overall_score, grade, evaluation_date, recommendations, issues
       FROM skill_evaluations
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY evaluation_date DESC
       LIMIT $${vals.length}`,
      vals
    );

    const reports: EvaluationReport[] = [];
    for (const row of rs.rows) {
      const items = await pool.query(
        `SELECT category_name, score, weight, details
         FROM skill_evaluation_items
         WHERE evaluation_id=$1`,
        [row.id]
      );

      reports.push({
        id: row.id,
        runId: row.run_id,
        skillName: row.skill_name,
        skillPath: row.skill_path,
        overallScore: Number(row.overall_score),
        grade: row.grade,
        evaluationDate: row.evaluation_date,
        categories: items.rows.map((i) => ({
          name: i.category_name,
          score: Number(i.score),
          weight: Number(i.weight),
          details: Array.isArray(i.details) ? i.details : [],
        })),
        recommendations: Array.isArray(row.recommendations) ? row.recommendations : [],
        issues: Array.isArray(row.issues) ? row.issues : [],
      });
    }

    return reports;
  }

  async createEvaluationRun(skillPath: string, skillName?: string): Promise<{ runId: string }> {
    const v = this.validateSkillPath(skillPath);
    if (!v.ok) throw new Error(v.reason || 'Path validation failed');
    if (!fs.existsSync(v.resolved!)) throw new Error('Skill directory not found');

    const runId = `ser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT INTO skill_evaluation_runs (id, skill_name, skill_path, status, created_at, updated_at)
       VALUES ($1,$2,$3,'pending',now(),now())`,
      [runId, skillName || path.basename(v.resolved!), v.resolved!]
    );

    void this.executeRun(runId);
    return { runId };
  }

  private async executeRun(runId: string): Promise<void> {
    const runRs = await pool.query(`SELECT * FROM skill_evaluation_runs WHERE id=$1`, [runId]);
    const run = runRs.rows[0];
    if (!run) return;

    try {
      await pool.query(`UPDATE skill_evaluation_runs SET status='running', started_at=now(), updated_at=now() WHERE id=$1`, [runId]);

      const result = this.evaluateByRules(run.skill_path);
      const report: EvaluationReport = {
        id: `se-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        runId,
        skillName: run.skill_name,
        skillPath: run.skill_path,
        overallScore: result.overallScore,
        grade: result.grade,
        evaluationDate: new Date().toISOString(),
        categories: result.categories,
        recommendations: result.recommendations,
        issues: result.issues,
      };

      await this.saveReport(report);
      await pool.query(`UPDATE skill_evaluation_runs SET status='completed', completed_at=now(), updated_at=now() WHERE id=$1`, [runId]);
    } catch (e: any) {
      await pool.query(
        `UPDATE skill_evaluation_runs SET status='failed', error_message=$2, completed_at=now(), updated_at=now() WHERE id=$1`,
        [runId, e?.message || 'unknown-error']
      );
    }
  }

  async getRunStatus(runId: string) {
    const rs = await pool.query(`SELECT * FROM skill_evaluation_runs WHERE id=$1`, [runId]);
    if (!rs.rows[0]) return null;
    return rs.rows[0];
  }

  async getSkillTrend(skillName: string, limit = 50) {
    const rs = await pool.query(
      `SELECT id, overall_score, grade, evaluation_date
       FROM skill_evaluations
       WHERE skill_name=$1
       ORDER BY evaluation_date DESC
       LIMIT $2`,
      [skillName, limit]
    );
    return rs.rows.map((r) => ({
      id: r.id,
      score: Number(r.overall_score),
      grade: r.grade,
      timestamp: r.evaluation_date,
    }));
  }

  async getIssueTopN(limit = 10) {
    const rs = await pool.query(
      `SELECT issue, COUNT(*)::int AS cnt
       FROM (
         SELECT jsonb_array_elements_text(issues) AS issue
         FROM skill_evaluations
       ) t
       GROUP BY issue
       ORDER BY cnt DESC
       LIMIT $1`,
      [limit]
    );
    return rs.rows.map((r) => ({ issue: r.issue, count: Number(r.cnt) }));
  }

  async getReportDetails(reportId: string): Promise<EvaluationReport | null> {
    const all = await this.getEvaluationReports(100);
    return all.find((r) => r.id === reportId) || null;
  }

  async deleteReport(reportId: string): Promise<boolean> {
    const rs = await pool.query(`DELETE FROM skill_evaluations WHERE id=$1`, [reportId]);
    return (rs.rowCount || 0) > 0;
  }

  async listSkills(options?: { type?: string; status?: 'active' | 'archived' | 'all'; page?: number; pageSize?: number }) {
    const allowed = path.resolve(SKILL_ALLOWED_ROOT.replace(/^~\//, `${process.env.HOME || ''}/`));
    const registry = this.readRegistry();
    const regMap = new Map(registry.map((r) => [path.resolve(r.skillPath), r]));

    const items: Array<{
      skillName: string;
      skillPath: string;
      type: string;
      status: 'active' | 'archived';
      hasSkillMd: boolean;
      lastScore?: number;
      lastGrade?: string;
      lastEvaluationAt?: string;
      mergedInto?: string;
      mergedAt?: string;
    }> = [];

    if (fs.existsSync(allowed)) {
      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const p = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // skip archived/system folders from management list
            if (entry.name === 'archived' || entry.name.startsWith('.')) continue;

            const skillMd = path.join(p, 'SKILL.md');
            if (fs.existsSync(skillMd)) {
              const reg = regMap.get(path.resolve(p));
              const status: 'active' | 'archived' = reg?.status || 'active';
              items.push({
                skillName: path.basename(p),
                skillPath: p,
                type: this.getSkillType(p),
                status,
                hasSkillMd: true,
                mergedInto: reg?.mergedInto,
                mergedAt: reg?.mergedAt,
              });
            } else {
              walk(p);
            }
          }
        }
      };
      walk(allowed);
    }

    const latestRs = await pool.query(
      `SELECT DISTINCT ON (skill_name)
          skill_name, overall_score, grade, evaluation_date
       FROM skill_evaluations
       ORDER BY skill_name, evaluation_date DESC`
    );
    const latestMap = new Map(latestRs.rows.map((r) => [r.skill_name, r]));

    for (const i of items) {
      const l = latestMap.get(i.skillName);
      if (l) {
        i.lastScore = Number(l.overall_score);
        i.lastGrade = l.grade;
        i.lastEvaluationAt = l.evaluation_date;
      }
    }

    const typeCounts: Record<string, number> = {};
    for (const i of items) typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;

    let filtered = items;
    if (options?.type && options.type !== 'all') filtered = filtered.filter(i => i.type === options.type);
    const st = options?.status || 'all';
    if (st !== 'all') filtered = filtered.filter(i => i.status === st);

    filtered = filtered.sort((a, b) => a.skillName.localeCompare(b.skillName));

    const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize || 30)));
    const page = Math.max(1, Number(options?.page || 1));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    return { skills: paged, total, page, pageSize, totalPages, typeCounts };
  }

  async createSkill(input: { skillName: string; relativePath?: string; template?: string; evaluateNow?: boolean; type?: string }) {
    const base = path.resolve(SKILL_ALLOWED_ROOT.replace(/^~\//, `${process.env.HOME || ''}/`));
    const folder = input.relativePath ? path.resolve(base, input.relativePath, input.skillName) : path.join(base, input.skillName);
    const v = this.validateSkillPath(folder);
    if (!v.ok) throw new Error(v.reason || 'Path validation failed');
    if (fs.existsSync(v.resolved!)) throw new Error('Skill directory already exists');

    fs.mkdirSync(v.resolved!, { recursive: true });
    const skillMd = path.join(v.resolved!, 'SKILL.md');
    const content = input.template || `---\nname: ${input.skillName}\ndescription: ${input.skillName} skill\n---\n\n# ${input.skillName}\n\n## Overview\n- TODO: add description\n`;
    fs.writeFileSync(skillMd, content);

    const registry = this.readRegistry();
    registry.push({ skillName: input.skillName, skillPath: v.resolved!, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    this.writeRegistry(registry);

    let runId: string | undefined;
    if (input.evaluateNow) {
      const run = await this.createEvaluationRun(v.resolved!, input.skillName);
      runId = run.runId;
    }

    return { skillName: input.skillName, skillPath: v.resolved!, runId };
  }

  async mergeSkills(input: { sourceSkillPaths: string[]; targetSkillPath: string }) {
    if (!Array.isArray(input.sourceSkillPaths) || input.sourceSkillPaths.length === 0) {
      throw new Error('Missing sourceSkillPaths');
    }

    const targetV = this.validateSkillPath(input.targetSkillPath);
    if (!targetV.ok || !targetV.resolved) throw new Error(targetV.reason || 'Invalid target path');

    const targetType = this.getSkillType(targetV.resolved);
    const normalizedSources = input.sourceSkillPaths
      .map((p) => this.validateSkillPath(p))
      .filter((v) => v.ok && v.resolved)
      .map((v) => v.resolved as string)
      .filter((p) => path.resolve(p) !== path.resolve(targetV.resolved!));

    if (normalizedSources.length === 0) throw new Error('No source skills available to merge');

    for (const sp of normalizedSources) {
      if (this.getSkillType(sp) !== targetType) {
        throw new Error(`Type mismatch, cannot merge: ${sp}`);
      }
    }

    const registry = this.readRegistry();
    const now = new Date().toISOString();

    const ensureEntry = (skillPath: string) => {
      const idx = registry.findIndex((r) => path.resolve(r.skillPath) === path.resolve(skillPath));
      if (idx >= 0) return idx;
      registry.push({
        skillName: path.basename(skillPath),
        skillPath,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      return registry.length - 1;
    };

    const targetIdx = ensureEntry(targetV.resolved);
    registry[targetIdx] = { ...registry[targetIdx], status: 'active', updatedAt: now };

    for (const sp of normalizedSources) {
      const idx = ensureEntry(sp);
      registry[idx] = {
        ...registry[idx],
        status: 'archived',
        mergedInto: targetV.resolved,
        mergedAt: now,
        updatedAt: now,
      };
    }

    this.writeRegistry(registry);

    return {
      merged: normalizedSources.length,
      targetSkillPath: targetV.resolved,
      sourceSkillPaths: normalizedSources,
      type: targetType,
      mergedAt: now,
    };
  }

  async deleteSkill(input: { skillPath: string; hardDelete?: boolean }) {
    const v = this.validateSkillPath(input.skillPath);
    if (!v.ok || !v.resolved) throw new Error(v.reason || 'Path validation failed');

    if (!fs.existsSync(v.resolved)) throw new Error('Skill directory not found');

    if (input.hardDelete) {
      const trashBase = path.join(path.dirname(v.resolved), '.trash');
      if (!fs.existsSync(trashBase)) fs.mkdirSync(trashBase, { recursive: true });
      const target = path.join(trashBase, `${path.basename(v.resolved)}-${Date.now()}`);
      fs.renameSync(v.resolved, target);
    }

    const registry = this.readRegistry();
    const idx = registry.findIndex(r => path.resolve(r.skillPath) === path.resolve(v.resolved!));
    if (idx >= 0) {
      registry[idx] = { ...registry[idx], status: 'archived', updatedAt: new Date().toISOString() };
    } else {
      registry.push({ skillName: path.basename(v.resolved), skillPath: v.resolved, status: 'archived', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.writeRegistry(registry);

    return { deleted: true, skillPath: v.resolved, hardDelete: !!input.hardDelete };
  }

  getSystemStatus() {
    return {
      status: 'running',
      version: '2.0.0',
      uptime: `${Math.floor((Date.now() - this.startedAt) / 1000)}s`,
    };
  }
}

export const skillEvaluatorService = new SkillEvaluatorService();
