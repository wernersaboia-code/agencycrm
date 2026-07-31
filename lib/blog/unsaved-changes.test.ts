// lib/blog/unsaved-changes.test.ts
import { describe, it, expect } from "vitest"
import { temAlteracaoNaoSalva, toDatetimeLocalValue, type TranslationStateLike } from "./unsaved-changes"

const traducaoPt: TranslationStateLike = {
    title: "Título",
    slug: "titulo",
    excerpt: "Resumo",
    contentHtml: "<p>Conteúdo</p>",
    metaDescription: "Meta",
}

function baseParams(): Parameters<typeof temAlteracaoNaoSalva>[0] {
    const publishedAtIso = "2026-08-01T13:00:00.000Z"
    return {
        tr: { pt: { ...traducaoPt } },
        initialTranslations: { pt: { ...traducaoPt } },
        cover: "https://example.com/capa.png",
        initialCoverImageUrl: "https://example.com/capa.png",
        categoryId: "cat-1",
        initialCategoryId: "cat-1",
        status: "DRAFT",
        initialStatus: "DRAFT",
        publishedAt: toDatetimeLocalValue(publishedAtIso),
        initialPublishedAt: publishedAtIso,
    }
}

describe("temAlteracaoNaoSalva", () => {
    it("nada editado, com publishedAt vindo como ISO e estado já convertido -> false", () => {
        expect(temAlteracaoNaoSalva(baseParams())).toBe(false)
    })

    it("só a data editada -> true", () => {
        const params = baseParams()
        params.publishedAt = "2026-08-02T09:30"
        expect(temAlteracaoNaoSalva(params)).toBe(true)
    })

    it("só o conteúdo de um idioma editado -> true", () => {
        const params = baseParams()
        params.tr = { pt: { ...traducaoPt, title: "Título editado" } }
        expect(temAlteracaoNaoSalva(params)).toBe(true)
    })

    it("post sem data (initial.publishedAt nulo e estado vazio) -> false", () => {
        const params = baseParams()
        params.publishedAt = ""
        params.initialPublishedAt = null
        expect(temAlteracaoNaoSalva(params)).toBe(false)
    })

    it("linha de base igual ao estado atual -> false, mesmo com o HTML do servidor normalizado de forma diferente", () => {
        // Simula o cenário real do editor: o servidor normaliza o contentHtml
        // ao salvar (remove <p></p> vazio, remove class, troca <br> por
        // <br />), então "o que o servidor devolveria normalizado" nunca bate
        // bit-a-bit com o que o editor tinha na tela. A linha de base pós-save
        // não é essa versão normalizada — é o estado que o EDITOR tinha no
        // momento em que salvou. Comparar contra ELA dá false.
        const editadoAoSalvar: TranslationStateLike = {
            ...traducaoPt,
            contentHtml: '<p class="MsoNormal">Conteúdo</p><p></p><br>',
        }
        const normalizadoPeloServidor: TranslationStateLike = {
            ...traducaoPt,
            contentHtml: "<p>Conteúdo</p><br />",
        }

        const params = baseParams()
        params.tr = { pt: editadoAoSalvar }
        // A linha de base é o estado do editor, não a versão normalizada —
        // por isso usamos editadoAoSalvar aqui, não normalizadoPeloServidor.
        params.initialTranslations = { pt: editadoAoSalvar }
        expect(temAlteracaoNaoSalva(params)).toBe(false)

        // E, para provar que a distinção importa: comparar o mesmo estado
        // contra a versão normalizada (o que aconteceria SEM a linha de base,
        // comparando direto contra `initial` do servidor) dá true — é
        // exatamente o falso positivo permanente que a linha de base evita.
        const paramsSemBaseline = baseParams()
        paramsSemBaseline.tr = { pt: editadoAoSalvar }
        paramsSemBaseline.initialTranslations = { pt: normalizadoPeloServidor }
        expect(temAlteracaoNaoSalva(paramsSemBaseline)).toBe(true)
    })
})
