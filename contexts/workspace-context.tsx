// contexts/workspace-context.tsx

"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type Workspace = {
    id: string
    name: string
    description: string | null
    color: string
    logo: string | null
    senderName: string | null
    senderEmail: string | null
    createdAt: string
    updatedAt: string
}

type WorkspaceContextType = {
    workspaces: Workspace[]
    activeWorkspace: Workspace | null
    setActiveWorkspace: (workspace: Workspace) => void
    isLoading: boolean
    refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Carregar workspaces ao iniciar
    const refreshWorkspaces = async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/workspaces")

            if (response.ok) {
                const data = await response.json()
                setWorkspaces(data.workspaces || [])

                // Se não tem workspace ativo, selecionar o primeiro
                if (!activeWorkspace && data.workspaces?.length > 0) {
                    // Verificar se tem um salvo no localStorage
                    const savedId = localStorage.getItem("activeWorkspaceId")
                    const saved = data.workspaces.find((w: Workspace) => w.id === savedId)

                    setActiveWorkspaceState(saved || data.workspaces[0])
                }
            }
        } catch (error) {
            console.error("Erro ao carregar workspaces:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Função para trocar workspace ativo
    const setActiveWorkspace = (workspace: Workspace) => {
        setActiveWorkspaceState(workspace)
        localStorage.setItem("activeWorkspaceId", workspace.id)
    }

    // Carregar ao montar
    useEffect(() => {
        refreshWorkspaces()
    }, [])

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                activeWorkspace,
                setActiveWorkspace,
                isLoading,
                refreshWorkspaces,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    )
}

// Hook para usar o contexto
export function useWorkspace() {
    const context = useContext(WorkspaceContext)

    if (context === undefined) {
        throw new Error("useWorkspace deve ser usado dentro de WorkspaceProvider")
    }

    return context
}