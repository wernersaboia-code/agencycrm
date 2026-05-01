import { describe, expect, it } from "vitest"

import { createLeadSchema, updateLeadSchema } from "./lead.validations"

describe("lead validations", () => {
    it("normalizes optional fields on create", () => {
        const parsed = createLeadSchema.parse({
            workspaceId: "workspace-1",
            firstName: "Ana",
            email: "ana@example.com",
            website: "example.com",
            country: "br",
            lastName: " ",
        })

        expect(parsed.website).toBe("https://example.com")
        expect(parsed.country).toBe("BR")
        expect(parsed.lastName).toBeNull()
        expect(parsed.status).toBe("NEW")
        expect(parsed.source).toBe("MANUAL")
    })

    it("rejects invalid emails", () => {
        const parsed = createLeadSchema.safeParse({
            workspaceId: "workspace-1",
            firstName: "Ana",
            email: "not-an-email",
        })

        expect(parsed.success).toBe(false)
    })

    it("accepts partial updates", () => {
        expect(updateLeadSchema.safeParse({ status: "INTERESTED" }).success).toBe(true)
    })
})
