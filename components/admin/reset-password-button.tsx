// components/admin/reset-password-button.tsx

"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { KeyRound, Loader2, Check } from "lucide-react"
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
import { sendPasswordReset } from "@/actions/admin/users"

interface ResetPasswordButtonProps {
    email: string
}

export function ResetPasswordButton({ email }: ResetPasswordButtonProps) {
    const t = useTranslations("admin.components.resetPassword")
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleReset = async () => {
        setIsLoading(true)
        try {
            await sendPasswordReset(email)
            setSent(true)
            toast.success(t("toastSuccess"))
        } catch {
            toast.error(t("toastError"))
        } finally {
            setIsLoading(false)
        }
    }

    if (sent) {
        return (
            <Button variant="outline" disabled>
                <Check className="h-4 w-4 mr-2 text-admin" />
                {t("buttonSent")}
            </Button>
        )
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <KeyRound className="h-4 w-4 mr-2" />
                    {t("button")}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.rich("description", { email: () => <strong>{email}</strong> })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("sending")}
                            </>
                        ) : (
                            t("confirm")
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
