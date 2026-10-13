import type { LegalDocument } from "./types"

const termsFr: LegalDocument = {
    title: "Conditions d'utilisation",
    lastUpdated: "2026-10-13",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Acceptation des conditions",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect est exploité par Werner Wild Saboia Carvalho Marinho, personne physique. En accédant au service ou en l'utilisant, vous acceptez les présentes conditions. Si vous ne les acceptez pas, n'utilisez pas le service." },
            ],
        },
        {
            id: "servico",
            heading: "2. Le service",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect vend des études d'entrée sur le marché, livrées au format PDF. Une fois le paiement confirmé, l'étude est disponible au téléchargement dans Mes achats." },
                { kind: "paragrafo", texto: "Les prix sont affichés dans le catalogue dans la devise choisie, et le paiement est encaissé par le prestataire de paiement indiqué lors de la commande." },
                { kind: "paragrafo", texto: "Les études sont élaborées à partir de sources publiques et reflètent la situation à la date de révision indiquée sur la page de chaque étude. Les entreprises changent de contacts, de structure et de stratégie : vérifiez les informations avant de prendre des décisions commerciales." },
            ],
        },
        {
            id: "conta",
            heading: "3. Inscription et compte",
            blocks: [
                { kind: "paragrafo", texto: "Il vous appartient de préserver la confidentialité de vos identifiants. Prévenez-nous immédiatement si vous constatez une utilisation non autorisée de votre compte." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "4. Usage acceptable",
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
            heading: "5. Propriété intellectuelle",
            blocks: [
                { kind: "paragrafo", texto: "Les études achetées sont destinées à l'usage de votre entreprise. Il n'est pas permis de les revendre, de les redistribuer ni de les publier." },
                { kind: "paragrafo", texto: "Les données que vous importez ou enregistrez dans le CRM restent sous votre responsabilité. Nous n'en revendiquons pas la propriété, sauf dans la mesure nécessaire au fonctionnement du service." },
            ],
        },
        {
            id: "pagamentos",
            heading: "6. Paiements et remboursements",
            blocks: [
                { kind: "paragrafo", texto: "Les achats du catalogue sont traités par un prestataire de paiement certifié. Le remboursement est intégral et inconditionnel dans un délai de 14 jours après l'achat, conformément à la Politique de remboursement." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "7. Limitation de responsabilité",
            blocks: [
                { kind: "paragrafo", texto: "Le service est fourni en l'état. Nous ne garantissons ni une disponibilité ininterrompue ni un résultat commercial déterminé : le retour d'un projet d'exportation dépend de facteurs qui échappent à notre contrôle." },
                { kind: "paragrafo", texto: "Notre responsabilité est limitée au montant que vous avez payé pour le service au cours des 12 derniers mois." },
            ],
        },
        {
            id: "rescisao",
            heading: "8. Résiliation",
            blocks: [
                { kind: "paragrafo", texto: "Nous pouvons suspendre ou fermer les comptes qui enfreignent les présentes conditions. Vous pouvez demander la fermeture du vôtre à tout moment en écrivant à contato@easyprospect.com.br ; tant que le compte existe, l'accès aux achats déjà effectués est maintenu." },
            ],
        },
        {
            id: "alteracoes",
            heading: "9. Modifications",
            blocks: [
                { kind: "paragrafo", texto: "Les présentes conditions peuvent être mises à jour. La date figurant en tête indique la dernière révision, et les modifications importantes sont annoncées à l'avance. La poursuite de l'utilisation après une modification vaut acceptation." },
            ],
        },
        {
            id: "idade",
            heading: "10. Âge minimum",
            blocks: [
                { kind: "paragrafo", texto: "Le service est destiné aux personnes de plus de 18 ans et à un usage professionnel." },
            ],
        },
        {
            id: "foroLei",
            heading: "11. Droit applicable et juridiction compétente",
            blocks: [
                { kind: "paragrafo", texto: "Les présentes conditions sont régies par le droit de la République fédérative du Brésil. Tout litige les concernant relève de la compétence des tribunaux de Fortaleza, Ceará, Brésil." },
                { kind: "paragrafo", texto: "Si vous contractez en tant que consommateur, ce choix ne vous prive pas des droits que vous accordent les règles impératives de protection des consommateurs, y compris celui de saisir les tribunaux du lieu où vous résidez." },
            ],
        },
    ],
}

export default termsFr
