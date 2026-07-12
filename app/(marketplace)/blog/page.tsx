import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { BLOG_LOCALES, DEFAULT_BLOG_LOCALE, isBlogLocale } from "@/lib/blog/locales"

export default async function BlogRootPage() {
    const accept = (await headers()).get("accept-language") ?? ""
    const preferred = accept
        .split(",")
        .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
        .find((code) => isBlogLocale(code) && (BLOG_LOCALES as readonly string[]).includes(code))

    redirect(`/blog/${preferred ?? DEFAULT_BLOG_LOCALE}`)
}
