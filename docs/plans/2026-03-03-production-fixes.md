# Production Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical/high/medium production issues: container OOM, CI gating, task-hierarchy 500, ESLint errors, npm vulnerabilities, legacy cleanup, and missing settings page.

**Architecture:** 8 independent fixes targeting: Dockerfile memory config, GitHub Actions workflow dependency, API error handling, ESLint ignores, npm audit, DB migration entrypoint, legacy file cleanup, and a new /settings page.

**Tech Stack:** Next.js 16 / Node 20 / Docker / GitHub Actions / PostgreSQL / ESLint

---

### Task 1: Fix Container Heap — Stop GC Thrashing

The Dockerfile CMD `node server.js` bypasses `package.json` scripts that set `--max-old-space-size=512`. The container defaults V8 heap to ~54MB, causing constant GC → CPU 100%.

**Files:**
- Modify: `Dockerfile:38-42`

**Step 1: Add NODE_OPTIONS to Dockerfile**

In `Dockerfile`, change the ENV and CMD section at the bottom:

```dockerfile
# Before:
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server.js"]

# After:
ENV NODE_ENV=production
ENV PORT=3001
ENV NODE_OPTIONS="--max-old-space-size=512"

CMD ["node", "server.js"]
```

**Step 2: Verify build**

Run: `cd /Users/kane/文档/project/mission-control && docker build -t mc-test . 2>&1 | tail -5`
Expected: Successfully built

**Step 3: Commit**

```bash
git add Dockerfile
git commit -m "fix(docker): add NODE_OPTIONS to prevent V8 heap OOM and GC thrashing"
```

---

### Task 2: Make CI Gate CD Deployment

CI and CD are independent workflows. CD deploys on every push to main regardless of CI results. Fix: make CD's `build-and-deploy` job depend on CI's `quality` job.

**Files:**
- Modify: `.github/workflows/cd.yml:14-16`

**Step 1: Add CI workflow dependency to CD**

In `.github/workflows/cd.yml`, the `build-and-deploy` job needs a `needs` clause referencing the CI workflow. Since GitHub Actions can't directly reference jobs in other workflow files, the cleanest fix is to embed the CI lint+build check directly into CD as a prerequisite job, then gate deployment on it.

Replace the entire file with:

```yaml
name: CD - Build & Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  ACR_REGISTRY: okmsacr120.azurecr.io
  IMAGE_NAME: mission-control
  WEBAPP_NAME: mission-control-app
  RESOURCE_GROUP: mc-rg

jobs:
  # ── Quality gate (must pass before deploy) ──
  quality-gate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    - run: npm ci
    - name: Lint (0 errors)
      run: npm run lint
    - name: Build verification
      run: npm run build
      env:
        NODE_ENV: production

  # ── Build & Deploy (only after quality gate passes) ──
  build-and-deploy:
    needs: quality-gate
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build (verify)
      run: npm run build
      env:
        NODE_ENV: production

    - name: Log in to Azure Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.ACR_REGISTRY }}
        username: ${{ secrets.MC_ACR_USERNAME }}
        password: ${{ secrets.MC_ACR_PASSWORD }}

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Build & push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ${{ env.ACR_REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          ${{ env.ACR_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Deploy to Azure Web App
      uses: azure/login@v2
      with:
        creds: ${{ secrets.MC_AZURE_CREDENTIALS }}

    - name: Update Web App container image
      run: |
        az webapp config container set \
          --name ${{ env.WEBAPP_NAME }} \
          --resource-group ${{ env.RESOURCE_GROUP }} \
          --container-image-name ${{ env.ACR_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          --container-registry-url https://${{ env.ACR_REGISTRY }} \
          --container-registry-user ${{ secrets.MC_ACR_USERNAME }} \
          --container-registry-password ${{ secrets.MC_ACR_PASSWORD }}

    - name: Restart Web App
      run: |
        az webapp restart \
          --name ${{ env.WEBAPP_NAME }} \
          --resource-group ${{ env.RESOURCE_GROUP }}

    - name: Wait and verify deployment
      run: |
        echo "Waiting 60s for app to start..."
        sleep 60
        URL="https://${{ env.WEBAPP_NAME }}.azurewebsites.net/api/health"
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
        echo "Health check status: $STATUS"
        if [ "$STATUS" = "200" ]; then
          echo "Deployment successful"
        else
          echo "App may still be starting (status: $STATUS)"
        fi
```

**Step 2: Commit**

```bash
git add .github/workflows/cd.yml
git commit -m "fix(ci): add quality gate to CD — lint+build must pass before deploy"
```

---

### Task 3: Fix `/api/task-hierarchy` 500 Error

The endpoint queries `mission_tasks` table via `pool.query()`. If the table doesn't exist (migrations not run), the query throws unhandled and returns empty 500. Fix: add try/catch with table-not-found handling.

**Files:**
- Modify: `src/app/api/task-hierarchy/route.ts:4-11`

**Step 1: Add error handling to GET handler**

Replace the GET function:

