// components/campaigns/send-confirmation-dialog.tsx

"use client"

import { useState, useEffect } from "react"
import {
    AlertTriangle,
    Send,
    Mail,
    Users,
    RefreshCw,
    Loader2,
} from "lucide-react"

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ============================================
// TYPES
// ============================================

interface SendConfirmationDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    campaignName: string
    campaignType: string
    templateName: string | null
    totalRecipients: number
    totalPending: number
    isSequence: boolean
    stepsCount?: number
}

// ============================================
// COMPONENT
// ============================================

export function SendConfirmationDialog({
                                           open,
                                           onClose,
                                           onConfirm,
                                           campaignName,
                                           campaignType,
                                           templateName,
                                           totalRecipients,
                                           totalPending,
                                           isSequence,
                                           stepsCount = 1,
                                       }: SendConfirmationDialogProps) {
    const [countdown, setCountdown] = useState<number>(3)
    const [isSending, setIsSending] = useState<boolean>(false)
    const isReady = countdown === 0

    // Reset countdown quando abre
    useEffect(() => {
        if (open) {
            setCountdown(3)
            setIsSending(false)
        }
    }, [open])

    // Contagem regressiva
    useEffect(() => {
        if (!open || countdown <= 0) return

        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1)
        }, 1000)

        return () => clearTimeout(timer)
    }, [open, countdown])

    const handleConfirm = async (): Promise<void> => {
        setIsSending(true)
        try {
            await onConfirm()
        } finally {
            setIsSending(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-lg">
                                Confirmar Envio de Campanha
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                                Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <Separator />

                {/* Resumo da Campanha */}
                <div className="space-y-4 py-2">
                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Campanha</span>
                            <span className="font-medium text-sm">{campaignName}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tipo</span>
                            <Badge variant="outline" className="gap-1">
                                {isSequence ? (
                                    <>
                                        <RefreshCw className="h-3 w-3" />
                                        Sequência ({stepsCount} steps)
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-3 w-3" />
                                        Email Único
                                    </>
                                )}
                            </Badge>
                        </div>

                        {templateName && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Template</span>
                                <span className="font-medium text-sm">{templateName}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Destinatários</span>
                            <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3" />
                                {totalPending} email(s)
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Aviso */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            {isSequence ? (
                                <>
                                    <strong>Atenção:</strong> O primeiro email será enviado
                                    imediatamente para {totalPending} lead(s). Os próximos steps
                                    serão enviados automaticamente conforme os delays configurados.
                                </>
                            ) : (
                                <>
                                    <strong>Atenção:</strong> Serão enviados {totalPending} email(s)
                                    imediatamente. Essa ação não pode ser cancelada após o início.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel disabled={isSending}>
                        Cancelar
                    </AlertDialogCancel>

                    <Button
                        onClick={handleConfirm}
                        disabled={!isReady || isSending}
                        variant="default"
                        className="gap-2"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : !isReady ? (
                            <>
                                <Send className="h-4 w-4" />
                                Aguarde ({countdown}s)
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Confirmar Envio
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}