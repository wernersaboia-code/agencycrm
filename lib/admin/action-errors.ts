import { Prisma } from "@prisma/client"
import { ZodError } from "zod"

/**
 * Resultado de uma action do admin que pode falhar por motivo previsível.
 *
 * A falha é DEVOLVIDA, nunca lançada. Em produção o Next apaga a mensagem de
 * qualquer exceção que atravesse uma server action — o cliente recebe só
 * "An error occurred in the Server Components render" e um digest. Foi assim
 * que um conflito de slug (P2002) chegou ao admin como erro sem causa
 * aparente. Valor de retorno não passa por essa censura.
 */
export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

/**
 * Traduz o erro para uma frase que o admin possa agir em cima.
 *
 * Não expõe SQL, nome de constraint nem JSON do zod: o que interessa é qual
 * campo está errado e o que fazer.
 */
export function describeListError(error: unknown): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const campos = Array.isArray(error.meta?.target) ? (error.meta.target as string[]) : []

        if (campos.includes("slug")) {
            return "Já existe uma lista com esse endereço (slug). Mude o nome ou edite o slug antes de salvar."
        }

        return campos.length > 0
            ? `Já existe uma lista com o mesmo valor em: ${campos.join(", ")}.`
            : "Já existe uma lista com esses dados."
    }

    if (error instanceof ZodError) {
        const campos = error.issues
            .map((issue) => issue.path.join("."))
            .filter((caminho) => caminho.length > 0)

        return campos.length > 0
            ? `Dados inválidos em: ${[...new Set(campos)].join(", ")}.`
            : "Dados inválidos."
    }

    // Mensagem nossa (canPublishList, writeListPrices) já é escrita para o
    // admin ler — repassar é melhor do que substituir por texto genérico.
    if (error instanceof Error && error.message) {
        return error.message
    }

    return "Erro inesperado ao salvar a lista. Tente novamente."
}
