// lib/free-sample/paginas.ts
import * as Sentry from "@sentry/nextjs"
import { unstable_cache } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractFreeSamplePath, FREE_SAMPLE_BUCKET } from "@/lib/supabase/free-sample"
import { TAG_AMOSTRA } from "@/lib/free-sample/amostra-ativa"

/**
 * Imagens das páginas da amostra gratuita, que passam sozinhas no topo da home.
 *
 * Moram num bucket PÚBLICO à parte, numa pasta por amostra (`<id>/p1.webp`…).
 * O PDF continua no bucket privado: a home é estática e não pode carregar URL
 * assinada, e as páginas já são de leitura livre (a amostra se lê sem
 * cadastro). Pasta por amostra, e não coluna no banco, para a lista de páginas
 * ser simplesmente o que está na pasta.
 */
export const FREE_SAMPLE_PAGES_BUCKET = "free-sample-pages"

/** O folhear da home mostra o começo do estudo; não precisa do arquivo todo. */
const MAX_PAGINAS = 12
const LARGURA_PX = 800

/** Desenha as primeiras páginas do PDF como WebP. */
export async function renderizarPaginas(pdf: Uint8Array): Promise<Buffer[]> {
    // Import dinâmico: pdf.js e o canvas nativo só carregam quando o admin sobe
    // ou liga uma amostra, nunca no caminho da home.
    const { getDocumentProxy, renderPageAsImage } = await import("unpdf")
    const { createCanvas, loadImage } = await import("@napi-rs/canvas")

    const documento = await getDocumentProxy(pdf)
    const total = Math.min(documento.numPages, MAX_PAGINAS)
    const paginas: Buffer[] = []

    for (let n = 1; n <= total; n++) {
        const png = await renderPageAsImage(documento, n, {
            canvasImport: () => import("@napi-rs/canvas"),
            width: LARGURA_PX,
        })
        // O unpdf devolve PNG; em WebP a página de texto cai para ~1/3.
        const imagem = await loadImage(Buffer.from(png))
        const canvas = createCanvas(imagem.width, imagem.height)
        canvas.getContext("2d").drawImage(imagem, 0, 0)
        paginas.push(await canvas.encode("webp", 75))
    }

    return paginas
}

/** Ordena `p2.webp` antes de `p10.webp` — ordem alfabética erraria. */
export function ordenarPaginas(nomes: string[]): string[] {
    const numero = (nome: string) => Number(nome.match(/^p(\d+)\.webp$/)?.[1] ?? NaN)
    return nomes.filter((nome) => !Number.isNaN(numero(nome))).sort((a, b) => numero(a) - numero(b))
}

async function garantirBucket() {
    const supabase = createAdminClient()
    const { error } = await supabase.storage.createBucket(FREE_SAMPLE_PAGES_BUCKET, { public: true })
    // Na segunda vez em diante o bucket já existe — é o caso normal.
    if (error && !/already exists/i.test(error.message)) {
        throw new Error(`Falha ao criar o bucket das páginas: ${error.message}`)
    }
}

export async function removerPaginas(amostraId: string): Promise<void> {
    const supabase = createAdminClient()
    const { data } = await supabase.storage.from(FREE_SAMPLE_PAGES_BUCKET).list(amostraId)
    if (!data?.length) return
    await supabase.storage
        .from(FREE_SAMPLE_PAGES_BUCKET)
        .remove(data.map((arquivo) => `${amostraId}/${arquivo.name}`))
}

/** Gera e guarda as páginas da amostra, substituindo as que houver. */
export async function gerarPaginas(amostraId: string, pdf: Uint8Array): Promise<number> {
    const paginas = await renderizarPaginas(pdf)
    await garantirBucket()
    await removerPaginas(amostraId)

    const supabase = createAdminClient()
    for (const [i, pagina] of paginas.entries()) {
        const { error } = await supabase.storage
            .from(FREE_SAMPLE_PAGES_BUCKET)
            // Cache longo: o nome muda junto com a amostra (pasta por id), então
            // uma página guardada nunca fica velha.
            .upload(`${amostraId}/p${i + 1}.webp`, pagina, {
                contentType: "image/webp",
                cacheControl: "31536000",
                upsert: true,
            })
        if (error) throw new Error(`Falha ao guardar a página ${i + 1}: ${error.message}`)
    }

    return paginas.length
}

