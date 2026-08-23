import type { LegalDocument } from "./types"

const termsNl: LegalDocument = {
    title: "Gebruiksvoorwaarden",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Aanvaarding van de voorwaarden",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect wordt geëxploiteerd door Werner Wild Saboia Carvalho Marinho, natuurlijke persoon. Door de dienst te bezoeken of te gebruiken gaat u akkoord met deze voorwaarden. Gaat u niet akkoord, gebruik de dienst dan niet." },
            ],
        },
        {
            id: "conta",
            heading: "2. Registratie en account",
            blocks: [
                { kind: "paragrafo", texto: "U bent verantwoordelijk voor het geheimhouden van uw inloggegevens. Waarschuw ons onmiddellijk als u ongeoorloofd gebruik van uw account vaststelt." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Aanvaardbaar gebruik",
            blocks: [
                { kind: "paragrafo", texto: "U stemt ermee in de dienst niet te gebruiken om:" },
                { kind: "lista", itens: [
                    "Spam, phishing of schadelijke inhoud te versturen.",
                    "Contactgegevens te verwerken zonder passende rechtsgrondslag.",
                    "Te proberen toegang te krijgen tot gegevens van andere gebruikers of tot andere werkruimtes.",
                    "Reverse engineering toe te passen of kwetsbaarheden te misbruiken.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "4. Intellectuele eigendom",
            blocks: [
                { kind: "paragrafo", texto: "De aangekochte studies en lijsten zijn bestemd voor gebruik door uw onderneming. Het is niet toegestaan ze door te verkopen, te verspreiden of te publiceren." },
                { kind: "paragrafo", texto: "De gegevens die u in het CRM importeert of vastlegt, blijven onder uw verantwoordelijkheid. Wij maken er geen eigendom op aanspraak, behalve voor zover dat nodig is om de dienst te laten werken." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Betalingen en terugbetalingen",
            blocks: [
                { kind: "paragrafo", texto: "Aankopen in de catalogus worden verwerkt via een gecertificeerde betaaldienstverlener. Terugbetaling is volledig en onvoorwaardelijk binnen 14 dagen na de aankoop, conform het Restitutiebeleid." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Beperking van aansprakelijkheid",
            blocks: [
                { kind: "paragrafo", texto: "De dienst wordt geleverd zoals het is. Wij garanderen geen ononderbroken beschikbaarheid en evenmin een bepaald commercieel resultaat: het rendement van een exportproject hangt af van factoren buiten onze controle." },
                { kind: "paragrafo", texto: "Onze aansprakelijkheid is beperkt tot het bedrag dat u in de afgelopen 12 maanden voor de dienst hebt betaald." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Beëindiging",
            blocks: [
                { kind: "paragrafo", texto: "Wij kunnen accounts die deze voorwaarden schenden opschorten of sluiten. U kunt het uwe op elk moment sluiten via de accountinstellingen; de toegang tot reeds gedane aankopen blijft behouden zolang het account bestaat." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Wijzigingen",
            blocks: [
                { kind: "paragrafo", texto: "Deze voorwaarden kunnen worden bijgewerkt. De datum bovenaan geeft de laatste herziening aan en belangrijke wijzigingen worden vooraf aangekondigd. Voortgezet gebruik na de wijziging geldt als aanvaarding." },
            ],
        },
        {
            id: "idade",
            heading: "9. Minimumleeftijd",
            blocks: [
                { kind: "paragrafo", texto: "De dienst is bestemd voor personen ouder dan 18 jaar en voor professioneel gebruik." },
            ],
        },
    ],
}

export default termsNl
