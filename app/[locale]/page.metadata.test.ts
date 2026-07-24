import { describe, it, expect, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => (key: string) =>
        key === "title" ? "Título de teste" : "Descrição de teste",
}))

import { generateMetadata } from "./page"

describe("metadata da home", () => {
    it("mantém a imagem de Open Graph ao sobrescrever openGraph", async () => {
        const meta = await generateMetadata({ params: Promise.resolve({ locale: "pt" }) })

        // O merge do Next é raso: declarar `openGraph` na página apaga o
        // `images` do layout raiz. A página precisa reafirmar a imagem.
        expect(meta.openGraph).toBeDefined()
        expect(meta.openGraph?.images).toBeTruthy()
    })

    it("mantém título, descrição e locale de Open Graph", async () => {
        const meta = await generateMetadata({ params: Promise.resolve({ locale: "pt" }) })

        expect(meta.openGraph?.title).toBe("Título de teste")
        expect(meta.openGraph?.description).toBe("Descrição de teste")
        expect(meta.openGraph?.locale).toBe("pt_BR")
    })
})
