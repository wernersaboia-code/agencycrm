/**
 * Diagnóstico de indexação por URL. Roda com `npm run index:inspecionar`.
 *
 * Por que existe: os relatórios de "Indexação de páginas" do Search Console
 * exportam só as CONTAGENS por motivo. A tabela com as URLs de cada motivo
 * fica na UI, sem export completo. A URL Inspection API é a única forma
 * programática de saber o `coverageState` de uma URL específica.
 *
 * Usa a MESMA conexão OAuth já salva pelo admin (`GoogleSearchConsoleConnection`)
 * e o mesmo escopo `webmasters.readonly` da Search Analytics API. Só faz
 * leitura — nenhuma escrita no Search Console nem no banco.
 *
 * Pré-requisitos no ambiente (os mesmos de produção):
 *   GOOGLE_SEARCH_CONSOLE_CLIENT_ID
 *   GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
 *   SECRETS_ENCRYPTION_KEY   (para decifrar o refresh token)
 *
 * Fica fora do vitest de propósito: nenhum teste deste projeto toca o banco
 * nem a rede.
 */
import { PrismaClient } from "@prisma/client"
import { writeFileSync } from "fs"
import { join } from "path"
import { config } from "dotenv"
import { decryptSecret } from "../lib/secrets"

// `.env.local` primeiro e sem override: assim as credenciais de produção
// (que não ficam no .env versionado) vencem as do .env, igual ao Next.
config({ path: [".env.local", ".env"] })

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br").replace(/\/$/, "")
const DEFAULT_LOCALE = "pt"
const PUBLISHED_LOCALES = ["pt", "de", "en", "es", "fr", "it", "nl"] as const

// Mesmas rotas estáticas de app/sitemap.ts.
const STATIC_ROUTES = ["/", "/catalog", "/faq", "/blog", "/about", "/privacy", "/terms", "/refund"]

const INSPECT_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

// Intervalo mínimo entre INÍCIO de requisições: a URL Inspection API tem cota
// de 600/min. 150ms => ~6,7/s, com folga mesmo com latência em paralelo.
const MIN_INTERVAL_MS = 150
const CONCURRENCY = 12

type IndexStatusResult = {
    verdict?: string
    coverageState?: string
    robotsTxtState?: string
    indexingState?: string
    pageFetchState?: string
    lastCrawlTime?: string
    googleCanonical?: string
    userCanonical?: string
}
type InspectionResponse = { inspectionResult?: { indexStatusResult?: IndexStatusResult } }

type Inspection = {
    url: string
    coverage: string
    verdict: string
    userCanonical: string
    googleCanonical: string
    robots: string
    indexing: string
    fetch: string
    lastCrawl: string
}

const prisma = new PrismaClient()

function urlFor(path: string, locale: string): string {
    if (locale === DEFAULT_LOCALE) return path === "/" ? BASE_URL : `${BASE_URL}${path}`
    return path === "/" ? `${BASE_URL}/${locale}` : `${BASE_URL}/${locale}${path}`
}

async function accessToken(refreshToken: string): Promise<string> {
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_SEARCH_CONSOLE_CLIENT_ID/SECRET não configurados no ambiente")
    }

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    })
    if (!response.ok) throw new Error(`Google OAuth respondeu ${response.status}`)

    const payload = (await response.json()) as { access_token?: string }
    if (!payload.access_token) throw new Error("Google OAuth não retornou access token")
    return payload.access_token
}

let nextSlot = 0
async function rateLimit() {
    const now = Date.now()
    const slot = Math.max(now, nextSlot)
    nextSlot = slot + MIN_INTERVAL_MS
    const wait = slot - now
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function failed(url: string, reason: string): Inspection {
    return {
        url,
        coverage: reason,
        verdict: "", userCanonical: "", googleCanonical: "",
        robots: "", indexing: "", fetch: "", lastCrawl: "",
    }
}

async function inspect(token: string, siteUrl: string, url: string): Promise<Inspection> {
    // Uma URL problemática (timeout, 429, 5xx) não pode derrubar o run inteiro:
    // devolve o motivo como um "coverageState" e segue para a próxima.
    for (let attempt = 1; attempt <= 3; attempt++) {
        await rateLimit()

        let response: Response
        try {
            response = await fetch(INSPECT_URL, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ inspectionUrl: url, siteUrl, languageCode: "pt-BR" }),
                signal: AbortSignal.timeout(20_000),
            })
        } catch (error) {
            if (attempt < 3) {
                await sleep(1_500 * attempt)
                continue
            }
            const message = error instanceof Error ? error.message : String(error)
            return failed(url, `ERRO DE REDE: ${message}`)
        }

        if (response.status === 429 || response.status >= 500) {
            if (attempt < 3) {
                await sleep(2_000 * attempt)
                continue
            }
            return failed(url, `ERRO HTTP ${response.status}`)
        }

        if (!response.ok) return failed(url, `ERRO HTTP ${response.status}`)

        const data = (await response.json()) as InspectionResponse
        const r = data.inspectionResult?.indexStatusResult
        if (!r) return failed(url, "SEM indexStatusResult")

        return {
            url,
            coverage: r.coverageState || "(sem coverageState)",
            verdict: r.verdict || "",
            userCanonical: r.userCanonical || "",
            googleCanonical: r.googleCanonical || "",
            robots: r.robotsTxtState || "",
            indexing: r.indexingState || "",
            fetch: r.pageFetchState || "",
            lastCrawl: r.lastCrawlTime || "",
        }
    }

    return failed(url, "ERRO DESCONHECIDO")
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length)
    let cursor = 0

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (true) {
            const index = cursor++
            if (index >= items.length) return
            results[index] = await fn(items[index])
        }
    })

    await Promise.all(workers)
    return results
}

