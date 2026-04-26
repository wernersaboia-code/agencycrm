// components/calls/charts/CallsConversionFunnel.tsx

"use client"

import { Phone, PhoneIncoming, Star, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface CallsConversionFunnelProps {
    data: {
        totalCalls: number
        answered: number
        interested: number
        meetingsScheduled: number
        answeredRate: number
        interestedRate: number
        meetingRate: number
    }
}

// ============================================
// COMPONENT
// ============================================

export function CallsConversionFunnel({ data }: CallsConversionFunnelProps) {
    const stages = [
        {
            label: "Total Ligações",
            value: data.totalCalls,
            rate: 100,
            icon: Phone,
            color: "bg-blue-500",
            width: "w-full",
        },
        {
            label: "Atendidas",
            value: data.answered,
            rate: data.answeredRate,
            icon: PhoneIncoming,
            color: "bg-green-500",
            width: "w-[85%]",
        },
        {
            label: "Interessados",
            value: data.interested,
            rate: data.interestedRate,
            icon: Star,
            color: "bg-emerald-500",
            width: "w-[60%]",
        },
        {
            label: "Reuniões",
            value: data.meetingsScheduled,
            rate: data.meetingRate,
            icon: Calendar,
            color: "bg-indigo-500",
            width: "w-[35%]",
        },
    ]

    return (
        <div className="space-y-3">
            {stages.map((stage) => (
                <div key={stage.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <stage.icon className="h-4 w-4 text-muted-foreground" />
                            <span>{stage.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{stage.value}</span>
                            <span className="text-muted-foreground text-xs">
                                ({stage.rate}%)
                            </span>
                        </div>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                stage.color,
                                stage.width
                            )}
                            style={{
                                width: `${stage.rate}%`,
                                minWidth: stage.value > 0 ? "20px" : "0",
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
