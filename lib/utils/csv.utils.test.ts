import { describe, expect, it } from "vitest"

import { buildCsv, escapeCsvValue, sanitizeCsvFilenameSegment } from "./csv.utils"

describe("csv utils", () => {
    it("escapes commas, quotes, and newlines", () => {
        expect(escapeCsvValue('ACME, "Global"\nNorth')).toBe('"ACME, ""Global""\nNorth"')
    })

    it.each(["=SUM(A1:A2)", "+cmd", "-10", "@user", "\tSUM(A1:A2)", "\rSUM(A1:A2)"])(
        "prefixes spreadsheet formulas for %s",
        (value) => {
            expect(escapeCsvValue(value)).toBe(`'${value}`)
        }
    )

    it("builds a CSV document from headers and rows", () => {
        const csv = buildCsv(["Name", "Email"], [["ACME", "sales@example.com"]])

        expect(csv).toBe("Name,Email\nACME,sales@example.com")
    })

    it("sanitizes filename segments", () => {
        expect(sanitizeCsvFilenameSegment("Ligações / São Paulo 2026.csv")).toBe("ligacoes-sao-paulo-2026-csv")
        expect(sanitizeCsvFilenameSegment("!!!")).toBe("export")
    })
})
