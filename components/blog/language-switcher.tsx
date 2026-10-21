import { Link } from "@/lib/i18n/navigation"
import { getBlogLabels } from "@/lib/blog/i18n"
import type { BlogLocale } from "@/lib/blog/locales"

export function LanguageSwitcher({
    locale, availableLocales, localeSlugs,
}: {
    locale: BlogLocale; availableLocales: BlogLocale[]; localeSlugs: Record<string, string>
}) {
    if (availableLocales.length <= 1) return null
    const labels = getBlogLabels(locale)
    return (
        <div className="mt-8 border-t pt-6">
            <p className="mb-2 text-sm font-medium text-gray-700">{labels.otherLanguages}</p>
            <div className="flex flex-wrap gap-2">
                {availableLocales.filter((l) => l !== locale).map((l) => (
                    // Link do next-intl com `locale`: sem ele o next/link puro não
                    // atualiza o cookie NEXT_LOCALE no clique, e voltar para o
                    // português (URL sem prefixo) caía no idioma que estava no
                    // cookie — o middleware redirecionava para /en/blog/...
                    <Link key={l} href={`/blog/${localeSlugs[l]}`} locale={l}
                        className="rounded-full border px-3 py-1 text-sm text-gray-600 hover:text-gray-950">
                        {labels.localeName[l]}
                    </Link>
                ))}
            </div>
        </div>
    )
}
