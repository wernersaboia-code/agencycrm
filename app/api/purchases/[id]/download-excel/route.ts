// app/api/purchases/[id]/download-excel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { generatePurchaseExcel } from "@/lib/exports/purchase-export"
import * as XLSX from "xlsx"
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

        const { data, filename } = await generatePurchaseExcel(id, userId)

        // Criar workbook
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Leads")

        // Gerar buffer
        const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

        return new NextResponse(excelBuffer, {
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error("Error downloading Excel:", error)
        return NextResponse.json(
            { error: "Failed to download Excel" },
            { status: 500 }
        )
    }
}
