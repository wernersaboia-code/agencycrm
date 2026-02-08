// actions/contacts.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { ContactFormData } from "@/types/contact"

// Função auxiliar para obter usuário autenticado
async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Usuário não autenticado")
    }

    return user
}

// Função auxiliar para limpar dados vazios
function cleanContactData(data: ContactFormData) {
    return {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        position: data.position || null,
        department: data.department || null,
        status: data.status,
        source: data.source || null,
        notes: data.notes || null,
        companyId: data.companyId || null,
    }
}

// Buscar todos os contatos
export async function getContacts(search?: string) {
    try {
        const contacts = await prisma.contact.findMany({
            where: search
                ? {
                    OR: [
                        { firstName: { contains: search, mode: "insensitive" } },
                        { lastName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                    ],
                }
                : undefined,
            include: {
                company: true,
                assignedTo: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return { data: contacts, error: null }
    } catch (error) {
        console.error("Erro ao buscar contatos:", error)
        return { data: null, error: "Erro ao buscar contatos" }
    }
}

// Buscar contato por ID
export async function getContactById(id: string) {
    try {
        const contact = await prisma.contact.findUnique({
            where: { id },
            include: {
                company: true,
                assignedTo: true,
                createdBy: true,
                tasks: true,
                activities: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        })

        if (!contact) {
            return { data: null, error: "Contato não encontrado" }
        }

        return { data: contact, error: null }
    } catch (error) {
        console.error("Erro ao buscar contato:", error)
        return { data: null, error: "Erro ao buscar contato" }
    }
}

// Criar contato
export async function createContact(data: ContactFormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { data: null, error: "Não autorizado" }
        }

        // Verificar se existe um usuário no banco com esse ID
        let dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        })

        // Se não existir, criar o usuário
        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email!,
                    name: user.user_metadata?.name || null,
                },
            })
        }

        // Limpar dados antes de salvar
        const cleanedData = cleanContactData(data)

        const contact = await prisma.contact.create({
            data: {
                ...cleanedData,
                createdById: user.id,
            },
        })

        revalidatePath("/contacts")
        return { data: contact, error: null }
    } catch (error) {
        console.error("Erro ao criar contato:", error)
        return { data: null, error: "Erro ao criar contato" }
    }
}

// Atualizar contato
export async function updateContact(id: string, data: ContactFormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { data: null, error: "Não autorizado" }
        }

        // Limpar dados antes de salvar
        const cleanedData = cleanContactData(data)

        const contact = await prisma.contact.update({
            where: { id },
            data: cleanedData,
        })

        revalidatePath("/contacts")
        revalidatePath(`/contacts/${id}`)
        return { data: contact, error: null }
    } catch (error) {
        console.error("Erro ao atualizar contato:", error)
        return { data: null, error: "Erro ao atualizar contato" }
    }
}

// Excluir contato
export async function deleteContact(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: "Não autorizado" }
        }

        await prisma.contact.delete({
            where: { id },
        })

        revalidatePath("/contacts")
        return { error: null }
    } catch (error) {
        console.error("Erro ao excluir contato:", error)
        return { error: "Erro ao excluir contato" }
    }
}

// Listar contatos para select (usado em outros formulários)
export async function getContactsForSelect() {
    try {
        const user = await getAuthenticatedUser()

        const contacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { assignedToId: user.id },
                    { createdById: user.id },
                ]
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
            orderBy: { firstName: "asc" },
        })

        return { success: true, data: contacts }
    } catch (error) {
        console.error("Erro ao buscar contatos:", error)
        return { success: false, error: "Erro ao buscar contatos", data: [] }
    }
}