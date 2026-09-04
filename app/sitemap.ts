import type { MetadataRoute } from "next"
import { getPathname } from "@/lib/i18n/navigation"
import { DEFAULT_LOCALE, PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"
import { alternatesFor } from "@/lib/i18n/alternates"
import { localesComConteudo } from "@/lib/seo/content-coverage"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"

// O sitemap é pré-renderizado no build. Sem isto, tirar uma lista do ar deixa a
// URL dela no sitemap até o próximo deploy — foi o que aconteceu em 23.08.2026
// com duas listas de teste, que continuaram sendo oferecidas ao buscador horas
// depois de desativadas. Uma hora é curto o bastante para não sobreviver a uma
// mudança de catálogo e longo o bastante para o arquivo não ser reconstruído a
// cada visita de robô.
export const revalidate = 3600

// Rotas estáticas do funil: uma entrada por idioma COM CONTEÚDO, com hreflang
// de mão dupla via alternatesFor. `/blog` entra aqui (não mais no bloco
// dinâmico abaixo) para não duplicar a URL do índice do blog.
//
// "Com conteúdo" não é o mesmo que "publicado". A maioria destas rotas tira o
// texto de messages/ e vale nos 8 idiomas, mas /terms, /privacy e /refund vêm
// de um documento por idioma em content/legal, e /blog depende de haver post
// publicado naquele idioma. Onde falta, a página serve o português do
// fallback — abrir assim para quem chega é a decisão certa, submeter ao
// Google como se fosse do idioma da URL não é. Ver lib/seo/content-coverage.
const ROUTES: { path: string; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/catalog", changeFrequency: "daily", priority: 0.9 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/refund", changeFrequency: "yearly", priority: 0.3 },
]

// `blogLocales` vem do banco e é o único pedaço da cobertura que não dá para
// resolver estaticamente. Sem ele — quando a consulta falha — o índice do
// blog fica de fora: melhor uma rota a menos no sitemap do que submeter sete
// listagens que podem estar vazias.
function rotasEstaticas(blogLocales: readonly Locale[]) {
    return ROUTES.flatMap((route) => {
        const idiomas = route.path === "/blog" ? blogLocales : localesComConteudo(route.path)
        const languages = alternatesFor(route.path, DEFAULT_LOCALE, idiomas).languages

        return idiomas.map((locale) => ({
            url: `${BASE_URL}${getPathname({ href: route.path, locale })}`,
            lastModified: new Date(),
            changeFrequency: route.changeFrequency,
            priority: route.priority,
            ...(languages ? { alternates: { languages } } : {}),
        }))
    })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const { prisma } = await import("@/lib/prisma")
        const lists = await prisma.leadList.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1000,
        })

        // Uma única entrada por lista, na URL do locale padrão (sem prefixo).
        // Diferente das rotas estáticas acima: a lista não tem tradução
        // própria no banco — nome, descrição, tabela de amostra e leads vêm
        // num idioma só, e as versões com prefixo (/de/list, /fr/list…) só
        // traduzem a interface em volta. Submeter as 7 com hreflang recíproco
        // fazia o Google ver quase-duplicatas por lista e deixá-las paradas
        // em "Detectada, mas não indexada". As variantes com prefixo seguem
        // respondendo 200 para quem navega, mas apontam canonical para esta
        // URL (ver generateMetadata em app/[locale]/list/[slug]/page.tsx).
        const listRoutes = lists.map((list) => ({
            url: `${BASE_URL}${getPathname({ href: `/list/${list.slug}`, locale: DEFAULT_LOCALE })}`,
            lastModified: list.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }))

        const now = new Date()
        const blogPosts = await prisma.blogPost.findMany({
            where: { status: "PUBLISHED", publishedAt: { lte: now } },
            select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
            take: 2000,
        })

        const blogRoutes = blogPosts.flatMap((post) => {
            const languages = Object.fromEntries(
                post.translations.map((t) => [t.locale, `${BASE_URL}${getPathname({ href: `/blog/${t.slug}`, locale: t.locale as Locale })}`])
            )
            return post.translations.map((t) => ({
                url: `${BASE_URL}${getPathname({ href: `/blog/${t.slug}`, locale: t.locale as Locale })}`,
                lastModified: post.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.6,
                alternates: { languages },
            }))
        })

        // O índice do blog (/blog) sai de rotasEstaticas, mas só nos idiomas
        // que aparecem aqui: uma listagem vazia é página fina, e era isso que
        // o sitemap oferecia ao Google para cada idioma sem post. A consulta
        // mora em lib/blog/queries para a página do blog aplicar o mesmo
        // critério no seu noindex.
        // Import dinâmico como o do prisma logo acima, e pelo mesmo motivo:
        // o módulo carrega o cliente do banco, e falha de CARGA (não só de
        // consulta) precisa cair no catch em vez de derrubar o sitemap.
        const { localesComPostPublicado } = await import("@/lib/blog/queries")
        const comPost = await localesComPostPublicado()
        const blogLocales = PUBLISHED_LOCALES.filter((locale) => comPost.includes(locale))

        // Aqui só entram os posts individuais, que vêm do banco.
        return [...rotasEstaticas(blogLocales), ...listRoutes, ...blogRoutes]
    } catch {
        return rotasEstaticas([])
    }
}
