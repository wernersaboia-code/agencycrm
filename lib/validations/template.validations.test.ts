import { describe, expect, it } from "vitest"

import { createTemplateSchema, updateTemplateSchema } from "./template.validations"

describe("template validations", () => {
    it("accepts a valid template", () => {
        const parsed = createTemplateSchema.safeParse({
            workspaceId: "workspace-1",
            name: "Prospecting",
            category: "PROSPECTING",
            subject: "Hello",
            body: "<p>Hello there</p>",
            isActive: true,
        })

        expect(parsed.success).toBe(true)
    })

    it("rejects empty body on create", () => {
        const parsed = createTemplateSchema.safeParse({
            workspaceId: "workspace-1",
            name: "Prospecting",
            category: "PROSPECTING",
            subject: "Hello",
            body: "",
        })

        expect(parsed.success).toBe(false)
    })

    it("accepts partial updates", () => {
        expect(updateTemplateSchema.safeParse({ isActive: false }).success).toBe(true)
    })
})
