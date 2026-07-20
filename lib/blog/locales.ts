// Mantido como reexport para não quebrar de uma vez os arquivos do blog que
// importam daqui. A fonte única é lib/i18n/locales.ts.
export {
    LOCALES as BLOG_LOCALES,
    DEFAULT_LOCALE as DEFAULT_BLOG_LOCALE,
    isLocale as isBlogLocale,
    isRtlLocale,
    dirForLocale,
} from "@/lib/i18n/locales"

export type { Locale as BlogLocale } from "@/lib/i18n/locales"
