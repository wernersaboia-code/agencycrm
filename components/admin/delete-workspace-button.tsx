// components/admin/delete-workspace-button.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteWorkspace } from "@/actions/admin/workspaces"

interface DeleteWorkspaceButtonProps {
    workspaceId: string
    workspaceName: string
}

export function DeleteWorkspaceButton({ workspaceId, workspaceName }: DeleteWorkspaceButtonProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [confirmation, setConfirmation] = useState("")

    const canDelete = confirmation === workspaceName

    const handleDelete = async () => {
        if (!canDelete) return

        setIsLoading(true)
        try {
            await deleteWorkspace(workspaceId)
            toast.success("Workspace excluído com sucesso")
            router.push("/super-admin/workspaces")
            router.refresh()
        } catch {
            toast.error("Erro ao excluir workspace")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Excluir Workspace
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <span>
                                Esta ação é <strong>irreversível</strong>. Todos os dados serão excluídos permanentemente:
                            </span>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>Todos os leads</li>
                                <li>Todas as campanhas e emails enviados</li>
                                <li>Todas as ligações registradas</li>
                                <li>Todos os templates</li>
                                <li>Todas as tags</li>
                            </ul>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-3">
                    <Label>
                        Digite <strong>{workspaceName}</strong> para confirmar:
                    </Label>
                    <Input
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder={workspaceName}
                        className={canDelete ? "border-destructive" : ""}
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading} onClick={() => setConfirmation("")}>
                        Cancelar
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!canDelete || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Permanentemente
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
