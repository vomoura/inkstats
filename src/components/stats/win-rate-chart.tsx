"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  month: string;
  winRate: number;
  totalMatches: number;
}

interface WinRateChartProps {
  data: DataPoint[];
}

export function WinRateChart({ data }: WinRateChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value) => [`${value}%`, "Win Rate"]}
          labelFormatter={(label) => `Mês: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="winRate"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ fill: "var(--accent)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
