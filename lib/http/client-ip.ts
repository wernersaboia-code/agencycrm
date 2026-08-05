// lib/http/client-ip.ts

/**
 * IP do cliente a partir dos headers da requisição.
 *
 * `x-forwarded-for` pode trazer uma cadeia de proxies (`cliente, proxy1,
 * proxy2`); o primeiro item é o cliente original. Usado como identificador de
 * rate limit, então o fallback "anonymous" agrupa todo mundo sem IP no mesmo
 * balde — deliberado: quem esconde o IP não ganha um balde exclusivo.
 */
export function getClientIpFromHeaders(h: Headers): string {
    const forwarded = h.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    return h.get("x-real-ip") || "anonymous"
}
