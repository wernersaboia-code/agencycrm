import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { AbstractIntlMessages } from "next-intl"
import ptJson from "@/messages/pt.json"
import { semTextosDoAdmin } from "./sem-textos-do-admin"

const pt = ptJson as unknown as AbstractIntlMessages

describe("semTextosDoAdmin", () => {
    it("tira o bloco admin e mantém o resto intacto", () => {
        const filtradas = semTextosDoAdmin(pt)
        expect(filtradas).not.toHaveProperty("admin")
        expect(filtradas.catalog).toBe(pt.catalog)
        expect(Object.keys(filtradas)).toHaveLength(Object.keys(pt).length - 1)
    })

    it("não altera o objeto original (o super-admin usa as mensagens completas)", () => {
        semTextosDoAdmin(pt)
        expect(pt).toHaveProperty("admin")
    })
})

/**
 * O filtro só protege se nada fora do painel depender de `admin.*` no cliente:
 * um componente do site com `useTranslations("admin…")` quebraria em tela.
 */
describe("componentes fora do painel", () => {
    const RAIZ = join(__dirname, "..", "..")
    const PAINEL = /[\\/](super-admin|admin)[\\/]/

    function arquivos(pasta: string): string[] {
        return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
            const caminho = join(pasta, entrada.name)
            if (entrada.isDirectory()) return entrada.name === "node_modules" ? [] : arquivos(caminho)
            return /\.tsx$/.test(entrada.name) ? [caminho] : []
        })
    }

    it("não leem textos do admin no cliente", () => {
        const usos = [...arquivos(join(RAIZ, "components")), ...arquivos(join(RAIZ, "app"))]
            .filter((arquivo) => !PAINEL.test(arquivo))
            .filter((arquivo) => {
                const codigo = readFileSync(arquivo, "utf8")
                return codigo.includes('"use client"') && /useTranslations\(\s*["']admin/.test(codigo)
            })
        expect(usos).toEqual([])
    })
})
