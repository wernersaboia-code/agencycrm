import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get("leadId")
    const token = searchParams.get("token")

    if (!leadId || !token) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    try {
        // Validate token exists and is not expired
        const accessToken = await prisma.purchaseAccessToken.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
            },
        })

        if (!accessToken) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 })
        }

        // Update lead status to UNSUBSCRIBED
        await prisma.lead.update({
            where: { id: leadId },
            data: { status: LeadStatus.UNSUBSCRIBED },
        })

        return NextResponse.json({ success: true, message: "Unsubscribed successfully" })
    } catch (error) {
        console.error("[Unsubscribe] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
