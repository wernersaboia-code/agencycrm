import type { LegalDocument } from "./types"

const refundFr: LegalDocument = {
    title: "Politique de remboursement",
    lastUpdated: "2026-08-23",
    sections: [
        {
            id: "escopo",
            heading: "1. Ce que couvre cette politique",
            blocks: [
                { kind: "paragrafo", texto: "Cette politique s'applique à toutes les études d'entrée sur le marché vendues dans le catalogue Easy Prospect." },
            ],
        },
        {
            id: "direito",
            heading: "2. Votre droit au remboursement",
            blocks: [
                { kind: "paragrafo", texto: "Vous pouvez demander le remboursement intégral dans un délai de 14 jours calendaires après l'achat, pour quelque motif que ce soit." },
                { kind: "paragrafo", texto: "Aucune justification n'est requise, et ce droit s'applique même si vous avez déjà téléchargé l'étude." },
            ],
        },
        {
            id: "comoPedir",
            heading: "3. Comment en faire la demande",
            blocks: [
                { kind: "paragrafo", texto: "Écrivez à contato@easyprospect.com.br depuis l'adresse e-mail du compte ayant effectué l'achat, en indiquant le numéro de commande. Il n'y a ni formulaire ni étape supplémentaire." },
            ],
        },
        {
            id: "prazo",
            heading: "4. Délai et modalités",
            blocks: [
                { kind: "paragrafo", texto: "Le remboursement est traité dans un délai de 10 jours ouvrés après la demande et restitué par le même moyen de paiement que celui utilisé lors de l'achat." },
                { kind: "paragrafo", texto: "Le temps nécessaire pour que le montant apparaisse sur votre relevé dépend de votre banque ou de l'émetteur de votre carte." },
            ],
        },
        {
            id: "apos",
            heading: "5. Après le remboursement",
            blocks: [
                { kind: "paragrafo", texto: "Une fois le remboursement effectué, l'accès à l'étude prend fin dans Mes achats et le fichier n'est plus disponible au téléchargement." },
            ],
        },
    ],
}

export default refundFr
