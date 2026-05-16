import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const checks: Record<string, "ok" | "error"> = {}
    let status = 200

    try {
        await prisma.$queryRaw`SELECT 1`
        checks.database = "ok"
    } catch {
        checks.database = "error"
        status = 503
    }

    return NextResponse.json(
        { status: status === 200 ? "healthy" : "unhealthy", checks, timestamp: new Date().toISOString() },
        { status }
    )
}
