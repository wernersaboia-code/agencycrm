import type { LegalDocument } from "./types"

const termsNl: LegalDocument = {
    title: "Gebruiksvoorwaarden",
    lastUpdated: "2026-10-13",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Aanvaarding van de voorwaarden",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect wordt geëxploiteerd door Werner Wild Saboia Carvalho Marinho, natuurlijke persoon. Door de dienst te bezoeken of te gebruiken gaat u akkoord met deze voorwaarden. Gaat u niet akkoord, gebruik de dienst dan niet." },
            ],
        },
        {
            id: "servico",
            heading: "2. De dienst",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect verkoopt marktintredestudies, geleverd als pdf. Na bevestiging van de betaling staat de studie klaar om te downloaden onder Mijn aankopen." },
                { kind: "paragrafo", texto: "De prijzen worden in de catalogus getoond in de gekozen valuta, en de betaling wordt geïnd door de betaalprovider die bij het afrekenen wordt vermeld." },
                { kind: "paragrafo", texto: "De studies worden samengesteld uit openbare bronnen en geven de situatie weer op de herzieningsdatum die op de pagina van elke studie staat. Bedrijven veranderen van contactpersonen, structuur en strategie: controleer de informatie voordat u zakelijke beslissingen neemt." },
            ],
        },
        {
            id: "conta",
            heading: "3. Registratie en account",
            blocks: [
                { kind: "paragrafo", texto: "U bent verantwoordelijk voor het geheimhouden van uw inloggegevens. Waarschuw ons onmiddellijk als u ongeoorloofd gebruik van uw account vaststelt." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "4. Aanvaardbaar gebruik",
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
            heading: "5. Intellectuele eigendom",
            blocks: [
                { kind: "paragrafo", texto: "De aangekochte studies zijn bestemd voor gebruik door uw onderneming. Het is niet toegestaan ze door te verkopen, te verspreiden of te publiceren." },
                { kind: "paragrafo", texto: "De gegevens die u in het CRM importeert of vastlegt, blijven onder uw verantwoordelijkheid. Wij maken er geen eigendom op aanspraak, behalve voor zover dat nodig is om de dienst te laten werken." },
            ],
        },
        {
            id: "pagamentos",
            heading: "6. Betalingen en terugbetalingen",
            blocks: [
                { kind: "paragrafo", texto: "Aankopen in de catalogus worden verwerkt via een gecertificeerde betaaldienstverlener. Terugbetaling is volledig en onvoorwaardelijk binnen 14 dagen na de aankoop, conform het Restitutiebeleid." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "7. Beperking van aansprakelijkheid",
            blocks: [
                { kind: "paragrafo", texto: "De dienst wordt geleverd zoals het is. Wij garanderen geen ononderbroken beschikbaarheid en evenmin een bepaald commercieel resultaat: het rendement van een exportproject hangt af van factoren buiten onze controle." },
                { kind: "paragrafo", texto: "Onze aansprakelijkheid is beperkt tot het bedrag dat u in de afgelopen 12 maanden voor de dienst hebt betaald." },
            ],
        },
        {
            id: "rescisao",
            heading: "8. Beëindiging",
            blocks: [
                { kind: "paragrafo", texto: "Wij kunnen accounts die deze voorwaarden schenden opschorten of sluiten. U kunt op elk moment om sluiting van uw account vragen door te schrijven naar contato@easyprospect.com.br; zolang het account bestaat, blijft de toegang tot reeds gedane aankopen behouden." },
            ],
        },
        {
            id: "alteracoes",
            heading: "9. Wijzigingen",
            blocks: [
                { kind: "paragrafo", texto: "Deze voorwaarden kunnen worden bijgewerkt. De datum bovenaan geeft de laatste herziening aan en belangrijke wijzigingen worden vooraf aangekondigd. Voortgezet gebruik na de wijziging geldt als aanvaarding." },
            ],
        },
        {
            id: "idade",
            heading: "10. Minimumleeftijd",
            blocks: [
                { kind: "paragrafo", texto: "De dienst is bestemd voor personen ouder dan 18 jaar en voor professioneel gebruik." },
            ],
        },
        {
            id: "foroLei",
            heading: "11. Toepasselijk recht en bevoegde rechter",
            blocks: [
                { kind: "paragrafo", texto: "Op deze voorwaarden is het recht van de Federatieve Republiek Brazilië van toepassing. Geschillen die hiermee verband houden, worden voorgelegd aan de bevoegde rechter in Fortaleza, Ceará, Brazilië." },
                { kind: "paragrafo", texto: "Als u als consument contracteert, ontneemt deze keuze u niet de rechten die dwingende regels van consumentenbescherming u bieden, waaronder het recht om naar de rechter in uw woonplaats te stappen." },
            ],
        },
    ],
}

export default termsNl
