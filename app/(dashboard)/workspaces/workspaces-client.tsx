// app/(dashboard)/workspaces/workspaces-client.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Users,
    Mail,
    Phone,
    ExternalLink,
    Building2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { WorkspaceModal } from "@/components/workspaces/workspace-modal"
import { deleteWorkspace } from "@/actions/workspaces"
import { useWorkspace } from "@/contexts/workspace-context"

type Workspace = {
    id: string
    name: string
    description: string | null
    color: string
    logo: string | null
    senderName: string | null
    senderEmail: string | null
    createdAt: string
    updatedAt: string
    _count: {
        leads: number
        campaigns: number
        calls: number
    }
}

interface WorkspacesClientProps {
    initialWorkspaces: Workspace[]
}

export function WorkspacesClient({ initialWorkspaces }: WorkspacesClientProps) {
    const router = useRouter()
    const { setActiveWorkspace, refreshWorkspaces } = useWorkspace()

    const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
    const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleEdit = (workspace: Workspace) => {
        setEditingWorkspace(workspace)
        setIsModalOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingWorkspace) return

        setIsDeleting(true)
        try {
            const result = await deleteWorkspace(deletingWorkspace.id)

            if (result.success) {
                toast.success("Cliente excluído!")
                setWorkspaces((prev) => prev.filter((w) => w.id !== deletingWorkspace.id))
                await refreshWorkspaces()
            } else {
                toast.error(result.error || "Erro ao excluir")
            }
        } catch (error) {
            toast.error("Erro ao excluir cliente")
        } finally {
            setIsDeleting(false)
            setDeletingWorkspace(null)
        }
    }

    const handleAccess = (workspace: Workspace) => {
        // Converter para o tipo do contexto (sem _count)
        setActiveWorkspace({
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
            color: workspace.color,
            logo: workspace.logo,
            senderName: workspace.senderName,
            senderEmail: workspace.senderEmail,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
        })
        router.push("/leads")
    }

    const handleSuccess = async () => {
        // Recarregar a lista
        const { getWorkspaces } = await import("@/actions/workspaces")
        const result = await getWorkspaces()
        if (result.data) {
            setWorkspaces(result.data)
        }
    }

    return (
        <>
            {/* Botão Novo */}
            <div className="flex justify-end">
                <Button onClick={() => {
                    setEditingWorkspace(null)
                    setIsModalOpen(true)
                }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                </Button>
            </div>

            {/* Lista de Workspaces */}
            {workspaces.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Nenhum cliente ainda</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Comece criando seu primeiro cliente para gerenciar leads e campanhas.
                        </p>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar primeiro cliente
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workspaces.map((workspace) => (
                        <Card key={workspace.id} className="relative group">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: workspace.color }}
                                        >
                                            {workspace.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{workspace.name}</CardTitle>
                                            {workspace.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {workspace.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleAccess(workspace)}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Acessar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(workspace)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => setDeletingWorkspace(workspace)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <p className="text-2xl font-bold">{workspace._count.leads}</p>
                                        <p className="text-xs text-muted-foreground">Leads</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <p className="text-2xl font-bold">{workspace._count.campaigns}</p>
                                        <p className="text-xs text-muted-foreground">Campanhas</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <p className="text-2xl font-bold">{workspace._count.calls}</p>
                                        <p className="text-xs text-muted-foreground">Ligações</p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-4"
                                    variant="outline"
                                    onClick={() => handleAccess(workspace)}
                                >
                                    Acessar Cliente
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Criar/Editar */}
            <WorkspaceModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open)
                    if (!open) setEditingWorkspace(null)
                }}
                workspace={editingWorkspace}
                onSuccess={handleSuccess}
            />

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog
                open={!!deletingWorkspace}
                onOpenChange={(open) => !open && setDeletingWorkspace(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>{deletingWorkspace?.name}</strong>?
                            <br /><br />
                            Esta ação irá excluir permanentemente:
                            <ul className="list-disc list-inside mt-2">
                                <li>{deletingWorkspace?._count.leads || 0} leads</li>
                                <li>{deletingWorkspace?._count.campaigns || 0} campanhas</li>
                                <li>{deletingWorkspace?._count.calls || 0} ligações</li>
                            </ul>
                            <br />
                            <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}