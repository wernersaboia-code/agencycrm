// components/calls/charts/CallsPerDayChart.tsx

"use client"

import { useMemo } from "react"
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

// ============================================
// TYPES
// ============================================

interface CallsPerDayChartProps {
    data: { date: string; total: number; answered: number; interested: number }[]
}

// ============================================
// COMPONENT
// ============================================

export function CallsPerDayChart({ data }: CallsPerDayChartProps) {
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            dateFormatted: format(parseISO(item.date), "dd/MM", { locale: ptBR }),
        }))
    }, [data])

    const maxValue = useMemo(() => {
        return Math.max(...data.map((d) => d.total), 5)
    }, [data])

    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInterested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="dateFormatted"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, maxValue]}
                        allowDecimals={false}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                                <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                                    <p className="font-medium mb-1">{label}</p>
                                    <div className="space-y-1">
                                        <p className="text-blue-600">
                                            Total: <span className="font-semibold">{payload[0]?.value}</span>
                                        </p>
                                        <p className="text-emerald-600">
                                            Interessados: <span className="font-semibold">{payload[1]?.value}</span>
                                        </p>
                                    </div>
                                </div>
                            )
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                    />
                    <Area
                        type="monotone"
                        dataKey="interested"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorInterested)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}