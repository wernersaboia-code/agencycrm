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

// ============================================
// HELPER: Salvar cookie no cliente
// ============================================
function setWorkspaceCookie(workspaceId: string): void {
    // Cookie expira em 1 ano
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)

    document.cookie = `activeWorkspaceId=${workspaceId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
}

// ============================================
// HELPER: Ler cookie no cliente
// ============================================
function getWorkspaceCookie(): string | null {
    if (typeof document === "undefined") return null

    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=")
        if (name === "activeWorkspaceId") {
            return value
        }
    }
    return null
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Carregar workspaces ao iniciar
    const refreshWorkspaces = async (): Promise<void> => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/workspaces")

            if (response.ok) {
                const data = await response.json()
                setWorkspaces(data.workspaces || [])

                // Se não tem workspace ativo, selecionar o primeiro
                if (!activeWorkspace && data.workspaces?.length > 0) {
                    // Verificar se tem um salvo no cookie ou localStorage
                    const savedId = getWorkspaceCookie() || localStorage.getItem("activeWorkspaceId")
                    const saved = data.workspaces.find((w: Workspace) => w.id === savedId)

                    const workspaceToSet = saved || data.workspaces[0]
                    setActiveWorkspaceState(workspaceToSet)

                    // Garantir que o cookie está salvo
                    setWorkspaceCookie(workspaceToSet.id)
                    localStorage.setItem("activeWorkspaceId", workspaceToSet.id)
                }
            }
        } catch (error) {
            console.error("Erro ao carregar workspaces:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Função para trocar workspace ativo
    const setActiveWorkspace = (workspace: Workspace): void => {
        setActiveWorkspaceState(workspace)

        // Salvar em AMBOS: localStorage e cookie
        localStorage.setItem("activeWorkspaceId", workspace.id)
        setWorkspaceCookie(workspace.id)
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