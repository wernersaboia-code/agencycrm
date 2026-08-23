import type { LegalDocument } from "./types"

const refundEn: LegalDocument = {
    title: "Refund Policy",
    lastUpdated: "2026-08-23",
    sections: [
        {
            id: "escopo",
            heading: "1. What this policy covers",
            blocks: [
                { kind: "paragrafo", texto: "This policy applies to every market entry study sold in the Easy Prospect catalogue." },
            ],
        },
        {
            id: "direito",
            heading: "2. Your right to a refund",
            blocks: [
                { kind: "paragrafo", texto: "You may request a full refund within 14 calendar days of your purchase, for any reason." },
                { kind: "paragrafo", texto: "No justification is required, and the right applies even if you have already downloaded the study." },
            ],
        },
        {
            id: "comoPedir",
            heading: "3. How to request one",
            blocks: [
                { kind: "paragrafo", texto: "Write to contato@easyprospect.com.br from the e-mail address of the account that made the purchase, quoting the order number. There is no form and no additional step." },
            ],
        },
        {
            id: "prazo",
            heading: "4. Timing and method",
            blocks: [
                { kind: "paragrafo", texto: "Refunds are processed within 10 business days of the request and returned through the same payment method used for the purchase." },
                { kind: "paragrafo", texto: "How long the amount takes to appear on your statement depends on your bank or card issuer." },
            ],
        },
        {
            id: "apos",
            heading: "5. After the refund",
            blocks: [
                { kind: "paragrafo", texto: "Once the refund is complete, access to the study ends under My purchases and the file is no longer available for download." },
            ],
        },
    ],
}

export default refundEn
