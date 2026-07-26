import { describe, expect, it } from "vitest"

import { createCampaignSchema, updateCampaignSchema } from "./campaign.validations"

// Fixture mínimo válido para createCampaignSchema no modo "single" (evita
// disparar o refine existente de type/templateId/steps por motivo errado).
function baseCreateData(overrides: Record<string, unknown> = {}) {
    return {
        name: "Campanha",
        workspaceId: "workspace-1",
        selectedLeadIds: ["lead-1"],
        type: "single" as const,
        templateId: "template-1",
        ...overrides,
    }
}

describe("campaign validations - janela de envio", () => {
    describe("createCampaignSchema", () => {
        it("recusa par invertido (start > end)", () => {
            const parsed = createCampaignSchema.safeParse(
                baseCreateData({ sendStartHour: 17, sendEndHour: 9 })
            )

            expect(parsed.success).toBe(false)
            if (!parsed.success) {
                expect(parsed.error.issues[0].message).toBe(
                    "O fim da janela precisa ser depois do início"
                )
            }
        })

        it("recusa par igual (janela vazia)", () => {
            const parsed = createCampaignSchema.safeParse(
                baseCreateData({ sendStartHour: 9, sendEndHour: 9 })
            )

            expect(parsed.success).toBe(false)
        })

        it("aceita par válido", () => {
            const parsed = createCampaignSchema.safeParse(
                baseCreateData({ sendStartHour: 9, sendEndHour: 17 })
            )

            expect(parsed.success).toBe(true)
        })

        it("aceita ausência dos dois campos (herda do workspace)", () => {
            const parsed = createCampaignSchema.safeParse(baseCreateData())

            expect(parsed.success).toBe(true)
        })

        it("aceita apenas um dos campos presente", () => {
            expect(
                createCampaignSchema.safeParse(
                    baseCreateData({ sendStartHour: 9 })
                ).success
            ).toBe(true)

            expect(
                createCampaignSchema.safeParse(
                    baseCreateData({ sendEndHour: 17 })
                ).success
            ).toBe(true)
        })
    })

    describe("updateCampaignSchema", () => {
        it("recusa par invertido (start > end)", () => {
            const parsed = updateCampaignSchema.safeParse({
                sendStartHour: 17,
                sendEndHour: 9,
            })

            expect(parsed.success).toBe(false)
            if (!parsed.success) {
                expect(parsed.error.issues[0].message).toBe(
                    "O fim da janela precisa ser depois do início"
                )
            }
        })

        it("recusa par igual (janela vazia)", () => {
            const parsed = updateCampaignSchema.safeParse({
                sendStartHour: 9,
                sendEndHour: 9,
            })

            expect(parsed.success).toBe(false)
        })

        it("aceita par válido", () => {
            const parsed = updateCampaignSchema.safeParse({
                sendStartHour: 9,
                sendEndHour: 17,
            })

            expect(parsed.success).toBe(true)
        })

        it("aceita ausência dos dois campos (herda do workspace)", () => {
            const parsed = updateCampaignSchema.safeParse({
                name: "Campanha atualizada",
            })

            expect(parsed.success).toBe(true)
        })

        it("aceita apenas um dos campos presente", () => {
            expect(
                updateCampaignSchema.safeParse({ sendStartHour: 9 }).success
            ).toBe(true)

            expect(
                updateCampaignSchema.safeParse({ sendEndHour: 17 }).success
            ).toBe(true)
        })
    })
})
