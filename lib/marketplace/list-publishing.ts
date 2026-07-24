/**
 * Gate único de publicação de uma lista.
 *
 * São duas promessas públicas que só se sustentam se a lista trouxer os dois
 * campos abaixo antes de ir ao ar:
 *
 * 1. `studyPdfUrl` — a entrega ao comprador É o estudo em PDF. Sem o arquivo, a
 *    compra entrega nada: a rota de download responde "lista ainda não tem PDF".
 * 2. `dataReviewedAt` — o FAQ afirma que a página de cada lista mostra quando os
 *    dados foram revisados pela última vez. Sem a data, a página omite o campo e
 *    a afirmação vira falsa. A data é registrada pelo admin em markListReviewed,
 *    nunca preenchida automaticamente — preencher sozinho seria inventar uma
 *    revisão que não aconteceu.
 */
export function canPublishList(
    list: { studyPdfUrl: string | null; dataReviewedAt: Date | null }
): { ok: true } | { ok: false; reason: string } {
    if (!list.studyPdfUrl || !list.studyPdfUrl.trim()) {
        return { ok: false, reason: "Anexe o estudo de mercado em PDF antes de publicar a lista." }
    }
    if (!list.dataReviewedAt) {
        return {
            ok: false,
            reason: "Marque os dados como revisados antes de publicar: a página da lista precisa mostrar a data da revisão.",
        }
    }
    return { ok: true }
}
