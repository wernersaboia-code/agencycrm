import Link from "next/link"
import type { BlogLocale } from "@/lib/blog/locales"
import { getPathname } from "@/lib/i18n/navigation"

export function PostCard({
    locale, slug, title, excerpt, coverImageUrl, categoryName, dateLabel,
}: {
    locale: BlogLocale; slug: string; title: string; excerpt: string
    coverImageUrl: string | null; categoryName: string | null; dateLabel: string
}) {
    return (
        <Link href={getPathname({ href: `/blog/${slug}`, locale })}
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {coverImageUrl
                ? <img src={coverImageUrl} alt="" className="h-40 w-full object-cover" />
                : <div className="h-40 w-full bg-gradient-to-br from-indigo-100 to-indigo-200" />}
            <div className="flex flex-1 flex-col p-5">
                {categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">{categoryName}</p>}
                <h3 className="mt-2 font-semibold leading-snug text-gray-950 group-hover:text-indigo-700">{title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">{excerpt}</p>
                <span className="mt-4 text-xs text-gray-400">{dateLabel}</span>
            </div>
        </Link>
    )
}
