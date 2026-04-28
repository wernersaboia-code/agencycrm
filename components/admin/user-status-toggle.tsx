// components/admin/user-status-toggle.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateUserStatus } from "@/actions/admin/users"
import type { UserStatus } from "@prisma/client"

interface UserStatusToggleProps {
    userId: string
    currentStatus: UserStatus
}

const statusConfig: Record<UserStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    ACTIVE: { label: "Ativo", variant: "default" },
    INACTIVE: { label: "Inativo", variant: "secondary" },
    PENDING: { label: "Pendente", variant: "outline" },
}

export function UserStatusToggle({ userId, currentStatus }: UserStatusToggleProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<UserStatus>(currentStatus)

    const handleChange = async (newStatus: UserStatus) => {
        if (newStatus === status) return

        setIsLoading(true)
        try {
            await updateUserStatus(userId, newStatus)
            setStatus(newStatus)
            toast.success(`Status alterado para ${statusConfig[newStatus].label}`)
            router.refresh()
        } catch {
            toast.error("Erro ao alterar status")
        } finally {
            setIsLoading(false)
        }
    }

    const config = statusConfig[status]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger disabled={isLoading} className="cursor-pointer">
                <Badge variant={config.variant} className="cursor-pointer">
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        config.label
                    )}
                </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleChange("ACTIVE")}>
                    <Badge variant="default" className="mr-2">Ativo</Badge>
                    Ativar usuário
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleChange("INACTIVE")}>
                    <Badge variant="secondary" className="mr-2">Inativo</Badge>
                    Desativar usuário
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleChange("PENDING")}>
                    <Badge variant="outline" className="mr-2">Pendente</Badge>
                    Marcar como pendente
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
