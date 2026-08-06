import { describe, it, expect, vi } from "vitest"
import { registrarUsuario, type SignUpDeps } from "./sign-up"

const ENTRADA = {
    name: "Heitor",
    email: "heitor@teste.com",
    password: "prospect1",
    locale: "de" as const,
}

function criarDeps(over: Partial<SignUpDeps> = {}): SignUpDeps {
    return {
        criarUsuario: vi.fn().mockResolvedValue({ situacao: "criado", tokenHash: "hash-1" }),
        enviarEmail: vi.fn().mockResolvedValue({ success: true }),
        appUrl: "https://www.easyprospect.com.br",
        ...over,
    }
}

describe("registrarUsuario", () => {
    it("cria o usuario e manda a confirmacao no idioma da tela", async () => {
        const deps = criarDeps()

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "ok" })
        expect(deps.enviarEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "heitor@teste.com",
                subject: "Bestätigen Sie Ihre E-Mail-Adresse — Easy Prospect",
            })
        )
    })

    it("guarda o locale no metadata, que e de onde User.language sai depois", async () => {
        const deps = criarDeps()

        await registrarUsuario(deps, ENTRADA)

        expect(deps.criarUsuario).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "heitor@teste.com",
                metadata: expect.objectContaining({ name: "Heitor", locale: "de", source: "marketplace" }),
            })
        )
    })

    it("monta o link de confirmacao apontando para /auth/confirm", async () => {
        const deps = criarDeps()

        await registrarUsuario(deps, ENTRADA)

        const [{ html }] = (deps.enviarEmail as ReturnType<typeof vi.fn>).mock.calls[0]
        expect(html).toContain("https://www.easyprospect.com.br/auth/confirm?token_hash=hash-1")
        expect(html).toContain("next=%2Fmy-purchases")
    })

    it("e-mail ja cadastrado responde IGUAL ao caso novo", async () => {
        // O ponto central: a resposta nao pode contar quem e cliente.
        const deps = criarDeps({
            criarUsuario: vi.fn().mockResolvedValue({ situacao: "ja_existe" }),
        })

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "ok" })
    })

    it("e-mail ja cadastrado recebe o aviso, nao a confirmacao", async () => {
        const deps = criarDeps({
            criarUsuario: vi.fn().mockResolvedValue({ situacao: "ja_existe" }),
        })

        await registrarUsuario(deps, ENTRADA)

        const [{ subject, html }] = (deps.enviarEmail as ReturnType<typeof vi.fn>).mock.calls[0]
        expect(subject).toBe("Sie haben bereits ein Konto — Easy Prospect")
        expect(html).not.toContain("token_hash")
    })

    it("recusa senha fraca sem chamar o Supabase", async () => {
        const deps = criarDeps()

        const resultado = await registrarUsuario(deps, { ...ENTRADA, password: "12345678" })

        expect(resultado).toEqual({ status: "senha_fraca", problema: "semLetra" })
        expect(deps.criarUsuario).not.toHaveBeenCalled()
        expect(deps.enviarEmail).not.toHaveBeenCalled()
    })

    it("falha na criacao vira erro, sem mandar e-mail", async () => {
        const deps = criarDeps({
            criarUsuario: vi.fn().mockRejectedValue(new Error("supabase fora do ar")),
        })

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "erro" })
        expect(deps.enviarEmail).not.toHaveBeenCalled()
    })

    it("falha no envio vira erro, para a tela nao prometer e-mail que nao saiu", async () => {
        const deps = criarDeps({
            enviarEmail: vi.fn().mockResolvedValue({ success: false }),
        })

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "erro" })
    })

    it("normaliza o e-mail antes de criar", async () => {
        const deps = criarDeps()

        await registrarUsuario(deps, { ...ENTRADA, email: "  Heitor@Teste.com " })

        expect(deps.criarUsuario).toHaveBeenCalledWith(
            expect.objectContaining({ email: "heitor@teste.com" })
        )
    })
})
