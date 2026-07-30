import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { PUBLISHED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales"
import { getLegalDocument } from "./index"
import { SECOES_PENDENTES } from "./pendencias"

const KINDS = ["privacy", "terms"] as const
const DIR = __dirname

describe("documentos legais", () => {
    for (const kind of KINDS) {
        const base = getLegalDocument(kind, DEFAULT_LOCALE)

        it(`${kind}: pt declara pelo menos uma seção`, () => {
            expect(base.sections.length).toBeGreaterThan(0)
        })

        it(`${kind}: lastUpdated é data ISO literal`, () => {
            expect(base.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })

        it(`${kind}: nenhuma seção pendente foi publicada`, () => {
            const publicadas = base.sections.map((s) => s.id)
            const vazadas = (SECOES_PENDENTES[kind] ?? []).filter((id) =>
                publicadas.includes(id)
            )
            expect(vazadas).toEqual([])
        })

        for (const locale of PUBLISHED_LOCALES) {
            const doc = getLegalDocument(kind, locale)

            it(`${kind}/${locale}: mesmas seções que pt, na mesma ordem`, () => {
                expect(doc.sections.map((s) => s.id)).toEqual(
                    base.sections.map((s) => s.id)
                )
            })

            it(`${kind}/${locale}: sem marcador de pendência no texto`, () => {
                const texto = JSON.stringify(doc)
                expect(texto).not.toMatch(/TODO|PENDENTE|XXX|«|»/)
            })

            it(`${kind}/${locale}: sem texto duplamente codificado`, () => {
                const texto = JSON.stringify(doc)
                expect(texto).not.toMatch(/Ã.|â€|Â[\s·©]/)
            })
        }
    }

    it("nenhum documento gera data em tempo de execução", () => {
        const arquivos = readdirSync(DIR).filter(
            (f) => /^(privacy|terms)\./.test(f) && f.endsWith(".ts")
        )
        expect(arquivos.length).toBeGreaterThan(0)

        const infratores = arquivos.filter((f) =>
            readFileSync(join(DIR, f), "utf8").includes("new Date")
        )
        expect(infratores).toEqual([])
    })
})
