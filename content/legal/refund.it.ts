import type { LegalDocument } from "./types"

const refundIt: LegalDocument = {
    title: "Politica di rimborso",
    lastUpdated: "2026-08-23",
    sections: [
        {
            id: "escopo",
            heading: "1. Che cosa copre questa politica",
            blocks: [
                { kind: "paragrafo", texto: "Questa politica si applica a tutti gli studi di ingresso nel mercato venduti nel catalogo di Easy Prospect." },
            ],
        },
        {
            id: "direito",
            heading: "2. Diritto al rimborso",
            blocks: [
                { kind: "paragrafo", texto: "Può richiedere il rimborso integrale entro 14 giorni di calendario dall'acquisto, per qualsiasi motivo." },
                { kind: "paragrafo", texto: "Non è necessario motivare la richiesta e il diritto vale anche se ha già scaricato lo studio." },
            ],
        },
        {
            id: "comoPedir",
            heading: "3. Come richiederlo",
            blocks: [
                { kind: "paragrafo", texto: "Scriva a contato@easyprospect.com.br dall'indirizzo e-mail dell'account che ha effettuato l'acquisto, indicando il numero d'ordine. Non c'è alcun modulo né passaggio aggiuntivo." },
            ],
        },
        {
            id: "prazo",
            heading: "4. Tempi e modalità",
            blocks: [
                { kind: "paragrafo", texto: "Il rimborso viene elaborato entro 10 giorni lavorativi dalla richiesta e restituito con lo stesso metodo di pagamento usato per l'acquisto." },
                { kind: "paragrafo", texto: "Il tempo necessario perché l'importo compaia sul suo estratto conto dipende dalla sua banca o dall'emittente della carta." },
            ],
        },
        {
            id: "apos",
            heading: "5. Dopo il rimborso",
            blocks: [
                { kind: "paragrafo", texto: "Completato il rimborso, l'accesso allo studio termina in I miei acquisti e il file non è più disponibile per il download." },
            ],
        },
    ],
}

export default refundIt
