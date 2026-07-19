// eslint-disable-next-line no-restricted-imports -- href sempre montado via getPathname() abaixo, prefixo de locale já correto
import Link from "next/link"
import { getBlogLabels } from "@/lib/blog/i18n"
import type { BlogLocale } from "@/lib/blog/locales"
import { getPathname } from "@/lib/i18n/navigation"

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
                    <Link key={l} href={getPathname({ href: `/blog/${localeSlugs[l]}`, locale: l })}
                        className="rounded-full border px-3 py-1 text-sm text-gray-600 hover:text-gray-950">
                        {labels.localeName[l]}
                    </Link>
                ))}
            </div>
        </div>
    )
}
