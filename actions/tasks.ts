// actions/tasks.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { TaskStatus, TaskPriority } from "@prisma/client"

// ==================== TIPOS ====================

export type TaskWithRelations = {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    dueDate: string | null
    completedAt: string | null
    createdAt: string
    updatedAt: string
    contact: { id: string; firstName: string; lastName: string } | null
    company: { id: string; name: string } | null
    deal: { id: string; title: string } | null
    assignedTo: { id: string; name: string | null; email: string } | null
    createdBy: { id: string; name: string | null; email: string }
    subtasks: {
        id: string
        title: string
        completed: boolean
        order: number
    }[]
    _count: {
        subtasks: number
    }
}

export type TaskFormData = {
    title: string
    description?: string | null
    status?: TaskStatus
    priority?: TaskPriority
    dueDate?: string | null
    contactId?: string | null
    companyId?: string | null
    dealId?: string | null
    assignedToId?: string | null
}

export type SubtaskFormData = {
    title: string
    completed?: boolean
    order?: number
}

// ==================== HELPERS ====================

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Não autenticado")
    }

    return user
}

function serializeTask(task: any): TaskWithRelations {
    return {
        ...task,
        dueDate: task.dueDate?.toISOString() || null,
        completedAt: task.completedAt?.toISOString() || null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        subtasks: task.subtasks?.map((s: any) => ({
            id: s.id,
            title: s.title,
            completed: s.completed,
            order: s.order,
        })) || [],
    }
}

function cleanFormData(data: TaskFormData) {
    return {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        contactId: data.contactId || null,
        companyId: data.companyId || null,
        dealId: data.dealId || null,
        assignedToId: data.assignedToId || null,
    }
}

// ==================== CRUD ====================

export async function getTasks(filters?: {
    status?: TaskStatus | "ALL"
    priority?: TaskPriority | "ALL"
    dueDateFilter?: "ALL" | "TODAY" | "WEEK" | "OVERDUE" | "NO_DATE"
    contactId?: string
    companyId?: string
    dealId?: string
    search?: string
}) {
    try {
        const user = await getAuthenticatedUser()

        // Construir filtros
        const where: any = {
            createdById: user.id,
        }

        // Filtro por status
        if (filters?.status && filters.status !== "ALL") {
            where.status = filters.status
        }

        // Filtro por prioridade
        if (filters?.priority && filters.priority !== "ALL") {
            where.priority = filters.priority
        }

        // Filtro por data
        if (filters?.dueDateFilter && filters.dueDateFilter !== "ALL") {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() + 7)

            switch (filters.dueDateFilter) {
                case "TODAY":
                    where.dueDate = {
                        gte: today,
                        lt: tomorrow,
                    }
                    break
                case "WEEK":
                    where.dueDate = {
                        gte: today,
                        lt: weekEnd,
                    }
                    break
                case "OVERDUE":
                    where.dueDate = {
                        lt: today,
                    }
                    where.status = {
                        notIn: ["COMPLETED", "CANCELLED"],
                    }
                    break
                case "NO_DATE":
                    where.dueDate = null
                    break
            }
        }

        // Filtro por vínculo
        if (filters?.contactId) {
            where.contactId = filters.contactId
        }
        if (filters?.companyId) {
            where.companyId = filters.companyId
        }
        if (filters?.dealId) {
            where.dealId = filters.dealId
        }

        // Filtro por busca
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ]
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
                company: {
                    select: { id: true, name: true },
                },
                deal: {
                    select: { id: true, title: true },
                },
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                subtasks: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: { subtasks: true },
                },
            },
            orderBy: [
                { status: "asc" },
                { priority: "desc" },
                { dueDate: "asc" },
                { createdAt: "desc" },
            ],
        })

        return {
            success: true,
            data: tasks.map(serializeTask),
        }
    } catch (error) {
        console.error("Erro ao buscar tarefas:", error)
        return {
            success: false,
            error: "Erro ao buscar tarefas",
        }
    }
}

export async function getTaskById(id: string) {
    try {
        const user = await getAuthenticatedUser()

        const task = await prisma.task.findFirst({
            where: {
                id,
                createdById: user.id,
            },
            include: {
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
                company: {
                    select: { id: true, name: true },
                },
                deal: {
                    select: { id: true, title: true },
                },
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                subtasks: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: { subtasks: true },
                },
            },
        })

        if (!task) {
            return {
                success: false,
                error: "Tarefa não encontrada",
            }
        }

        return {
            success: true,
            data: serializeTask(task),
        }
    } catch (error) {
        console.error("Erro ao buscar tarefa:", error)
        return {
            success: false,
            error: "Erro ao buscar tarefa",
        }
    }
}

