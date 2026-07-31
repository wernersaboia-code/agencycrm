import type { AboutDocument } from "./types"

// Transcrição literal de "Why EasyProspect.docx".
// Não reescrever: o sócio pediu o texto dele palavra por palavra. Mudança aqui
// só a partir de uma versão nova do documento.
//
// Exceção registrada: os dois últimos parágrafos de "Origin of Our Data" não estão
// no documento deste idioma — são a tradução do trecho sobre disparo em massa
// que só o documento alemão traz, incluído nos 7 a pedido do Werner.
const aboutEn: AboutDocument = {
    eyebrow: "Why EasyProspect?",
    title: "Your Partner for Successful International Market Entry",
    intro: [
        { kind: "paragrafo", texto: "New export markets offer enormous growth opportunities. At the same time, searching for suitable importers, distributors, and reliable market information often takes weeks or even months." },
        { kind: "paragrafo", texto: "EasyProspect was developed to make this process significantly easier." },
        { kind: "paragrafo", texto: "We support manufacturers, brand companies, and exporters in opening up new sales markets more quickly – with professional market entry studies and carefully researched importer and distributor directories." },
        { kind: "paragrafo", texto: "Our studies combine many years of experience in international sales with a modern research methodology. Both AI-supported analysis methods and a final manual quality check are used." },
        { kind: "paragrafo", texto: "The result is structured, practical information that helps you make informed decisions and identify the right distribution partners for your products." },
    ],
    sections: [
        {
            id: "metodologia",
            heading: "Our Methodology",
            sub: "Careful Research Instead of Confusing Address Lists",
            blocks: [
                { kind: "paragrafo", texto: "At EasyProspect, the focus is not on the quantity of data, but on its practical relevance." },
                { kind: "paragrafo", texto: "For each market entry study, numerous publicly accessible information sources are systematically evaluated. Modern AI technologies support the research, analysis, and structuring of large volumes of data. All results are then reviewed by us and assessed for their plausibility and usefulness for export." },
                { kind: "paragrafo", texto: "Our goal is not to list as many companies as possible, but to identify those that could actually be of interest for your export project." },
            ],
        },
        {
            id: "fontes",
            heading: "Origin of Our Data",
            blocks: [
                { kind: "paragrafo", texto: "All information comes exclusively from publicly accessible sources." },
                { kind: "paragrafo", texto: "These include, among others:" },
                { kind: "lista", itens: [
                    "Company websites",
                    "Chambers of commerce",
                    "Industry associations",
                    "Trade fair catalogues",
                    "Company directories",
                    "Specialist portals",
                    "Other freely accessible business information",
                ] },
                { kind: "paragrafo", texto: "Before publication, the data is checked for plausibility, completeness, and practical usability." },
                { kind: "paragrafo", texto: "As contact persons and company structures can change regularly, our studies are updated at regular intervals." },
                { kind: "paragrafo", texto: "Our importer directories are expressly not intended for impersonal mass mailings." },
                { kind: "paragrafo", texto: "They serve instead as a well-founded basis for a carefully prepared, individual approach to potential business partners — because in international business, successful business relationships arise above all from trust and personal contact." },
            ],
        },
        {
            id: "verificacao",
            heading: "Company Review",
            blocks: [
                { kind: "paragrafo", texto: "Every company is reviewed on the basis of publicly available information before being included in one of our directories." },
                { kind: "paragrafo", texto: "In particular, we check" },
                { kind: "lista", itens: [
                    "whether the company operates in the relevant industry,",
                    "whether import or distribution activities are identifiable,",
                    "whether a professional company presence exists,",
                    "whether current contact details are available,",
                    "and whether the company could generally be considered as a potential distribution partner.",
                ] },
                { kind: "paragrafo", texto: "This review does not replace individual sales qualification, but it increases the likelihood that the listed companies are relevant to your export project." },
            ],
        },
        {
            id: "atualizacao",
            heading: "Regular Updates",
            blocks: [
                { kind: "paragrafo", texto: "International markets are constantly changing." },
                { kind: "paragrafo", texto: "That is why we regularly review and update our market entry studies and company directories so that you have access to the most current and practically relevant information possible." },
            ],
        },
        {
            id: "entrega",
            heading: "What You Receive",
            blocks: [
                { kind: "paragrafo", texto: "Every market entry study provides you with significantly more than a classic address list." },
                { kind: "paragrafo", texto: "You receive a compact and practice-oriented basis for decision-making for your market entry." },
                { kind: "paragrafo", texto: "Depending on the industry, a study includes, among other things:" },
                { kind: "lista", itens: [
                    "Overview of the target market",
                    "Analysis of the industry situation",
                    "Market potential and current trends",
                    "Market access requirements",
                    "Sales and distribution structures",
                    "Directory of relevant importers and distributors",
                    "Tips for successfully approaching potential business partners",
                    "Recommendations for preparing your market entry",
                ] },
                { kind: "paragrafo", texto: "Our goal is to take a large part of the time-consuming research off your hands so that you can concentrate on building new business relationships." },
            ],
        },
        {
            id: "limites",
            heading: "What We Cannot Promise",
            blocks: [
                { kind: "paragrafo", texto: "The success of an export project depends on many factors." },
                { kind: "paragrafo", texto: "Therefore, we cannot guarantee that every company will respond to a contact approach or that a business relationship will immediately result." },
                { kind: "paragrafo", texto: "Decisive factors include, among others:" },
                { kind: "lista", itens: [
                    "the competitiveness of your product,",
                    "demand in the target market,",
                    "your pricing,",
                    "your delivery capability,",
                    "your marketing and sales strategy,",
                    "the timing of the contact approach,",
                    "as well as the individual purchasing decisions of the respective importers.",
                ] },
                { kind: "paragrafo", texto: "What we can offer you, however, is a solid foundation for your export planning and a significant time saving in identifying suitable distribution partners." },
            ],
        },
        {
            id: "confianca",
            heading: "Why Companies Trust EasyProspect",
            blocks: [
                { kind: "cartoes", cartoes: [
                    { titulo: "Practice-Oriented", texto: "Our studies are created specifically for manufacturers, exporters, and international sales managers." },
                    { titulo: "More Than Just Address Lists", texto: "You receive structured market information, concrete recommendations for action, and carefully researched importer and distributor directories." },
                    { titulo: "Carefully Researched", texto: "Our research is based on a systematic methodology and is subjected to a manual quality check before publication." },
                    { titulo: "Save Time", texto: "Instead of spending weeks researching suitable companies, you can immediately start approaching potential distribution partners." },
                    { titulo: "Regularly Updated", texto: "Our studies are continuously reviewed and revised or supplemented as needed." },
                    { titulo: "Developed for Your Export Success", texto: "Our goal is not to sell as much data as possible, but to provide a solid working basis with which you can open up new markets efficiently and professionally." },
                ] },
            ],
        },
        {
            id: "cta",
            heading: "Have You Already Found the Right Target Market?",
            blocks: [
                { kind: "paragrafo", texto: "Discover our market entry studies and importer directories for numerous countries and industries." },
                { kind: "paragrafo", texto: "With EasyProspect, you receive solid market information and carefully researched potential distribution partners – so that you can make the right decisions more quickly and successfully open up new export markets." },
                { kind: "paragrafo", texto: "Select the right market entry study now." },
            ],
        },
    ],
}

export default aboutEn
