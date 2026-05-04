// app/api/purchases/[id]/download-excel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { generatePurchaseExcel } from "@/lib/exports/purchase-export"
import writeXlsxFile from "write-excel-file/node"
import { getAuthenticatedUserId } from "@/lib/auth"

function toCellValue(value: unknown): string | number | boolean | Date | null {
    if (value === null || value === undefined) return null
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
    if (value instanceof Date) return value
    return String(value)
}

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

        const headers = Object.keys(data[0] ?? {})
        const excelBuffer = await writeXlsxFile(
            headers.length > 0
                ? [
                    headers,
                    ...data.map((row) => {
                        const values = row as Record<string, unknown>
                        return headers.map((header) => toCellValue(values[header]))
                    }),
                ]
                : [[""]]
        ).toBuffer()

        return new NextResponse(new Uint8Array(excelBuffer), {
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
