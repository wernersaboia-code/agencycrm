// app/api/workspaces/active/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

async function getAuthenticatedUserId() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user.id
}

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { activeWorkspaceId: true },
        })

        const workspace = await prisma.workspace.findFirst({
            where: {
                userId,
                ...(user?.activeWorkspaceId ? { id: user.activeWorkspaceId } : {}),
            },
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
                plan: true,
                trialEndsAt: true,
                subscriptionStatus: true,
            },
            orderBy: { createdAt: "asc" },
        })

        const fallbackWorkspace = workspace ?? await prisma.workspace.findFirst({
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
                plan: true,
                trialEndsAt: true,
                subscriptionStatus: true,
            },
            orderBy: { createdAt: "asc" },
        })

        if (fallbackWorkspace && fallbackWorkspace.id !== user?.activeWorkspaceId) {
            await prisma.user.update({
                where: { id: userId },
                data: { activeWorkspaceId: fallbackWorkspace.id },
            })
        }

        const cookieStore = await cookies()
        if (fallbackWorkspace) {
            cookieStore.set("activeWorkspaceId", fallbackWorkspace.id, {
                path: "/",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365,
            })
        }

        return NextResponse.json({
            workspace: fallbackWorkspace ? {
                ...fallbackWorkspace,
                createdAt: fallbackWorkspace.createdAt.toISOString(),
                updatedAt: fallbackWorkspace.updatedAt.toISOString(),
                trialEndsAt: fallbackWorkspace.trialEndsAt?.toISOString() || null,
            } : null,
        })
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthenticatedUserId()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { workspaceId } = await request.json() as { workspaceId?: string }

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId },
            select: { id: true },
        })

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
        }

        await prisma.user.update({
            where: { id: userId },
            data: { activeWorkspaceId: workspace.id },
        })

        const cookieStore = await cookies()
        cookieStore.set("activeWorkspaceId", workspace.id, {
            path: "/",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
        })

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
