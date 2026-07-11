import { describe, it, expect } from "vitest"
import { publishedWhere } from "./queries"

describe("publishedWhere", () => {
    it("filtra por PUBLISHED e publishedAt <= now", () => {
        const now = new Date("2026-07-11T12:00:00Z")
        expect(publishedWhere(now)).toEqual({
            status: "PUBLISHED",
            publishedAt: { lte: now },
        })
    })
})
