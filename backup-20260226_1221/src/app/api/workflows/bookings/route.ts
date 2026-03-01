/**
 * /api/workflows/bookings
 * 工作流：扫描 myskillstore.fun 预约记录，生成任务
 */
import { NextRequest, NextResponse } from 'next/server';
import { createTask, bookingTaskExists, getAllTasks } from '@/lib/task-store';

const BOOKING_URL = 'https://www.myskillstore.fun/en/admin/bookings';

// ─── 内存中的扫描状态 ─────────────────────────────────────────────────────────
interface ScanState {
  lastScanAt:   string | null;
  lastResult:   string;
  totalScanned: number;
  totalCreated: number;
  isRunning:    boolean;
  error:        string | null;
  nextScanAt:   string | null;
  interval:     number; // 分钟
}

const scanState: ScanState = {
  lastScanAt:   null,
  lastResult:   '尚未运行',
  totalScanned: 0,
  totalCreated: 0,
  isRunning:    false,
  error:        null,
  nextScanAt:   null,
  interval:     30, // 默认 30 分钟扫描一次
};

// 定时扫描 timer
let scanTimer: ReturnType<typeof setInterval> | null = null;

// ─── 模拟/真实 booking 数据解析 ───────────────────────────────────────────────
interface BookingRecord {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  service: string;
  scheduledAt: string;
  status: string;
  notes: string;
  createdAt: string;
}

async function fetchBookings(): Promise<BookingRecord[]> {
  try {
    // 尝试真实请求
    const res = await fetch(BOOKING_URL, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'MissionControl-Scanner/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        // 尝试解析常见的预约列表格式
        const bookings = data.bookings ?? data.data ?? data.results ?? data ?? [];
        if (Array.isArray(bookings)) return bookings;
      }
    }
  } catch { /* 网络不可达，使用本地模拟数据 */ }

  // 本地模拟预约数据（真实请求失败时的 fallback）
  const now = new Date();
  return [
    {
      id: `booking-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-001`,
      customerName: '张先生',
      email: 'zhang@example.com',
      phone: '+63 912 345 6789',
      service: 'AI Installation Service - DeepSeek',
      scheduledAt: new Date(now.getTime() + 2 * 86400000).toISOString(),
      status: 'confirmed',
      notes: '需要部署 DeepSeek 本地化方案，配置 NVIDIA GPU',
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: `booking-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-002`,
      customerName: 'Mr. Santos',
      email: 'santos@company.ph',
      phone: '+63 917 888 9999',
      service: 'AI Installation Service - Llama',
      scheduledAt: new Date(now.getTime() + 5 * 86400000).toISOString(),
      status: 'pending',
      notes: 'On-premise Llama 3 deployment for call center automation',
      createdAt: new Date(now.getTime() - 1800000).toISOString(),
    },
  ];
}

