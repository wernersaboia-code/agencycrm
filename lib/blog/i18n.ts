import type { BlogLocale } from "./locales"

export interface BlogLabels {
    readMore: string
    publishedOn: string
    allCategories: string
    otherLanguages: string
    empty: string
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
    pt: { readMore: "Ler mais", publishedOn: "Publicado em", allCategories: "Todas as categorias", otherLanguages: "Outros idiomas", empty: "Nenhum artigo publicado ainda." },
    de: { readMore: "Weiterlesen", publishedOn: "Veröffentlicht am", allCategories: "Alle Kategorien", otherLanguages: "Andere Sprachen", empty: "Noch keine Artikel veröffentlicht." },
    en: { readMore: "Read more", publishedOn: "Published on", allCategories: "All categories", otherLanguages: "Other languages", empty: "No articles published yet." },
    es: { readMore: "Leer más", publishedOn: "Publicado el", allCategories: "Todas las categorías", otherLanguages: "Otros idiomas", empty: "Aún no hay artículos publicados." },
    fr: { readMore: "Lire la suite", publishedOn: "Publié le", allCategories: "Toutes les catégories", otherLanguages: "Autres langues", empty: "Aucun article publié pour le moment." },
    ar: { readMore: "اقرأ المزيد", publishedOn: "نُشر في", allCategories: "كل الفئات", otherLanguages: "لغات أخرى", empty: "لا توجد مقالات منشورة بعد." },
    it: { readMore: "Leggi di più", publishedOn: "Pubblicato il", allCategories: "Tutte le categorie", otherLanguages: "Altre lingue", empty: "Nessun articolo pubblicato ancora." },
    nl: { readMore: "Lees meer", publishedOn: "Gepubliceerd op", allCategories: "Alle categorieën", otherLanguages: "Andere talen", empty: "Nog geen artikelen gepubliceerd." },
}

export function getBlogLabels(locale: BlogLocale): BlogLabels {
    return { ...UI[locale], localeName: NAMES[locale] }
}
