import type { LegalDocument } from "./types"

const termsIt: LegalDocument = {
    title: "Condizioni d'uso",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Accettazione delle condizioni",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect è gestito da Werner Wild Saboia Carvalho Marinho, persona fisica. Accedendo al servizio o utilizzandolo accetti queste condizioni. Se non le accetti, non utilizzare il servizio." },
            ],
        },
        {
            id: "conta",
            heading: "2. Registrazione e account",
            blocks: [
                { kind: "paragrafo", texto: "Sei responsabile della riservatezza delle tue credenziali. Avvisaci subito se rilevi un uso non autorizzato del tuo account." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Uso accettabile",
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
            heading: "4. Proprietà intellettuale",
            blocks: [
                { kind: "paragrafo", texto: "Gli studi e le liste acquistati sono destinati all'uso della tua azienda. Non è consentito rivenderli, ridistribuirli o pubblicarli." },
                { kind: "paragrafo", texto: "I dati che importi o inserisci nel CRM restano sotto la tua responsabilità. Non ne rivendichiamo la proprietà, salvo per quanto necessario a far funzionare il servizio." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Pagamenti e rimborsi",
            blocks: [
                { kind: "paragrafo", texto: "Gli acquisti nel catalogo sono elaborati tramite un fornitore di pagamento certificato. Il rimborso è integrale e incondizionato entro 14 giorni dall'acquisto, secondo la Politica di rimborso." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Limitazione di responsabilità",
            blocks: [
                { kind: "paragrafo", texto: "Il servizio è fornito così com'è. Non garantiamo una disponibilità ininterrotta né un risultato commerciale specifico: il ritorno di un progetto di esportazione dipende da fattori fuori dal nostro controllo." },
                { kind: "paragrafo", texto: "La nostra responsabilità è limitata all'importo che hai pagato per il servizio negli ultimi 12 mesi." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Risoluzione",
            blocks: [
                { kind: "paragrafo", texto: "Possiamo sospendere o chiudere gli account che violano queste condizioni. Puoi chiudere il tuo in qualsiasi momento dalle impostazioni dell'account; l'accesso agli acquisti già effettuati resta disponibile finché l'account esiste." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Modifiche",
            blocks: [
                { kind: "paragrafo", texto: "Queste condizioni possono essere aggiornate. La data in alto indica l'ultima revisione e le modifiche rilevanti sono annunciate in anticipo. L'uso continuato dopo la modifica costituisce accettazione." },
            ],
        },
        {
            id: "idade",
            heading: "9. Età minima",
            blocks: [
                { kind: "paragrafo", texto: "Il servizio è destinato a persone maggiori di 18 anni e a un uso professionale." },
            ],
        },
    ],
}

export default termsIt
