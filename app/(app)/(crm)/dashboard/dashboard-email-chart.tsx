"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface ChartTooltipPayload {
    color?: string
    name?: string
    value?: string | number
}

interface ChartTooltipProps {
    active?: boolean
    payload?: ChartTooltipPayload[]
    label?: string
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-medium">{entry.value}</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

interface DashboardEmailChartProps {
    data: Array<{
        date: string
        sent: number
        opened: number
        clicked: number
    }>
}

export default function DashboardEmailChart({ data }: DashboardEmailChartProps) {
    if (!data.some((d) => d.sent > 0)) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Nenhum email enviado no período
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="sent"
                    name="Enviados"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.2}
                />
                <Area
                    type="monotone"
                    dataKey="opened"
                    name="Abertos"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.2}
                />
                <Area
                    type="monotone"
                    dataKey="clicked"
                    name="Clicados"
                    stroke="var(--chart-4)"
                    fill="var(--chart-4)"
                    fillOpacity={0.2}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
