import type { LegalDocument } from "./types"

const termsIt: LegalDocument = {
    title: "Condizioni d'uso",
    lastUpdated: "2026-10-13",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Accettazione delle condizioni",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect è gestito da Werner Wild Saboia Carvalho Marinho, persona fisica. Accedendo al servizio o utilizzandolo accetti queste condizioni. Se non le accetti, non utilizzare il servizio." },
            ],
        },
        {
            id: "servico",
            heading: "2. Il servizio",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect vende studi di ingresso nel mercato, consegnati in PDF. Una volta confermato il pagamento, lo studio è disponibile per il download in I miei acquisti." },
                { kind: "paragrafo", texto: "I prezzi sono indicati nel catalogo nella valuta scelta e l'addebito è effettuato dal fornitore di pagamento indicato al momento dell'acquisto." },
                { kind: "paragrafo", texto: "Gli studi sono elaborati a partire da fonti pubbliche e riflettono la situazione alla data di revisione indicata nella pagina di ciascuno studio. Le aziende cambiano contatti, struttura e strategia: verifica le informazioni prima di prendere decisioni commerciali." },
            ],
        },
        {
            id: "conta",
            heading: "3. Registrazione e account",
            blocks: [
                { kind: "paragrafo", texto: "Sei responsabile della riservatezza delle tue credenziali. Avvisaci subito se rilevi un uso non autorizzato del tuo account." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "4. Uso accettabile",
            blocks: [
                { kind: "paragrafo", texto: "Ti impegni a non utilizzare il servizio per:" },
                { kind: "lista", itens: [
                    "Inviare spam, phishing o contenuti dannosi.",
                    "Trattare dati di contatti senza un'adeguata base giuridica.",
                    "Tentare di accedere ai dati di altri utenti o ad altri spazi di lavoro.",
                    "Effettuare reverse engineering o sfruttare vulnerabilità.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "5. Proprietà intellettuale",
            blocks: [
                { kind: "paragrafo", texto: "Gli studi acquistati sono destinati all'uso della tua azienda. Non è consentito rivenderli, ridistribuirli o pubblicarli." },
                { kind: "paragrafo", texto: "I dati che importi o inserisci nel CRM restano sotto la tua responsabilità. Non ne rivendichiamo la proprietà, salvo per quanto necessario a far funzionare il servizio." },
            ],
        },
        {
            id: "pagamentos",
            heading: "6. Pagamenti e rimborsi",
            blocks: [
                { kind: "paragrafo", texto: "Gli acquisti nel catalogo sono elaborati tramite un fornitore di pagamento certificato. Il rimborso è integrale e incondizionato entro 14 giorni dall'acquisto, secondo la Politica di rimborso." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "7. Limitazione di responsabilità",
            blocks: [
                { kind: "paragrafo", texto: "Il servizio è fornito così com'è. Non garantiamo una disponibilità ininterrotta né un risultato commerciale specifico: il ritorno di un progetto di esportazione dipende da fattori fuori dal nostro controllo." },
                { kind: "paragrafo", texto: "La nostra responsabilità è limitata all'importo che hai pagato per il servizio negli ultimi 12 mesi." },
            ],
        },
        {
            id: "rescisao",
            heading: "8. Risoluzione",
            blocks: [
                { kind: "paragrafo", texto: "Possiamo sospendere o chiudere gli account che violano queste condizioni. Puoi chiedere la chiusura del tuo in qualsiasi momento scrivendo a contato@easyprospect.com.br; finché l'account esiste, l'accesso agli acquisti già effettuati resta disponibile." },
            ],
        },
        {
            id: "alteracoes",
            heading: "9. Modifiche",
            blocks: [
                { kind: "paragrafo", texto: "Queste condizioni possono essere aggiornate. La data in alto indica l'ultima revisione e le modifiche rilevanti sono annunciate in anticipo. L'uso continuato dopo la modifica costituisce accettazione." },
            ],
        },
        {
            id: "idade",
            heading: "10. Età minima",
            blocks: [
                { kind: "paragrafo", texto: "Il servizio è destinato a persone maggiori di 18 anni e a un uso professionale." },
            ],
        },
        {
            id: "foroLei",
            heading: "11. Legge applicabile e foro competente",
            blocks: [
                { kind: "paragrafo", texto: "Queste condizioni sono regolate dalle leggi della Repubblica Federativa del Brasile. Per qualsiasi controversia relativa a esse è competente il foro di Fortaleza, Ceará, Brasile." },
                { kind: "paragrafo", texto: "Se contratti come consumatore, questa scelta non ti priva dei diritti che ti riconoscono le norme imperative a tutela dei consumatori, compreso quello di rivolgerti ai giudici del luogo in cui risiedi." },
            ],
        },
    ],
}

export default termsIt