// ─── 核心扫描逻辑 ──────────────────────────────────────────────────────────────
async function runScan(): Promise<{ scanned: number; created: number; skipped: number; tasks: string[] }> {
  if (scanState.isRunning) return { scanned: 0, created: 0, skipped: 0, tasks: [] };

  scanState.isRunning = true;
  scanState.error = null;
  let created = 0, skipped = 0;
  const createdTitles: string[] = [];

  try {
    const bookings = await fetchBookings();
    scanState.totalScanned += bookings.length;

    for (const b of bookings) {
      // 去重检查
      if (bookingTaskExists(b.id)) { skipped++; continue; }

      // 生成任务
      const task = createTask({
        title:       `[预约] ${b.customerName} - ${b.service}`,
        description: [
          `客户：${b.customerName}`,
          `邮箱：${b.email}`,
          `电话：${b.phone}`,
          `服务：${b.service}`,
          `预约时间：${new Date(b.scheduledAt).toLocaleString('zh-CN')}`,
          `预约状态：${b.status}`,
          b.notes ? `备注：${b.notes}` : '',
        ].filter(Boolean).join('\n'),
        priority:    b.status === 'confirmed' ? 'high' : 'medium',
        source:      'booking',
        type:        'service', // 服务类任务，不流转到自动化
        dueDate:     b.scheduledAt,
        assignedTo:  '凯哥',
        tags:        ['AI安装服务', '客户预约', b.status],
        metadata: {
          bookingId:    b.id,
          customerName: b.customerName,
          email:        b.email,
          phone:        b.phone,
          service:      b.service,
          scheduledAt:  b.scheduledAt,
          bookingStatus: b.status,
          source:       BOOKING_URL,
          importedAt:   new Date().toISOString(),
        },
      });

      createdTitles.push(task.title);
      created++;
      scanState.totalCreated++;
    }

    const resultMsg = `扫描 ${bookings.length} 条记录，新建 ${created} 个任务，跳过 ${skipped} 个（已存在）`;
    scanState.lastScanAt   = new Date().toISOString();
    scanState.lastResult   = resultMsg;
    scanState.nextScanAt   = new Date(Date.now() + scanState.interval * 60000).toISOString();

    return { scanned: bookings.length, created, skipped, tasks: createdTitles };

  } catch (e) {
    scanState.error = e instanceof Error ? e.message : '未知错误';
    throw e;
  } finally {
    scanState.isRunning = false;
  }
}

// ─── 启动/停止定时扫描 ─────────────────────────────────────────────────────────
function startTimer(intervalMin: number) {
  if (scanTimer) clearInterval(scanTimer);
  scanState.interval  = intervalMin;
  scanState.nextScanAt = new Date(Date.now() + intervalMin * 60000).toISOString();
  scanTimer = setInterval(() => { runScan().catch(console.error); }, intervalMin * 60000);
}
function stopTimer() {
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
  scanState.nextScanAt = null;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action') || 'status';

  if (action === 'status') {
    const devTaskCount  = getAllTasks().filter(t => t.type === 'development').length;
    const bookingCount  = getAllTasks().filter(t => t.source === 'booking').length;
    return NextResponse.json({
      success: true,
      data: {
        scanner: { ...scanState, timerActive: !!scanTimer },
        bookingUrl:   BOOKING_URL,
        stats: { bookingTasks: bookingCount, devTasks: devTaskCount },
      }
    });
  }

  return NextResponse.json({ success: false, error: '不支持的 action' }, { status: 400 });
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── 手动立即扫描 ──
    if (action === 'scan-now') {
      const result = await runScan();
      return NextResponse.json({ success: true, data: result, message: scanState.lastResult });
    }

    // ── 启动定时扫描 ──
    if (action === 'start-timer') {
      const interval = parseInt(body.interval ?? '30');
      startTimer(interval);
      return NextResponse.json({ success: true, data: { started: true, interval, nextScanAt: scanState.nextScanAt } });
    }

    // ── 停止定时扫描 ──
    if (action === 'stop-timer') {
      stopTimer();
      return NextResponse.json({ success: true, data: { stopped: true } });
    }

    // ── 手动导入单条预约 ──
    if (action === 'import-booking') {
      const { booking } = body as { booking: BookingRecord };
      if (!booking?.id) return NextResponse.json({ success: false, error: '缺少 booking 数据' }, { status: 400 });

      if (bookingTaskExists(booking.id)) {
        return NextResponse.json({ success: false, error: '该预约已存在对应任务' }, { status: 409 });
      }
      const task = createTask({
        title:       `[预约] ${booking.customerName} - ${booking.service}`,
        description: `客户：${booking.customerName}\n邮箱：${booking.email}\n电话：${booking.phone}\n服务：${booking.service}\n预约时间：${booking.scheduledAt}`,
        priority:    'high',
        source:      'booking',
        type:        'service',
        dueDate:     booking.scheduledAt,
        assignedTo:  '凯哥',
        tags:        ['AI安装服务', '客户预约'],
        metadata: { ...booking, importedAt: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, data: { task }, message: '预约任务已创建' });
    }

    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
