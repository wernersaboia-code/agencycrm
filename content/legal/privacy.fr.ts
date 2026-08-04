import type { LegalDocument } from "./types"

const privacyFr: LegalDocument = {
    title: "Politique de confidentialité",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "responsavel",
            heading: "1. Qui est le responsable",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect est exploité par Werner Wild Saboia Carvalho Marinho, personne physique, responsable des décisions relatives au traitement des données décrites dans la présente politique." },
                { kind: "paragrafo", texto: "Pour toute question relative aux données personnelles, y compris l'exercice des droits décrits ci-dessous, écrivez à contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Données que nous traitons",
            blocks: [
                { kind: "paragrafo", texto: "Nous traitons les informations nécessaires au fonctionnement du service :" },
                { kind: "lista", itens: [
                    "Données de compte : nom, adresse e-mail et avatar, fournis par vous lors de l'inscription et gérés par Supabase Auth.",
                    "Données d'achat : articles acquis, montant, devise et historique de téléchargement.",
                    "Données de paiement : identifiants de la transaction chez Stripe. Nous ne recevons ni ne conservons de numéros de carte.",
                    "Données d'utilisation du site : pages consultées et événements de navigation, uniquement lorsque vous acceptez les cookies de mesure.",
                    "Données que vous saisissez dans le CRM : contacts, entreprises et enregistrements d'activité que vous importez ou créez.",
                    "Données de contact professionnel de tiers : les entreprises et les personnes de contact qui composent les listes du catalogue. Voir la section dédiée ci-dessous.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Base légale de chaque traitement",
            blocks: [
                { kind: "lista", itens: [
                    "Créer et maintenir votre compte, traiter l'achat et livrer l'étude acquise : exécution du contrat qui nous lie.",
                    "Envoyer des messages relatifs à votre achat, comme la confirmation et la mise à disposition du téléchargement : exécution du contrat.",
                    "Conserver les registres de vente pendant les durées exigées : respect d'une obligation légale.",
                    "Mesurer l'utilisation du site : consentement, que vous pouvez refuser ou retirer à tout moment via la bannière de cookies.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. Comment nous utilisons les données",
            blocks: [
                { kind: "lista", itens: [
                    "Faire fonctionner le catalogue, le paiement et la livraison des études acquises.",
                    "Donner un accès permanent à vos achats dans l'espace Mes achats.",
                    "Envoyer les notifications transactionnelles liées à votre compte et à vos achats.",
                    "Faire fonctionner le CRM pour les données que vous créez ou importez vous-même.",
                ] },
                { kind: "paragrafo", texto: "Nous ne vendons pas de données personnelles d'utilisateurs et nous n'utilisons pas vos données de compte pour entraîner des modèles." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Avec qui nous partageons",
            blocks: [
                { kind: "paragrafo", texto: "Nous faisons appel à des prestataires pour des opérations précises, chacun n'ayant accès qu'à ce qui est nécessaire :" },
                { kind: "lista", itens: [
                    "Supabase — base de données, authentification et stockage de fichiers.",
                    "Stripe — traitement des paiements.",
                    "Vercel — hébergement de l'application et mesure de performance.",
                    "Zoho — boîte de l'adresse de contact.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. Transferts internationaux",
            blocks: [
                { kind: "paragrafo", texto: "La base de données est hébergée au Brésil. Les autres prestataires listés ci-dessus exploitent une infrastructure dans plusieurs pays, dont les États-Unis et l'Union européenne." },
                { kind: "paragrafo", texto: "Si vous vous trouvez dans l'Union européenne, cela signifie que vos données peuvent être traitées en dehors de l'Espace économique européen. À cette date, le Brésil ne fait pas l'objet d'une décision d'adéquation de la Commission européenne." },
            ],
        },
        {
            id: "listas",
            heading: "7. Données de contact dans les listes du catalogue",
            blocks: [
                { kind: "paragrafo", texto: "Les listes vendues dans le catalogue rassemblent des données de contact professionnel d'entreprises : raison sociale, pays, secteur, site web, adresses e-mail et numéros de téléphone institutionnels. Certaines listes comportent aussi le nom et la fonction d'une personne de contact." },
                { kind: "paragrafo", texto: "Ces données proviennent de sources publiques — sites institutionnels, registres d'entreprises et autres informations accessibles au public — et ne sont pas collectées auprès de la personne elle-même." },
                { kind: "paragrafo", texto: "Si vous avez repéré des données vous concernant dans l'une de nos listes et souhaitez y accéder, les faire rectifier, vous opposer au traitement ou en demander l'effacement, écrivez à contato@easyprospect.com.br. Les demandes de ce type sont traitées." },
            ],
        },
        {
            id: "direitos",
            heading: "8. Vos droits",
            blocks: [
                { kind: "paragrafo", texto: "Vous pouvez demander à tout moment :" },
                { kind: "lista", itens: [
                    "L'accès aux données que nous traitons à votre sujet.",
                    "La rectification de données incomplètes ou obsolètes.",
                    "L'effacement de vos données, sous réserve des obligations légales de conservation.",
                    "La portabilité des données que vous nous avez fournies.",
                    "L'opposition à un traitement et le retrait du consentement, lorsque celui-ci en est la base.",
                ] },
                { kind: "paragrafo", texto: "Il suffit d'écrire à contato@easyprospect.com.br. Vous avez également le droit d'introduire une réclamation auprès d'une autorité de protection des données — l'ANPD, au Brésil, ou l'autorité de contrôle de votre pays, dans l'Union européenne." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookies et mesure",
            blocks: [
                { kind: "paragrafo", texto: "Nous utilisons des cookies essentiels pour l'authentification et pour mémoriser vos préférences, comme la langue. Ils sont nécessaires au fonctionnement du site et ne dépendent pas du consentement." },
                { kind: "paragrafo", texto: "Les cookies de mesure d'audience ne sont chargés qu'après votre acceptation, dans la bannière affichée lors de la première visite. Les refuser ne limite aucune fonctionnalité." },
            ],
        },
        {
            id: "retencao",
            heading: "10. Combien de temps nous conservons les données",
            blocks: [
                { kind: "paragrafo", texto: "Nous conservons vos données de compte tant que celui-ci existe. Après la suppression du compte, les données personnelles sont effacées ou anonymisées sous 90 jours." },
                { kind: "paragrafo", texto: "Les registres d'achat sont conservés pendant les durées exigées par la législation fiscale, même après la suppression du compte." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Modifications et contact",
            blocks: [
                { kind: "paragrafo", texto: "La présente politique peut être mise à jour. La date indiquée en haut correspond à la dernière révision, et les modifications importantes sont annoncées sur le site." },
                { kind: "paragrafo", texto: "Questions sur cette politique : contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyFr
