import { LRUCache } from "lru-cache"

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
