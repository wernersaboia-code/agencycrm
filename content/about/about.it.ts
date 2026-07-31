import type { AboutDocument } from "./types"

// Transcrição literal de "Perque EasyProspect IT.docx".
// Não reescrever: o sócio pediu o texto dele palavra por palavra. Mudança aqui
// só a partir de uma versão nova do documento.
//
// Exceção registrada: os dois últimos parágrafos de "Origine dei nostri dati" não estão
// no documento deste idioma — são a tradução do trecho sobre disparo em massa
// que só o documento alemão traz, incluído nos 7 a pedido do Werner.
const aboutIt: AboutDocument = {
    eyebrow: "Perché EasyProspect?",
    title: "Il vostro partner per un ingresso di successo nei mercati internazionali",
    intro: [
        { kind: "paragrafo", texto: "I nuovi mercati di esportazione offrono enormi opportunità di crescita. Allo stesso tempo, la ricerca di importatori, distributori idonei e di informazioni di mercato affidabili richiede spesso settimane o addirittura mesi." },
        { kind: "paragrafo", texto: "EasyProspect è stato sviluppato per rendere questo processo significativamente più semplice." },
        { kind: "paragrafo", texto: "Supportiamo produttori, aziende di marca ed esportatori nell’aprire più rapidamente nuovi mercati di vendita – con studi professionali di ingresso sul mercato e directory di importatori e distributori accuratamente ricercate." },
        { kind: "paragrafo", texto: "I nostri studi combinano molti anni di esperienza nella vendita internazionale con una metodologia di ricerca moderna. Vengono utilizzati sia metodi di analisi supportati dall’IA sia un controllo di qualità manuale finale." },
        { kind: "paragrafo", texto: "Il risultato è un’informazione strutturata e pratica che vi aiuta a prendere decisioni informate e a individuare i partner di distribuzione giusti per i vostri prodotti." },
    ],
    sections: [
        {
            id: "metodologia",
            heading: "La nostra metodologia",
            sub: "Ricerca accurata invece di elenchi di indirizzi confusi",
            blocks: [
                { kind: "paragrafo", texto: "In EasyProspect, l’attenzione non è rivolta alla quantità di dati, ma alla loro rilevanza pratica." },
                { kind: "paragrafo", texto: "Per ogni studio di ingresso sul mercato vengono valutate sistematicamente numerose fonti di informazione pubblicamente accessibili. Le moderne tecnologie di IA supportano la ricerca, l’analisi e la strutturazione di grandi volumi di dati. Tutti i risultati vengono poi esaminati da noi e valutati per la loro plausibilità e utilità per l’esportazione." },
                { kind: "paragrafo", texto: "Il nostro obiettivo non è elencare il maggior numero possibile di aziende, ma identificare quelle che potrebbero effettivamente essere di interesse per il vostro progetto di esportazione." },
            ],
        },
        {
            id: "fontes",
            heading: "Origine dei nostri dati",
            blocks: [
                { kind: "paragrafo", texto: "Tutte le informazioni provengono esclusivamente da fonti pubblicamente accessibili." },
                { kind: "paragrafo", texto: "Queste includono, tra le altre:" },
                { kind: "lista", itens: [
                    "Siti web aziendali",
                    "Camere di commercio",
                    "Associazioni di settore",
                    "Cataloghi di fiere",
                    "Directory aziendali",
                    "Portali specializzati",
                    "Altre informazioni commerciali liberamente accessibili",
                ] },
                { kind: "paragrafo", texto: "Prima della pubblicazione, i dati vengono controllati per plausibilità, completezza e utilizzabilità pratica." },
                { kind: "paragrafo", texto: "Poiché le persone di contatto e le strutture aziendali possono cambiare regolarmente, i nostri studi vengono aggiornati a intervalli regolari." },
                { kind: "paragrafo", texto: "Le nostre directory di importatori non sono espressamente destinate a invii di massa impersonali." },
                { kind: "paragrafo", texto: "Servono piuttosto come base solida per un approccio individuale e accuratamente preparato a potenziali partner commerciali, perché nel commercio internazionale le relazioni d'affari di successo nascono soprattutto dalla fiducia e dal contatto personale." },
            ],
        },
        {
            id: "verificacao",
            heading: "Revisione delle aziende",
            blocks: [
                { kind: "paragrafo", texto: "Ogni azienda viene rivista sulla base di informazioni pubblicamente disponibili prima di essere inclusa in una delle nostre directory." },
                { kind: "paragrafo", texto: "In particolare, controlliamo" },
                { kind: "lista", itens: [
                    "se l’azienda opera nel settore pertinente,",
                    "se sono identificabili attività di importazione o distribuzione,",
                    "se esiste una presenza aziendale professionale,",
                    "se sono disponibili dati di contatto aggiornati,",
                    "e se l’azienda possa generalmente essere considerata come potenziale partner di distribuzione.",
                ] },
                { kind: "paragrafo", texto: "Questa revisione non sostituisce la qualificazione individuale delle vendite, ma aumenta la probabilità che le aziende elencate siano rilevanti per il vostro progetto di esportazione." },
            ],
        },
        {
            id: "atualizacao",
            heading: "Aggiornamenti regolari",
            blocks: [
                { kind: "paragrafo", texto: "I mercati internazionali sono in continua evoluzione." },
                { kind: "paragrafo", texto: "Ecco perché rivediamo e aggiorniamo regolarmente i nostri studi di ingresso sul mercato e le directory aziendali, in modo che abbiate accesso alle informazioni più attuali e praticamente rilevanti possibili." },
            ],
        },
        {
            id: "entrega",
            heading: "Cosa ricevete",
            blocks: [
                { kind: "paragrafo", texto: "Ogni studio di ingresso sul mercato vi fornisce significativamente più di un classico elenco di indirizzi." },
                { kind: "paragrafo", texto: "Ricevete una base di decisione compatta e orientata alla pratica per il vostro ingresso sul mercato." },
                { kind: "paragrafo", texto: "A seconda del settore, uno studio include, tra le altre cose:" },
                { kind: "lista", itens: [
                    "Panoramica del mercato di destinazione",
                    "Analisi della situazione del settore",
                    "Potenziale di mercato e tendenze attuali",
                    "Requisiti di accesso al mercato",
                    "Strutture di vendita e distribuzione",
                    "Directory di importatori e distributori rilevanti",
                    "Consigli per avvicinare con successo potenziali partner commerciali",
                    "Raccomandazioni per preparare il vostro ingresso sul mercato",
                ] },
                { kind: "paragrafo", texto: "Il nostro obiettivo è sollevarvi da gran parte della ricerca che richiede tempo, in modo che possiate concentrarvi sulla costruzione di nuove relazioni commerciali." },
            ],
        },
        {
            id: "limites",
            heading: "Cosa non possiamo promettere",
            blocks: [
                { kind: "paragrafo", texto: "Il successo di un progetto di esportazione dipende da molti fattori." },
                { kind: "paragrafo", texto: "Pertanto, non possiamo garantire che ogni azienda risponderà a un approccio di contatto o che ne risulterà immediatamente una relazione commerciale." },
                { kind: "paragrafo", texto: "I fattori decisivi includono, tra gli altri:" },
                { kind: "lista", itens: [
                    "la competitività del vostro prodotto,",
                    "la domanda nel mercato di destinazione,",
                    "il vostro pricing,",
                    "la vostra capacità di consegna,",
                    "la vostra strategia di marketing e vendita,",
                    "il timing dell’approccio di contatto,",
                    "nonché le decisioni di acquisto individuali dei rispettivi importatori.",
                ] },
                { kind: "paragrafo", texto: "Ciò che possiamo offrirvi, tuttavia, è una solida base per la vostra pianificazione dell’esportazione e un notevole risparmio di tempo nell’identificazione di partner di distribuzione idonei." },
            ],
        },
        {
            id: "confianca",
            heading: "Perché le aziende si fidano di EasyProspect",
            blocks: [
                { kind: "cartoes", cartoes: [
                    { titulo: "Orientato alla pratica", texto: "I nostri studi sono creati specificamente per produttori, esportatori e responsabili delle vendite internazionali." },
                    { titulo: "Più che semplici elenchi di indirizzi", texto: "Ricevete informazioni di mercato strutturate, raccomandazioni concrete per l’azione e directory di importatori e distributori accuratamente ricercate." },
                    { titulo: "Ricercato con cura", texto: "La nostra ricerca si basa su una metodologia sistematica ed è sottoposta a un controllo di qualità manuale prima della pubblicazione." },
                    { titulo: "Risparmio di tempo", texto: "Invece di passare settimane a ricercare aziende idonee, potete iniziare immediatamente ad avvicinare potenziali partner di distribuzione." },
                    { titulo: "Aggiornato regolarmente", texto: "I nostri studi vengono continuamente rivisti e revisionati o integrati secondo necessità." },
                    { titulo: "Sviluppato per il vostro successo nell’esportazione", texto: "Il nostro obiettivo non è vendere quanti più dati possibili, ma fornire una solida base di lavoro con cui potete aprire nuovi mercati in modo efficiente e professionale." },
                ] },
            ],
        },
        {
            id: "cta",
            heading: "Avete già trovato il mercato di destinazione giusto?",
            blocks: [
                { kind: "paragrafo", texto: "Scoprite i nostri studi di ingresso sul mercato e le directory di importatori per numerosi paesi e settori." },
                { kind: "paragrafo", texto: "Con EasyProspect ricevete solide informazioni di mercato e potenziali partner di distribuzione accuratamente ricercati – in modo da poter prendere le decisioni giuste più rapidamente e aprire con successo nuovi mercati di esportazione." },
                { kind: "paragrafo", texto: "Selezionate ora lo studio di ingresso sul mercato giusto." },
            ],
        },
    ],
}

export default aboutIt
