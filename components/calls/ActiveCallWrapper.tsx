// components/calls/ActiveCallWrapper.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { ActiveCallManager } from "@/components/calls/ActiveCallManager"
import { useWorkspace } from "@/contexts/workspace-context"

// ============================================
// COMPONENT
// ============================================

export function ActiveCallWrapper() {
    const { activeWorkspace } = useWorkspace()

    console.log("🟡 ActiveCallWrapper renderizou", {
        workspaceId: activeWorkspace?.id
    })

    if (!activeWorkspace?.id) {
        console.log("❌ Sem workspace ativo")
        return null
    }

    return <ActiveCallManager workspaceId={activeWorkspace.id} />
}