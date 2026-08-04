import type { LegalDocument } from "./types"

const privacyNl: LegalDocument = {
    title: "Privacyverklaring",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "responsavel",
            heading: "1. Wie is verantwoordelijk",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect wordt geëxploiteerd door Werner Wild Saboia Carvalho Marinho, natuurlijke persoon, die beslist over de verwerking van de in deze verklaring beschreven gegevens." },
                { kind: "paragrafo", texto: "Voor elke kwestie over persoonsgegevens, waaronder het uitoefenen van de hieronder beschreven rechten, schrijft u naar contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Gegevens die wij verwerken",
            blocks: [
                { kind: "paragrafo", texto: "Wij verwerken de informatie die nodig is om de dienst te laten werken:" },
                { kind: "lista", itens: [
                    "Accountgegevens: naam, e-mailadres en avatar, door u opgegeven bij de registratie en beheerd door Supabase Auth.",
                    "Aankoopgegevens: gekochte items, bedrag, valuta en downloadgeschiedenis.",
                    "Betaalgegevens: transactiekenmerken bij Stripe. Wij ontvangen en bewaren geen kaartnummers.",
                    "Gebruiksgegevens van de site: bezochte pagina's en navigatiegebeurtenissen, alleen wanneer u de meetcookies accepteert.",
                    "Gegevens die u in het CRM invoert: contacten, bedrijven en activiteitenregistraties die u importeert of aanmaakt.",
                    "Zakelijke contactgegevens van derden: de bedrijven en contactpersonen waaruit de lijsten in de catalogus bestaan. Zie de aparte sectie hieronder.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Rechtsgrond van elke verwerking",
            blocks: [
                { kind: "lista", itens: [
                    "Uw account aanmaken en onderhouden, de aankoop verwerken en het gekochte onderzoek leveren: uitvoering van de overeenkomst tussen ons.",
                    "Berichten over uw aankoop sturen, zoals de bevestiging en de vrijgave van de download: uitvoering van de overeenkomst.",
                    "Verkoopgegevens bewaren gedurende de vereiste termijnen: nakoming van een wettelijke verplichting.",
                    "Het gebruik van de site meten: toestemming, die u op elk moment kunt weigeren of intrekken via de cookiebanner.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. Hoe wij de gegevens gebruiken",
            blocks: [
                { kind: "lista", itens: [
                    "De catalogus, de afrekenpagina en de levering van de gekochte onderzoeken laten werken.",
                    "Permanente toegang geven tot uw aankopen in het gedeelte Mijn aankopen.",
                    "Transactionele meldingen sturen over uw account en uw aankopen.",
                    "Het CRM laten werken voor de gegevens die u zelf invoert of importeert.",
                ] },
                { kind: "paragrafo", texto: "Wij verkopen geen persoonsgegevens van gebruikers en gebruiken uw accountgegevens niet om modellen te trainen." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Met wie wij gegevens delen",
            blocks: [
                { kind: "paragrafo", texto: "Wij schakelen dienstverleners in voor specifieke taken, elk met toegang tot alleen wat nodig is:" },
                { kind: "lista", itens: [
                    "Supabase — database, authenticatie en bestandsopslag.",
                    "Stripe — betalingsverwerking.",
                    "Vercel — hosting van de applicatie en prestatiemeting.",
                    "Zoho — mailbox van het contactadres.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. Internationale doorgiften",
            blocks: [
                { kind: "paragrafo", texto: "De database wordt gehost in Brazilië. De overige hierboven genoemde dienstverleners gebruiken infrastructuur in verschillende landen, waaronder de Verenigde Staten en de Europese Unie." },
                { kind: "paragrafo", texto: "Bevindt u zich in de Europese Unie, dan betekent dit dat uw gegevens buiten de Europese Economische Ruimte kunnen worden verwerkt. Voor Brazilië bestaat op dit moment geen adequaatheidsbesluit van de Europese Commissie." },
            ],
        },
        {
            id: "listas",
            heading: "7. Contactgegevens in de lijsten van de catalogus",
            blocks: [
                { kind: "paragrafo", texto: "De lijsten die in de catalogus worden verkocht bundelen zakelijke contactgegevens van bedrijven: bedrijfsnaam, land, sector, website, algemene e-mailadressen en telefoonnummers. In sommige lijsten staan ook de naam en de functie van een contactpersoon." },
                { kind: "paragrafo", texto: "Deze gegevens komen uit openbare bronnen — bedrijfswebsites, handelsregisters en andere openbaar toegankelijke informatie — en worden niet bij de betrokkene zelf verzameld." },
                { kind: "paragrafo", texto: "Hebt u gegevens over uzelf in een van onze lijsten aangetroffen en wilt u die inzien, laten corrigeren, bezwaar maken tegen de verwerking of om verwijdering vragen, schrijf dan naar contato@easyprospect.com.br. Zulke verzoeken worden afgehandeld." },
            ],
        },
        {
            id: "direitos",
            heading: "8. Uw rechten",
            blocks: [
                { kind: "paragrafo", texto: "U kunt op elk moment verzoeken om:" },
                { kind: "lista", itens: [
                    "Inzage in de gegevens die wij over u verwerken.",
                    "Rectificatie van onvolledige of verouderde gegevens.",
                    "Wissing van uw gegevens, behoudens wettelijke bewaarplichten.",
                    "Overdraagbaarheid van de gegevens die u ons hebt verstrekt.",
                    "Bezwaar tegen een verwerking en intrekking van de toestemming, wanneer die de grondslag is.",
                ] },
                { kind: "paragrafo", texto: "Schrijf daarvoor naar contato@easyprospect.com.br. U hebt ook het recht een klacht in te dienen bij een gegevensbeschermingsautoriteit — de ANPD, in Brazilië, of de toezichthoudende autoriteit van uw land, in de Europese Unie." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookies en meting",
            blocks: [
                { kind: "paragrafo", texto: "Wij gebruiken essentiële cookies voor authenticatie en om uw voorkeuren te onthouden, zoals de taal. Ze zijn nodig om de site te laten werken en vragen geen toestemming." },
                { kind: "paragrafo", texto: "Cookies voor gebruiksmeting worden pas geladen nadat u ze accepteert in de banner die bij het eerste bezoek wordt getoond. Weigeren beperkt geen enkele functie." },
            ],
        },
        {
            id: "retencao",
            heading: "10. Hoe lang wij de gegevens bewaren",
            blocks: [
                { kind: "paragrafo", texto: "Wij bewaren uw accountgegevens zolang het account bestaat. Na verwijdering van het account worden de persoonsgegevens binnen 90 dagen verwijderd of geanonimiseerd." },
                { kind: "paragrafo", texto: "Aankoopgegevens worden bewaard gedurende de termijnen die de fiscale wetgeving voorschrijft, ook na verwijdering van het account." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Wijzigingen en contact",
            blocks: [
                { kind: "paragrafo", texto: "Deze verklaring kan worden bijgewerkt. De datum bovenaan geeft de laatste herziening aan en belangrijke wijzigingen worden op de site aangekondigd." },
                { kind: "paragrafo", texto: "Vragen over deze verklaring: contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyNl
