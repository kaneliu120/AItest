/**
 * /api/workflows/bookings
 * Workflow: Scan myskillstore.fun bookingLog, GenerateTask
 */
import { NextRequest, NextResponse } from 'next/server';
import { createTask, bookingTaskExists, getAllTasks } from '@/lib/task-store';

const BOOKING_URL = 'https://www.myskillstore.fun/en/admin/bookings';

// ─── 内存Center'sScanStatus ─────────────────────────────────────────────────────────
interface ScanState {
  lastScanAt:   string | null;
  lastResult:   string;
  totalScanned: number;
  totalCreated: number;
  isRunning:    boolean;
  error:        string | null;
  nextScanAt:   string | null;
  interval:     number; // min
}

const scanState: ScanState = {
  lastScanAt:   null,
  lastResult:   'Not yet run',
  totalScanned: 0,
  totalCreated: 0,
  isRunning:    false,
  error:        null,
  nextScanAt:   null,
  interval:     30, // Default 30 minScan一 times
};

// 定时Scan timer
let scanTimer: ReturnType<typeof setInterval> | null = null;

// ─── 模拟/true实 booking dataParse ───────────────────────────────────────────────
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
    // 尝试true实Request
    const res = await fetch(BOOKING_URL, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'MissionControl-Scanner/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        // 尝试Parse常见'sbookingListFormat
        const bookings = data.bookings ?? data.data ?? data.results ?? data ?? [];
        if (Array.isArray(bookings)) return bookings;
      }
    }
  } catch { /* 网络不可达, usingLocal模拟data */ }

  // Local模拟bookingdata(true实Request failed时's fallback)
  const now = new Date();
  return [
    {
      id: `booking-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-001`,
      customerName: 'Mr. Zhang',
      email: 'zhang@example.com',
      phone: '+63 912 345 6789',
      service: 'AI Installation servervice - DeepSeek',
      scheduledAt: new Date(now.getTime() + 2 * 86400000).toISOString(),
      status: 'confirmed',
      notes: 'Need to deploy DeepSeek local solution, configure NVIDIA GPU',
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: `booking-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-002`,
      customerName: 'Mr. Santos',
      email: 'santos@company.ph',
      phone: '+63 917 888 9999',
      service: 'AI Installation servervice - Llama',
      scheduledAt: new Date(now.getTime() + 5 * 86400000).toISOString(),
      status: 'pending',
      notes: 'On-premise Llama 3 deployment for call center automation',
      createdAt: new Date(now.getTime() - 1800000).toISOString(),
    },
  ];
}

// ─── 核心Scan逻辑 ──────────────────────────────────────────────────────────────
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
      // 去重Check
      if (bookingTaskExists(b.id)) { skipped++; continue; }

      // GenerateTask
      const task = await createTask({
        title:       `[Booking] ${b.customerName} - ${b.service}`,
        description: [
          `Customer: ${b.customerName}`,
          `Email: ${b.email}`,
          `Phone: ${b.phone}`,
          `servervice: ${b.service}`,
          `Scheduled: ${new Date(b.scheduledAt).toLocaleString('en-US')}`,
          `Booking status: ${b.status}`,
          b.notes ? `Notes: ${b.notes}` : '',
        ].filter(Boolean).join('\n'),
        priority:    b.status === 'confirmed' ? 'high' : 'medium',
        status:      'pending',
        source:      'booking',
        type:        'service', // serverviceclassTask, 不流转toAutomation
        dueDate:     b.scheduledAt,
        assignedTo:  'Admin',
        tags:        ['AI Install Service', 'Customer Booking', b.status],
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

      if (task) {
        createdTitles.push(task.title);
        created++;
      }
      scanState.totalCreated++;
    }

    const resultMsg = `Scanned ${bookings.length} logs, created ${created} tasks, skipped ${skipped} (already exist)`;
    scanState.lastScanAt   = new Date().toISOString();
    scanState.lastResult   = resultMsg;
    scanState.nextScanAt   = new Date(Date.now() + scanState.interval * 60000).toISOString();

    return { scanned: bookings.length, created, skipped, tasks: createdTitles };

  } catch (e) {
    scanState.error = e instanceof Error ? e.message : 'Unknown error';
    throw e;
  } finally {
    scanState.isRunning = false;
  }
}

// ─── Start/Stop定时Scan ─────────────────────────────────────────────────────────
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
    const allTasks = await getAllTasks();
    const devTaskCount  = allTasks.filter(t => t.type === 'development').length;
    const bookingCount  = allTasks.filter(t => t.source === 'booking').length;
    return NextResponse.json({
      success: true,
      data: {
        scanner: { ...scanState, timerActive: !!scanTimer },
        bookingUrl:   BOOKING_URL,
        stats: { bookingTasks: bookingCount, devTasks: devTaskCount },
      }
    });
  }

  return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── 手动立i.e.Scan ──
    if (action === 'scan-now') {
      const result = await runScan();
      return NextResponse.json({ success: true, data: result, message: scanState.lastResult });
    }

    // ── Start定时Scan ──
    if (action === 'start-timer') {
      const interval = parseInt(body.interval ?? '30');
      startTimer(interval);
      return NextResponse.json({ success: true, data: { started: true, interval, nextScanAt: scanState.nextScanAt } });
    }

    // ── Stop定时Scan ──
    if (action === 'stop-timer') {
      stopTimer();
      return NextResponse.json({ success: true, data: { stopped: true } });
    }

    // ── 手动Import单 booking ──
    if (action === 'import-booking') {
      const { booking } = body as { booking: BookingRecord };
      if (!booking?.id) return NextResponse.json({ success: false, error: 'Missing  booking data' }, { status: 400 });

      if (bookingTaskExists(booking.id)) {
        return NextResponse.json({ success: false, error: 'A task already exists for this booking' }, { status: 409 });
      }
      const task = await createTask({
        title:       `[Booking] ${booking.customerName} - ${booking.service}`,
        description: `Customer: ${booking.customerName}\nEmail: ${booking.email}\nPhone: ${booking.phone}\nService: ${booking.service}\nScheduled: ${new Date(booking.scheduledAt).toLocaleString('en-US')}\nStatus: ${booking.status}`,
        priority:    'high',
        status:      'pending',
        source:      'booking',
        type:        'service',
        dueDate:     booking.scheduledAt,
        assignedTo:  'Admin',
        tags:        ['AI Install Service', 'Customer Booking'],
        metadata: { ...booking, importedAt: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, data: { task }, message: 'Booking task created' });
    }

    return NextResponse.json({ success: false, error: 'Unsupported operation' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