export async function createTask(data: TaskFormData) {
    try {
        const user = await getAuthenticatedUser()
        const cleanedData = cleanFormData(data)

        const task = await prisma.task.create({
            data: {
                ...cleanedData,
                createdById: user.id,
            },
            include: {
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
                company: {
                    select: { id: true, name: true },
                },
                deal: {
                    select: { id: true, title: true },
                },
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                subtasks: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: { subtasks: true },
                },
            },
        })

        revalidatePath("/tasks")
        revalidatePath("/dashboard")

        if (task.contactId) revalidatePath(`/contacts/${task.contactId}`)
        if (task.companyId) revalidatePath(`/companies/${task.companyId}`)
        if (task.dealId) revalidatePath(`/deals/${task.dealId}`)

        return {
            success: true,
            data: serializeTask(task),
        }
    } catch (error) {
        console.error("Erro ao criar tarefa:", error)
        return {
            success: false,
            error: "Erro ao criar tarefa",
        }
    }
}

export async function updateTask(id: string, data: TaskFormData) {
    try {
        const user = await getAuthenticatedUser()
        const cleanedData = cleanFormData(data)

        // Verificar se a tarefa pertence ao usuário
        const existing = await prisma.task.findFirst({
            where: { id, createdById: user.id },
        })

        if (!existing) {
            return {
                success: false,
                error: "Tarefa não encontrada",
            }
        }

        // Se está marcando como concluída, registrar a data
        const updateData: any = { ...cleanedData }
        if (cleanedData.status === "COMPLETED" && existing.status !== "COMPLETED") {
            updateData.completedAt = new Date()
        } else if (cleanedData.status !== "COMPLETED") {
            updateData.completedAt = null
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
                company: {
                    select: { id: true, name: true },
                },
                deal: {
                    select: { id: true, title: true },
                },
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                subtasks: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: { subtasks: true },
                },
            },
        })

        revalidatePath("/tasks")
        revalidatePath(`/tasks/${id}`)
        revalidatePath("/dashboard")

        if (task.contactId) revalidatePath(`/contacts/${task.contactId}`)
        if (task.companyId) revalidatePath(`/companies/${task.companyId}`)
        if (task.dealId) revalidatePath(`/deals/${task.dealId}`)

        return {
            success: true,
            data: serializeTask(task),
        }
    } catch (error) {
        console.error("Erro ao atualizar tarefa:", error)
        return {
            success: false,
            error: "Erro ao atualizar tarefa",
        }
    }
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
    try {
        const user = await getAuthenticatedUser()

        const existing = await prisma.task.findFirst({
            where: { id, createdById: user.id },
        })

        if (!existing) {
            return {
                success: false,
                error: "Tarefa não encontrada",
            }
        }

        const updateData: any = { status }
        if (status === "COMPLETED") {
            updateData.completedAt = new Date()
        } else {
            updateData.completedAt = null
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
                company: {
                    select: { id: true, name: true },
                },
                deal: {
                    select: { id: true, title: true },
                },
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                subtasks: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: { subtasks: true },
                },
            },
        })

        revalidatePath("/tasks")
        revalidatePath("/dashboard")

        return {
            success: true,
            data: serializeTask(task),
        }
    } catch (error) {
        console.error("Erro ao atualizar status:", error)
        return {
            success: false,
            error: "Erro ao atualizar status",
        }
    }
}

export async function deleteTask(id: string) {
    try {
        const user = await getAuthenticatedUser()

        const existing = await prisma.task.findFirst({
            where: { id, createdById: user.id },
        })

        if (!existing) {
            return {
                success: false,
                error: "Tarefa não encontrada",
            }
        }

        await prisma.task.delete({
            where: { id },
        })

        revalidatePath("/tasks")
        revalidatePath("/dashboard")

        if (existing.contactId) revalidatePath(`/contacts/${existing.contactId}`)
        if (existing.companyId) revalidatePath(`/companies/${existing.companyId}`)
        if (existing.dealId) revalidatePath(`/deals/${existing.dealId}`)

        return {
            success: true,
        }
    } catch (error) {
        console.error("Erro ao excluir tarefa:", error)
        return {
            success: false,
            error: "Erro ao excluir tarefa",
        }
    }
}

// ==================== SUBTAREFAS ====================

export async function addSubtask(taskId: string, data: SubtaskFormData) {
    try {
        const user = await getAuthenticatedUser()

        // Verificar se a tarefa pertence ao usuário
        const task = await prisma.task.findFirst({
            where: { id: taskId, createdById: user.id },
            include: { subtasks: true },
        })

        if (!task) {
            return {
                success: false,
                error: "Tarefa não encontrada",
            }
        }

        // Calcular próxima ordem
        const maxOrder = task.subtasks.reduce((max, s) => Math.max(max, s.order), -1)

        const subtask = await prisma.subtask.create({
            data: {
                title: data.title.trim(),
                completed: data.completed || false,
                order: data.order ?? maxOrder + 1,
                taskId,
            },
        })

        revalidatePath("/tasks")
        revalidatePath(`/tasks/${taskId}`)

        return {
            success: true,
            data: subtask,
        }
    } catch (error) {
        console.error("Erro ao adicionar subtarefa:", error)
        return {
            success: false,
            error: "Erro ao adicionar subtarefa",
        }
    }
}

