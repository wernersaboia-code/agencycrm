// lib/marketplace/registro-lead-pdf.ts
//
// Converte a empresa lida do diretório na linha de MarketplaceLead, com
// origin = "pdf". Puro, para servir à rota do admin e ao script de lote
// (prisma/extrair-leads.ts), que não carrega o cliente Prisma do Next.

import type { LeadDoDiretorio } from "./leads-do-diretorio"
import { ORIGEM_PDF } from "./origem-lead"

function cortar(texto: string | null, max: number): string | null {
    if (!texto) return null
    const limpo = texto.replace(/\s+/g, " ").trim()
    return limpo ? limpo.slice(0, max) : null
}

export function paraRegistro(
    lead: LeadDoDiretorio,
    lista: { id: string; countries: string[]; industries: string[] }
) {
    return {
        listId: lista.id,
        origin: ORIGEM_PDF,
        // Estudo de vários países não diz o país de cada empresa de forma
        // confiável; fica o primeiro do estudo, como referência.
        country: lista.countries[0] ?? "—",
        companyName: cortar(lead.companyName, 200)!,
        location: cortar(lead.location, 300),
        directorySection: cortar(lead.secao, 200),
        website: cortar(lead.website, 200),
        contactForm: cortar(lead.contactForm, 300),
        emailGeneral: cortar(lead.emailGeneral, 200),
        emailPurchasing: cortar(lead.emailPurchasing, 200),
        phoneGeneral: cortar(lead.phoneGeneral, 80),
        companyType: cortar(lead.companyType, 200),
        sector: lista.industries[0] ?? null,
        productPortfolio: cortar(lead.productPortfolio, 4000),
        specialFocus: cortar(lead.specialFocus, 4000),
        isComplete: Boolean(lead.emailGeneral),
    }
}
