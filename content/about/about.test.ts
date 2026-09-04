import { describe, expect, it } from "vitest"
import { PUBLISHED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales"
import { getAboutDocument } from "./index"

/**
 * Ordem canônica das seções. Os documentos do sócio não são traduções
 * paralelas: o alemão não tem chamada final. Ausência é permitida, ordem
 * trocada e id desconhecido não — isso seria erro de transcrição.
 */
const ORDEM = [
    "metodologia",
    "fontes",
    "verificacao",
    "atualizacao",
    "entrega",
    "limites",
    "confianca",
    "cta",
] as const

/** Diferenças reais entre os documentos, conferidas contra os .docx. */
const SECOES_AUSENTES: Partial<Record<string, string[]>> = {
    de: ["cta"],
}

describe("documento 'Por que Easy Prospect'", () => {
    for (const locale of PUBLISHED_LOCALES) {
        const doc = getAboutDocument(locale)

        it(`${locale}: tem sobrelinha, título e introdução`, () => {
            expect(doc.eyebrow.trim()).not.toBe("")
            expect(doc.title.trim()).not.toBe("")
            expect(doc.intro.length).toBeGreaterThan(0)
        })

        it(`${locale}: só usa ids conhecidos, na ordem canônica`, () => {
            const ids = doc.sections.map((s) => s.id)
            const esperado = ORDEM.filter(
                (id) => !(SECOES_AUSENTES[locale] ?? []).includes(id)
            )

            expect(ids).toEqual(esperado)
        })

        it(`${locale}: nenhuma seção vazia`, () => {
            const vazias = doc.sections
                .filter((s) => !s.heading.trim() || s.blocks.length === 0)
                .map((s) => s.id)

            expect(vazias).toEqual([])
        })

        it(`${locale}: nenhum texto vazio dentro dos blocos`, () => {
            const vazios: string[] = []
            for (const section of doc.sections) {
                for (const bloco of section.blocks) {
                    if (bloco.kind === "paragrafo" && !bloco.texto.trim()) vazios.push(section.id)
                    if (bloco.kind === "lista" && bloco.itens.some((i) => !i.trim())) vazios.push(section.id)
                    if (bloco.kind === "cartoes" && bloco.cartoes.some((c) => !c.titulo.trim() || !c.texto.trim())) {
                        vazios.push(section.id)
                    }
                }
            }

            expect(vazios).toEqual([])
        })

        it(`${locale}: sem sobra de marcação do .docx`, () => {
            const textos = [
                doc.eyebrow,
                doc.title,
                ...doc.sections.flatMap((s) => [
                    s.heading,
                    s.sub ?? "",
                    ...s.blocks.flatMap((b) =>
                        b.kind === "paragrafo" ? [b.texto]
                        : b.kind === "lista" ? b.itens
                        : b.cartoes.flatMap((c) => [c.titulo, c.texto])
                    ),
                ]),
            ]

            // ✓ vinha como texto nos documentos en/es e virou item de lista;
            // &apos; era entidade não decodificada na extração do francês.
            const sujos = textos.filter((t) => /[✓]|&[a-z]+;|\s{2,}/.test(t))

            expect(sujos).toEqual([])
        })

        it(`${locale}: fala de disparo em massa (decisão do Werner, 2026-07-31)`, () => {
            const fontes = doc.sections.find((s) => s.id === "fontes")
            const texto = JSON.stringify(fontes?.blocks ?? []).toLowerCase()

            expect(texto).toMatch(/massenmailing|mass mailing|massa|masivo|masse|massaal|جماعي/)
        })
    }

    it("português é o documento de referência e tem todas as seções", () => {
        expect(getAboutDocument(DEFAULT_LOCALE).sections.map((s) => s.id)).toEqual([...ORDEM])
    })
})