export async function updateSubtask(
    subtaskId: string,
    data: Partial<SubtaskFormData>
) {
    try {
        const user = await getAuthenticatedUser()

        // Verificar se a subtarefa pertence a uma tarefa do usuário
        const subtask = await prisma.subtask.findFirst({
            where: { id: subtaskId },
            include: { task: true },
        })

        if (!subtask || subtask.task.createdById !== user.id) {
            return {
                success: false,
                error: "Subtarefa não encontrada",
            }
        }

        const updateData: any = {}
        if (data.title !== undefined) updateData.title = data.title.trim()
        if (data.completed !== undefined) {
            updateData.completed = data.completed
            updateData.completedAt = data.completed ? new Date() : null
        }
        if (data.order !== undefined) updateData.order = data.order

        const updated = await prisma.subtask.update({
            where: { id: subtaskId },
            data: updateData,
        })

        revalidatePath("/tasks")
        revalidatePath(`/tasks/${subtask.taskId}`)

        return {
            success: true,
            data: updated,
        }
    } catch (error) {
        console.error("Erro ao atualizar subtarefa:", error)
        return {
            success: false,
            error: "Erro ao atualizar subtarefa",
        }
    }
}

export async function toggleSubtask(subtaskId: string) {
    try {
        const user = await getAuthenticatedUser()

        const subtask = await prisma.subtask.findFirst({
            where: { id: subtaskId },
            include: { task: true },
        })

        if (!subtask || subtask.task.createdById !== user.id) {
            return {
                success: false,
                error: "Subtarefa não encontrada",
            }
        }

        const updated = await prisma.subtask.update({
            where: { id: subtaskId },
            data: {
                completed: !subtask.completed,
                completedAt: !subtask.completed ? new Date() : null,
            },
        })

        revalidatePath("/tasks")
        revalidatePath(`/tasks/${subtask.taskId}`)

        return {
            success: true,
            data: updated,
        }
    } catch (error) {
        console.error("Erro ao alternar subtarefa:", error)
        return {
            success: false,
            error: "Erro ao alternar subtarefa",
        }
    }
}

export async function deleteSubtask(subtaskId: string) {
    try {
        const user = await getAuthenticatedUser()

        const subtask = await prisma.subtask.findFirst({
            where: { id: subtaskId },
            include: { task: true },
        })

        if (!subtask || subtask.task.createdById !== user.id) {
            return {
                success: false,
                error: "Subtarefa não encontrada",
            }
        }

        await prisma.subtask.delete({
            where: { id: subtaskId },
        })

        revalidatePath("/tasks")
        revalidatePath(`/tasks/${subtask.taskId}`)

        return {
            success: true,
        }
    } catch (error) {
        console.error("Erro ao excluir subtarefa:", error)
        return {
            success: false,
            error: "Erro ao excluir subtarefa",
        }
    }
}

// ==================== HELPERS PARA SELECTS ====================

export async function getContactsForSelect() {
    try {
        const user = await getAuthenticatedUser()

        const contacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { createdById: user.id },
                    { assignedToId: user.id },
                ],
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
            orderBy: { firstName: "asc" },
        })

        return {
            success: true,
            data: contacts,
        }
    } catch (error) {
        return { success: false, error: "Erro ao buscar contatos" }
    }
}

export async function getCompaniesForSelect() {
    try {
        const user = await getAuthenticatedUser()

        const companies = await prisma.company.findMany({
            where: {
                assignedToId: user.id,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        })

        return {
            success: true,
            data: companies,
        }
    } catch (error) {
        return { success: false, error: "Erro ao buscar empresas" }
    }
}

export async function getDealsForSelect() {
    try {
        const user = await getAuthenticatedUser()

        const deals = await prisma.deal.findMany({
            where: {
                assignedToId: user.id,
                status: "OPEN",
            },
            select: {
                id: true,
                title: true,
            },
            orderBy: { title: "asc" },
        })

        return {
            success: true,
            data: deals,
        }
    } catch (error) {
        return { success: false, error: "Erro ao buscar deals" }
    }
}

// ==================== ESTATÍSTICAS ====================

export async function getTaskStats() {
    try {
        const user = await getAuthenticatedUser()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [total, todo, inProgress, completed, overdue] = await Promise.all([
            prisma.task.count({
                where: { createdById: user.id },
            }),
            prisma.task.count({
                where: { createdById: user.id, status: "TODO" },
            }),
            prisma.task.count({
                where: { createdById: user.id, status: "IN_PROGRESS" },
            }),
            prisma.task.count({
                where: { createdById: user.id, status: "COMPLETED" },
            }),
            prisma.task.count({
                where: {
                    createdById: user.id,
                    status: { notIn: ["COMPLETED", "CANCELLED"] },
                    dueDate: { lt: today },
                },
            }),
        ])

        return {
            success: true,
            data: {
                total,
                todo,
                inProgress,
                completed,
                overdue,
            },
        }
    } catch (error) {
        return { success: false, error: "Erro ao buscar estatísticas" }
    }
}