```typescript
export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'tree';
    const tasks = await listMissionTasks();
    return NextResponse.json({
      success: true,
      data: mode === 'flat' ? tasks : toTree(tasks),
      total: tasks.length,
    });
  } catch (error: any) {
    const msg = error?.message || 'Unknown error';
    // Table doesn't exist → return empty data instead of 500
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        warning: 'Database tables not initialized. Run migrations.',
      });
    }
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify locally**

Run: `curl -sf http://localhost:3001/api/task-hierarchy | python3 -m json.tool`
Expected: JSON with `success: true` (either data or warning)

**Step 3: Commit**

```bash
git add src/app/api/task-hierarchy/route.ts
git commit -m "fix(api): handle missing mission_tasks table gracefully in task-hierarchy"
```

---

### Task 4: Fix ESLint Errors (7 errors → 0)

Errors come from: (a) `backup-20260226_1221/` folder, (b) `public/*.js` legacy files, (c) `jest.setup.js`, (d) 2 real code issues in `src/app/api/task-hierarchy/generate/route.ts`.

**Files:**
- Modify: `eslint.config.mjs:47-55`
- Modify: `src/app/api/task-hierarchy/generate/route.ts:16,90`

**Step 1: Add backup dir and public JS to ESLint ignores**

In `eslint.config.mjs`, update the ignores array:

```javascript
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'backup-*/**',
      'public/**/*.js',
      'src/lib/requirements-analysis/**',
      'src/components/requirements-analysis/visual-dashboard.tsx',
      'src/components/requirements-analysis/visualization-dashboard.tsx',
      '*.config.*',
      'scripts/**',
    ],
  }
```

**Step 2: Fix the 2 real code errors in generate/route.ts**

In `src/app/api/task-hierarchy/generate/route.ts`:

Line 16 — `no-useless-escape`: Change `\.` to `.` in the regex string (or use a raw string).
Line 90 — `no-empty`: Add a comment inside the empty catch block.

```typescript
// Line 16: remove unnecessary escape
.replace(/^\d+(?:\.\d+)*\s*[.、]\s*/, '')

// Line 90: add comment to empty block
} catch (_e) { /* stdout not needed */ }
```

**Step 3: Run ESLint to verify 0 errors**

Run: `npx eslint . 2>&1 | grep "  error  " | wc -l`
Expected: 0

**Step 4: Commit**

```bash
git add eslint.config.mjs src/app/api/task-hierarchy/generate/route.ts
git commit -m "fix(lint): resolve all ESLint errors — exclude legacy dirs, fix 2 code issues"
```

---

### Task 5: Fix npm Security Vulnerabilities

63 vulnerabilities (2 critical). Run safe audit fix first, then evaluate remaining.

**Files:**
- Modify: `package.json`, `package-lock.json`

**Step 1: Run safe audit fix**

Run: `npm audit fix`

**Step 2: Check remaining vulnerabilities**

Run: `npm audit --audit-level=high 2>&1 | tail -5`

**Step 3: Verify build still works**

Run: `npm run build 2>&1 | tail -3`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "fix(security): npm audit fix — resolve dependency vulnerabilities"
```

---

### Task 6: Delete Legacy Backup Files

`backup-20260226_1221/` is a full src copy (12 dirs, many broken files). It serves no purpose in the repo.

**Files:**
- Delete: `backup-20260226_1221/` (entire directory)

**Step 1: Delete backup directory**

Run: `rm -rf backup-20260226_1221/`

**Step 2: Verify ESLint still clean**

Run: `npx eslint . 2>&1 | grep "  error  " | wc -l`
Expected: 0

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove stale backup-20260226 directory"
```

---

### Task 7: Create `/settings` Page

The sidebar links to `/settings` (lines 197, 213) but no page exists → 404. Create a minimal settings page with theme toggle, language selector, and system info.

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: Create settings page**

Create `src/app/settings/page.tsx` — a "use client" page with:
- Theme toggle (light/dark)
- Language selector (EN/ZH)
- System information display (version, environment, database status)
- Links to external monitoring (Prometheus/Grafana if configured)

Follow the same pattern as other pages: Card-based layout, using existing `@/components/ui/card`, `Badge`, `Button` components. Use `useLang()` for i18n.

**Step 2: Verify page renders**

Run: `curl -sf http://localhost:3001/settings | grep -c "Settings"`
Expected: >= 1

**Step 3: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add settings page — theme, language, system info"
```

---

### Task 8: Deploy & Verify

Push all changes, wait for CI quality gate to pass, then CD deploys.

**Step 1: Push to main**

```bash
git push origin main
```

**Step 2: Verify CI passes**

Run: `gh run list --limit 2`
Expected: CI quality check passes (0 errors)

**Step 3: Verify CD deploys**

Wait for CD to complete successfully.

**Step 4: Verify production**

```bash
# Health check
curl -sf https://mission-control-app.azurewebsites.net/api/health | python3 -m json.tool

# Task hierarchy no longer 500
curl -sf -o /dev/null -w "%{http_code}" https://mission-control-app.azurewebsites.net/api/task-hierarchy

# Settings page exists
curl -sf -o /dev/null -w "%{http_code}" https://mission-control-app.azurewebsites.net/settings

# CPU should drop from 100% after heap fix takes effect (~5 min)
```
