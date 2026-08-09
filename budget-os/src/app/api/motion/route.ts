// Optional sync to Motion (usemotion.com), the AI calendar/task app.
// - GET  → { connected } so the UI can show a "synced to Motion" hint.
// - POST → creates a task in Motion when MOTION_API_KEY is set; otherwise
//   returns { local: true } and the app just tracks the task in-app.
//
// Set these to enable real sync (Motion → Settings → API):
//   MOTION_API_KEY, MOTION_WORKSPACE_ID

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API = "https://api.usemotion.com/v1/tasks";

export async function GET() {
  return NextResponse.json({ connected: Boolean(process.env.MOTION_API_KEY) });
}

export async function POST(req: NextRequest) {
  const { task } = await req.json();
  const apiKey = process.env.MOTION_API_KEY;
  const workspaceId = process.env.MOTION_WORKSPACE_ID;

  if (!apiKey || !workspaceId || !task?.title) {
    return NextResponse.json({ local: true });
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: task.title,
        workspaceId,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
        description:
          `Created by your Financial Coach.` +
          (task.amount ? ` Amount: ₱${Number(task.amount).toLocaleString("en-PH")}.` : "") +
          (task.recurrence && task.recurrence !== "none"
            ? ` Recurrence: ${task.recurrence}.`
            : ""),
        autoScheduled: {},
      }),
    });
    if (!res.ok) return NextResponse.json({ local: true });
    const json = await res.json();
    return NextResponse.json({ motionId: json.id ?? null });
  } catch {
    return NextResponse.json({ local: true });
  }
}
