"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactYen, formatYen } from "@/lib/format";
import type { MonthlyProjectionRow } from "@/lib/tax/types";

export function MonthlyChart({ rows }: { rows: MonthlyProjectionRow[] }) {
  const data = rows.map((row) => ({
    month: `${row.month}月`,
    実績売上: row.status === "actual" ? row.revenue : null,
    予測売上: row.status === "forecast" ? row.revenue : null,
    経費: row.expenses,
    利益: row.profit,
    積立目安: row.reserve,
  }));

  return (
    <div className="chart-wrap" role="img" aria-label="1月から12月の売上、経費、利益、税金積立推奨額。現在月以降は予測値です。">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} accessibilityLayer margin={{ top: 12, right: 10, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#dfe5e2" strokeDasharray="3 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#65716e", fontSize: 11 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={58}
            tick={{ fill: "#65716e", fontSize: 10 }}
            tickFormatter={(value) => formatCompactYen(Number(value)).replace("円", "")}
          />
          <Tooltip formatter={(value) => formatYen(Number(value))} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="実績売上" stackId="sales" fill="#246B73" radius={[5, 5, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="予測売上" stackId="sales" fill="#9CB8B5" radius={[5, 5, 0, 0]} isAnimationActive={false} />
          <Line dataKey="経費" stroke="#A66A3F" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="利益" stroke="#183F49" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line dataKey="積立目安" stroke="#6E5A8A" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
