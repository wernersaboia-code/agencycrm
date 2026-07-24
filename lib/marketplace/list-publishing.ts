/**
 * Uma lista só pode ir ao ar com o estudo em PDF anexado: a entrega ao
 * comprador É o PDF, e o FAQ promete isso. Sem o arquivo, a compra entrega
 * nada — a rota de download responde "lista ainda não tem PDF".
 */
export function canPublishList(
    list: { studyPdfUrl: string | null }
): { ok: true } | { ok: false; reason: string } {
    if (!list.studyPdfUrl || !list.studyPdfUrl.trim()) {
        return { ok: false, reason: "Anexe o estudo de mercado em PDF antes de publicar a lista." }
    }
    return { ok: true }
}
