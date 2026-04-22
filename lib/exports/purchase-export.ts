// lib/exports/purchase-export.ts
import { prisma } from "@/lib/prisma"

export async function generatePurchaseCSV(purchaseItemId: string, userId: string) {
    // Buscar item da compra
    const purchaseItem = await prisma.purchaseItem.findFirst({
        where: {
            id: purchaseItemId,
            purchase: { userId },
        },
        include: {
            list: {
                include: {
                    leads: true,
                },
            },
        },
    })

    if (!purchaseItem) {
        throw new Error("Purchase item not found")
    }

    // Atualizar contador de downloads
    await prisma.purchaseItem.update({
        where: { id: purchaseItemId },
        data: {
            downloadCount: { increment: 1 },
            downloadedAt: new Date(),
        },
    })

    const leads = purchaseItem.list.leads

    // Headers do CSV
    const headers = [
        "País",
        "Empresa",
        "Email Geral",
        "Telefone Geral",
        "Website",
        "Setor",
        "Tipo de Empresa",
        "Gerente",
        "Email Compras",
        "Telefone Compras",
        "Pessoa Compras",
        "Portfólio de Produtos",
        "Especialidade",
        "Tipos de Cliente",
        "Tipos de Produto",
        "Sourcing",
        "Vendas Exportação",
        "Foco Especial",
        "Palavras-chave Produto",
        "Pontos de Venda",
        "Formulário Contato",
    ]

    // Gerar linhas do CSV
    const rows = leads.map((lead) => [
        lead.country || "",
        lead.companyName || "",
        lead.emailGeneral || "",
        lead.phoneGeneral || "",
        lead.website || "",
        lead.sector || "",
        lead.companyType || "",
        lead.manager || "",
        lead.emailPurchasing || "",
        lead.phonePurchasing || "",
        lead.purchasingPerson || "",
        lead.productPortfolio || "",
        lead.specialty || "",
        lead.customerTypes || "",
        lead.productTypes || "",
        lead.sourcing || "",
        lead.exportSales || "",
        lead.specialFocus || "",
        lead.productKeywords || "",
        lead.salesPointsCount || "",
        lead.contactForm || "",
    ])

    // Construir CSV
    const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
    ].join("\n")

    // BOM para UTF-8
    const csv = "\uFEFF" + csvContent

    return {
        csv,
        filename: `${purchaseItem.list.slug}-${new Date().toISOString().split("T")[0]}.csv`,
        leadsCount: leads.length,
    }
}

export async function generatePurchaseExcel(purchaseItemId: string, userId: string) {
    // Buscar item da compra
    const purchaseItem = await prisma.purchaseItem.findFirst({
        where: {
            id: purchaseItemId,
            purchase: { userId },
        },
        include: {
            list: {
                include: {
                    leads: true,
                },
            },
        },
    })

    if (!purchaseItem) {
        throw new Error("Purchase item not found")
    }

    // Atualizar contador de downloads
    await prisma.purchaseItem.update({
        where: { id: purchaseItemId },
        data: {
            downloadCount: { increment: 1 },
            downloadedAt: new Date(),
        },
    })

    const leads = purchaseItem.list.leads

    // Construir dados para Excel
    const data = leads.map((lead) => ({
        País: lead.country || "",
        Empresa: lead.companyName || "",
        "Email Geral": lead.emailGeneral || "",
        "Telefone Geral": lead.phoneGeneral || "",
        Website: lead.website || "",
        Setor: lead.sector || "",
        "Tipo de Empresa": lead.companyType || "",
        Gerente: lead.manager || "",
        "Email Compras": lead.emailPurchasing || "",
        "Telefone Compras": lead.phonePurchasing || "",
        "Pessoa Compras": lead.purchasingPerson || "",
        "Portfólio de Produtos": lead.productPortfolio || "",
        Especialidade: lead.specialty || "",
        "Tipos de Cliente": lead.customerTypes || "",
        "Tipos de Produto": lead.productTypes || "",
        Sourcing: lead.sourcing || "",
        "Vendas Exportação": lead.exportSales || "",
        "Foco Especial": lead.specialFocus || "",
        "Palavras-chave Produto": lead.productKeywords || "",
        "Pontos de Venda": lead.salesPointsCount || "",
        "Formulário Contato": lead.contactForm || "",
    }))

    return {
        data,
        filename: `${purchaseItem.list.slug}-${new Date().toISOString().split("T")[0]}.xlsx`,
        leadsCount: leads.length,
    }
}