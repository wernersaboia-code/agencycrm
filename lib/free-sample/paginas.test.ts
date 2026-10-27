import { describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }))

import { ordenarPaginas } from "./paginas"

describe("ordenarPaginas", () => {
    // O storage lista em ordem alfabética: p10 viria antes de p2 e o folhear
    // da home pularia do índice para o fim do estudo.
    it("ordena pelo número da página, não pelo texto", () => {
        expect(ordenarPaginas(["p10.webp", "p2.webp", "p1.webp"])).toEqual(["p1.webp", "p2.webp", "p10.webp"])
    })

    it("ignora o que não é página", () => {
        expect(ordenarPaginas([".emptyFolderPlaceholder", "p1.webp", "capa.png"])).toEqual(["p1.webp"])
    })
})
