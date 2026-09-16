import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { accessibleWorkspaceWhere } from "@/lib/auth"

export async function getActiveOrFirstWorkspaceId(userId: string): Promise<string | null> {
    const cookieStore = await cookies()
    const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

    if (activeWorkspaceId) {
        const activeWorkspace = await prisma.workspace.findFirst({
            where: {
                id: activeWorkspaceId,
                ...accessibleWorkspaceWhere(userId),
            },
            select: { id: true },
        })

        if (activeWorkspace) {
            return activeWorkspace.id
        }
    }

    const firstWorkspace = await prisma.workspace.findFirst({
        where: accessibleWorkspaceWhere(userId),
        select: { id: true },
        orderBy: { createdAt: "asc" },
    })

    return firstWorkspace?.id ?? null
}
