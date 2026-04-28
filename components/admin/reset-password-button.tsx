// components/admin/reset-password-button.tsx

"use client"

import { useState } from "react"
import { toast } from "sonner"
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
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleReset = async () => {
        setIsLoading(true)
        try {
            await sendPasswordReset(email)
            setSent(true)
            toast.success("Email de reset enviado!")
        } catch {
            toast.error("Erro ao enviar email de reset")
        } finally {
            setIsLoading(false)
        }
    }

    if (sent) {
        return (
            <Button variant="outline" disabled>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Email Enviado
            </Button>
        )
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Reset de Senha
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Enviar reset de senha?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Um email será enviado para <strong>{email}</strong> com um link para redefinir a senha.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            "Enviar Email"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
