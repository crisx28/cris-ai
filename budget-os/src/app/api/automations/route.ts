// Local-development bridge to the agentform runner's JSON run files.
//
// Lets you approve plans from the app without Supabase while developing. It
// has no authentication of its own, so it is switched off in production
// builds — there, approvals go through Supabase (see src/lib/automations.ts).
//
//   AGENTFORM_RUNS_DIR  where `python -m agentform plan` writes runs
//                       (default: ../automation/.agentform/runs)

import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RUN_ID = /^[0-9]{8}-[0-9]{6}-[a-f0-9]{6}$/;

function runsDir(): string {
  return process.env.AGENTFORM_RUNS_DIR ?? path.join(process.cwd(), "..", "automation", ".agentform", "runs");
}

function disabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function GET() {
  if (disabled()) return new NextResponse(null, { status: 404 });
  let files: string[] = [];
  try {
    files = (await fs.readdir(runsDir())).filter((f) => f.endsWith(".json"));
  } catch {
    return NextResponse.json({ runs: [] });
  }
  const runs = await Promise.all(
    files.map(async (f) => JSON.parse(await fs.readFile(path.join(runsDir(), f), "utf8")))
  );
  runs.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return NextResponse.json({ runs: runs.slice(0, 50) });
}

export async function POST(req: NextRequest) {
  if (disabled()) return new NextResponse(null, { status: 404 });
  const { id, planHash, decision } = await req.json();
  if (typeof id !== "string" || !RUN_ID.test(id)) {
    return NextResponse.json({ error: "Invalid run id" }, { status: 400 });
  }
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const file = path.join(runsDir(), `${id}.json`);
  let run;
  try {
    run = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  if (run.status !== "planned") {
    return NextResponse.json({ error: `Run is ${run.status}, not awaiting approval` }, { status: 409 });
  }
  if (decision === "approve") {
    // Bind the approval to the exact plan the person was shown.
    if (planHash !== run.plan_hash) {
      return NextResponse.json({ error: "The plan changed since it was shown. Reload and review again." }, { status: 409 });
    }
    run.status = "approved";
    run.approved_plan_hash = planHash;
    run.approved_at = new Date().toISOString();
  } else {
    run.status = "rejected";
  }
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(run, null, 2));
  await fs.rename(tmp, file);
  return NextResponse.json({ ok: true });
}
