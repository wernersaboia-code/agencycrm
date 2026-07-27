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
 * Resposta para uma requisição barrada pelo limite.
 *
 * Devolve 429 direto, sem redirect. Redirecionar para uma página que também é
 * limitada (o caso das telas de auth) faz a requisição seguinte bater no mesmo
 * limite e devolver outro redirect, em loop, até o navegador desistir com
 * ERR_TOO_MANY_REDIRECTS — o usuário fica sem tela nenhuma em vez de ver o
 * aviso.
 */
export function tooManyRequestsResponse(retryAfterSeconds = 60): Response {
    const body = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Muitas requisições</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f9fafb; color:#111827; margin:0; padding:40px 16px; }
  .card { max-width:440px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:32px; text-align:center; }
  h1 { font-size:20px; margin:0 0 12px; }
  p { color:#6b7280; line-height:1.5; margin:0; }
</style>
</head>
<body>
  <div class="card">
    <h1>Muitas requisições</h1>
    <p>Recebemos requisições demais deste endereço. Aguarde ${retryAfterSeconds} segundos e recarregue a página.</p>
  </div>
</body>
</html>`

    return new Response(body, {
        status: 429,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Retry-After": String(retryAfterSeconds),
        },
    })
}

/**
 * Wrapper para rate limiting de ações administrativas sensíveis. Reusa o
 * limiter persistente compartilhado entre instâncias. Ações que exigem
 * rate limiting: envio de convite/reset de senha, role/status change,
 * transferência/deleção de workspace, criação/edição/deleção de listas.
 *
 * @param action Nome curto da ação (ex.: "user.password_reset")
 * @param adminId ID do admin que executa a ação
 * @param limit Máximo de requisições na janela (default: 10)
 * @param windowMs Janela em ms (default: 60000 = 1 minuto)
 * @throws Error se o limite foi excedido
 */
export async function checkAdminRateLimit(
    action: string,
    adminId: string,
    limit = 10,
    windowMs = 60_000
): Promise<void> {
    const allowed = await checkPersistentRateLimit(
        `admin:${action}`,
        adminId,
        limit,
        windowMs
    )
    if (!allowed) {
        throw new Error("Limite de requisições excedido. Tente novamente mais tarde.")
    }
}

/**
 * Wrapper para rate limiting de ações de escrita do CRM (envio de campanha,
 * import de leads). Diferente de checkAdminRateLimit, retorna `false` em vez
 * de lançar, para compatibilidade com o padrão ActionResult usado nas actions
 * do CRM. Use `if (!await checkCrmRateLimit(...)) return { success: false,
 * error: "..." }`.
 *
 * @param action Nome curto da ação (ex.: "campaign.send")
 * @param userId ID do usuário que executa a ação
 * @param limit Máximo de requisições na janela (default: 5)
 * @param windowMs Janela em ms (default: 60000 = 1 minuto)
 * @returns `true` se permitido, `false` se excedeu o limite
 */
export async function checkCrmRateLimit(
    action: string,
    userId: string,
    limit = 5,
    windowMs = 60_000
): Promise<boolean> {
    return checkPersistentRateLimit(
        `crm:${action}`,
        userId,
        limit,
        windowMs
    )
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
