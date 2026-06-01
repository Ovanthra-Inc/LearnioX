"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { RevenueDataPoint } from "@/types/analytics";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format dates for X axis (e.g. "Nov 24")
  const chartData = data.map((pt) => {
    const d = new Date(pt.date);
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    const year = d.toLocaleDateString("en-IN", { year: "2-digit" });
    return {
      ...pt,
      formattedDate: `${month} '${year}`,
    };
  });

  if (!isMounted) {
    return (
      <div className="w-full h-64 mt-6 bg-surface-container-low border border-border animate-pulse flex items-center justify-center text-label-sm text-muted-foreground uppercase tracking-widest font-mono">
        Loading Analytics Chart...
      </div>
    );
  }

  return (
    <div className="w-full h-64 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(value) => `₹${value / 1000}k`}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0rem", // strict B&W flat
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              color: "var(--foreground)",
            }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--foreground)"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
