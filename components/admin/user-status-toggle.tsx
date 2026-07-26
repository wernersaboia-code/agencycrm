// components/admin/user-status-toggle.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
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

const statusConfig: Record<UserStatus, { variant: "default" | "secondary" | "outline" | "destructive" }> = {
    ACTIVE: { variant: "default" },
    INACTIVE: { variant: "secondary" },
    PENDING: { variant: "outline" },
}

export function UserStatusToggle({ userId, currentStatus }: UserStatusToggleProps) {
    const t = useTranslations("admin.components.userStatusToggle")
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<UserStatus>(currentStatus)

    const handleChange = async (newStatus: UserStatus) => {
        if (newStatus === status) return

        setIsLoading(true)
        try {
            await updateUserStatus(userId, newStatus)
            setStatus(newStatus)
            toast.success(t("toastSuccess", { status: t(statusToKey(newStatus)) }))
            router.refresh()
        } catch {
            toast.error(t("toastError"))
        } finally {
            setIsLoading(false)
        }
    }

    const config = statusConfig[status]

    const statusToKey = (s: UserStatus) => {
        switch (s) {
            case "ACTIVE": return "active"
            case "INACTIVE": return "inactive"
            case "PENDING": return "pending"
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger disabled={isLoading} className="cursor-pointer">
                <Badge variant={config.variant} className="cursor-pointer">
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        t(statusToKey(status))
                    )}
                </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleChange("ACTIVE")}>
                    <Badge variant="default" className="mr-2">{t("active")}</Badge>
                    {t("activate")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleChange("INACTIVE")}>
                    <Badge variant="secondary" className="mr-2">{t("inactive")}</Badge>
                    {t("deactivate")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleChange("PENDING")}>
                    <Badge variant="outline" className="mr-2">{t("pending")}</Badge>
                    {t("markPending")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
