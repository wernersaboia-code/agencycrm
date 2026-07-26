import { describe, it, expect } from "vitest"
import {
    normalizeMessageId,
    parseHeaderBlock,
    extractReferencedMessageIds,
} from "./reply-detection"

describe("normalizeMessageId", () => {
    it("remove colchetes angulares, espaços e baixa a caixa", () => {
        expect(normalizeMessageId("  <ABC123@Mail.Exemplo.COM>  ")).toBe(
            "abc123@mail.exemplo.com"
        )
    })

    it("aceita id já sem colchetes", () => {
        expect(normalizeMessageId("abc@x.com")).toBe("abc@x.com")
    })
})

describe("parseHeaderBlock", () => {
    it("separa nome e valor, em minúsculas na chave", () => {
        const raw = "In-Reply-To: <a@x.com>\r\nSubject: Re: proposta\r\n"
        expect(parseHeaderBlock(raw)).toEqual({
            "in-reply-to": "<a@x.com>",
            subject: "Re: proposta",
        })
    })

    it("junta linhas dobradas (folding) do RFC 5322", () => {
        const raw = "References: <a@x.com>\r\n <b@x.com>\r\n\t<c@x.com>\r\n"
        expect(parseHeaderBlock(raw)).toEqual({
            references: "<a@x.com> <b@x.com> <c@x.com>",
        })
    })

    it("devolve objeto vazio para entrada vazia", () => {
        expect(parseHeaderBlock("")).toEqual({})
    })
})

describe("extractReferencedMessageIds", () => {
    it("junta In-Reply-To e References sem repetir", () => {
        expect(
            extractReferencedMessageIds({
                inReplyTo: "<A@x.com>",
                references: "<a@x.com> <b@x.com>",
            })
        ).toEqual(["a@x.com", "b@x.com"])
    })

    it("lida com campos ausentes", () => {
        expect(extractReferencedMessageIds({})).toEqual([])
        expect(
            extractReferencedMessageIds({ inReplyTo: null, references: null })
        ).toEqual([])
    })

    it("ignora fragmentos sem arroba", () => {
        expect(
            extractReferencedMessageIds({ references: "<lixo> <ok@x.com>" })
        ).toEqual(["ok@x.com"])
    })
})