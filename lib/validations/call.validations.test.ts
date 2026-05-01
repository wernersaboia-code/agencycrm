import { describe, expect, it } from "vitest"

import { callFilterSchema, createCallSchema } from "./call.validations"

describe("call validations", () => {
    it("coerces dates for create calls", () => {
        const parsed = createCallSchema.parse({
            leadId: "lead-1",
            workspaceId: "workspace-1",
            result: "ANSWERED",
            calledAt: "2026-04-30T12:00:00.000Z",
            followUpAt: "2026-05-01T12:00:00.000Z",
        })

        expect(parsed.calledAt).toBeInstanceOf(Date)
        expect(parsed.followUpAt).toBeInstanceOf(Date)
    })

    it("rejects invalid call results", () => {
        const parsed = createCallSchema.safeParse({
            leadId: "lead-1",
            workspaceId: "workspace-1",
            result: "MAYBE",
        })

        expect(parsed.success).toBe(false)
    })

    it("accepts single and multiple result filters", () => {
        expect(callFilterSchema.safeParse({ result: "ANSWERED" }).success).toBe(true)
        expect(callFilterSchema.safeParse({ result: ["ANSWERED", "CALLBACK"] }).success).toBe(true)
    })
})
