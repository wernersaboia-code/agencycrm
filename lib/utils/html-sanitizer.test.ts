import { describe, expect, it } from "vitest"

import { sanitizeHtmlForPreview } from "./html-sanitizer"

describe("html sanitizer", () => {
    it("removes blocked script-like tags", () => {
        expect(sanitizeHtmlForPreview('<p>Hello</p><script>alert("x")</script>')).toBe(
            "<p>Hello</p>"
        )
    })

    it("removes event handlers", () => {
        expect(sanitizeHtmlForPreview('<img src="/logo.png" onerror="alert(1)">')).toBe(
            '<img src="/logo.png">'
        )
    })

    it("removes dangerous URL attributes", () => {
        expect(sanitizeHtmlForPreview('<a href="javascript:alert(1)">Click</a>')).toBe(
            '<a>Click</a>'
        )
    })
})
