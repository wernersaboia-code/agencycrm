// components/admin/user-role-select.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateUserRole } from "@/actions/admin/users"
import type { UserRole } from "@prisma/client"

interface UserRoleSelectProps {
    userId: string
    currentRole: UserRole
}

const roleLabels: Record<UserRole, string> = {
    USER: "Usuário",
    MANAGER: "Gerente",
    ADMIN: "Administrador",
}

const roleColors: Record<UserRole, string> = {
    USER: "bg-gray-100 text-gray-700",
    MANAGER: "bg-blue-100 text-blue-700",
    ADMIN: "bg-violet-100 text-violet-700",
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [role, setRole] = useState<UserRole>(currentRole)

    const handleChange = async (newRole: UserRole) => {
        if (newRole === role) return

        setIsLoading(true)
        try {
            await updateUserRole(userId, newRole)
            setRole(newRole)
            toast.success(`Permissão alterada para ${roleLabels[newRole]}`)
            router.refresh()
        } catch {
            toast.error("Erro ao alterar permissão")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Select
            value={role}
            onValueChange={(value) => handleChange(value as UserRole)}
            disabled={isLoading}
        >
            <SelectTrigger className={`w-[130px] ${roleColors[role]}`}>
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <SelectValue />
                )}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="USER">Usuário</SelectItem>
                <SelectItem value="MANAGER">Gerente</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
            </SelectContent>
        </Select>
    )
}
