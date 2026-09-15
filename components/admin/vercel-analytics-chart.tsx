"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { VercelAnalyticsRow } from "@/lib/analytics/vercel-web-analytics"

export function VercelAnalyticsChart({ data }: { data: Array<VercelAnalyticsRow & { timestamp: string }> }) {
    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                        <linearGradient id="pageviews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5559a0" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#5559a0" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(value) => value.slice(5)} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="pageviews" stroke="#5559a0" fill="url(#pageviews)" strokeWidth={2} />
                    <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" fill="transparent" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
