"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { addWorkspaceMember, removeWorkspaceMember, type WorkspaceMemberRow } from "@/actions/workspace-members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type WorkspaceTeamSettingsProps = {
    workspaceId: string
    members: WorkspaceMemberRow[]
    canManage: boolean
}

export function WorkspaceTeamSettings({ workspaceId, members, canManage }: WorkspaceTeamSettingsProps) {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [isPending, startTransition] = useTransition()

    const addMember = () => {
        startTransition(async () => {
            const result = await addWorkspaceMember(workspaceId, email)
            if (!result.success) {
                toast.error(result.error ?? "Não foi possível adicionar a pessoa")
                return
            }
            setEmail("")
            toast.success(result.message ?? "Operador adicionado")
            router.refresh()
        })
    }

    const removeMember = (member: WorkspaceMemberRow) => {
        startTransition(async () => {
            const result = await removeWorkspaceMember(workspaceId, member.id)
            if (!result.success) {
                toast.error(result.error ?? "Não foi possível remover a pessoa")
                return
            }
            toast.success(`${member.name || member.email} não tem mais acesso ao workspace.`)
            router.refresh()
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Equipe do workspace
                </CardTitle>
                <CardDescription>
                    Proprietários administram a equipe. Operadores usam o CRM sem acesso ao super-admin do site.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{member.name || member.email}</p>
                                <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                                    {member.role === "OWNER" ? "Proprietário" : "Operador"}
                                </Badge>
                                {canManage && member.role !== "OWNER" && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Remover ${member.name || member.email}`}
                                        disabled={isPending}
                                        onClick={() => removeMember(member)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {canManage && (
                    <div className="border-t pt-5">
                        <p className="mb-3 text-sm font-medium">Adicionar operador</p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="email@exemplo.com"
                                disabled={isPending}
                            />
                            <Button type="button" onClick={addMember} disabled={isPending || !email.trim()}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                Adicionar
                            </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            A pessoa precisa já ter criado e confirmado uma conta no site.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
