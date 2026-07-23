import { describe, it, expect } from "vitest"
import { buildAuditData } from "./audit"

describe("buildAuditData", () => {
    it("monta o registro a partir do input completo", () => {
        const data = buildAuditData({
            actorId: "admin-1",
            actorEmail: "admin@x.com",
            action: "user.role_changed",
            targetType: "user",
            targetId: "user-9",
            metadata: { from: "USER", to: "ADMIN" },
            ip: "1.2.3.4",
        })

        expect(data).toEqual({
            actorId: "admin-1",
            actorEmail: "admin@x.com",
            action: "user.role_changed",
            targetType: "user",
            targetId: "user-9",
            metadata: { from: "USER", to: "ADMIN" },
            ip: "1.2.3.4",
        })
    })

    it("normaliza metadata e ip ausentes para null", () => {
        const data = buildAuditData({
            actorId: "admin-1",
            actorEmail: "admin@x.com",
            action: "workspace.deleted",
            targetType: "workspace",
            targetId: "ws-3",
        })

        expect(data.metadata).toBeNull()
        expect(data.ip).toBeNull()
    })
})
