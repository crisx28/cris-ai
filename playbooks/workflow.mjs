#!/usr/bin/env node
// Non-negotiable tool workflow.
//
// Every tool has a unique ID in registry.json. A client build lists the tools
// it uses in clients/<CLIENT-ID>.json. When a listed tool is non-negotiable
// (NN-*), the workflow fetches its playbook from tools/<TOOL-ID>.json and
// returns that playbook's tasks, each with an owner (owners.json).
//
//   node playbooks/workflow.mjs list
//   node playbooks/workflow.mjs run CB-BUDGET-OS [--phase setup] [--owner polly] [--status planned] [--json]
//   node playbooks/workflow.mjs check
//   node playbooks/workflow.mjs docs
//
// No dependencies. Node 18+.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PHASES = ["setup", "per-release", "recurring"];

const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

export function loadRegistry() {
  const { tools } = readJson("registry.json");
  return new Map(tools.map((t) => [t.id, t]));
}

export function loadOwners() {
  return readJson("owners.json");
}

export function listClients() {
  return readdirSync(join(ROOT, "clients"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

export function loadClient(clientId) {
  const rel = `clients/${clientId}.json`;
  if (!existsSync(join(ROOT, rel))) {
    throw new Error(`Unknown client build "${clientId}". Known: ${listClients().join(", ")}`);
  }
  return readJson(rel);
}

export function fetchPlaybook(toolId, registry = loadRegistry()) {
  const tool = registry.get(toolId);
  if (!tool) throw new Error(`Unknown tool ID "${toolId}"`);
  if (!tool.nonNegotiable) return null;
  return readJson(tool.playbook);
}

// The workflow: client build → its tools → playbooks for non-negotiables → tasks.
export function runWorkflow(clientId, { phase, owner, status } = {}) {
  const registry = loadRegistry();
  const client = loadClient(clientId);
  const playbooks = [];
  const skipped = [];

  for (const entry of client.tools) {
    const tool = registry.get(entry.id);
    if (!tool) throw new Error(`${clientId} lists unknown tool ID "${entry.id}"`);
    if (status && entry.status !== status) continue;
    if (!tool.nonNegotiable) {
      skipped.push({ id: tool.id, name: tool.name, reason: "optional — no playbook" });
      continue;
    }
    const playbook = fetchPlaybook(tool.id, registry);
    const tasks = playbook.tasks.filter(
      (t) => (!phase || t.phase === phase) && (!owner || t.owner === owner),
    );
    playbooks.push({ ...playbook, status: entry.status, note: entry.note, tasks });
  }

  return { client: { id: client.id, name: client.name }, playbooks, skipped };
}

// Validation: IDs unique, cross-references resolve, every build lists every NN tool.
export function check() {
  const errors = [];
  const registry = loadRegistry();
  const owners = loadOwners();
  const { tools } = readJson("registry.json");

  const seen = new Set();
  for (const t of tools) {
    if (seen.has(t.id)) errors.push(`Duplicate tool ID ${t.id}`);
    seen.add(t.id);
    const prefixOk = t.nonNegotiable ? t.id.startsWith("NN-") : t.id.startsWith("OPT-");
    if (!prefixOk) errors.push(`${t.id}: prefix must be ${t.nonNegotiable ? "NN-" : "OPT-"}`);
  }

  const taskIds = new Set();
  for (const t of tools.filter((t) => t.nonNegotiable)) {
    if (!t.playbook || !existsSync(join(ROOT, t.playbook))) {
      errors.push(`${t.id}: playbook file missing (${t.playbook})`);
      continue;
    }
    const pb = readJson(t.playbook);
    if (pb.id !== t.id) errors.push(`${t.playbook}: id "${pb.id}" does not match registry "${t.id}"`);
    if (!owners[pb.defaultOwner]) errors.push(`${t.id}: unknown defaultOwner "${pb.defaultOwner}"`);
    if (!pb.tasks?.length) errors.push(`${t.id}: playbook has no tasks`);
    for (const task of pb.tasks ?? []) {
      if (taskIds.has(task.id)) errors.push(`Duplicate task ID ${task.id}`);
      taskIds.add(task.id);
      if (!task.id.startsWith(`${t.id}-`)) errors.push(`${task.id}: must start with ${t.id}-`);
      if (!owners[task.owner]) errors.push(`${task.id}: unknown owner "${task.owner}"`);
      if (!PHASES.includes(task.phase)) errors.push(`${task.id}: phase must be one of ${PHASES.join(", ")}`);
      if (!task.steps?.length || !task.doneWhen) errors.push(`${task.id}: needs steps and doneWhen`);
    }
    if (renderPlaybookMarkdown(pb, owners) !== readIfExists(`tools/${t.id}.md`)) {
      errors.push(`tools/${t.id}.md is out of date — run: node playbooks/workflow.mjs docs`);
    }
  }

  const nnIds = tools.filter((t) => t.nonNegotiable).map((t) => t.id);
  for (const clientId of listClients()) {
    const client = loadClient(clientId);
    if (client.id !== clientId) errors.push(`clients/${clientId}.json: id "${client.id}" does not match filename`);
    const listed = new Set();
    for (const entry of client.tools) {
      if (!registry.has(entry.id)) errors.push(`${clientId}: unknown tool ID "${entry.id}"`);
      if (listed.has(entry.id)) errors.push(`${clientId}: lists ${entry.id} twice`);
      listed.add(entry.id);
      if (!["active", "planned"].includes(entry.status)) errors.push(`${clientId}/${entry.id}: status must be active or planned`);
    }
    for (const id of nnIds) {
      if (!listed.has(id)) errors.push(`${clientId}: missing non-negotiable ${id}`);
    }
  }

  return errors;
}

function readIfExists(rel) {
  const p = join(ROOT, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

export function renderPlaybookMarkdown(pb, owners = loadOwners()) {
  const lines = [
    `<!-- Generated from ${pb.id}.json by workflow.mjs docs. Edit the JSON, not this file. -->`,
    `# ${pb.name} playbook — \`${pb.id}\``,
    "",
    pb.purpose,
    "",
    `**Default owner:** ${owners[pb.defaultOwner].name} (${owners[pb.defaultOwner].role})`,
  ];
  if (pb.env.length) lines.push("", `**Environment:** ${pb.env.map((e) => `\`${e}\``).join(", ")}`);
  for (const phase of PHASES) {
    const tasks = pb.tasks.filter((t) => t.phase === phase);
    if (!tasks.length) continue;
    lines.push("", `## ${phase[0].toUpperCase()}${phase.slice(1)}`, "");
    lines.push("| Task ID | Task | Owner | Done when |", "| --- | --- | --- | --- |");
    for (const t of tasks) lines.push(`| \`${t.id}\` | ${t.title} | ${owners[t.owner].name} | ${t.doneWhen} |`);
    for (const t of tasks) {
      lines.push("", `### \`${t.id}\` ${t.title}`, "");
      for (const s of t.steps) lines.push(`- ${s}`);
    }
  }
  return lines.join("\n") + "\n";
}

function writeDocs() {
  const owners = loadOwners();
  for (const tool of loadRegistry().values()) {
    if (!tool.nonNegotiable) continue;
    const pb = readJson(tool.playbook);
    writeFileSync(join(ROOT, "tools", `${tool.id}.md`), renderPlaybookMarkdown(pb, owners));
    console.log(`wrote tools/${tool.id}.md`);
  }
}

function printRun(result) {
  const owners = loadOwners();
  console.log(`${result.client.id} — ${result.client.name}\n`);
  const matched = result.playbooks.filter((pb) => pb.tasks.length);
  let total = 0;
  for (const pb of matched) {
    const note = pb.note ? ` — ${pb.note}` : "";
    console.log(`[${pb.id}] ${pb.name} (${pb.status})${note}`);
    for (const t of pb.tasks) {
      console.log(`  ${t.id.padEnd(18)} ${t.phase.padEnd(12)} ${owners[t.owner].name.padEnd(7)} ${t.title}`);
    }
    total += pb.tasks.length;
    console.log("");
  }
  for (const s of result.skipped) console.log(`[${s.id}] ${s.name} — ${s.reason}`);
  console.log(`\n${matched.length} playbooks, ${total} tasks`);
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json") flags.json = true;
    else if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  }
  return flags;
}

function main([cmd, ...args]) {
  switch (cmd) {
    case "list": {
      for (const t of loadRegistry().values()) {
        console.log(`${t.id.padEnd(15)} ${t.nonNegotiable ? "non-negotiable" : "optional      "}  ${t.name}`);
      }
      console.log(`\nClient builds: ${listClients().join(", ")}`);
      return 0;
    }
    case "run": {
      const [clientId, ...rest] = args;
      if (!clientId || clientId.startsWith("--")) {
        console.error(`Usage: run <CLIENT-ID> [--phase ${PHASES.join("|")}] [--owner id] [--status active|planned] [--json]`);
        return 1;
      }
      const flags = parseFlags(rest);
      const result = runWorkflow(clientId, flags);
      if (flags.json) console.log(JSON.stringify(result, null, 2));
      else printRun(result);
      return 0;
    }
    case "check": {
      const errors = check();
      for (const e of errors) console.error(`✗ ${e}`);
      if (!errors.length) console.log("✓ registry, playbooks, and client builds are consistent");
      return errors.length ? 1 : 0;
    }
    case "docs":
      writeDocs();
      return 0;
    default:
      console.error("Commands: list | run <CLIENT-ID> | check | docs");
      return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
