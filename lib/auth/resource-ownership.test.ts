import { describe, it, expect } from "vitest"
import { buildOwnedWhere } from "./resource-ownership"

describe("buildOwnedWhere", () => {
    it("exige workspace do dono", () => {
        expect(buildOwnedWhere("user-1")).toEqual({
            workspace: { userId: "user-1" },
        })
    })

    it("mescla filtros extras sem sobrescrever o dono", () => {
        expect(buildOwnedWhere("user-1", { status: "ACTIVE" })).toEqual({
            status: "ACTIVE",
            workspace: { userId: "user-1" },
        })
    })
})
