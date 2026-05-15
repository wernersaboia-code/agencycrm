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
            "<a>Click</a>"
        )
    })

    it("removes encoded javascript URLs", () => {
        expect(sanitizeHtmlForPreview('<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(1)">Click</a>')).toBe(
            "<a>Click</a>"
        )
    })

    it("removes uppercase SCRIPT tags", () => {
        expect(sanitizeHtmlForPreview("<p>Test</p><SCRIPT>alert(1)</SCRIPT>")).toBe(
            "<p>Test</p>"
        )
    })

    it("removes iframe and embed tags", () => {
        expect(sanitizeHtmlForPreview('<iframe src="https://evil.com"></iframe>')).toBe("")
        expect(sanitizeHtmlForPreview('<embed src="https://evil.com/swf">')).toBe("")
    })

    it("preserves safe HTML structure", () => {
        const input = '<div style="color: red"><p><strong>Bold</strong> and <em>italic</em></p><a href="https://example.com" target="_blank">Link</a></div>'
        expect(sanitizeHtmlForPreview(input)).toBe(input)
    })

    it("handles empty input", () => {
        expect(sanitizeHtmlForPreview("")).toBe("")
    })
})
