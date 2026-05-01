// app/api/purchases/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server"
import { generatePurchaseCSV } from "@/lib/exports/purchase-export"
import { getAuthenticatedUserId } from "@/lib/auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUserId()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { csv, filename } = await generatePurchaseCSV(id, userId)

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error("Error downloading CSV:", error)
        return NextResponse.json(
            { error: "Failed to download CSV" },
            { status: 500 }
        )
    }
}
