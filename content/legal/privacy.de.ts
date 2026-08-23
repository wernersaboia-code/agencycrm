import type { LegalDocument } from "./types"

const privacyDe: LegalDocument = {
    title: "Datenschutzerklärung",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "responsavel",
            heading: "1. Wer ist verantwortlich",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect wird von Werner Wild Saboia Carvalho Marinho als natürlicher Person mit Sitz in Fortaleza, Ceará, Brasilien betrieben, der über die Verarbeitung der in dieser Erklärung beschriebenen Daten entscheidet." },
                { kind: "paragrafo", texto: "Für alle Fragen zu personenbezogenen Daten, einschließlich der Ausübung der unten beschriebenen Rechte, schreiben Sie an contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Daten, die wir verarbeiten",
            blocks: [
                { kind: "paragrafo", texto: "Wir verarbeiten die Informationen, die für den Betrieb des Dienstes erforderlich sind:" },
                { kind: "lista", itens: [
                    "Kontodaten: Name, E-Mail-Adresse und Avatar, die Sie bei der Registrierung angeben und die über Supabase Auth verwaltet werden.",
                    "Kaufdaten: erworbene Artikel, Betrag, Währung und Download-Verlauf.",
                    "Zahlungsdaten: Transaktionskennungen bei Stripe. Wir erhalten und speichern keine Kartennummern.",
                    "Nutzungsdaten der Website: aufgerufene Seiten und Navigationsereignisse, nur wenn Sie die Messcookies akzeptieren.",
                    "Von Ihnen im CRM eingegebene Daten: Kontakte, Unternehmen und Aktivitätseinträge, die Sie importieren oder anlegen.",
                    "Berufliche Kontaktdaten Dritter: die Unternehmen und Ansprechpersonen, aus denen die Listen des Katalogs bestehen. Siehe den eigenen Abschnitt weiter unten.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Rechtsgrundlage der einzelnen Verarbeitungen",
            blocks: [
                { kind: "lista", itens: [
                    "Ihr Konto anlegen und führen, den Kauf abwickeln und die erworbene Studie bereitstellen: Erfüllung des Vertrags zwischen uns.",
                    "Nachrichten zu Ihrem Kauf senden, etwa Bestätigung und Freigabe des Downloads: Erfüllung des Vertrags.",
                    "Verkaufsunterlagen für die vorgeschriebenen Fristen aufbewahren: Erfüllung einer rechtlichen Verpflichtung.",
                    "Die Nutzung der Website messen: Einwilligung, die Sie jederzeit über das Cookie-Banner verweigern oder widerrufen können.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. Wie wir die Daten verwenden",
            blocks: [
                { kind: "lista", itens: [
                    "Den Katalog, den Checkout und die Bereitstellung der erworbenen Studien betreiben.",
                    "Dauerhaften Zugang zu Ihren Käufen im Bereich Meine Käufe geben.",
                    "Transaktionsbenachrichtigungen zu Ihrem Konto und zu Ihren Käufen versenden.",
                    "Das CRM für die Daten betreiben, die Sie selbst anlegen oder importieren.",
                ] },
                { kind: "paragrafo", texto: "Wir verkaufen keine personenbezogenen Daten von Nutzern und verwenden Ihre Kontodaten nicht zum Training von Modellen." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Mit wem wir Daten teilen",
            blocks: [
                { kind: "paragrafo", texto: "Wir setzen Dienstleister für einzelne Aufgaben ein, jeder mit Zugang nur zu dem, was dafür nötig ist:" },
                { kind: "lista", itens: [
                    "Supabase — Datenbank, Authentifizierung und Dateispeicherung.",
                    "Stripe — Zahlungsabwicklung.",
                    "Vercel — Hosting der Anwendung und Leistungsmessung.",
                    "Zoho — Postfach der Kontaktadresse.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. Internationale Übermittlungen",
            blocks: [
                { kind: "paragrafo", texto: "Die Datenbank wird in Brasilien gehostet. Die übrigen oben genannten Dienstleister betreiben Infrastruktur in mehreren Ländern, darunter die Vereinigten Staaten und die Europäische Union." },
                { kind: "paragrafo", texto: "Wenn Sie sich in der Europäischen Union befinden, bedeutet das, dass Ihre Daten außerhalb des Europäischen Wirtschaftsraums verarbeitet werden können. Für Brasilien liegt zum jetzigen Zeitpunkt kein Angemessenheitsbeschluss der Europäischen Kommission vor." },
            ],
        },
        {
            id: "listas",
            heading: "7. Kontaktdaten in den Listen des Katalogs",
            blocks: [
                { kind: "paragrafo", texto: "Die im Katalog verkauften Listen enthalten berufliche Kontaktdaten von Unternehmen: Firmenname, Land, Branche, Website, institutionelle E-Mail-Adressen und Telefonnummern. In einigen Listen stehen außerdem der Name und die Funktion einer Ansprechperson." },
                { kind: "paragrafo", texto: "Diese Daten stammen aus öffentlichen Quellen — Unternehmenswebsites, Handelsregistern und anderen öffentlich zugänglichen Informationen — und werden nicht bei der betroffenen Person selbst erhoben." },
                { kind: "paragrafo", texto: "Wenn Sie Daten zu Ihrer Person in einer unserer Listen gefunden haben und darauf zugreifen, sie berichtigen, der Verarbeitung widersprechen oder ihre Löschung verlangen möchten, schreiben Sie an contato@easyprospect.com.br. Solche Anfragen werden bearbeitet." },
            ],
        },
        {
            id: "direitos",
            heading: "8. Ihre Rechte",
            blocks: [
                { kind: "paragrafo", texto: "Sie können jederzeit verlangen:" },
                { kind: "lista", itens: [
                    "Auskunft über die Daten, die wir über Sie verarbeiten.",
                    "Berichtigung unvollständiger oder veralteter Daten.",
                    "Löschung Ihrer Daten, vorbehaltlich gesetzlicher Aufbewahrungspflichten.",
                    "Datenübertragbarkeit der Daten, die Sie uns bereitgestellt haben.",
                    "Widerspruch gegen eine Verarbeitung und Widerruf der Einwilligung, wenn diese die Grundlage ist.",
                ] },
                { kind: "paragrafo", texto: "Schreiben Sie dafür einfach an contato@easyprospect.com.br. Sie haben außerdem das Recht, Beschwerde bei einer Datenschutzbehörde einzulegen — bei der ANPD in Brasilien oder bei der Aufsichtsbehörde Ihres Landes in der Europäischen Union." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookies und Messung",
            blocks: [
                { kind: "paragrafo", texto: "Wir verwenden unbedingt erforderliche Cookies für die Authentifizierung und um Ihre Einstellungen wie die Sprache zu speichern. Sie sind für den Betrieb der Website notwendig und setzen keine Einwilligung voraus." },
                { kind: "paragrafo", texto: "Cookies zur Nutzungsmessung werden erst geladen, nachdem Sie im Banner beim ersten Besuch zugestimmt haben. Eine Ablehnung schränkt keine Funktion ein." },
            ],
        },
        {
            id: "retencao",
            heading: "10. Wie lange wir die Daten aufbewahren",
            blocks: [
                { kind: "paragrafo", texto: "Wir bewahren Ihre Kontodaten auf, solange das Konto besteht. Nach der Löschung des Kontos werden die personenbezogenen Daten innerhalb von 90 Tagen entfernt oder anonymisiert." },
                { kind: "paragrafo", texto: "Kaufunterlagen werden für die steuerrechtlich vorgeschriebenen Fristen aufbewahrt, auch nach der Löschung des Kontos." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Änderungen und Kontakt",
            blocks: [
                { kind: "paragrafo", texto: "Diese Erklärung kann aktualisiert werden. Das Datum am Anfang gibt die letzte Überarbeitung an, und wesentliche Änderungen werden auf der Website angekündigt." },
                { kind: "paragrafo", texto: "Fragen zu dieser Erklärung: contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyDe
