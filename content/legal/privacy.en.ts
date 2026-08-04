import type { LegalDocument } from "./types"

const privacyEn: LegalDocument = {
    title: "Privacy Policy",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "responsavel",
            heading: "1. Who is responsible",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect is operated by Werner Wild Saboia Carvalho Marinho, an individual, who decides on the processing of the data described in this policy." },
                { kind: "paragrafo", texto: "For any matter concerning personal data, including exercising the rights described below, write to contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Data we process",
            blocks: [
                { kind: "paragrafo", texto: "We process the information needed to operate the service:" },
                { kind: "lista", itens: [
                    "Account data: name, email and avatar, provided by you at sign-up and managed by Supabase Auth.",
                    "Purchase data: items bought, amount, currency and download history.",
                    "Payment data: transaction identifiers at Stripe. We neither receive nor store card numbers.",
                    "Site usage data: pages visited and navigation events, only when you accept the measurement cookies.",
                    "Data you enter in the CRM: contacts, companies and activity records that you import or create.",
                    "Third-party professional contact data: the companies and contact people that make up the catalogue lists. See the dedicated section below.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Legal basis for each processing activity",
            blocks: [
                { kind: "lista", itens: [
                    "Creating and maintaining your account, processing the purchase and delivering the study bought: performance of the contract between us.",
                    "Sending messages about your purchase, such as confirmation and download release: performance of the contract.",
                    "Keeping sales records for the periods required: compliance with a legal obligation.",
                    "Measuring site usage: consent, which you can refuse or withdraw at any time through the cookie banner.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. How we use the data",
            blocks: [
                { kind: "lista", itens: [
                    "Operating the catalogue, the checkout and the delivery of the studies bought.",
                    "Giving permanent access to your purchases in the My purchases area.",
                    "Sending transactional notifications related to your account and your purchases.",
                    "Operating the CRM for the data you enter or import yourself.",
                ] },
                { kind: "paragrafo", texto: "We do not sell users' personal data and we do not use your account data to train models." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Who we share data with",
            blocks: [
                { kind: "paragrafo", texto: "We use service providers for specific operations, each with access only to what is necessary:" },
                { kind: "lista", itens: [
                    "Supabase — database, authentication and file storage.",
                    "Stripe — payment processing.",
                    "Vercel — application hosting and performance measurement.",
                    "Zoho — mailbox for the contact address.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. International transfers",
            blocks: [
                { kind: "paragrafo", texto: "The database is hosted in Brazil. The other providers listed above run infrastructure in several countries, including the United States and the European Union." },
                { kind: "paragrafo", texto: "If you are in the European Union, this means your data may be processed outside the European Economic Area. As of this date, Brazil is not covered by an adequacy decision of the European Commission." },
            ],
        },
        {
            id: "listas",
            heading: "7. Contact data in the catalogue lists",
            blocks: [
                { kind: "paragrafo", texto: "The lists sold in the catalogue bring together professional contact data of companies: company name, country, sector, website, institutional emails and phone numbers. Some lists also include the name and job title of a contact person." },
                { kind: "paragrafo", texto: "This data is obtained from public sources — company websites, business registers and other publicly accessible information — and is not collected from the person themselves." },
                { kind: "paragrafo", texto: "If you have found data about yourself in one of our lists and want to access it, correct it, object to the processing or request its removal, write to contato@easyprospect.com.br. Requests of this kind are acted on." },
            ],
        },
        {
            id: "direitos",
            heading: "8. Your rights",
            blocks: [
                { kind: "paragrafo", texto: "You can request at any time:" },
                { kind: "lista", itens: [
                    "Access to the data we process about you.",
                    "Rectification of incomplete or outdated data.",
                    "Erasure of your data, subject to legal retention obligations.",
                    "Portability of the data you provided to us.",
                    "Objection to a processing activity and withdrawal of consent, where consent is the basis.",
                ] },
                { kind: "paragrafo", texto: "Just write to contato@easyprospect.com.br. You also have the right to lodge a complaint with a data protection authority — the ANPD, in Brazil, or the supervisory authority of your country, in the European Union." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookies and measurement",
            blocks: [
                { kind: "paragrafo", texto: "We use essential cookies for authentication and to remember your preferences, such as language. They are needed for the site to work and do not depend on consent." },
                { kind: "paragrafo", texto: "Usage measurement cookies are only loaded after you accept them in the banner shown on your first visit. Refusing does not limit any functionality." },
            ],
        },
        {
            id: "retencao",
            heading: "10. How long we keep the data",
            blocks: [
                { kind: "paragrafo", texto: "We keep your account data for as long as the account exists. After the account is deleted, personal data is removed or anonymised within 90 days." },
                { kind: "paragrafo", texto: "Purchase records are kept for the periods required by tax law, even after the account is deleted." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Changes and contact",
            blocks: [
                { kind: "paragrafo", texto: "This policy may be updated. The date at the top indicates the latest revision, and material changes are announced on the site." },
                { kind: "paragrafo", texto: "Questions about this policy: contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyEn
