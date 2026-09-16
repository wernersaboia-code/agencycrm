"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireWorkspaceAccess, requireWorkspaceOwner } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"

const workspaceIdSchema = z.string().min(1).max(200)
const memberIdSchema = z.string().min(1).max(200)
const memberEmailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase())

export type WorkspaceMemberRow = {
    id: string
    userId: string
    role: "OWNER" | "OPERATOR"
    name: string | null
    email: string
    avatar: string | null
    createdAt: string
}

function serializeMember(member: {
    id: string
    userId: string
    role: "OWNER" | "OPERATOR"
    createdAt: Date
    user: { name: string | null; email: string; avatar: string | null }
}): WorkspaceMemberRow {
    return {
        id: member.id,
        userId: member.userId,
        role: member.role,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
        createdAt: member.createdAt.toISOString(),
    }
}

/** Lista a equipe do workspace para os próprios membros. */
export async function getWorkspaceMembers(workspaceId: string) {
    const parsedWorkspaceId = workspaceIdSchema.safeParse(workspaceId)
    if (!parsedWorkspaceId.success) return { success: false as const, error: "Workspace inválido", data: [] as WorkspaceMemberRow[] }

    try {
        const user = await requireWorkspaceAccess(parsedWorkspaceId.data)
        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId: parsedWorkspaceId.data },
            include: { user: { select: { name: true, email: true, avatar: true } } },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        })
        const currentMembership = members.find((member) => member.userId === user.id)

        return {
            success: true as const,
            data: members.map(serializeMember),
            canManage: currentMembership?.role === "OWNER",
        }
    } catch {
        return { success: false as const, error: "Workspace não encontrado", data: [] as WorkspaceMemberRow[] }
    }
}

/** Adiciona ao workspace uma pessoa que já tenha uma conta ativa no site. */
export async function addWorkspaceMember(workspaceId: string, email: string) {
    const parsedWorkspaceId = workspaceIdSchema.safeParse(workspaceId)
    const parsedEmail = memberEmailSchema.safeParse(email)
    if (!parsedWorkspaceId.success || !parsedEmail.success) {
        return { success: false, error: "Informe um email válido" }
    }

    try {
        const owner = await requireWorkspaceOwner(parsedWorkspaceId.data)
        const person = await prisma.user.findFirst({
            where: { email: { equals: parsedEmail.data, mode: "insensitive" }, status: "ACTIVE" },
            select: { id: true, email: true, name: true },
        })

        if (!person) {
            return { success: false, error: "Esta pessoa precisa criar e confirmar uma conta antes de entrar no CRM." }
        }

        const existing = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: parsedWorkspaceId.data, userId: person.id } },
            select: { role: true },
        })

        if (existing?.role === "OWNER") {
            return { success: true, message: "Esta pessoa já é proprietária do workspace." }
        }

        await prisma.workspaceMember.upsert({
            where: { workspaceId_userId: { workspaceId: parsedWorkspaceId.data, userId: person.id } },
            create: { workspaceId: parsedWorkspaceId.data, userId: person.id, role: "OPERATOR" },
            update: { role: "OPERATOR" },
        })

        await recordAudit({
            actorId: owner.id,
            actorEmail: owner.email,
            action: "workspace.member_added",
            targetType: "workspace_member",
            targetId: person.id,
            metadata: { workspaceId: parsedWorkspaceId.data, email: person.email },
        })

        revalidatePath("/settings")
        return { success: true, message: existing ? "Acesso do operador reativado." : "Operador adicionado ao workspace." }
    } catch {
        return { success: false, error: "Não foi possível adicionar esta pessoa" }
    }
}

/** Remove um operador sem permitir que o último dono seja removido por acidente. */
export async function removeWorkspaceMember(workspaceId: string, memberId: string) {
    const parsedWorkspaceId = workspaceIdSchema.safeParse(workspaceId)
    const parsedMemberId = memberIdSchema.safeParse(memberId)
    if (!parsedWorkspaceId.success || !parsedMemberId.success) {
        return { success: false, error: "Membro inválido" }
    }

    try {
        const owner = await requireWorkspaceOwner(parsedWorkspaceId.data)
        const member = await prisma.workspaceMember.findFirst({
            where: { id: parsedMemberId.data, workspaceId: parsedWorkspaceId.data },
            include: { user: { select: { email: true } } },
        })

        if (!member) return { success: false, error: "Membro não encontrado" }
        if (member.role === "OWNER") return { success: false, error: "O proprietário não pode ser removido por esta tela." }

        await prisma.workspaceMember.delete({ where: { id: member.id } })
        await recordAudit({
            actorId: owner.id,
            actorEmail: owner.email,
            action: "workspace.member_removed",
            targetType: "workspace_member",
            targetId: member.userId,
            metadata: { workspaceId: parsedWorkspaceId.data, email: member.user.email },
        })

        revalidatePath("/settings")
        return { success: true }
    } catch {
        return { success: false, error: "Não foi possível remover esta pessoa" }
    }
}
