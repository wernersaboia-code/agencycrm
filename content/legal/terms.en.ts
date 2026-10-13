import type { LegalDocument } from "./types"

const termsEn: LegalDocument = {
    title: "Terms of Use",
    lastUpdated: "2026-10-13",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Acceptance of the terms",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect is operated by Werner Wild Saboia Carvalho Marinho, an individual. By accessing or using the service, you agree to these terms. If you do not agree, do not use the service." },
            ],
        },
        {
            id: "servico",
            heading: "2. The service",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect sells market entry studies, delivered as PDF files. Once payment is confirmed, the study is available for download under My purchases." },
                { kind: "paragrafo", texto: "Prices are shown in the catalogue in the currency you choose, and payment is collected by the payment provider indicated at checkout." },
                { kind: "paragrafo", texto: "The studies are compiled from public sources and reflect the situation on the review date shown on each study's page. Companies change contacts, structure and strategy: check the information before making business decisions." },
            ],
        },
        {
            id: "conta",
            heading: "3. Registration and account",
            blocks: [
                { kind: "paragrafo", texto: "You are responsible for keeping your credentials confidential. Notify us immediately if you identify unauthorised use of your account." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "4. Acceptable use",
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
            heading: "5. Intellectual property",
            blocks: [
                { kind: "paragrafo", texto: "The studies and lists you purchase are intended for use by your company. Reselling, redistributing or publishing them is not permitted." },
                { kind: "paragrafo", texto: "The data you import or record in the CRM remains your responsibility. We claim no ownership over it, except as needed to operate the service." },
            ],
        },
        {
            id: "pagamentos",
            heading: "6. Payments and refunds",
            blocks: [
                { kind: "paragrafo", texto: "Purchases in the catalogue are processed through a certified payment provider. Refunds are full and unconditional within 14 days of the purchase, under the terms of the Refund Policy." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "7. Limitation of liability",
            blocks: [
                { kind: "paragrafo", texto: "The service is provided as is. We do not guarantee uninterrupted availability or any specific commercial result: the return on an export project depends on factors outside our control." },
                { kind: "paragrafo", texto: "Our liability is limited to the amount you paid for the service in the last 12 months." },
            ],
        },
        {
            id: "rescisao",
            heading: "8. Termination",
            blocks: [
                { kind: "paragrafo", texto: "We may suspend or close accounts that breach these terms. You can ask us to close yours at any time by writing to contato@easyprospect.com.br; for as long as the account exists, access to purchases already made is kept." },
            ],
        },
        {
            id: "alteracoes",
            heading: "9. Changes",
            blocks: [
                { kind: "paragrafo", texto: "These terms may be updated. The date at the top indicates the latest revision, and significant changes are announced in advance. Continued use after a change constitutes acceptance." },
            ],
        },
        {
            id: "idade",
            heading: "10. Minimum age",
            blocks: [
                { kind: "paragrafo", texto: "The service is intended for people over 18 and for professional use." },
            ],
        },
        {
            id: "foroLei",
            heading: "11. Governing law and jurisdiction",
            blocks: [
                { kind: "paragrafo", texto: "These terms are governed by the laws of the Federative Republic of Brazil. The courts of Fortaleza, Ceará, Brazil, have jurisdiction over any dispute relating to them." },
                { kind: "paragrafo", texto: "If you contract as a consumer, this choice does not take away the rights that mandatory consumer protection rules give you, including the right to bring proceedings in the courts where you live." },
            ],
        },
    ],
}

export default termsEn
