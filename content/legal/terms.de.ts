import type { LegalDocument } from "./types"

const termsDe: LegalDocument = {
    title: "Nutzungsbedingungen",
    lastUpdated: "2026-10-13",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Annahme der Bedingungen",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect wird von Werner Wild Saboia Carvalho Marinho als natürlicher Person betrieben. Mit dem Zugriff auf den Dienst oder seiner Nutzung stimmen Sie diesen Bedingungen zu. Wenn Sie nicht zustimmen, nutzen Sie den Dienst nicht." },
            ],
        },
        {
            id: "servico",
            heading: "2. Die Leistung",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect verkauft Markteintrittsstudien, die als PDF geliefert werden. Nach Bestätigung der Zahlung steht die Studie unter Meine Käufe zum Download bereit." },
                { kind: "paragrafo", texto: "Die Preise werden im Katalog in der gewählten Währung angezeigt, und die Zahlung wird von dem beim Checkout angegebenen Zahlungsanbieter abgewickelt." },
                { kind: "paragrafo", texto: "Die Studien werden aus öffentlichen Quellen erstellt und geben den Stand zum Prüfdatum wieder, das auf der Seite jeder Studie angegeben ist. Unternehmen ändern Kontakte, Struktur und Strategie: Prüfen Sie die Angaben, bevor Sie geschäftliche Entscheidungen treffen." },
            ],
        },
        {
            id: "conta",
            heading: "3. Registrierung und Konto",
            blocks: [
                { kind: "paragrafo", texto: "Sie sind dafür verantwortlich, Ihre Zugangsdaten vertraulich zu halten. Benachrichtigen Sie uns unverzüglich, wenn Sie eine unbefugte Nutzung Ihres Kontos feststellen." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "4. Zulässige Nutzung",
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
            heading: "5. Geistiges Eigentum",
            blocks: [
                { kind: "paragrafo", texto: "Die erworbenen Studien sind für die Nutzung durch Ihr Unternehmen bestimmt. Es ist nicht gestattet, sie weiterzuverkaufen, weiterzugeben oder zu veröffentlichen." },
                { kind: "paragrafo", texto: "Die Daten, die Sie in das CRM importieren oder dort anlegen, bleiben in Ihrer Verantwortung. Wir beanspruchen daran kein Eigentum, außer soweit dies für den Betrieb des Dienstes erforderlich ist." },
            ],
        },
        {
            id: "pagamentos",
            heading: "6. Zahlungen und Erstattungen",
            blocks: [
                { kind: "paragrafo", texto: "Käufe im Katalog werden über einen zertifizierten Zahlungsdienstleister abgewickelt. Erstattungen erfolgen innerhalb von 14 Tagen nach dem Kauf vollständig und bedingungslos, gemäß der Erstattungsrichtlinie." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "7. Haftungsbeschränkung",
            blocks: [
                { kind: "paragrafo", texto: "Der Dienst wird wie besehen bereitgestellt. Wir garantieren weder eine unterbrechungsfreie Verfügbarkeit noch ein bestimmtes geschäftliches Ergebnis: Der Erfolg eines Exportprojekts hängt von Faktoren ab, die außerhalb unseres Einflusses liegen." },
                { kind: "paragrafo", texto: "Unsere Haftung ist auf den Betrag beschränkt, den Sie in den letzten 12 Monaten für den Dienst gezahlt haben." },
            ],
        },
        {
            id: "rescisao",
            heading: "8. Kündigung",
            blocks: [
                { kind: "paragrafo", texto: "Wir können Konten sperren oder schließen, die gegen diese Bedingungen verstoßen. Sie können die Schließung Ihres Kontos jederzeit per E-Mail an contato@easyprospect.com.br verlangen; solange das Konto besteht, bleibt der Zugang zu den bereits getätigten Käufen erhalten." },
            ],
        },
        {
            id: "alteracoes",
            heading: "9. Änderungen",
            blocks: [
                { kind: "paragrafo", texto: "Diese Bedingungen können aktualisiert werden. Das Datum am Anfang gibt die letzte Überarbeitung an, und wesentliche Änderungen werden im Voraus angekündigt. Die weitere Nutzung nach einer Änderung gilt als Annahme." },
            ],
        },
        {
            id: "idade",
            heading: "10. Mindestalter",
            blocks: [
                { kind: "paragrafo", texto: "Der Dienst richtet sich an Personen über 18 Jahre und an die berufliche Nutzung." },
            ],
        },
        {
            id: "foroLei",
            heading: "11. Anwendbares Recht und Gerichtsstand",
            blocks: [
                { kind: "paragrafo", texto: "Für diese Bedingungen gilt das Recht der Föderativen Republik Brasilien. Gerichtsstand für alle Streitigkeiten im Zusammenhang mit ihnen ist Fortaleza, Ceará, Brasilien." },
                { kind: "paragrafo", texto: "Wenn Sie als Verbraucher handeln, nimmt Ihnen diese Wahl nicht die Rechte, die Ihnen zwingende Verbraucherschutzvorschriften gewähren, einschließlich des Rechts, die Gerichte an Ihrem Wohnort anzurufen." },
            ],
        },
    ],
}

export default termsDe
