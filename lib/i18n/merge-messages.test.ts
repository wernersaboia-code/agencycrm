import { describe, it, expect } from "vitest"
import { mergeMessages } from "./merge-messages"

describe("mergeMessages", () => {
    it("mantém a tradução quando a chave existe nos dois lados", () => {
        expect(mergeMessages({ save: "Salvar" }, { save: "Speichern" })).toEqual({
            save: "Speichern",
        })
    })

    it("completa com o fallback a chave que falta na tradução", () => {
        expect(mergeMessages({ save: "Salvar", cancel: "Cancelar" }, { save: "Speichern" })).toEqual(
            { save: "Speichern", cancel: "Cancelar" }
        )
    })

    it("desce em objetos aninhados em vez de substituir o galho inteiro", () => {
        const merged = mergeMessages(
            { admin: { common: { save: "Salvar", back: "Voltar" } } },
            { admin: { common: { save: "Speichern" } } }
        )

        expect(merged).toEqual({ admin: { common: { save: "Speichern", back: "Voltar" } } })
    })

    it("traz o namespace inteiro quando a tradução não tem nenhuma chave dele", () => {
        const merged = mergeMessages({ admin: { title: "Painel" }, nav: { home: "Início" } }, { nav: { home: "Start" } })

        expect(merged).toEqual({ admin: { title: "Painel" }, nav: { home: "Start" } })
    })

    it("não altera os objetos recebidos", () => {
        const fallback = { admin: { save: "Salvar" } }
        const messages = { admin: { save: "Speichern" } }

        mergeMessages(fallback, messages)

        expect(fallback).toEqual({ admin: { save: "Salvar" } })
        expect(messages).toEqual({ admin: { save: "Speichern" } })
    })
})
