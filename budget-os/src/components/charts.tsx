"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pesoCompact, peso } from "@/lib/currency";

const AXIS = { fontSize: 12, fill: "#94a3b8" } as const;

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-soft">
      {label && <div className="mb-1 font-semibold text-slate-700">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800">{peso(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({
  data,
}: {
  data: { label: string; income: number; expenses: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => pesoCompact(v)}
          width={54}
        />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#dd6f92" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#5fb3c9" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({
  data,
}: {
  data: { category: string; amount: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip content={<MoneyTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({
  data,
  dataKey,
  name,
  color = "#5fb08a",
}: {
  data: { label: string; [k: string]: any }[];
  dataKey: string;
  name: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => pesoCompact(v)}
          width={54}
        />
        <Tooltip content={<MoneyTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#grad-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryCompareBar({
  data,
}: {
  data: { category: string; thisAmt: number; lastAmt: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
      <BarChart data={data} layout="vertical" barGap={2} margin={{ left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f6" />
        <XAxis
          type="number"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => pesoCompact(v)}
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
          width={92}
        />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="lastAmt" name="Last month" fill="#cbd5e1" radius={[0, 6, 6, 0]} />
        <Bar dataKey="thisAmt" name="This month" fill="#dd6f92" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SavingsGrowthChart({
  data,
}: {
  data: { label: string; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="grad-growth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5fb08a" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#5fb08a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => pesoCompact(v)}
          width={54}
        />
        <Tooltip content={<MoneyTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          name="Cumulative savings"
          stroke="#4d9a76"
          strokeWidth={2.5}
          fill="url(#grad-growth)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DebtPayoffChart({
  data,
}: {
  data: { label: string; balance: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="grad-debt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#dd6f92" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#dd6f92" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => pesoCompact(v)}
          width={54}
        />
        <Tooltip content={<MoneyTooltip />} />
        <Area
          type="monotone"
          dataKey="balance"
          name="Debt balance"
          stroke="#dd6f92"
          strokeWidth={2.5}
          fill="url(#grad-debt)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ParentSpendChart({
  data,
}: {
  data: { label: string; child: number; school: number; food: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => pesoCompact(v)}
          width={54}
        />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="child" name="Child" fill="#b79cd6" radius={[5, 5, 0, 0]} />
        <Bar dataKey="school" name="School" fill="#8f9be0" radius={[5, 5, 0, 0]} />
        <Bar dataKey="food" name="Food" fill="#e17b84" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SavingsLine({
  data,
}: {
  data: { label: string; net: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => pesoCompact(v)}
          width={54}
        />
        <Tooltip content={<MoneyTooltip />} />
        <Line
          type="monotone"
          dataKey="net"
          name="Net savings"
          stroke="#4d9a76"
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
