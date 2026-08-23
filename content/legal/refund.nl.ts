import type { LegalDocument } from "./types"

const refundNl: LegalDocument = {
    title: "Restitutiebeleid",
    lastUpdated: "2026-08-23",
    sections: [
        {
            id: "escopo",
            heading: "1. Wat dit beleid dekt",
            blocks: [
                { kind: "paragrafo", texto: "Dit beleid geldt voor alle markttoetredingsstudies die in de catalogus van Easy Prospect worden verkocht." },
            ],
        },
        {
            id: "direito",
            heading: "2. Uw recht op terugbetaling",
            blocks: [
                { kind: "paragrafo", texto: "U kunt binnen 14 kalenderdagen na uw aankoop om welke reden dan ook volledige terugbetaling aanvragen." },
                { kind: "paragrafo", texto: "Een motivering is niet nodig, en het recht geldt ook als u de studie al hebt gedownload." },
            ],
        },
        {
            id: "comoPedir",
            heading: "3. Hoe u een verzoek indient",
            blocks: [
                { kind: "paragrafo", texto: "Schrijf naar contato@easyprospect.com.br vanaf het e-mailadres van het account waarmee de aankoop is gedaan, met vermelding van het bestelnummer. Er is geen formulier en geen extra stap." },
            ],
        },
        {
            id: "prazo",
            heading: "4. Termijn en wijze van terugbetaling",
            blocks: [
                { kind: "paragrafo", texto: "Terugbetalingen worden binnen 10 werkdagen na het verzoek verwerkt en teruggestort via hetzelfde betaalmiddel als bij de aankoop." },
                { kind: "paragrafo", texto: "Hoelang het duurt voordat het bedrag op uw afschrift staat, hangt af van uw bank of kaartuitgever." },
            ],
        },
        {
            id: "apos",
            heading: "5. Na de terugbetaling",
            blocks: [
                { kind: "paragrafo", texto: "Zodra de terugbetaling is afgerond, eindigt de toegang tot de studie onder Mijn aankopen en is het bestand niet meer te downloaden." },
            ],
        },
    ],
}

export default refundNl
