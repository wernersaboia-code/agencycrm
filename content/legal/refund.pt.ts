import type { LegalDocument } from "./types"

const refundPt: LegalDocument = {
    title: "Política de Reembolso",
    lastUpdated: "2026-08-23",
    sections: [
        {
            id: "escopo",
            heading: "1. O que esta política cobre",
            blocks: [
                { kind: "paragrafo", texto: "Esta política vale para todos os estudos de entrada em mercado vendidos no catálogo do Easy Prospect." },
            ],
        },
        {
            id: "direito",
            heading: "2. Direito ao reembolso",
            blocks: [
                { kind: "paragrafo", texto: "Você pode solicitar o reembolso integral em até 14 dias corridos após a compra, por qualquer motivo." },
                { kind: "paragrafo", texto: "Não é preciso justificar o pedido, e o direito vale mesmo que você já tenha baixado o estudo." },
            ],
        },
        {
            id: "comoPedir",
            heading: "3. Como solicitar",
            blocks: [
                { kind: "paragrafo", texto: "Escreva para contato@easyprospect.com.br a partir do e-mail da conta que fez a compra, informando o número do pedido. Não há formulário nem etapa adicional." },
            ],
        },
        {
            id: "prazo",
            heading: "4. Prazo e forma de devolução",
            blocks: [
                { kind: "paragrafo", texto: "O reembolso é processado em até 10 dias úteis após o pedido e devolvido pelo mesmo meio de pagamento usado na compra." },
                { kind: "paragrafo", texto: "O tempo até o valor aparecer no seu extrato depende do seu banco ou da operadora do cartão." },
            ],
        },
        {
            id: "apos",
            heading: "5. Depois do reembolso",
            blocks: [
                { kind: "paragrafo", texto: "Concluído o reembolso, o acesso ao estudo é encerrado na área Minhas compras e o arquivo deixa de ficar disponível para download." },
            ],
        },
    ],
}

export default refundPt
