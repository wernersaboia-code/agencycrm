// app/(dashboard)/deals/[id]/deal-actions.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Pencil,
    Trash2,
    Trophy,
    XCircle,
    Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { DealModal } from "@/components/deals/deal-modal"
import {
    deleteDeal,
    markDealAsWon,
    markDealAsLost,
    getPipelineStages,
} from "@/actions/deals"

type Deal = {
    id: string
    title: string
    value?: number | null
    probability?: number | null
    expectedCloseDate?: string | null
    description?: string | null
    stageId?: string | null
    contactId?: string | null
    companyId?: string | null
    status: string
    stage?: { id: string; name: string; color: string } | null
}

type DealActionsProps = {
    deal: Deal
}

export function DealActions({ deal }: DealActionsProps) {
    const router = useRouter()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isWinOpen, setIsWinOpen] = useState(false)
    const [isLoseOpen, setIsLoseOpen] = useState(false)
    const [lostReason, setLostReason] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [stages, setStages] = useState<{ id: string; name: string; color: string }[]>([])

    const isOpen = deal.status === "OPEN"

    const loadStages = async () => {
        const result = await getPipelineStages()
        if (result.success) {
            setStages(result.data || [])
        }
    }

    const handleEditClick = async () => {
        await loadStages()
        setIsEditOpen(true)
    }

    const handleDelete = async () => {
        setIsLoading(true)
        const result = await deleteDeal(deal.id)

        if (result.success) {
            toast.success("Deal excluído com sucesso!")
            router.push("/deals")
        } else {
            toast.error(result.error || "Erro ao excluir deal")
            setIsLoading(false)
        }
        setIsDeleteOpen(false)
    }

    const handleWin = async () => {
        setIsLoading(true)
        const result = await markDealAsWon(deal.id)

        if (result.success) {
            toast.success("🎉 Deal marcado como GANHO!")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao atualizar deal")
        }
        setIsLoading(false)
        setIsWinOpen(false)
    }

    const handleLose = async () => {
        setIsLoading(true)
        const result = await markDealAsLost(deal.id, lostReason)

        if (result.success) {
            toast.success("Deal marcado como perdido")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao atualizar deal")
        }
        setIsLoading(false)
        setIsLoseOpen(false)
        setLostReason("")
    }

    const handleEditSuccess = () => {
        router.refresh()
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {isOpen && (
                    <>
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setIsWinOpen(true)}
                        >
                            <Trophy className="mr-2 h-4 w-4" />
                            Marcar como Ganho
                        </Button>
                        <Button
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setIsLoseOpen(true)}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Marcar como Perdido
                        </Button>
                    </>
                )}
                <Button variant="outline" onClick={handleEditClick}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setIsDeleteOpen(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                </Button>
            </div>

            {/* Modal de edição */}
            <DealModal
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                deal={deal}
                stages={stages}
                onSuccess={handleEditSuccess}
            />

            {/* Dialog de confirmação de exclusão */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir deal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o deal{" "}
                            <strong>{deal.title}</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de marcar como ganho */}
            <AlertDialog open={isWinOpen} onOpenChange={setIsWinOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-green-600" />
                            Marcar como Ganho?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Parabéns! 🎉 O deal <strong>{deal.title}</strong> será marcado como ganho.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleWin}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Confirmar"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de marcar como perdido */}
            <Dialog open={isLoseOpen} onOpenChange={setIsLoseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            Marcar como Perdido
                        </DialogTitle>
                        <DialogDescription>
                            O deal <strong>{deal.title}</strong> será marcado como perdido.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="lostReason">Motivo da perda (opcional)</Label>
                        <Textarea
                            id="lostReason"
                            placeholder="Ex: Cliente escolheu concorrente, orçamento insuficiente..."
                            value={lostReason}
                            onChange={(e) => setLostReason(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsLoseOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLose}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}