// components/admin/delete-workspace-button.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
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
    const t = useTranslations("admin.components.deleteWorkspace")
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [confirmation, setConfirmation] = useState("")

    const canDelete = confirmation === workspaceName

    const handleDelete = async () => {
        if (!canDelete) return

        setIsLoading(true)
        try {
            await deleteWorkspace(workspaceId)
            toast.success(t("toastSuccess"))
            router.push("/super-admin/workspaces")
            router.refresh()
        } catch {
            toast.error(t("toastError"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("button")}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        {t("title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <span>
                                {t.rich("description", { strong: (chunks) => <strong>{chunks}</strong> })}
                            </span>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>{t("allLeads")}</li>
                                <li>{t("allCampaigns")}</li>
                                <li>{t("allCalls")}</li>
                                <li>{t("allTemplates")}</li>
                                <li>{t("allTags")}</li>
                            </ul>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-3">
                    <Label>
                        {t.rich("confirmLabel", { name: () => <strong>{workspaceName}</strong> })}
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
                        {t("cancel")}
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!canDelete || isLoading}
                    >
                        {isLoading ? (
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
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
