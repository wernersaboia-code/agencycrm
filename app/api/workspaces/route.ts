// app/api/workspaces/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const workspaces = await prisma.workspace.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
        })

        // Serializar datas
        const serialized = workspaces.map((w) => ({
            ...w,
            createdAt: w.createdAt.toISOString(),
            updatedAt: w.updatedAt.toISOString(),
        }))

        return NextResponse.json({ workspaces: serialized })
    } catch (error) {
        console.error("Erro ao buscar workspaces:", error)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}