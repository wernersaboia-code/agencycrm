import type { LegalDocument } from "./types"

const termsFr: LegalDocument = {
    title: "Conditions d'utilisation",
    lastUpdated: "2026-08-05",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Acceptation des conditions",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect est exploité par Werner Wild Saboia Carvalho Marinho, personne physique. En accédant au service ou en l'utilisant, vous acceptez les présentes conditions. Si vous ne les acceptez pas, n'utilisez pas le service." },
            ],
        },
        {
            id: "conta",
            heading: "2. Inscription et compte",
            blocks: [
                { kind: "paragrafo", texto: "Il vous appartient de préserver la confidentialité de vos identifiants. Prévenez-nous immédiatement si vous constatez une utilisation non autorisée de votre compte." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Usage acceptable",
            blocks: [
                { kind: "paragrafo", texto: "Vous vous engagez à ne pas utiliser le service pour :" },
                { kind: "lista", itens: [
                    "Envoyer du spam, du phishing ou des contenus malveillants.",
                    "Traiter des données de contacts sans base légale adéquate.",
                    "Tenter d'accéder aux données d'autres utilisateurs ou à d'autres espaces de travail.",
                    "Procéder à de l'ingénierie inverse ou exploiter des vulnérabilités.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "4. Propriété intellectuelle",
            blocks: [
                { kind: "paragrafo", texto: "Les études et les listes achetées sont destinées à l'usage de votre entreprise. Il n'est pas permis de les revendre, de les redistribuer ni de les publier." },
                { kind: "paragrafo", texto: "Les données que vous importez ou enregistrez dans le CRM restent sous votre responsabilité. Nous n'en revendiquons pas la propriété, sauf dans la mesure nécessaire au fonctionnement du service." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Paiements et remboursements",
            blocks: [
                { kind: "paragrafo", texto: "Les achats en réals brésiliens sont traités par Mercado Pago. Les achats en euros ou en dollars américains sont traités par Paddle, qui agit en tant que vendeur enregistré (Merchant of Record) de la transaction et est responsable de la collecte des taxes applicables, y compris la TVA dans l'Union européenne. Dans ces cas, le débit apparaît sur votre relevé au nom de Paddle." },
                { kind: "paragrafo", texto: "Les remboursements peuvent être demandés dans les 14 jours suivant l'achat, à condition que le fichier n'ait pas été téléchargé. Écrivez à contato@easyprospect.com.br. Les achats traités par Paddle sont remboursés par Paddle, après notre autorisation." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Limitation de responsabilité",
            blocks: [
                { kind: "paragrafo", texto: "Le service est fourni en l'état. Nous ne garantissons ni une disponibilité ininterrompue ni un résultat commercial déterminé : le retour d'un projet d'exportation dépend de facteurs qui échappent à notre contrôle." },
                { kind: "paragrafo", texto: "Notre responsabilité est limitée au montant que vous avez payé pour le service au cours des 12 derniers mois." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Résiliation",
            blocks: [
                { kind: "paragrafo", texto: "Nous pouvons suspendre ou fermer les comptes qui enfreignent les présentes conditions. Vous pouvez fermer le vôtre à tout moment depuis les paramètres du compte ; l'accès aux achats déjà effectués est maintenu tant que le compte existe." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Modifications",
            blocks: [
                { kind: "paragrafo", texto: "Les présentes conditions peuvent être mises à jour. La date figurant en tête indique la dernière révision, et les modifications importantes sont annoncées à l'avance. La poursuite de l'utilisation après une modification vaut acceptation." },
            ],
        },
        {
            id: "idade",
            heading: "9. Âge minimum",
            blocks: [
                { kind: "paragrafo", texto: "Le service est destiné aux personnes de plus de 18 ans et à un usage professionnel." },
            ],
        },
    ],
}

export default termsFr
