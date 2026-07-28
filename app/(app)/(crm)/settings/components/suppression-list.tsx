// app/(crm)/settings/components/suppression-list.tsx
"use client"

import { useState, useTransition } from "react"
import { Ban, Trash2 } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    addWorkspaceSuppression,
    deleteWorkspaceSuppression,
    type SuppressionRow,
} from "@/actions/workspace-settings"

const REASON_LABELS: Record<string, string> = {
    hard_bounce: "Endereço inválido",
    complaint: "Marcou como spam",
    unsubscribe: "Cancelou inscrição",
    manual: "Adicionado manualmente",
}

interface SuppressionListProps {
    workspaceId: string
    initial: SuppressionRow[]
}

export function SuppressionList({ workspaceId, initial }: SuppressionListProps) {
    const [rows, setRows] = useState(initial)
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleAdd() {
        setError(null)
        startTransition(async () => {
            const result = await addWorkspaceSuppression(workspaceId, email)
            if (!result.success) {
                setError(result.error || "Erro ao adicionar.")
                return
            }
            setRows((current) => [
                {
                    id: `temp-${Date.now()}`,
                    email: email.trim().toLowerCase(),
                    reason: "manual",
                    detail: null,
                    createdAt: new Date().toISOString(),
                    isGlobal: false,
                },
                ...current,
            ])
            setEmail("")
        })
    }

    function handleRemove(id: string) {
        startTransition(async () => {
            const result = await deleteWorkspaceSuppression(workspaceId, id)
            if (result.success) {
                setRows((current) => current.filter((row) => row.id !== id))
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Lista de supressão
                </CardTitle>
                <CardDescription>
                    Endereços que nunca recebem e-mail de campanha, em qualquer
                    campanha deste workspace.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="email@empresa.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <Button onClick={handleAdd} disabled={isPending || !email.trim()}>
                        Adicionar
                    </Button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nenhum endereço suprimido.
                    </p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {rows.map((row) => (
                            <li
                                key={row.id}
                                className="flex items-center justify-between gap-3 p-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {row.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {REASON_LABELS[row.reason] || row.reason}
                                        {row.detail ? ` — ${row.detail}` : ""}
                                    </p>
                                </div>
                                {row.isGlobal ? (
                                    <Badge variant="secondary">Global</Badge>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Remover ${row.email} da supressão`}
                                        disabled={isPending}
                                        onClick={() => handleRemove(row.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
