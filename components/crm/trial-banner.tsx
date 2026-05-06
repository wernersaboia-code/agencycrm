// components/crm/trial-banner.tsx
"use client"

import { useWorkspace } from "@/contexts/workspace-context"
import { differenceInDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Crown, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DismissedState {
    workspaceId: string | null
    dismissed: boolean
}

export function TrialBanner() {
    const { activeWorkspace } = useWorkspace()  // 🆕 Corrigido: activeWorkspace em vez de workspace
    const [dismissedState, setDismissedState] = useState<DismissedState>({
        workspaceId: null,
        dismissed: false,
    })

    if (!activeWorkspace || activeWorkspace.plan !== "TRIAL" || !activeWorkspace.trialEndsAt) {
        return null
    }

    const dismissed = dismissedState.workspaceId === activeWorkspace.id && dismissedState.dismissed

    if (dismissed) return null

    const trialEndDate = new Date(activeWorkspace.trialEndsAt)
    const daysLeft = differenceInDays(trialEndDate, new Date())
    const endDate = format(trialEndDate, "dd 'de' MMMM", { locale: ptBR })

    // Cores baseadas na urgência
    const getBannerStyle = () => {
        if (daysLeft <= 3) {
            return "bg-red-50 border-red-200 text-red-800"
        }
        if (daysLeft <= 7) {
            return "bg-orange-50 border-orange-200 text-orange-800"
        }
        return "bg-blue-50 border-blue-200 text-blue-800"
    }

    const getButtonStyle = () => {
        if (daysLeft <= 3) {
            return "bg-red-600 hover:bg-red-700 text-white"
        }
        if (daysLeft <= 7) {
            return "bg-orange-600 hover:bg-orange-700 text-white"
        }
        return "bg-blue-600 hover:bg-blue-700 text-white"
    }

    return (
        <div className={`border-b ${getBannerStyle()} px-4 py-3 relative`}>
            <button
                onClick={() => setDismissedState({ workspaceId: activeWorkspace.id, dismissed: true })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 rounded"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5" />
                    <div>
                        <p className="font-medium">
                            {daysLeft <= 0 ? (
                                "Seu período de teste terminou"
                            ) : daysLeft === 1 ? (
                                "⚠️ Último dia de teste grátis!"
                            ) : (
                                `⏰ Seu período de teste termina em ${daysLeft} dias (${endDate})`
                            )}
                        </p>
                        <p className="text-sm opacity-90">
                            Assine agora e garanta 20% de desconto no primeiro ano!
                        </p>
                    </div>
                </div>

                <Button
                    size="sm"
                    className={getButtonStyle()}
                    asChild
                >
                    <Link href="/pricing">
                        {daysLeft <= 0 ? "Escolher Plano" : "Assinar Agora"}
                    </Link>
                </Button>
            </div>
        </div>
    )
}
