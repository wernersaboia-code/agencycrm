import { describe, it, expect } from "vitest"
import { generatePurchaseConfirmationEmail } from "./purchase-confirmation"

const DADOS = {
    userName: "Heitor",
    purchaseId: "cmsgu5l1d0001l704ekvxhxe1",
    purchaseDate: new Date("2026-08-06T09:30:00Z"),
    total: 5,
    currency: "EUR",
    items: [{ name: "Estudo de mercado — Alemanha", price: 5 }],
    accessUrl: "https://www.easyprospect.com.br/my-purchases?token=abc",
}

describe("generatePurchaseConfirmationEmail", () => {
    it("sai em portugues quando o locale e pt", async () => {
        const { subject, html } = await generatePurchaseConfirmationEmail(DADOS, "pt")

        expect(subject).toContain("Sua compra foi confirmada")
        expect(html).toContain("Compra confirmada")
        expect(html).toContain("Olá Heitor")
    })

    it("sai em alemao quando o locale e de", async () => {
        // O caso que motivou o trabalho: comprador alemao, e-mail em alemao.
        const { subject, html } = await generatePurchaseConfirmationEmail(DADOS, "de")

        expect(subject).toContain("Ihr Kauf ist bestätigt")
        expect(html).toContain("Kauf bestätigt")
        expect(html).toContain("Hallo Heitor")
        expect(html).not.toContain("Compra confirmada")
    })

    it("formata o valor no padrao do locale", async () => {
        const alemao = await generatePurchaseConfirmationEmail(DADOS, "de")
        const portugues = await generatePurchaseConfirmationEmail(DADOS, "pt")

        // Alemao usa virgula decimal e o simbolo depois do numero.
        expect(alemao.html).toContain("5,00")
        expect(portugues.html).toContain("5,00")
        expect(alemao.html).not.toEqual(portugues.html)
    })

    it("formata a data no padrao do locale", async () => {
        const { html } = await generatePurchaseConfirmationEmail(DADOS, "en")

        // en-US escreve mes/dia; pt-BR escreveria 06/08.
        expect(html).toContain("08/06/2026")
    })

    it("mostra o numero curto do pedido no assunto", async () => {
        const { subject } = await generatePurchaseConfirmationEmail(DADOS, "pt")

        expect(subject).toContain("cmsgu5l1")
        expect(subject).not.toContain("l704ekvxhxe1")
    })

    it("leva o link de acesso e os itens", async () => {
        const { html } = await generatePurchaseConfirmationEmail(DADOS, "pt")

        expect(html).toContain(DADOS.accessUrl)
        expect(html).toContain("Estudo de mercado — Alemanha")
    })

    it("nao deixa placeholder cru no HTML", async () => {
        const { subject, html } = await generatePurchaseConfirmationEmail(DADOS, "it")

        expect(subject).not.toMatch(/\{\w+\}/)
        expect(html).not.toMatch(/\{\w+\}/)
    })

    it("escapa nome e item no HTML, porque quem preenche o nome no cadastro pode nao ser o destinatario", async () => {
        // A Purchase carrega o nome de quem se cadastrou, nao necessariamente
        // de quem esta lendo o e-mail nesta caixa de entrada. Sem escape, um
        // <a href=...> no nome ou no item sairia clicavel, com a marca e o
        // SMTP do Easy Prospect por tras.
        const dadosComHtml = {
            ...DADOS,
            userName: '<a href="https://evil.example">clique</a>',
            items: [{ name: '<img src=x onerror=alert(1)>', price: 5 }],
        }
        const { html } = await generatePurchaseConfirmationEmail(dadosComHtml, "pt")

        expect(html).not.toContain('<a href="https://evil.example">')
        expect(html).not.toContain("<img src=x onerror=alert(1)>")
        expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;")
    })
})
