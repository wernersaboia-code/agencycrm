// components/admin/delete-lead-button.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { deleteMarketplaceLead } from "@/actions/admin/lists"

interface DeleteLeadButtonProps {
    leadId: string
    listId: string
}

export function DeleteLeadButton({ leadId, listId }: DeleteLeadButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            await deleteMarketplaceLead(leadId, listId)
            toast.success("Lead removido")
            router.refresh()
        } catch (error) {
            toast.error("Erro ao remover lead")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remover lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Remover"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}