// components/admin/transfer-workspace-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { transferWorkspace, searchUsersForTransfer } from "@/actions/admin/workspaces"

interface TransferWorkspaceModalProps {
    workspaceId: string
    workspaceName: string
    currentOwner: {
        id: string
        name: string | null
        email: string
    }
}

interface UserOption {
    id: string
    name: string | null
    email: string
}

export function TransferWorkspaceModal({
                                           workspaceId,
                                           workspaceName,
                                           currentOwner,
                                       }: TransferWorkspaceModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [search, setSearch] = useState("")
    const [users, setUsers] = useState<UserOption[]>([])
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)

    // Buscar usuários quando digita
    useEffect(() => {
        const searchUsers = async () => {
            if (search.length < 2) {
                setUsers([])
                return
            }

            setIsSearching(true)
            try {
                const results = await searchUsersForTransfer(search)
                // Filtrar o dono atual
                setUsers(results.filter((u) => u.id !== currentOwner.id))
            } catch (error) {
                console.error("Erro ao buscar usuários:", error)
            } finally {
                setIsSearching(false)
            }
        }

        const debounce = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounce)
    }, [search, currentOwner.id])

    const handleTransfer = async () => {
        if (!selectedUser) return

        setIsLoading(true)
        try {
            await transferWorkspace(workspaceId, selectedUser.id)
            toast.success(`Workspace transferido para ${selectedUser.name || selectedUser.email}`)
            setOpen(false)
            router.refresh()
        } catch {
            toast.error("Erro ao transferir workspace")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setOpen(false)
        setSearch("")
        setUsers([])
        setSelectedUser(null)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Transferir
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transferir Workspace</DialogTitle>
                    <DialogDescription>
                        Transfira &quot;{workspaceName}&quot; para outro usuário. O novo dono terá acesso completo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Dono atual */}
                    <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">Dono Atual</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                    {currentOwner.name?.[0] || currentOwner.email[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                                {currentOwner.name || currentOwner.email}
                            </span>
                        </div>
                    </div>

                    {/* Busca */}
                    <div className="space-y-2">
                        <Label>Novo Proprietário</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome ou email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Resultados */}
                    {isSearching ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {users.map((user) => {
                                const isSelected = selectedUser?.id === user.id
                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setSelectedUser(user)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                            isSelected
                                                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                                                : "hover:bg-muted"
                                        }`}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {user.name?.[0] || user.email[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="text-sm font-medium">
                                                {user.name || "Sem nome"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : search.length >= 2 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum usuário encontrado
                        </p>
                    ) : null}

                    {/* Selecionado */}
                    {selectedUser && (
                        <div className="p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg">
                            <Label className="text-xs text-violet-600 dark:text-violet-400">
                                Transferir para
                            </Label>
                            <p className="font-medium">
                                {selectedUser.name || selectedUser.email}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={!selectedUser || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Transferindo...
                            </>
                        ) : (
                            "Confirmar Transferência"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
