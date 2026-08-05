// lib/free-sample/amostra-ativa.ts
import * as Sentry from "@sentry/nextjs"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/**
 * Verifica se o erro é o P2021 do Prisma ("a tabela não existe"), sem
 * depender de importar `PrismaClientKnownRequestError` (o formato do erro
 * muda entre versões do Prisma) — checagem defensiva pela forma do objeto.
 */
function isTabelaAusente(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === "P2021"
    )
}

/** Tag revalidada quando o admin liga, desliga ou troca o arquivo. */
export const TAG_AMOSTRA = "free-sample"

/**
 * A amostra ativa, ou `null` quando não há nenhuma.
 *
 * Em cache com tag porque isso entra na HOME, que é a página mais visitada e
 * já teve problema de renderização dinâmica: sem cache, cada visita pagaria
 * uma ida ao banco para descobrir algo que muda uma vez por mês.
 */
export const getAmostraAtiva = unstable_cache(
    async () => {
        try {
            return await prisma.freeSample.findFirst({
                where: { isActive: true },
                select: { id: true },
            })
        } catch (error) {
            // Só toleramos o erro "tabela não existe" (P2021): é o estado
            // esperado enquanto a migração desta feature não foi aplicada no
            // banco (aplicação fica para a Task 9 / deploy). Nesse caso a
            // home tem que ficar "publicada invisível" — retornar `null` em
            // vez de derrubar a Suspense boundary inteira.
            //
            // Qualquer outro erro (timeout, credencial inválida, banco fora
            // do ar) é relançado de propósito. Este resultado fica em cache
            // sem `revalidate` por tempo — só sai daqui quando alguém chamar
            // `revalidateTag(TAG_AMOSTRA)`. Se engolíssemos um erro
            // transitório e gravássemos `null`, a seção sumiria da home PARA
            // SEMPRE, mesmo depois de o banco voltar, e ninguém saberia que
            // precisa revalidar a tag. Relançar deixa a home cair e mostrar
            // app/[locale]/error.tsx, que já captura a exceção no Sentry
            // (via onRequestError, em instrumentation.ts) — falha visível e
            // reportada é preferível a falha invisível e permanente.
            if (isTabelaAusente(error)) {
                // Aviso, não erro: é o estado esperado até a migração rodar.
                // console.error sozinho não chega ao Sentry — este projeto
                // não tem consoleLoggingIntegration (ver sentry.server.config.ts)
                // — por isso o captureMessage explícito abaixo.
                console.error(
                    "Amostra ativa: tabela free_samples ainda não existe (migração pendente):",
                    error
                )
                Sentry.captureMessage(
                    "Amostra ativa: tabela free_samples ainda não existe (migração pendente)",
                    "warning"
                )
                return null
            }

            throw error
        }
    },
    ["free-sample-ativa"],
    { tags: [TAG_AMOSTRA] }
)
