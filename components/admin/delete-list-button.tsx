// components/admin/delete-list-button.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

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

import { deleteList } from "@/actions/admin/lists"

interface DeleteListButtonProps {
    listId: string
    listName: string
}

export function DeleteListButton({ listId, listName }: DeleteListButtonProps) {
    const router = useRouter()
    const t = useTranslations("admin.components.deleteList")
    const [isDeleting, setIsDeleting] = useState(false)
    const [open, setOpen] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)

        try {
            await deleteList(listId)
            toast.success(t("toastSuccess"))
            setOpen(false)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : t("toastError")
            toast.error(message)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title={t("button")}
                    className="text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.rich("description", { name: () => <strong>{listName}</strong>, strong: (chunks) => <strong>{chunks}</strong> })}
                        <br />
                        <br />
                        {t("warning")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("deleting")}
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("confirm")}
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}