/**
 * Gera as páginas sem derrubar quem chamou: a amostra sobe e liga mesmo que o
 * desenho falhe — a home então mostra o bloco sem o folhear. O erro vai ao
 * Sentry porque `console.error` sozinho não chega lá neste projeto.
 */
export async function gerarPaginasSemFalhar(amostraId: string, pdf: Uint8Array): Promise<void> {
    try {
        await gerarPaginas(amostraId, pdf)
    } catch (error) {
        console.error("Amostra gratuita: falha ao gerar as páginas:", error)
        Sentry.captureException(error, { tags: { area: "free-sample-paginas" } })
    }
}

/** Gerações em curso nesta instância: várias visitas seguidas à home sem
 * páginas pediriam o mesmo desenho ao mesmo tempo. */
const emCurso = new Map<string, Promise<void>>()

/**
 * Para uma amostra sem páginas — as que subiram antes deste recurso, ou uma
 * cujo desenho falhou no upload —, baixa o PDF do bucket privado e gera.
 * Chamado ao ligar no admin e, em segundo plano, pela home.
 */
export function garantirPaginas(amostraId: string, filePath: string): Promise<void> {
    const atual = emCurso.get(amostraId)
    if (atual) return atual
    const tarefa = baixarEGerar(amostraId, filePath).finally(() => emCurso.delete(amostraId))
    emCurso.set(amostraId, tarefa)
    return tarefa
}

async function baixarEGerar(amostraId: string, filePath: string): Promise<void> {
    const supabase = createAdminClient()
    const { data: existentes } = await supabase.storage.from(FREE_SAMPLE_PAGES_BUCKET).list(amostraId)
    if (existentes?.length) return

    const { data: arquivo, error } = await supabase.storage
        .from(FREE_SAMPLE_BUCKET)
        .download(extractFreeSamplePath(filePath))
    if (error || !arquivo) {
        Sentry.captureException(new Error(`Amostra gratuita: PDF não baixou para gerar as páginas: ${error?.message}`))
        return
    }

    await gerarPaginasSemFalhar(amostraId, new Uint8Array(await arquivo.arrayBuffer()))
}

/** Lançado de dentro do cache para a lista vazia não ficar guardada. */
class SemPaginas extends Error {
    name = "SemPaginas"
}

/**
 * URLs públicas das páginas, em ordem. Em cache com a mesma tag da amostra:
 * subir, ligar ou apagar uma amostra já invalida a tag.
 */
const listarPaginas = unstable_cache(
    async (amostraId: string): Promise<string[]> => {
        const supabase = createAdminClient()
        const { data, error } = await supabase.storage.from(FREE_SAMPLE_PAGES_BUCKET).list(amostraId)
        const nomes = ordenarPaginas((data ?? []).map((arquivo) => arquivo.name))
        // Bucket inexistente, falha do storage ou páginas ainda não geradas:
        // o `unstable_cache` não guarda erro, então a próxima visita olha de
        // novo — e encontra as páginas assim que a geração em segundo plano
        // terminar, sem esperar ninguém mexer na amostra.
        if (error || nomes.length === 0) throw new SemPaginas()

        return nomes.map(
            (nome) =>
                supabase.storage.from(FREE_SAMPLE_PAGES_BUCKET).getPublicUrl(`${amostraId}/${nome}`).data
                    .publicUrl
        )
    },
    ["free-sample-paginas"],
    { tags: [TAG_AMOSTRA], revalidate: 3600 }
)

export async function getPaginasDaAmostra(amostraId: string): Promise<string[]> {
    try {
        return await listarPaginas(amostraId)
    } catch (error) {
        if (error instanceof Error && error.name === "SemPaginas") return []
        throw error
    }
}
