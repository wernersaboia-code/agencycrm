import { LRUCache } from "lru-cache"
import { prisma } from "@/lib/prisma"

export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    const realIp = request.headers.get("x-real-ip")
    if (realIp) {
        return realIp
    }
    return "anonymous"
}

export function rateLimit(tokenCount: number) {
    const cache = new LRUCache<string, number[]>({
        max: tokenCount * 2,
    })

    return {
        check: (token: string, limit: number, duration: number) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = cache.get(token) || []
                const now = Date.now()
                const windowStart = now - duration

                const requestsInWindow = tokenCount.filter((t) => t > windowStart)

                if (requestsInWindow.length >= limit) {
                    reject(new Error("Rate limit exceeded"))
                } else {
                    requestsInWindow.push(now)
                    cache.set(token, requestsInWindow)
                    resolve()
                }
            }),
    }
}

/**
 * Rate limiter fixed-window persistido no Postgres, compartilhado entre todas
 * as instâncias serverless (ao contrário do limiter em memória acima, que é
 * por instância). Use em rotas sensíveis de baixo/médio volume — evite em
 * caminhos de altíssima frequência (ex.: pixel de tracking), onde a escrita no
 * banco a cada requisição seria custosa.
 *
 * @returns `true` se a requisição está dentro do limite, `false` se excedeu.
 *
 * Fail-open: em caso de erro de banco, retorna `true` para não bloquear
 * usuários legítimos por um problema de infraestrutura. As verificações de
 * segurança de verdade (auth, valor do pagamento) são independentes disto.
 */
export async function checkPersistentRateLimit(
    bucket: string,
    identifier: string,
    limit: number,
    windowMs: number
): Promise<boolean> {
    const windowIndex = Math.floor(Date.now() / windowMs)
    const key = `${bucket}:${identifier}:${windowIndex}`

    try {
        // upsert com increment é atômico no nível da linha no Postgres, então a
        // contagem fica correta mesmo com requisições concorrentes.
        const row = await prisma.rateLimit.upsert({
            where: { key },
            create: {
                key,
                windowStart: new Date(windowIndex * windowMs),
                count: 1,
            },
            update: {
                count: { increment: 1 },
            },
            select: { count: true },
        })

        return row.count <= limit
    } catch (error) {
        console.error("[RateLimit] Falha ao verificar limite persistente:", error)
        return true
    }
}
