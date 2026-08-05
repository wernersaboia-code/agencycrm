import type { LegalDocument } from "./types"

const privacyIt: LegalDocument = {
    title: "Informativa sulla privacy",
    lastUpdated: "2026-08-05",
    sections: [
        {
            id: "responsavel",
            heading: "1. Chi è il titolare",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect è gestito da Werner Wild Saboia Carvalho Marinho, persona fisica, che decide sul trattamento dei dati descritti in questa informativa." },
                { kind: "paragrafo", texto: "Per qualsiasi questione relativa ai dati personali, compreso l'esercizio dei diritti descritti più avanti, scrivi a contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Dati che trattiamo",
            blocks: [
                { kind: "paragrafo", texto: "Trattiamo le informazioni necessarie per far funzionare il servizio:" },
                { kind: "lista", itens: [
                    "Dati dell'account: nome, e-mail e avatar, forniti da te in fase di registrazione e gestiti da Supabase Auth.",
                    "Dati di acquisto: articoli acquistati, importo, valuta e cronologia dei download.",
                    "Dati di pagamento: identificativi della transazione su Mercado Pago o Paddle, a seconda della valuta dell'acquisto. Non riceviamo né conserviamo numeri di carta.",
                    "Dati di utilizzo del sito: pagine visitate ed eventi di navigazione, solo quando accetti i cookie di misurazione.",
                    "Dati inseriti da te nel CRM: contatti, aziende e registrazioni di attività che importi o crei.",
                    "Dati di contatto professionale di terzi: le aziende e le persone di contatto che compongono gli elenchi del catalogo. Vedi la sezione dedicata più avanti.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Base giuridica di ciascun trattamento",
            blocks: [
                { kind: "lista", itens: [
                    "Creare e mantenere il tuo account, gestire l'acquisto e consegnare lo studio acquistato: esecuzione del contratto tra noi.",
                    "Inviare messaggi relativi al tuo acquisto, come la conferma e l'abilitazione del download: esecuzione del contratto.",
                    "Conservare le registrazioni di vendita per i termini richiesti: adempimento di un obbligo legale.",
                    "Misurare l'uso del sito: consenso, che puoi rifiutare o revocare in qualsiasi momento dal banner dei cookie.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. Come usiamo i dati",
            blocks: [
                { kind: "lista", itens: [
                    "Far funzionare il catalogo, il checkout e la consegna degli studi acquistati.",
                    "Dare accesso permanente ai tuoi acquisti nell'area I miei acquisti.",
                    "Inviare notifiche transazionali relative al tuo account e ai tuoi acquisti.",
                    "Far funzionare il CRM per i dati che inserisci o importi tu stesso.",
                ] },
                { kind: "paragrafo", texto: "Non vendiamo dati personali degli utenti e non usiamo i dati del tuo account per addestrare modelli." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Con chi condividiamo",
            blocks: [
                { kind: "paragrafo", texto: "Ci avvaliamo di fornitori per operazioni specifiche, ciascuno con accesso solo a quanto necessario:" },
                { kind: "lista", itens: [
                    "Supabase — database, autenticazione e archiviazione dei file.",
                    "Mercado Pago — elaborazione dei pagamenti in real brasiliani.",
                    "Paddle — elaborazione dei pagamenti in euro e dollari statunitensi, in qualità di Merchant of Record.",
                    "Vercel — hosting dell'applicazione e misurazione delle prestazioni.",
                    "Zoho — casella dell'indirizzo di contatto.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. Trasferimenti internazionali",
            blocks: [
                { kind: "paragrafo", texto: "Il database è ospitato in Brasile. Gli altri fornitori elencati sopra gestiscono infrastrutture in vari paesi, tra cui Stati Uniti e Unione Europea." },
                { kind: "paragrafo", texto: "Se ti trovi nell'Unione Europea, questo significa che i tuoi dati possono essere trattati fuori dallo Spazio economico europeo. Alla data odierna il Brasile non è oggetto di una decisione di adeguatezza della Commissione europea." },
            ],
        },
        {
            id: "listas",
            heading: "7. Dati di contatto negli elenchi del catalogo",
            blocks: [
                { kind: "paragrafo", texto: "Gli elenchi venduti nel catalogo raccolgono dati di contatto professionale di aziende: ragione sociale, paese, settore, sito web, e-mail e numeri di telefono istituzionali. In alcuni elenchi compaiono anche il nome e il ruolo di una persona di contatto." },
                { kind: "paragrafo", texto: "Questi dati provengono da fonti pubbliche — siti istituzionali, registri delle imprese e altre informazioni di pubblico accesso — e non sono raccolti presso la persona stessa." },
                { kind: "paragrafo", texto: "Se hai trovato dati che ti riguardano in uno dei nostri elenchi e vuoi accedervi, farli rettificare, opporti al trattamento o chiederne la cancellazione, scrivi a contato@easyprospect.com.br. Le richieste di questo tipo vengono evase." },
            ],
        },
        {
            id: "direitos",
            heading: "8. I tuoi diritti",
            blocks: [
                { kind: "paragrafo", texto: "Puoi chiedere in qualsiasi momento:" },
                { kind: "lista", itens: [
                    "Accesso ai dati che trattiamo su di te.",
                    "Rettifica di dati incompleti o non aggiornati.",
                    "Cancellazione dei tuoi dati, fatti salvi gli obblighi legali di conservazione.",
                    "Portabilità dei dati che ci hai fornito.",
                    "Opposizione a un trattamento e revoca del consenso, quando è questa la base.",
                ] },
                { kind: "paragrafo", texto: "Basta scrivere a contato@easyprospect.com.br. Hai inoltre il diritto di proporre reclamo a un'autorità di protezione dei dati — l'ANPD, in Brasile, o l'autorità di controllo del tuo paese, nell'Unione Europea." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookie e misurazione",
            blocks: [
                { kind: "paragrafo", texto: "Usiamo cookie essenziali per l'autenticazione e per ricordare le tue preferenze, come la lingua. Sono necessari al funzionamento del sito e non dipendono dal consenso." },
                { kind: "paragrafo", texto: "I cookie di misurazione dell'uso vengono caricati solo dopo la tua accettazione nel banner mostrato alla prima visita. Rifiutarli non limita alcuna funzionalità." },
            ],
        },
        {
            id: "retencao",
            heading: "10. Per quanto tempo conserviamo i dati",
            blocks: [
                { kind: "paragrafo", texto: "Conserviamo i dati del tuo account finché esiste. Dopo l'eliminazione dell'account, i dati personali vengono rimossi o anonimizzati entro 90 giorni." },
                { kind: "paragrafo", texto: "Le registrazioni di acquisto sono conservate per i termini richiesti dalla normativa fiscale, anche dopo l'eliminazione dell'account." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Modifiche e contatti",
            blocks: [
                { kind: "paragrafo", texto: "Questa informativa può essere aggiornata. La data in alto indica l'ultima revisione e le modifiche rilevanti sono annunciate sul sito." },
                { kind: "paragrafo", texto: "Domande su questa informativa: contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyIt
