// lib/constants/call.constants.ts

import { CallResult } from "@prisma/client"
import {
    Phone,
    PhoneOff,
    PhoneMissed,
    Voicemail,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Clock,
    Calendar,
    LucideIcon,
} from "lucide-react"

// ============================================
// CONFIGURAÇÃO DE RESULTADOS DE LIGAÇÃO
// ============================================

export interface CallResultConfig {
    label: string
    description: string
    icon: LucideIcon
    color: string
    bgColor: string
    borderColor: string
    isPositive: boolean
    requiresFollowUp: boolean
}

export const CALL_RESULT_CONFIG: Record<CallResult, CallResultConfig> = {
    ANSWERED: {
        label: "Atendeu",
        description: "Ligação atendida, conversa realizada",
        icon: Phone,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        isPositive: true,
        requiresFollowUp: false,
    },
    NO_ANSWER: {
        label: "Não Atendeu",
        description: "Ligação não foi atendida",
        icon: PhoneMissed,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        isPositive: false,
        requiresFollowUp: true,
    },
    BUSY: {
        label: "Ocupado",
        description: "Linha ocupada",
        icon: PhoneOff,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        isPositive: false,
        requiresFollowUp: true,
    },
    VOICEMAIL: {
        label: "Caixa Postal",
        description: "Deixou mensagem na caixa postal",
        icon: Voicemail,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        isPositive: false,
        requiresFollowUp: true,
    },
    WRONG_NUMBER: {
        label: "Número Errado",
        description: "Número incorreto ou inexistente",
        icon: AlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        isPositive: false,
        requiresFollowUp: false,
    },
    INTERESTED: {
        label: "Interessado",
        description: "Demonstrou interesse no produto/serviço",
        icon: ThumbsUp,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        isPositive: true,
        requiresFollowUp: true,
    },
    NOT_INTERESTED: {
        label: "Sem Interesse",
        description: "Não tem interesse no momento",
        icon: ThumbsDown,
        color: "text-slate-600",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        isPositive: false,
        requiresFollowUp: false,
    },
    CALLBACK: {
        label: "Retornar",
        description: "Pediu para ligar em outro momento",
        icon: Clock,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        isPositive: true,
        requiresFollowUp: true,
    },
    MEETING_SCHEDULED: {
        label: "Reunião Agendada",
        description: "Agendou reunião ou demonstração",
        icon: Calendar,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        isPositive: true,
        requiresFollowUp: true,
    },
}

// ============================================
// HELPERS
// ============================================

export function getCallResultConfig(result: CallResult): CallResultConfig {
    return CALL_RESULT_CONFIG[result]
}

export function getCallResultOptions(): Array<{
    value: CallResult
    label: string
    description: string
}> {
    return Object.entries(CALL_RESULT_CONFIG).map(([value, config]) => ({
        value: value as CallResult,
        label: config.label,
        description: config.description,
    }))
}

export function getPositiveResults(): CallResult[] {
    return Object.entries(CALL_RESULT_CONFIG)
        .filter(([_, config]) => config.isPositive)
        .map(([value]) => value as CallResult)
}

export function getResultsRequiringFollowUp(): CallResult[] {
    return Object.entries(CALL_RESULT_CONFIG)
        .filter(([_, config]) => config.requiresFollowUp)
        .map(([value]) => value as CallResult)
}

// ============================================
// FORMATAÇÃO DE DURAÇÃO
// ============================================

export function formatCallDuration(seconds: number | null | undefined): string {
    if (!seconds || seconds <= 0) return "-"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes === 0) {
        return `${remainingSeconds}s`
    }

    if (remainingSeconds === 0) {
        return `${minutes}min`
    }

    return `${minutes}min ${remainingSeconds}s`
}

export function parseDurationToSeconds(duration: string): number | null {
    if (!duration || duration.trim() === "") return null

    // Formato: "5" (minutos), "5:30" (min:seg), "330" (segundos se > 60)
    const trimmed = duration.trim()

    // Se contém ":", é formato min:seg
    if (trimmed.includes(":")) {
        const [min, sec] = trimmed.split(":").map(Number)
        if (isNaN(min) || isNaN(sec)) return null
        return min * 60 + sec
    }

    // Número simples
    const num = parseInt(trimmed, 10)
    if (isNaN(num)) return null

    // Se <= 60, considera minutos; se > 60, considera segundos
    return num <= 60 ? num * 60 : num
}

// ============================================
// ESTATÍSTICAS
// ============================================

export interface CallStats {
    total: number
    answered: number
    noAnswer: number
    interested: number
    notInterested: number
    meetingsScheduled: number
    pendingCallbacks: number
    successRate: number // % de ligações positivas
}

export function calculateCallStats(
    calls: Array<{ result: CallResult; followUpAt?: Date | null }>
): CallStats {
    const now = new Date()

    const stats: CallStats = {
        total: calls.length,
        answered: 0,
        noAnswer: 0,
        interested: 0,
        notInterested: 0,
        meetingsScheduled: 0,
        pendingCallbacks: 0,
        successRate: 0,
    }

    let positiveCount = 0

    calls.forEach((call) => {
        const config = CALL_RESULT_CONFIG[call.result]

        if (config.isPositive) positiveCount++

        switch (call.result) {
            case "ANSWERED":
                stats.answered++
                break
            case "NO_ANSWER":
            case "BUSY":
            case "VOICEMAIL":
                stats.noAnswer++
                break
            case "INTERESTED":
                stats.interested++
                break
            case "NOT_INTERESTED":
                stats.notInterested++
                break
            case "MEETING_SCHEDULED":
                stats.meetingsScheduled++
                break
        }

        // Callbacks pendentes (followUpAt no futuro ou hoje)
        if (call.followUpAt && new Date(call.followUpAt) >= now) {
            stats.pendingCallbacks++
        }
    })

    stats.successRate = stats.total > 0 ? (positiveCount / stats.total) * 100 : 0

    return stats
}