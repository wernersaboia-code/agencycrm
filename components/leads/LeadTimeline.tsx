// components/leads/LeadTimeline.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { useMemo } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Mail,
    MailOpen,
    MousePointerClick,
    Phone,
    MessageSquare,
    Calendar,
    Clock,
    Activity,
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import { CallResultBadge } from "@/components/calls/CallResultBadge"
import { SerializedCallWithLead } from "@/types/call.types"
import { getCallResultConfig } from "@/lib/constants/call.constants"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface EmailSendInfo {
    id: string
    campaignName: string
    status: string
    sentAt: string | null
    openedAt: string | null
    clickedAt: string | null
}

interface LeadTimelineProps {
    calls: SerializedCallWithLead[]
    emailSends: EmailSendInfo[]
}

type TimelineEventType = "call" | "email_sent" | "email_opened" | "email_clicked"

interface TimelineEvent {
    id: string
    type: TimelineEventType
    date: Date
    data: SerializedCallWithLead | EmailSendInfo
}

// ============================================
// COMPONENT
// ============================================

export function LeadTimeline({ calls, emailSends }: LeadTimelineProps) {
    // ============================================
    // COMPUTED: Mescla e ordena eventos
    // ============================================

    const timelineEvents = useMemo((): TimelineEvent[] => {
        const events: TimelineEvent[] = []

        // Adiciona ligações
        calls.forEach((call) => {
            events.push({
                id: `call-${call.id}`,
                type: "call",
                date: new Date(call.calledAt),
                data: call,
            })
        })

        // Adiciona eventos de email
        emailSends.forEach((send) => {
            if (send.sentAt) {
                events.push({
                    id: `email-sent-${send.id}`,
                    type: "email_sent",
                    date: new Date(send.sentAt),
                    data: send,
                })
            }

            if (send.openedAt) {
                events.push({
                    id: `email-opened-${send.id}`,
                    type: "email_opened",
                    date: new Date(send.openedAt),
                    data: send,
                })
            }

            if (send.clickedAt) {
                events.push({
                    id: `email-clicked-${send.id}`,
                    type: "email_clicked",
                    date: new Date(send.clickedAt),
                    data: send,
                })
            }
        })

        // Ordena por data (mais recente primeiro)
        return events.sort((a, b) => b.date.getTime() - a.date.getTime())
    }, [calls, emailSends])

    // ============================================
    // RENDER
    // ============================================

    if (timelineEvents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Timeline de Interações
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="rounded-full bg-muted p-3 mb-3">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Nenhuma interação registrada ainda
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Timeline de Interações
                    <Badge variant="secondary">{timelineEvents.length}</Badge>
                </CardTitle>
                <CardDescription>
                    Histórico de emails e ligações com este lead
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-[500px] pr-4">
                    <div className="relative">
                        {/* Linha vertical */}
                        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                        <div className="space-y-4">
                            {timelineEvents.map((event) => (
                                <TimelineEventItem key={event.id} event={event} />
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

// ============================================
// SUBCOMPONENTS
// ============================================

function TimelineEventItem({ event }: { event: TimelineEvent }) {
    const { type, date, data } = event

    const eventConfig = getEventConfig(type, data)

    return (
        <div className="relative pl-10">
            {/* Ícone */}
            <div
                className={cn(
                    "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                    eventConfig.borderColor
                )}
            >
                <eventConfig.icon className={cn("h-4 w-4", eventConfig.iconColor)} />
            </div>

            {/* Conteúdo */}
            <div
                className={cn(
                    "rounded-lg border p-3",
                    eventConfig.bgColor,
                    eventConfig.borderColor
                )}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{eventConfig.title}</span>
                            {eventConfig.badge}
                        </div>

                        {eventConfig.description && (
                            <p className="text-sm text-muted-foreground">
                                {eventConfig.description}
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            <span className="text-muted-foreground/60">
                ({formatDistanceToNow(date, { addSuffix: true, locale: ptBR })})
              </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================
// HELPERS
// ============================================

interface EventConfig {
    icon: typeof Mail
    iconColor: string
    borderColor: string
    bgColor: string
    title: string
    description?: string
    badge?: React.ReactNode
}

function getEventConfig(
    type: TimelineEventType,
    data: SerializedCallWithLead | EmailSendInfo
): EventConfig {
    switch (type) {
        case "call": {
            const call = data as SerializedCallWithLead
            const config = getCallResultConfig(call.result)
            return {
                icon: Phone,
                iconColor: config.color,
                borderColor: config.borderColor,
                bgColor: config.bgColor,
                title: "Ligação realizada",
                description: call.notes || undefined,
                badge: <CallResultBadge result={call.result} size="sm" />,
            }
        }

        case "email_sent": {
            const email = data as EmailSendInfo
            return {
                icon: Mail,
                iconColor: "text-blue-600",
                borderColor: "border-blue-200",
                bgColor: "bg-blue-50/50",
                title: "Email enviado",
                description: `Campanha: ${email.campaignName}`,
            }
        }

        case "email_opened": {
            const email = data as EmailSendInfo
            return {
                icon: MailOpen,
                iconColor: "text-green-600",
                borderColor: "border-green-200",
                bgColor: "bg-green-50/50",
                title: "Email aberto",
                description: `Campanha: ${email.campaignName}`,
                badge: (
                    <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                    >
                        Aberto
                    </Badge>
                ),
            }
        }

        case "email_clicked": {
            const email = data as EmailSendInfo
            return {
                icon: MousePointerClick,
                iconColor: "text-purple-600",
                borderColor: "border-purple-200",
                bgColor: "bg-purple-50/50",
                title: "Clicou no email",
                description: `Campanha: ${email.campaignName}`,
                badge: (
                    <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                        Clicou
                    </Badge>
                ),
            }
        }

        default:
            return {
                icon: Activity,
                iconColor: "text-gray-600",
                borderColor: "border-gray-200",
                bgColor: "bg-gray-50/50",
                title: "Evento",
            }
    }
}