// actions/companies.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

// Tipos
export type CompanyFormData = {
    name: string
    domain?: string | null
    industry?: string | null
    size?: string | null
    website?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    postalCode?: string | null
    description?: string | null
}

// Função para limpar dados (evita erro de FK com strings vazias)
function cleanCompanyData(data: CompanyFormData) {
    return {
        name: data.name.trim(),
        domain: data.domain?.trim() || null,
        industry: data.industry?.trim() || null,
        size: data.size?.trim() || null,
        website: data.website?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        description: data.description?.trim() || null,
    }
}

// Obter usuário autenticado
async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Usuário não autenticado")
    }

    return user
}

// CREATE - Criar empresa
export async function createCompany(data: CompanyFormData) {
    try {
        const user = await getAuthenticatedUser()
        const cleanedData = cleanCompanyData(data)

        const company = await prisma.company.create({
            data: {
                ...cleanedData,
                assignedTo: {
                    connect: { id: user.id }
                }
            },
        })

        revalidatePath("/companies")
        return { success: true, data: company }
    } catch (error) {
        console.error("Erro ao criar empresa:", error)
        return { success: false, error: "Erro ao criar empresa" }
    }
}

// READ - Listar empresas
export async function getCompanies(search?: string) {
    try {
        const user = await getAuthenticatedUser()

        const companies = await prisma.company.findMany({
            where: {
                assignedToId: user.id,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { domain: { contains: search, mode: "insensitive" } },
                        { industry: { contains: search, mode: "insensitive" } },
                    ],
                }),
            },
            include: {
                _count: {
                    select: { contacts: true, deals: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return { success: true, data: companies }
    } catch (error) {
        console.error("Erro ao buscar empresas:", error)
        return { success: false, error: "Erro ao buscar empresas", data: [] }
    }
}

// READ - Buscar empresa por ID
export async function getCompanyById(id: string) {
    try {
        const user = await getAuthenticatedUser()

        const company = await prisma.company.findFirst({
            where: {
                id,
                assignedToId: user.id,
            },
            include: {
                contacts: {
                    orderBy: { firstName: "asc" },
                },
                deals: {
                    orderBy: { createdAt: "desc" },
                },
                _count: {
                    select: { contacts: true, deals: true },
                },
            },
        })

        if (!company) {
            return { success: false, error: "Empresa não encontrada" }
        }

        return { success: true, data: company }
    } catch (error) {
        console.error("Erro ao buscar empresa:", error)
        return { success: false, error: "Erro ao buscar empresa" }
    }
}

// UPDATE - Atualizar empresa
export async function updateCompany(id: string, data: CompanyFormData) {
    try {
        const user = await getAuthenticatedUser()
        const cleanedData = cleanCompanyData(data)

        // Verifica se a empresa pertence ao usuário
        const existing = await prisma.company.findFirst({
            where: { id, assignedToId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Empresa não encontrada" }
        }

        const company = await prisma.company.update({
            where: { id },
            data: cleanedData,
        })

        revalidatePath("/companies")
        revalidatePath(`/companies/${id}`)
        return { success: true, data: company }
    } catch (error) {
        console.error("Erro ao atualizar empresa:", error)
        return { success: false, error: "Erro ao atualizar empresa" }
    }
}

// DELETE - Excluir empresa
export async function deleteCompany(id: string) {
    try {
        const user = await getAuthenticatedUser()

        // Verifica se a empresa pertence ao usuário
        const existing = await prisma.company.findFirst({
            where: { id, assignedToId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Empresa não encontrada" }
        }

        await prisma.company.delete({
            where: { id },
        })

        revalidatePath("/companies")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir empresa:", error)
        return { success: false, error: "Erro ao excluir empresa" }
    }
}

// Listar empresas para select (usado em outros formulários)
export async function getCompaniesForSelect() {
    try {
        const user = await getAuthenticatedUser()

        const companies = await prisma.company.findMany({
            where: { assignedToId: user.id },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        })

        return { success: true, data: companies }
    } catch (error) {
        console.error("Erro ao buscar empresas:", error)
        return { success: false, error: "Erro ao buscar empresas", data: [] }
    }
}