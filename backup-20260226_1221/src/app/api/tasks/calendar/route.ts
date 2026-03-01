/**
 * /api/tasks/calendar — Apple Calendar 集成
 * POST: 将任务添加到 Apple Calendar
 * GET:  列出可用日历
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── 获取可用日历列表 ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const { stdout } = await execAsync(
      `osascript -e 'tell application "Calendar" to get name of calendars'`
    );
    const exclude = new Set(['生日','菲律宾节假日','Philippines Holidays','Siri建议','kaneliu10@gmail.com']);
    const calendars = stdout.trim().split(', ').filter(c => c && !exclude.has(c));
    return NextResponse.json({ success: true, data: { calendars } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── 添加任务到 Apple Calendar ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { title, description = '', dueDate, calendarName = '工作' } = await request.json();

    if (!title) {
      return NextResponse.json({ success: false, error: '缺少任务标题' }, { status: 400 });
    }

    // 解析目标日期
    let d: Date;
    if (dueDate) {
      d = new Date(dueDate);
      if (isNaN(d.getTime())) d = new Date();
    } else {
      d = new Date();
      d.setDate(d.getDate() + 1);
    }

    const yr    = d.getFullYear();
    const mo    = MONTH_NAMES[d.getMonth()];   // e.g. "February"
    const dy    = d.getDate();                  // e.g. 25
    const startH = 9;
    const startSec = startH * 3600;
    const endSec   = (startH + 1) * 3600;

    // 清理文本（防止注入）
    const safeTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, '').slice(0, 120);
    const safeDesc  = (description + '\n\n来源: Mission Control 任务管理')
                      .replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, '').slice(0, 500);
    const safeCal   = calendarName.replace(/'/g, '');

    // 用属性赋值避免本地化日期格式问题
    const script = [
      `tell application "Calendar"`,
      `  tell calendar "${safeCal}"`,
      `    set sd to current date`,
      `    set year  of sd to ${yr}`,
      `    set month of sd to ${mo}`,
      `    set day   of sd to ${dy}`,
      `    set time  of sd to ${startSec}`,
      `    set ed to current date`,
      `    set year  of ed to ${yr}`,
      `    set month of ed to ${mo}`,
      `    set day   of ed to ${dy}`,
      `    set time  of ed to ${endSec}`,
      `    make new event with properties {summary:"${safeTitle}", start date:sd, end date:ed, description:"${safeDesc}"}`,
      `  end tell`,
      `  reload calendars`,
      `end tell`,
      `return "ok"`,
    ].join('\n');

    // 写入临时文件避免 shell 转义问题
    const tmpFile = `/tmp/mc_cal_${Date.now()}.scpt`;
    const { writeFileSync, unlinkSync } = await import('fs');
    writeFileSync(tmpFile, script, 'utf-8');

    const { stdout, stderr } = await execAsync(`osascript "${tmpFile}"`);
    try { unlinkSync(tmpFile); } catch {}

    if (stderr && /error/i.test(stderr)) {
      return NextResponse.json({ success: false, error: stderr }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message:   `已添加到 Apple Calendar「${calendarName}」`,
        title,
        calendar:  calendarName,
        date:      `${yr}-${String(d.getMonth()+1).padStart(2,'0')}-${String(dy).padStart(2,'0')}`,
        time:      `${startH}:00`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
