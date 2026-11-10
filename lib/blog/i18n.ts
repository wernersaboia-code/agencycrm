import type { BlogLocale } from "./locales"

export interface BlogLabels {
    /** Título da lista de outros artigos ao pé do post. */
    readAlso: string
    readMore: string
    publishedOn: string
    allCategories: string
    otherLanguages: string
    empty: string
    previous: string
    next: string
    pageOf: string
    /** <title> do índice do blog; o layout acrescenta " | Easy Prospect". */
    metaTitle: string
    metaDescription: string
    localeName: Record<BlogLocale, string>
}

// Nomes dos idiomas, cada bloco no próprio idioma.
const NAMES: Record<BlogLocale, Record<BlogLocale, string>> = {
    pt: { pt: "Português", de: "Alemão", en: "Inglês", es: "Espanhol", fr: "Francês", ar: "Árabe", it: "Italiano", nl: "Holandês" },
    de: { pt: "Portugiesisch", de: "Deutsch", en: "Englisch", es: "Spanisch", fr: "Französisch", ar: "Arabisch", it: "Italienisch", nl: "Niederländisch" },
    en: { pt: "Portuguese", de: "German", en: "English", es: "Spanish", fr: "French", ar: "Arabic", it: "Italian", nl: "Dutch" },
    es: { pt: "Portugués", de: "Alemán", en: "Inglés", es: "Español", fr: "Francés", ar: "Árabe", it: "Italiano", nl: "Neerlandés" },
    fr: { pt: "Portugais", de: "Allemand", en: "Anglais", es: "Espagnol", fr: "Français", ar: "Arabe", it: "Italien", nl: "Néerlandais" },
    ar: { pt: "البرتغالية", de: "الألمانية", en: "الإنجليزية", es: "الإسبانية", fr: "الفرنسية", ar: "العربية", it: "الإيطالية", nl: "الهولندية" },
    it: { pt: "Portoghese", de: "Tedesco", en: "Inglese", es: "Spagnolo", fr: "Francese", ar: "Arabo", it: "Italiano", nl: "Olandese" },
    nl: { pt: "Portugees", de: "Duits", en: "Engels", es: "Spaans", fr: "Frans", ar: "Arabisch", it: "Italiaans", nl: "Nederlands" },
}

const UI: Record<BlogLocale, Omit<BlogLabels, "localeName">> = {
    pt: { readAlso: "Leia também", readMore: "Ler mais", publishedOn: "Publicado em", allCategories: "Todas as categorias", otherLanguages: "Outros idiomas", empty: "Nenhum artigo publicado ainda.", previous: "Anterior", next: "Próxima", pageOf: "Página {current} de {total}", metaTitle: "Blog para exportadores: mercados e importadores", metaDescription: "Artigos para quem exporta: tamanho e tendências de mercados, como encontrar importadores e distribuidores e como fazer o primeiro contato do jeito certo." },
    de: { readAlso: "Lesen Sie auch", readMore: "Weiterlesen", publishedOn: "Veröffentlicht am", allCategories: "Alle Kategorien", otherLanguages: "Andere Sprachen", empty: "Noch keine Artikel veröffentlicht.", previous: "Zurück", next: "Weiter", pageOf: "Seite {current} von {total}", metaTitle: "Blog für Exporteure: Märkte und Importeure", metaDescription: "Artikel für Exporteure: Marktvolumen und Trends, wie Sie Importeure und Distributoren finden und den Erstkontakt richtig angehen." },
    en: { readAlso: "Keep reading", readMore: "Read more", publishedOn: "Published on", allCategories: "All categories", otherLanguages: "Other languages", empty: "No articles published yet.", previous: "Previous", next: "Next", pageOf: "Page {current} of {total}", metaTitle: "Blog for exporters: markets and importers", metaDescription: "Articles for exporters: market size and trends, how to find importers and distributors, and how to make first contact the right way." },
    es: { readAlso: "Lea también", readMore: "Leer más", publishedOn: "Publicado el", allCategories: "Todas las categorías", otherLanguages: "Otros idiomas", empty: "Aún no hay artículos publicados.", previous: "Anterior", next: "Siguiente", pageOf: "Página {current} de {total}", metaTitle: "Blog para exportadores: mercados e importadores", metaDescription: "Artículos para quienes exportan: tamaño y tendencias de los mercados, cómo encontrar importadores y distribuidores y cómo hacer bien el primer contacto." },
    fr: { readAlso: "À lire aussi", readMore: "Lire la suite", publishedOn: "Publié le", allCategories: "Toutes les catégories", otherLanguages: "Autres langues", empty: "Aucun article publié pour le moment.", previous: "Précédent", next: "Suivant", pageOf: "Page {current} sur {total}", metaTitle: "Blog pour exportateurs : marchés et importateurs", metaDescription: "Des articles pour les exportateurs : taille et tendances des marchés, comment trouver importateurs et distributeurs et réussir le premier contact." },
    ar: { readAlso: "اقرأ أيضًا", readMore: "اقرأ المزيد", publishedOn: "نُشر في", allCategories: "كل الفئات", otherLanguages: "لغات أخرى", empty: "لا توجد مقالات منشورة بعد.", previous: "السابق", next: "التالي", pageOf: "الصفحة {current} من {total}", metaTitle: "مدونة للمصدّرين: الأسواق والمستوردون", metaDescription: "مقالات للمصدّرين: حجم الأسواق واتجاهاتها، وكيفية العثور على المستوردين والموزعين وإجراء أول اتصال بالطريقة الصحيحة." },
    it: { readAlso: "Leggi anche", readMore: "Leggi di più", publishedOn: "Pubblicato il", allCategories: "Tutte le categorie", otherLanguages: "Altre lingue", empty: "Nessun articolo pubblicato ancora.", previous: "Precedente", next: "Successivo", pageOf: "Pagina {current} di {total}", metaTitle: "Blog per esportatori: mercati e importatori", metaDescription: "Articoli per chi esporta: dimensioni e tendenze dei mercati, come trovare importatori e distributori e come gestire bene il primo contatto." },
    nl: { readAlso: "Lees ook", readMore: "Lees meer", publishedOn: "Gepubliceerd op", allCategories: "Alle categorieën", otherLanguages: "Andere talen", empty: "Nog geen artikelen gepubliceerd.", previous: "Vorige", next: "Volgende", pageOf: "Pagina {current} van {total}", metaTitle: "Blog voor exporteurs: markten en importeurs", metaDescription: "Artikelen voor exporteurs: marktomvang en trends, hoe u importeurs en distributeurs vindt en hoe u het eerste contact goed aanpakt." },
}

export function getBlogLabels(locale: BlogLocale): BlogLabels {
    return { ...UI[locale], localeName: NAMES[locale] }
}
