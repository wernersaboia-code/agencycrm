// lib/marketplace/origem-lead.ts
//
// Leads lidos do PDF do estudo (origin = "pdf") são SÓ DO ADMIN: servem para a
// equipe conhecer as empresas dos estudos. Tudo o que chega ao comprador — o
// download da compra, a contagem `totalLeads` e a amostra `previewData` da
// página pública — filtra por este `where`.

export const ORIGEM_PDF = "pdf"

/** `where` dos leads que o comprador pode ver (importados por planilha). */
export const LEADS_DO_COMPRADOR = { origin: { not: ORIGEM_PDF } } as const