function csvEscape(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

async function main() {
    const argUser = process.argv.find((a) => a.startsWith("--user="))?.split("=")[1]
    const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]

    const connection = argUser
        ? await prisma.googleSearchConsoleConnection.findUnique({ where: { userId: argUser } })
        : await prisma.googleSearchConsoleConnection.findFirst()

    if (!connection) {
        console.error("Nenhuma conexão do Search Console encontrada no banco. Conecte pelo super-admin primeiro.")
        await prisma.$disconnect()
        process.exit(1)
    }

    console.log(`Propriedade: ${connection.siteUrl}`)
    if (connection.connectedEmail) console.log(`Conta: ${connection.connectedEmail}`)

    const token = await accessToken(decryptSecret(connection.refreshTokenEncrypted) || "")

    const lists = await prisma.leadList.findMany({
        where: { isActive: true },
        select: { slug: true },
        orderBy: { slug: "asc" },
    })

    const urls: string[] = []
    if (only !== "lists") {
        for (const route of STATIC_ROUTES) for (const locale of PUBLISHED_LOCALES) urls.push(urlFor(route, locale))
    }
    if (only !== "static") {
        for (const { slug } of lists) for (const locale of PUBLISHED_LOCALES) urls.push(urlFor(`/list/${slug}`, locale))
    }

    console.log(`Listas ativas: ${lists.length}`)
    console.log(`URLs a inspecionar: ${urls.length} (~${Math.ceil((urls.length * MIN_INTERVAL_MS) / 1000)}s mínimo)\n`)

    const startedAt = Date.now()
    let done = 0
    const inspections = await mapPool(urls, CONCURRENCY, async (url) => {
        const result = await inspect(token, connection.siteUrl, url)
        done++
        if (done % 25 === 0 || done === urls.length) {
            const elapsed = Math.round((Date.now() - startedAt) / 1000)
            console.log(`  ${done}/${urls.length}  (${elapsed}s)`)
        }
        return result
    })

    const byCoverage = new Map<string, Inspection[]>()
    for (const item of inspections) {
        const bucket = byCoverage.get(item.coverage) || []
        bucket.push(item)
        byCoverage.set(item.coverage, bucket)
    }

    console.log("Resumo por coverageState:")
    for (const [coverage, items] of [...byCoverage.entries()].sort((a, b) => b[1].length - a[1].length)) {
        console.log(`  ${String(items.length).padStart(4)}  ${coverage}`)
    }

    for (const [coverage, items] of [...byCoverage.entries()].sort((a, b) => b[1].length - a[1].length)) {
        console.log(`\n## ${coverage} — ${items.length}`)
        for (const item of items.slice(0, 25)) {
            const canonicalMismatch = item.googleCanonical && item.userCanonical && item.googleCanonical !== item.userCanonical
                ? `  [googleCanonical: ${item.googleCanonical}]`
                : ""
            console.log(`   ${item.url}${canonicalMismatch}`)
        }
        if (items.length > 25) console.log(`   ... +${items.length - 25}`)
    }

    const outPath = join(process.cwd(), "inspecao-indexacao.csv")
    const header = "url,coverageState,verdict,robotsTxtState,indexingState,pageFetchState,userCanonical,googleCanonical,lastCrawlTime"
    const rows = inspections.map((item) =>
        [item.url, item.coverage, item.verdict, item.robots, item.indexing, item.fetch, item.userCanonical, item.googleCanonical, item.lastCrawl]
            .map(csvEscape)
            .join(",")
    )
    writeFileSync(outPath, [header, ...rows].join("\n"), "utf8")
    console.log(`\nCSV completo: ${outPath}`)

    await prisma.$disconnect()
}

main().catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
})
