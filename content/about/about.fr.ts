import type { AboutDocument } from "./types"

// Transcrição literal de "Pourquoi EasyProspect.docx".
// Não reescrever: o sócio pediu o texto dele palavra por palavra. Mudança aqui
// só a partir de uma versão nova do documento.
//
// Exceção registrada: os dois últimos parágrafos de "Origine de nos données" não estão
// no documento deste idioma — são a tradução do trecho sobre disparo em massa
// que só o documento alemão traz, incluído nos 7 a pedido do Werner.
const aboutFr: AboutDocument = {
    eyebrow: "Pourquoi EasyProspect ?",
    title: "Votre partenaire pour une entrée réussie sur les marchés internationaux",
    intro: [
        { kind: "paragrafo", texto: "Les nouveaux marchés d'exportation offrent d'énormes opportunités de croissance. Dans le même temps, la recherche d'importateurs, de distributeurs adaptés et d'informations de marché fiables prend souvent des semaines, voire des mois." },
        { kind: "paragrafo", texto: "EasyProspect a été développé pour simplifier considérablement ce processus." },
        { kind: "paragrafo", texto: "Nous accompagnons les fabricants, les entreprises de marques et les exportateurs dans l'ouverture plus rapide de nouveaux marchés de vente – grâce à des études d'entrée sur le marché professionnelles et à des annuaires d'importateurs et de distributeurs soigneusement recherchés." },
        { kind: "paragrafo", texto: "Nos études combinent de nombreuses années d'expérience dans la vente internationale avec une méthodologie de recherche moderne. Des méthodes d'analyse assistées par l'IA ainsi qu'un contrôle qualité manuel final sont utilisés." },
        { kind: "paragrafo", texto: "Le résultat est une information structurée et pratique qui vous aide à prendre des décisions éclairées et à identifier les bons partenaires de distribution pour vos produits." },
    ],
    sections: [
        {
            id: "metodologia",
            heading: "Notre méthodologie",
            sub: "Une recherche soignée plutôt que des listes d'adresses confuses",
            blocks: [
                { kind: "paragrafo", texto: "Chez EasyProspect, l'accent n'est pas mis sur la quantité de données, mais sur leur pertinence pratique." },
                { kind: "paragrafo", texto: "Pour chaque étude d'entrée sur le marché, de nombreuses sources d'information accessibles au public sont systématiquement évaluées. Les technologies d'IA modernes soutiennent la recherche, l'analyse et la structuration de grands volumes de données. Tous les résultats sont ensuite examinés par nos soins et évalués quant à leur plausibilité et leur utilité pour l'export." },
                { kind: "paragrafo", texto: "Notre objectif n'est pas de lister le plus grand nombre possible d'entreprises, mais d'identifier celles qui pourraient réellement présenter un intérêt pour votre projet d'exportation." },
            ],
        },
        {
            id: "fontes",
            heading: "Origine de nos données",
            blocks: [
                { kind: "paragrafo", texto: "Toutes les informations proviennent exclusivement de sources accessibles au public." },
                { kind: "paragrafo", texto: "Celles-ci comprennent notamment :" },
                { kind: "lista", itens: [
                    "Sites web d'entreprises",
                    "Chambres de commerce",
                    "Associations professionnelles",
                    "Catalogues de salons",
                    "Annuaires d'entreprises",
                    "Portails spécialisés",
                    "Autres informations commerciales librement accessibles",
                ] },
                { kind: "paragrafo", texto: "Avant publication, les données sont vérifiées quant à leur plausibilité, leur exhaustivité et leur utilisabilité pratique." },
                { kind: "paragrafo", texto: "Comme les personnes de contact et les structures des entreprises peuvent évoluer régulièrement, nos études sont mises à jour à intervalles réguliers." },
                { kind: "paragrafo", texto: "Nos annuaires d'importateurs ne sont expressément pas destinés à des envois de masse impersonnels." },
                { kind: "paragrafo", texto: "Ils servent plutôt de base solide à une approche individuelle et soigneusement préparée de partenaires commerciaux potentiels — car, dans le commerce international, les relations d'affaires fructueuses naissent avant tout de la confiance et du contact personnel." },
            ],
        },
        {
            id: "verificacao",
            heading: "Examen des entreprises",
            blocks: [
                { kind: "paragrafo", texto: "Chaque entreprise est examinée sur la base d'informations publiquement disponibles avant d'être incluse dans l'un de nos annuaires." },
                { kind: "paragrafo", texto: "En particulier, nous vérifions" },
                { kind: "lista", itens: [
                    "si l'entreprise opère dans le secteur concerné,",
                    "si des activités d'importation ou de distribution sont identifiables,",
                    "s'il existe une présence professionnelle de l'entreprise,",
                    "si des coordonnées de contact actuelles sont disponibles,",
                    "et si l'entreprise peut généralement être considérée comme un partenaire de distribution potentiel.",
                ] },
                { kind: "paragrafo", texto: "Cet examen ne remplace pas une qualification commerciale individuelle, mais il augmente la probabilité que les entreprises listées soient pertinentes pour votre projet d'exportation." },
            ],
        },
        {
            id: "atualizacao",
            heading: "Mises à jour régulières",
            blocks: [
                { kind: "paragrafo", texto: "Les marchés internationaux évoluent constamment." },
                { kind: "paragrafo", texto: "C'est pourquoi nous examinons et mettons à jour régulièrement nos études d'entrée sur le marché et nos annuaires d'entreprises afin que vous disposiez des informations les plus actuelles et les plus pertinentes possible sur le plan pratique." },
            ],
        },
        {
            id: "entrega",
            heading: "Ce que vous recevez",
            blocks: [
                { kind: "paragrafo", texto: "Chaque étude d'entrée sur le marché vous fournit bien plus qu'une liste d'adresses classique." },
                { kind: "paragrafo", texto: "Vous recevez une base de décision compacte et orientée vers la pratique pour votre entrée sur le marché." },
                { kind: "paragrafo", texto: "Selon le secteur, une étude comprend, entre autres :" },
                { kind: "lista", itens: [
                    "Aperçu du marché cible",
                    "Analyse de la situation du secteur",
                    "Potentiel de marché et tendances actuelles",
                    "Exigences d'accès au marché",
                    "Structures de vente et de distribution",
                    "Annuaire des importateurs et distributeurs pertinents",
                    "Conseils pour aborder avec succès les partenaires commerciaux potentiels",
                    "Recommandations pour préparer votre entrée sur le marché",
                ] },
                { kind: "paragrafo", texto: "Notre objectif est de vous décharger d'une grande partie de la recherche chronophage afin que vous puissiez vous concentrer sur la construction de nouvelles relations commerciales." },
            ],
        },
        {
            id: "limites",
            heading: "Ce que nous ne pouvons pas promettre",
            blocks: [
                { kind: "paragrafo", texto: "Le succès d'un projet d'exportation dépend de nombreux facteurs." },
                { kind: "paragrafo", texto: "Par conséquent, nous ne pouvons pas garantir que chaque entreprise répondra à une approche de contact ou qu'une relation commerciale en résultera immédiatement." },
                { kind: "paragrafo", texto: "Les facteurs déterminants comprennent, entre autres :" },
                { kind: "lista", itens: [
                    "la compétitivité de votre produit,",
                    "la demande sur le marché cible,",
                    "votre tarification,",
                    "votre capacité de livraison,",
                    "votre stratégie marketing et commerciale,",
                    "le moment de l'approche de contact,",
                    "ainsi que les décisions d'achat individuelles des importateurs respectifs.",
                ] },
                { kind: "paragrafo", texto: "Ce que nous pouvons cependant vous offrir, c'est une base solide pour votre planification d'exportation et un gain de temps significatif dans l'identification de partenaires de distribution adaptés." },
            ],
        },
        {
            id: "confianca",
            heading: "Pourquoi les entreprises font confiance à EasyProspect",
            blocks: [
                { kind: "cartoes", cartoes: [
                    { titulo: "Orienté vers la pratique", texto: "Nos études sont créées spécifiquement pour les fabricants, les exportateurs et les responsables des ventes internationales." },
                    { titulo: "Plus que de simples listes d'adresses", texto: "Vous recevez des informations de marché structurées, des recommandations d'action concrètes et des annuaires d'importateurs et de distributeurs soigneusement recherchés." },
                    { titulo: "Soigneusement recherché", texto: "Notre recherche repose sur une méthodologie systématique et fait l'objet d'un contrôle qualité manuel avant publication." },
                    { titulo: "Gagnez du temps", texto: "Au lieu de passer des semaines à rechercher des entreprises adaptées, vous pouvez immédiatement commencer à approcher des partenaires de distribution potentiels." },
                    { titulo: "Régulièrement mis à jour", texto: "Nos études sont continuellement examinées et révisées ou complétées selon les besoins." },
                    { titulo: "Développé pour votre succès à l'exportation", texto: "Notre objectif n'est pas de vendre le plus de données possible, mais de fournir une base de travail solide avec laquelle vous pouvez ouvrir de nouveaux marchés de manière efficace et professionnelle." },
                ] },
            ],
        },
        {
            id: "cta",
            heading: "Avez-vous déjà trouvé le bon marché cible ?",
            blocks: [
                { kind: "paragrafo", texto: "Découvrez nos études d'entrée sur le marché et nos annuaires d'importateurs pour de nombreux pays et secteurs." },
                { kind: "paragrafo", texto: "Avec EasyProspect, vous recevez des informations de marché solides et des partenaires de distribution potentiels soigneusement recherchés – afin que vous puissiez prendre les bonnes décisions plus rapidement et ouvrir avec succès de nouveaux marchés d'exportation." },
                { kind: "paragrafo", texto: "Sélectionnez dès maintenant la bonne étude d'entrée sur le marché." },
            ],
        },
    ],
}

export default aboutFr
