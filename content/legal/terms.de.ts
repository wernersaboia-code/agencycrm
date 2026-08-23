import type { LegalDocument } from "./types"

const termsDe: LegalDocument = {
    title: "Nutzungsbedingungen",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Annahme der Bedingungen",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect wird von Werner Wild Saboia Carvalho Marinho als natürlicher Person betrieben. Mit dem Zugriff auf den Dienst oder seiner Nutzung stimmen Sie diesen Bedingungen zu. Wenn Sie nicht zustimmen, nutzen Sie den Dienst nicht." },
            ],
        },
        {
            id: "conta",
            heading: "2. Registrierung und Konto",
            blocks: [
                { kind: "paragrafo", texto: "Sie sind dafür verantwortlich, Ihre Zugangsdaten vertraulich zu halten. Benachrichtigen Sie uns unverzüglich, wenn Sie eine unbefugte Nutzung Ihres Kontos feststellen." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Zulässige Nutzung",
            blocks: [
                { kind: "paragrafo", texto: "Sie verpflichten sich, den Dienst nicht für Folgendes zu nutzen:" },
                { kind: "lista", itens: [
                    "Spam, Phishing oder schädliche Inhalte versenden.",
                    "Kontaktdaten ohne geeignete Rechtsgrundlage verarbeiten.",
                    "Versuchen, auf Daten anderer Nutzer oder auf fremde Arbeitsbereiche zuzugreifen.",
                    "Reverse Engineering betreiben oder Schwachstellen ausnutzen.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "4. Geistiges Eigentum",
            blocks: [
                { kind: "paragrafo", texto: "Die erworbenen Studien und Listen sind für die Nutzung durch Ihr Unternehmen bestimmt. Es ist nicht gestattet, sie weiterzuverkaufen, weiterzugeben oder zu veröffentlichen." },
                { kind: "paragrafo", texto: "Die Daten, die Sie in das CRM importieren oder dort anlegen, bleiben in Ihrer Verantwortung. Wir beanspruchen daran kein Eigentum, außer soweit dies für den Betrieb des Dienstes erforderlich ist." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Zahlungen und Erstattungen",
            blocks: [
                { kind: "paragrafo", texto: "Käufe im Katalog werden über einen zertifizierten Zahlungsdienstleister abgewickelt. Erstattungen erfolgen innerhalb von 14 Tagen nach dem Kauf vollständig und bedingungslos, gemäß der Erstattungsrichtlinie." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Haftungsbeschränkung",
            blocks: [
                { kind: "paragrafo", texto: "Der Dienst wird wie besehen bereitgestellt. Wir garantieren weder eine unterbrechungsfreie Verfügbarkeit noch ein bestimmtes geschäftliches Ergebnis: Der Erfolg eines Exportprojekts hängt von Faktoren ab, die außerhalb unseres Einflusses liegen." },
                { kind: "paragrafo", texto: "Unsere Haftung ist auf den Betrag beschränkt, den Sie in den letzten 12 Monaten für den Dienst gezahlt haben." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Kündigung",
            blocks: [
                { kind: "paragrafo", texto: "Wir können Konten sperren oder schließen, die gegen diese Bedingungen verstoßen. Sie können Ihr Konto jederzeit über die Kontoeinstellungen schließen; der Zugang zu den bereits getätigten Käufen bleibt bestehen, solange das Konto besteht." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Änderungen",
            blocks: [
                { kind: "paragrafo", texto: "Diese Bedingungen können aktualisiert werden. Das Datum am Anfang gibt die letzte Überarbeitung an, und wesentliche Änderungen werden im Voraus angekündigt. Die weitere Nutzung nach einer Änderung gilt als Annahme." },
            ],
        },
        {
            id: "idade",
            heading: "9. Mindestalter",
            blocks: [
                { kind: "paragrafo", texto: "Der Dienst richtet sich an Personen über 18 Jahre und an die berufliche Nutzung." },
            ],
        },
    ],
}

export default termsDe
