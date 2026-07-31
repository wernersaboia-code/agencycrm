import type { AboutDocument } from "./types"

// Transcrição literal de "Warum EasyProspect-.docx".
// Não reescrever: o sócio pediu o texto dele palavra por palavra. Mudança aqui
// só a partir de uma versão nova do documento.
const aboutDe: AboutDocument = {
    eyebrow: "Warum EasyProspect?",
    title: "Ihr Partner für erfolgreiche internationale Markteintritte",
    intro: [
        { kind: "paragrafo", texto: "Der Eintritt in neue Exportmärkte bietet große Chancen – erfordert jedoch fundierte Marktkenntnisse, zuverlässige Informationen und die richtigen Geschäftspartner." },
        { kind: "paragrafo", texto: "EasyProspect unterstützt Hersteller, Exporteure und Markenunternehmen dabei, neue Auslandsmärkte schneller, gezielter und mit deutlich geringerem Rechercheaufwand zu erschließen." },
        { kind: "paragrafo", texto: "Unsere Markteintrittsstudien und präqualifizierten Importeurs- und Distributorenverzeichnisse verbinden langjährige Erfahrung im internationalen Vertrieb mit einer speziell entwickelten Recherchemethodik. Moderne KI-Technologien unterstützen dabei die Auswertung großer Datenmengen, während jede Studie vor ihrer Veröffentlichung einer sorgfältigen Qualitätsprüfung unterzogen wird." },
        { kind: "paragrafo", texto: "Unser Ziel ist einfach: Wir möchten Ihnen genau die Informationen liefern, die Sie benötigen, um fundierte Entscheidungen zu treffen und geeignete Vertriebspartner für Ihre Produkte zu finden." },
        { kind: "paragrafo", texto: "Jede Markteintrittsstudie enthält unter anderem:" },
        { kind: "lista", itens: [
            "einen Überblick über den Zielmarkt und die Branchensituation",
            "Informationen zu Marktpotenzial und aktuellen Entwicklungen",
            "Marktzugangsvoraussetzungen",
            "eine Analyse der wichtigsten Vertriebs- und Distributionswege",
            "ein strukturiertes Verzeichnis relevanter Importeure und Distributoren",
            "praxisnahe Empfehlungen für eine erfolgreiche Kontaktaufnahme",
        ] },
    ],
    sections: [
        {
            id: "metodologia",
            heading: "Unsere Methodik",
            sub: "Sorgfältige Recherche statt unübersichtlicher Adresslisten",
            blocks: [
                { kind: "paragrafo", texto: "Unsere Markteintrittsstudien und Importeursverzeichnisse basieren auf einer eigens entwickelten Recherchemethodik." },
                { kind: "paragrafo", texto: "Hierfür werden zahlreiche öffentlich zugängliche Informationsquellen systematisch ausgewertet. Moderne KI-Technologien unterstützen die Recherche, Strukturierung und Analyse der Daten. Anschließend werden sämtliche Ergebnisse manuell überprüft und hinsichtlich ihrer Plausibilität, Aktualität und praktischen Relevanz bewertet." },
                { kind: "paragrafo", texto: "Unser Anspruch ist nicht, möglichst viele Unternehmen aufzulisten, sondern diejenigen zu identifizieren, die für Ihr Exportvorhaben tatsächlich von Interesse sein können." },
            ],
        },
        {
            id: "fontes",
            heading: "Woher stammen unsere Informationen?",
            blocks: [
                { kind: "paragrafo", texto: "Alle Informationen stammen ausschließlich aus öffentlich zugänglichen Quellen, beispielsweise von Unternehmenswebsites, Branchenverzeichnissen, Handelskammern, Verbänden, Messekatalogen und weiteren frei verfügbaren Informationsquellen." },
                { kind: "paragrafo", texto: "Vor der Veröffentlichung werden die Daten hinsichtlich Plausibilität, Vollständigkeit und ihrer praktischen Verwendbarkeit geprüft." },
                { kind: "paragrafo", texto: "Da Unternehmen ihre Ansprechpartner, Organisationsstrukturen oder Geschäftsschwerpunkte laufend anpassen, können sich einzelne Kontaktdaten im Laufe der Zeit ändern. Deshalb werden unsere Studien regelmäßig überprüft und aktualisiert." },
                { kind: "paragrafo", texto: "Unsere Importeursverzeichnisse sind ausdrücklich nicht für unpersönliche Massenmailings gedacht." },
                { kind: "paragrafo", texto: "Sie dienen vielmehr als fundierte Grundlage für eine sorgfältig vorbereitete und individuelle Ansprache potenzieller Geschäftspartner – denn gerade im internationalen Geschäft entstehen erfolgreiche Geschäftsbeziehungen in erster Linie durch Vertrauen und persönliche Kontakte." },
            ],
        },
        {
            id: "verificacao",
            heading: "Prüfung der Unternehmen",
            blocks: [
                { kind: "paragrafo", texto: "Bevor ein Unternehmen in eines unserer Importeursverzeichnisse aufgenommen wird, prüfen wir anhand öffentlich zugänglicher Informationen unter anderem," },
                { kind: "lista", itens: [
                    "ob das Unternehmen tatsächlich in der angegebenen Branche tätig ist,",
                    "ob Import- oder Distributionsaktivitäten erkennbar sind,",
                    "ob eine professionelle Unternehmenspräsenz besteht,",
                    "ob aktuelle Kontaktdaten verfügbar sind,",
                    "und ob das Unternehmen grundsätzlich als potenzieller Vertriebspartner infrage kommt.",
                ] },
                { kind: "paragrafo", texto: "Diese Prüfung ersetzt zwar keine individuelle Vertriebsqualifizierung, erhöht jedoch die Wahrscheinlichkeit, dass die aufgeführten Unternehmen für Ihr Exportvorhaben relevant sind." },
            ],
        },
        {
            id: "atualizacao",
            heading: "Regelmäßige Aktualisierung",
            blocks: [
                { kind: "paragrafo", texto: "Internationale Märkte entwickeln sich ständig weiter." },
                { kind: "paragrafo", texto: "Deshalb überprüfen und aktualisieren wir unsere Markteintrittsstudien und Unternehmensverzeichnisse in regelmäßigen Abständen. So stellen wir sicher, dass Ihnen möglichst aktuelle und praxisrelevante Informationen für Ihre Exportplanung zur Verfügung stehen." },
            ],
        },
        {
            id: "entrega",
            heading: "Was Sie erhalten",
            blocks: [
                { kind: "paragrafo", texto: "Mit jeder Markteintrittsstudie erhalten Sie weit mehr als eine Adressliste." },
                { kind: "paragrafo", texto: "Sie erhalten eine kompakte Marktanalyse mit den wichtigsten Informationen für Ihren erfolgreichen Markteintritt sowie ein sorgfältig recherchiertes Verzeichnis potenzieller Importeure und Distributoren." },
                { kind: "paragrafo", texto: "Je nach Branche umfasst die Studie unter anderem:" },
                { kind: "lista", itens: [
                    "Marktübersicht und Branchensituation",
                    "Marktpotenzial und aktuelle Entwicklungen",
                    "relevante Vertriebs- und Distributionskanäle",
                    "potenzielle Importeure und Distributoren",
                    "Hinweise zur erfolgreichen Marktbearbeitung",
                    "Empfehlungen für die erste Kontaktaufnahme",
                    "Informationen über Anforderungen potenzieller Lieferanten",
                ] },
                { kind: "paragrafo", texto: "Dadurch sparen Sie oft viele Tage oder sogar Wochen eigener Recherche und können sich auf den Aufbau neuer Geschäftsbeziehungen konzentrieren." },
            ],
        },
        {
            id: "limites",
            heading: "Was wir nicht versprechen können",
            blocks: [
                { kind: "paragrafo", texto: "Exporterfolg lässt sich nicht garantieren." },
                { kind: "paragrafo", texto: "Ob aus einer Kontaktaufnahme eine langfristige Geschäftsbeziehung entsteht, hängt von zahlreichen Faktoren ab – unter anderem von der Wettbewerbsfähigkeit Ihres Produkts, der Nachfrage im Zielmarkt, Ihrer Preisgestaltung, Ihrer Lieferfähigkeit, Ihrer Vertriebsstrategie sowie den Einkaufsentscheidungen des jeweiligen Importeurs." },
                { kind: "paragrafo", texto: "Was wir Ihnen jedoch bieten können, ist eine fundierte Entscheidungsgrundlage und eine erhebliche Zeitersparnis bei der Suche nach geeigneten Vertriebspartnern." },
                { kind: "paragrafo", texto: "Unsere Studien helfen Ihnen dabei, Ihre Exportaktivitäten effizienter zu planen und sich auf Unternehmen zu konzentrieren, die grundsätzlich als Importeur oder Distributor für Ihre Produkte infrage kommen." },
            ],
        },
        {
            id: "confianca",
            heading: "Warum entscheiden sich Unternehmen für EasyProspect?",
            blocks: [
                { kind: "cartoes", cartoes: [
                    { titulo: "Praxisorientiert", texto: "Unsere Studien wurden speziell für Hersteller, Exporteure und internationale Vertriebsverantwortliche entwickelt und orientieren sich an den Anforderungen der täglichen Exportpraxis." },
                    { titulo: "Sorgfältig recherchiert", texto: "Wir liefern keine unübersichtlichen Adresssammlungen, sondern strukturierte Marktinformationen und sorgfältig recherchierte Unternehmensverzeichnisse." },
                    { titulo: "Deutliche Zeitersparnis", texto: "Wir übernehmen den größten Teil der zeitaufwendigen Markt- und Unternehmensrecherche, sodass Sie schneller mit der eigentlichen Marktbearbeitung beginnen können." },
                    { titulo: "Regelmäßig aktualisiert", texto: "Unsere Markteintrittsstudien und Unternehmensverzeichnisse werden kontinuierlich überprüft und bei Bedarf aktualisiert." },
                    { titulo: "Praxisnahe Handlungsempfehlungen", texto: "Neben Marktinformationen erhalten Sie wertvolle Hinweise für die Ansprache potenzieller Vertriebspartner und für die Vorbereitung Ihres Markteintritts." },
                    { titulo: "Entwickelt für nachhaltigen Exporterfolg", texto: "Unser Ziel ist nicht der Verkauf einer Adressliste, sondern die Bereitstellung einer fundierten Arbeitsgrundlage, mit der Sie neue Exportmärkte systematisch und erfolgreich erschließen können." },
                ] },
            ],
        },
    ],
}

export default aboutDe
