import type { AboutDocument } from "./types"

// Transcrição literal de "Waroom EasyProspect NL.docx".
// Não reescrever: o sócio pediu o texto dele palavra por palavra. Mudança aqui
// só a partir de uma versão nova do documento.
//
// Exceção registrada: os dois últimos parágrafos de "Herkomst van onze data" não estão
// no documento deste idioma — são a tradução do trecho sobre disparo em massa
// que só o documento alemão traz, incluído nos 7 a pedido do Werner.
const aboutNl: AboutDocument = {
    eyebrow: "Waarom EasyProspect?",
    title: "Uw partner voor succesvolle internationale markttoetreding",
    intro: [
        { kind: "paragrafo", texto: "Nieuwe exportmarkten bieden enorme groeikansen. Tegelijkertijd kost het zoeken naar geschikte importeurs, distributeurs en betrouwbare marktinformatie vaak weken of zelfs maanden." },
        { kind: "paragrafo", texto: "EasyProspect is ontwikkeld om dit proces aanzienlijk te vereenvoudigen." },
        { kind: "paragrafo", texto: "Wij ondersteunen fabrikanten, merkbedrijven en exporteurs bij het sneller openen van nieuwe afzetmarkten – met professionele markttoetredingsstudies en zorgvuldig onderzochte directories van importeurs en distributeurs." },
        { kind: "paragrafo", texto: "Onze studies combineren jarenlange ervaring in internationale verkoop met een moderne onderzoeksmethodologie. Er worden zowel AI-ondersteunde analysemethoden als een uiteindelijke handmatige kwaliteitscontrole gebruikt." },
        { kind: "paragrafo", texto: "Het resultaat is gestructureerde, praktische informatie die u helpt om weloverwogen beslissingen te nemen en de juiste distributiepartners voor uw producten te identificeren." },
    ],
    sections: [
        {
            id: "metodologia",
            heading: "Onze Methodologie",
            sub: "Zorgvuldig onderzoek in plaats van verwarrende adressenlijsten",
            blocks: [
                { kind: "paragrafo", texto: "Bij EasyProspect ligt de focus niet op de hoeveelheid data, maar op de praktische relevantie ervan." },
                { kind: "paragrafo", texto: "Voor elke markttoetredingsstudie worden talrijke openbaar toegankelijke informatiebronnen systematisch geëvalueerd. Moderne AI-technologieën ondersteunen het onderzoek, de analyse en de structurering van grote datavolumes. Alle resultaten worden vervolgens door ons beoordeeld op plausibiliteit en nut voor de export." },
                { kind: "paragrafo", texto: "Ons doel is niet om zo veel mogelijk bedrijven te vermelden, maar om diegenen te identificeren die daadwerkelijk interessant kunnen zijn voor uw exportproject." },
            ],
        },
        {
            id: "fontes",
            heading: "Herkomst van onze data",
            blocks: [
                { kind: "paragrafo", texto: "Alle informatie is uitsluitend afkomstig uit openbaar toegankelijke bronnen." },
                { kind: "paragrafo", texto: "Deze omvatten onder andere:" },
                { kind: "lista", itens: [
                    "Bedrijfswebsites",
                    "Kamers van koophandel",
                    "Brancheverenigingen",
                    "Beurscatalogi",
                    "Bedrijvengidsen",
                    "Specialistische portals",
                    "Andere vrij toegankelijke bedrijfsinformatie",
                ] },
                { kind: "paragrafo", texto: "Voor publicatie wordt de data gecontroleerd op plausibiliteit, volledigheid en praktische bruikbaarheid." },
                { kind: "paragrafo", texto: "Aangezien contactpersonen en bedrijfsstructuren regelmatig kunnen veranderen, worden onze studies met regelmatige intervallen bijgewerkt." },
                { kind: "paragrafo", texto: "Onze importeursdirectories zijn uitdrukkelijk niet bedoeld voor onpersoonlijke massamailings." },
                { kind: "paragrafo", texto: "Ze dienen veeleer als gedegen basis voor een zorgvuldig voorbereide, individuele benadering van potentiële zakenpartners — want juist in de internationale handel ontstaan succesvolle zakelijke relaties vooral door vertrouwen en persoonlijk contact." },
            ],
        },
        {
            id: "verificacao",
            heading: "Bedrijfsbeoordeling",
            blocks: [
                { kind: "paragrafo", texto: "Elk bedrijf wordt op basis van openbaar beschikbare informatie beoordeeld voordat het in een van onze directories wordt opgenomen." },
                { kind: "paragrafo", texto: "In het bijzonder controleren wij" },
                { kind: "lista", itens: [
                    "of het bedrijf actief is in de relevante branche,",
                    "of import- of distributieactiviteiten identificeerbaar zijn,",
                    "of er een professionele bedrijfsuitstraling bestaat,",
                    "of actuele contactgegevens beschikbaar zijn,",
                    "en of het bedrijf in het algemeen als potentiële distributiepartner in aanmerking kan komen.",
                ] },
                { kind: "paragrafo", texto: "Deze beoordeling vervangt geen individuele verkoopkwalificatie, maar verhoogt de kans dat de vermelde bedrijven relevant zijn voor uw exportproject." },
            ],
        },
        {
            id: "atualizacao",
            heading: "Regelmatige updates",
            blocks: [
                { kind: "paragrafo", texto: "Internationale markten veranderen voortdurend." },
                { kind: "paragrafo", texto: "Daarom controleren en actualiseren wij onze markttoetredingsstudies en bedrijfsdirectories regelmatig, zodat u toegang heeft tot de meest actuele en praktisch relevante informatie mogelijk." },
            ],
        },
        {
            id: "entrega",
            heading: "Wat u ontvangt",
            blocks: [
                { kind: "paragrafo", texto: "Elke markttoetredingsstudie biedt u aanzienlijk meer dan een klassieke adressenlijst." },
                { kind: "paragrafo", texto: "U ontvangt een compacte en praktijkgerichte basis voor besluitvorming voor uw markttoetreding." },
                { kind: "paragrafo", texto: "Afhankelijk van de branche omvat een studie onder andere:" },
                { kind: "lista", itens: [
                    "Overzicht van de doelmarkt",
                    "Analyse van de branchesituatie",
                    "Marktpotentieel en actuele trends",
                    "Markttoegangsvereisten",
                    "Verkoop- en distributiestructuren",
                    "Directory van relevante importeurs en distributeurs",
                    "Tips voor het succesvol benaderen van potentiële zakenpartners",
                    "Aanbevelingen voor de voorbereiding van uw markttoetreding",
                ] },
                { kind: "paragrafo", texto: "Ons doel is om een groot deel van het tijdrovende onderzoek van u over te nemen, zodat u zich kunt concentreren op het opbouwen van nieuwe zakelijke relaties." },
            ],
        },
        {
            id: "limites",
            heading: "Wat wij niet kunnen beloven",
            blocks: [
                { kind: "paragrafo", texto: "Het succes van een exportproject hangt van vele factoren af." },
                { kind: "paragrafo", texto: "Daarom kunnen wij niet garanderen dat elk bedrijf zal reageren op een contactbenadering of dat er onmiddellijk een zakelijke relatie zal ontstaan." },
                { kind: "paragrafo", texto: "Bepalende factoren zijn onder andere:" },
                { kind: "lista", itens: [
                    "de concurrentiekracht van uw product,",
                    "de vraag op de doelmarkt,",
                    "uw prijsstelling,",
                    "uw leveringsvermogen,",
                    "uw marketing- en verkoopstrategie,",
                    "het tijdstip van de contactbenadering,",
                    "evenals de individuele aankoopbeslissingen van de betreffende importeurs.",
                ] },
                { kind: "paragrafo", texto: "Wat wij u echter wel kunnen bieden, is een solide basis voor uw exportplanning en een aanzienlijke tijdsbesparing bij het identificeren van geschikte distributiepartners." },
            ],
        },
        {
            id: "confianca",
            heading: "Waarom bedrijven EasyProspect vertrouwen",
            blocks: [
                { kind: "cartoes", cartoes: [
                    { titulo: "Praktijkgericht", texto: "Onze studies worden specifiek gemaakt voor fabrikanten, exporteurs en internationale salesmanagers." },
                    { titulo: "Meer dan alleen adressenlijsten", texto: "U ontvangt gestructureerde marktinformatie, concrete handelingsaanbevelingen en zorgvuldig onderzochte directories van importeurs en distributeurs." },
                    { titulo: "Zorgvuldig onderzocht", texto: "Ons onderzoek is gebaseerd op een systematische methodologie en wordt voor publicatie onderworpen aan een handmatige kwaliteitscontrole." },
                    { titulo: "Tijd besparen", texto: "In plaats van weken te besteden aan het onderzoeken van geschikte bedrijven, kunt u onmiddellijk beginnen met het benaderen van potentiële distributiepartners." },
                    { titulo: "Regelmatig bijgewerkt", texto: "Onze studies worden voortdurend gecontroleerd en waar nodig herzien of aangevuld." },
                    { titulo: "Ontwikkeld voor uw exportsucces", texto: "Ons doel is niet om zo veel mogelijk data te verkopen, maar om een solide werkbases te bieden waarmee u nieuwe markten efficiënt en professioneel kunt ontsluiten." },
                ] },
            ],
        },
        {
            id: "cta",
            heading: "Heeft u de juiste doelmarkt al gevonden?",
            blocks: [
                { kind: "paragrafo", texto: "Ontdek onze markttoetredingsstudies en importeursdirectories voor talloze landen en branches." },
                { kind: "paragrafo", texto: "Met EasyProspect ontvangt u solide marktinformatie en zorgvuldig onderzochte potentiële distributiepartners – zodat u sneller de juiste beslissingen kunt nemen en succesvol nieuwe exportmarkten kunt openen." },
                { kind: "paragrafo", texto: "Selecteer nu de juiste markttoetredingsstudie." },
            ],
        },
    ],
}

export default aboutNl
