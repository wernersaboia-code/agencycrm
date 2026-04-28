// components/purchases/import-to-crm-modal.tsx
"use client"

import Image from "next/image"
import { useState } from "react"
import { Building2, CheckCircle2, ChevronRight, Database, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { importMarketplaceLeadsToWorkspace } from "@/actions/marketplace-import"
import { useRouter } from "next/navigation"

interface Workspace {
    id: string
    name: string
    color: string
    logo: string | null
    leadsCount: number
}

interface ImportToCRMModalProps {
    isOpen: boolean
    onClose: () => void
    purchaseItemId: string
    listName: string
    leadsCount: number
    workspaces: Workspace[]
    alreadyImportedTo?: string | null
}

export function ImportToCRMModal({
                                     isOpen,
                                     onClose,
                                     purchaseItemId,
                                     listName,
                                     leadsCount,
                                     workspaces,
                                     alreadyImportedTo,
                                 }: ImportToCRMModalProps) {
    const router = useRouter()
    const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
    const [importing, setImporting] = useState(false)
    const [imported, setImported] = useState(false)
    const [importResult, setImportResult] = useState<{
        imported: number
        skipped: number
        workspaceName: string
    } | null>(null)

    const handleImport = async () => {
        if (!selectedWorkspace) return

        setImporting(true)

        try {
            const result = await importMarketplaceLeadsToWorkspace({
                purchaseItemId,
                workspaceId: selectedWorkspace,
            })

            setImportResult({
                imported: result.imported,
                skipped: result.skipped,
                workspaceName: result.workspaceName,
            })
            setImported(true)
            toast.success(`${result.imported} leads importados com sucesso!`)

            // Recarregar a página após 2 segundos para atualizar o estado
            setTimeout(() => {
                router.refresh()
            }, 2000)

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao importar leads")
        } finally {
            setImporting(false)
        }
    }

    const handleGoToWorkspace = () => {
        router.push(`/workspaces/${selectedWorkspace}`)
        onClose()
    }

    const handleCreateWorkspace = () => {
        router.push("/workspaces")
        onClose()
    }

    const workspaceAlreadyUsed = workspaces.find(w => w.id === alreadyImportedTo)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#4a2c5a]">
                        {imported ? "✅ Importação Concluída!" : "Importar para CRM"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        {imported
                            ? `${importResult?.imported} leads foram importados para o workspace ${importResult?.workspaceName}`
                            : `Selecione um workspace para importar ${leadsCount} leads da lista "${listName}"`
                        }
                    </DialogDescription>
                </DialogHeader>

                {!imported ? (
                    <div className="space-y-4">
                        {/* Info da lista */}
                        <div className="bg-gradient-to-r from-[#4a2c5a]/5 to-[#2ec4b6]/5 rounded-lg p-4 border border-[#2ec4b6]/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Database className="h-5 w-5 text-[#2ec4b6]" />
                                <span className="font-medium text-gray-800">{listName}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {leadsCount.toLocaleString()} leads disponíveis para importação
                            </div>
                        </div>

                        {/* Workspace já importado */}
                        {workspaceAlreadyUsed && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ Esta lista já foi importada para o workspace{" "}
                                    <strong>{workspaceAlreadyUsed.name}</strong>
                                </p>
                            </div>
                        )}

                        {/* Lista de Workspaces */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Selecione um workspace:
                            </label>
                            <ScrollArea className="h-[250px] rounded-md border">
                                <div className="p-2 space-y-2">
                                    {workspaces.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 mb-4">
                                                Você ainda não tem nenhum workspace
                                            </p>
                                            <Button
                                                onClick={handleCreateWorkspace}
                                                className="bg-[#4a2c5a] hover:bg-[#5d3a70]"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Criar Workspace
                                            </Button>
                                        </div>
                                    ) : (
                                        workspaces.map((workspace) => (
                                            <button
                                                key={workspace.id}
                                                onClick={() => setSelectedWorkspace(workspace.id)}
                                                disabled={workspace.id === alreadyImportedTo}
                                                className={`
                                                    w-full p-3 rounded-lg border text-left transition-all
                                                    ${selectedWorkspace === workspace.id
                                                    ? "border-[#2ec4b6] bg-[#2ec4b6]/5"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }
                                                    ${workspace.id === alreadyImportedTo
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "cursor-pointer"
                                                }
                                                `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                            style={{ backgroundColor: workspace.color }}
                                                        >
                                                            {workspace.logo ? (
                                                                <Image
                                                                    src={workspace.logo}
                                                                    alt={workspace.name}
                                                                    width={40}
                                                                    height={40}
                                                                    className="w-full h-full object-cover rounded-lg"
                                                                />
                                                            ) : (
                                                                workspace.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-800">
                                                                {workspace.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {workspace.leadsCount} leads existentes
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedWorkspace === workspace.id && (
                                                        <CheckCircle2 className="h-5 w-5 text-[#2ec4b6]" />
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={onClose} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!selectedWorkspace || importing || selectedWorkspace === alreadyImportedTo}
                                className="flex-1 bg-[#4a2c5a] hover:bg-[#5d3a70]"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <Database className="h-4 w-4 mr-2" />
                                        Importar Leads
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-lg font-medium text-gray-800 mb-2">
                                Importação concluída!
                            </p>
                            <p className="text-gray-600 mb-4">
                                {importResult?.imported} leads importados com sucesso
                                {importResult?.skipped ? ` (${importResult.skipped} ignorados)` : ""}
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleGoToWorkspace}
                                    className="flex-1 bg-[#4a2c5a] hover:bg-[#5d3a70]"
                                >
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                    Ir para Workspace
                                </Button>
                                <Button variant="outline" onClick={onClose} className="flex-1">
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
