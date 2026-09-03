import { validaCodigoDePais } from "@/lib/i18n/nome-de-pais"

/**
 * Gate único de publicação de uma lista.
 *
 * São três promessas públicas que só se sustentam se a lista trouxer os campos
 * abaixo antes de ir ao ar:
 *
 * 1. `studyPdfUrl` — a entrega ao comprador É o estudo em PDF. Sem o arquivo, a
 *    compra entrega nada: a rota de download responde "lista ainda não tem PDF".
 * 2. `dataReviewedAt` — o FAQ afirma que a página de cada lista mostra quando os
 *    dados foram revisados pela última vez. Sem a data, a página omite o campo e
 *    a afirmação vira falsa. A data é registrada pelo admin em markListReviewed,
 *    nunca preenchida automaticamente — preencher sozinho seria inventar uma
 *    revisão que não aconteceu.
 * 3. `countries` — o filtro do catálogo mostra os países que têm estudo. Um
 *    código que não é país vira opção morta na barra lateral, e um código
 *    obsoleto vira uma SEGUNDA opção para um país que já está lá (o `UK` ao
 *    lado do `GB`). O campo é texto livre no admin e vem auto-preenchido do
 *    PDF importado, então é por aqui que entra o lixo.
 *
 * A ordem dos motivos é deliberada: sem PDF a compra não entrega nada, o que é
 * pior que um filtro incompleto.
 */
export function canPublishList(
    list: {
        studyPdfUrl: string | null
        dataReviewedAt: Date | null
        /** Opcional: quem chama sem o campo é julgado só pelos dois primeiros. */
        countries?: readonly string[]
    }
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
    for (const codigo of list.countries ?? []) {
        const check = validaCodigoDePais(codigo)
        if (!check.ok) {
            return { ok: false, reason: check.motivo }
        }
    }
    return { ok: true }
}
