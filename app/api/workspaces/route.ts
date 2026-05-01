// app/api/workspaces/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUserId } from "@/lib/auth"

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const workspaces = await prisma.workspace.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                logo: true,
                senderName: true,
                senderEmail: true,
                createdAt: true,
                updatedAt: true,
                // 🆕 Novos campos
                plan: true,
                trialEndsAt: true,
                subscriptionStatus: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        // Converter datas para string
        const serializedWorkspaces = workspaces.map(workspace => ({
            ...workspace,
            createdAt: workspace.createdAt.toISOString(),
            updatedAt: workspace.updatedAt.toISOString(),
            trialEndsAt: workspace.trialEndsAt?.toISOString() || null,
        }))

        return NextResponse.json({ workspaces: serializedWorkspaces })
    } catch (error) {
        console.error("Erro ao buscar workspaces:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
