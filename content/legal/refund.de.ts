import type { LegalDocument } from "./types"

const refundDe: LegalDocument = {
    title: "Erstattungsrichtlinie",
    lastUpdated: "2026-08-23",
    sections: [
        {
            id: "escopo",
            heading: "1. Was diese Richtlinie abdeckt",
            blocks: [
                { kind: "paragrafo", texto: "Diese Richtlinie gilt für alle Markteintrittsstudien, die im Katalog von Easy Prospect verkauft werden." },
            ],
        },
        {
            id: "direito",
            heading: "2. Ihr Anspruch auf Erstattung",
            blocks: [
                { kind: "paragrafo", texto: "Sie können innerhalb von 14 Kalendertagen nach dem Kauf aus jedem beliebigen Grund die volle Erstattung verlangen." },
                { kind: "paragrafo", texto: "Eine Begründung ist nicht erforderlich, und der Anspruch gilt auch dann, wenn Sie die Studie bereits heruntergeladen haben." },
            ],
        },
        {
            id: "comoPedir",
            heading: "3. So beantragen Sie die Erstattung",
            blocks: [
                { kind: "paragrafo", texto: "Schreiben Sie an contato@easyprospect.com.br von der E-Mail-Adresse des Kontos, mit dem der Kauf getätigt wurde, und nennen Sie die Bestellnummer. Es gibt kein Formular und keinen weiteren Schritt." },
            ],
        },
        {
            id: "prazo",
            heading: "4. Frist und Rückzahlungsweg",
            blocks: [
                { kind: "paragrafo", texto: "Erstattungen werden innerhalb von 10 Werktagen nach der Anfrage bearbeitet und über dasselbe Zahlungsmittel zurückgezahlt, mit dem der Kauf getätigt wurde." },
                { kind: "paragrafo", texto: "Wie lange es dauert, bis der Betrag auf Ihrem Kontoauszug erscheint, hängt von Ihrer Bank oder Ihrem Kartenherausgeber ab." },
            ],
        },
        {
            id: "apos",
            heading: "5. Nach der Erstattung",
            blocks: [
                { kind: "paragrafo", texto: "Nach Abschluss der Erstattung endet der Zugriff auf die Studie unter Meine Käufe und die Datei steht nicht mehr zum Download bereit." },
            ],
        },
    ],
}

export default refundDe
