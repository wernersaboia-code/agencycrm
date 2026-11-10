import { describe, it, expect } from "vitest"
import { escolherRelacionados, publishedWhere } from "./queries"

describe("escolherRelacionados", () => {
    const posts = [
        { id: "a", categoryId: "x" },
        { id: "b", categoryId: "y" },
        { id: "c", categoryId: null },
        { id: "d", categoryId: "y" },
    ]

    it("põe a mesma categoria na frente e completa com os demais, na ordem recebida", () => {
        expect(escolherRelacionados(posts, "y", 3).map((p) => p.id)).toEqual(["b", "d", "a"])
    })

    it("post sem categoria mantém a ordem recebida, sem agrupar os outros sem categoria", () => {
        expect(escolherRelacionados(posts, null, 4).map((p) => p.id)).toEqual(["a", "b", "c", "d"])
    })
})

describe("publishedWhere", () => {
    it("filtra por PUBLISHED e publishedAt <= now", () => {
        const now = new Date("2026-07-11T12:00:00Z")
        expect(publishedWhere(now)).toEqual({
            status: "PUBLISHED",
            publishedAt: { lte: now },
        })
    })
})
