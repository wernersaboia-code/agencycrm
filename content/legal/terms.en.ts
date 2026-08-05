import type { LegalDocument } from "./types"

const termsEn: LegalDocument = {
    title: "Terms of Use",
    lastUpdated: "2026-08-05",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Acceptance of the terms",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect is operated by Werner Wild Saboia Carvalho Marinho, an individual. By accessing or using the service, you agree to these terms. If you do not agree, do not use the service." },
            ],
        },
        {
            id: "conta",
            heading: "2. Registration and account",
            blocks: [
                { kind: "paragrafo", texto: "You are responsible for keeping your credentials confidential. Notify us immediately if you identify unauthorised use of your account." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Acceptable use",
            blocks: [
                { kind: "paragrafo", texto: "You agree not to use the service to:" },
                { kind: "lista", itens: [
                    "Send spam, phishing or malicious content.",
                    "Process contact data without an adequate legal basis.",
                    "Attempt to access other users' data or workspaces.",
                    "Reverse engineer the service or exploit vulnerabilities.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "4. Intellectual property",
            blocks: [
                { kind: "paragrafo", texto: "The studies and lists you purchase are intended for use by your company. Reselling, redistributing or publishing them is not permitted." },
                { kind: "paragrafo", texto: "The data you import or record in the CRM remains your responsibility. We claim no ownership over it, except as needed to operate the service." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Payments and refunds",
            blocks: [
                { kind: "paragrafo", texto: "Purchases in Brazilian reais are processed by Mercado Pago. Purchases in euros or US dollars are processed by Paddle, which acts as Merchant of Record for the transaction and is responsible for collecting applicable taxes, including EU VAT. In those cases the charge appears on your statement under Paddle's name." },
                { kind: "paragrafo", texto: "Refunds may be requested within 14 days of purchase, provided the file has not been downloaded. Write to contato@easyprospect.com.br. Purchases processed by Paddle are refunded by Paddle, following our authorisation." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Limitation of liability",
            blocks: [
                { kind: "paragrafo", texto: "The service is provided as is. We do not guarantee uninterrupted availability or any specific commercial result: the return on an export project depends on factors outside our control." },
                { kind: "paragrafo", texto: "Our liability is limited to the amount you paid for the service in the last 12 months." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Termination",
            blocks: [
                { kind: "paragrafo", texto: "We may suspend or close accounts that breach these terms. You can close yours at any time through the account settings; access to purchases already made is kept for as long as the account exists." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Changes",
            blocks: [
                { kind: "paragrafo", texto: "These terms may be updated. The date at the top indicates the latest revision, and significant changes are announced in advance. Continued use after a change constitutes acceptance." },
            ],
        },
        {
            id: "idade",
            heading: "9. Minimum age",
            blocks: [
                { kind: "paragrafo", texto: "The service is intended for people over 18 and for professional use." },
            ],
        },
    ],
}

export default termsEn
