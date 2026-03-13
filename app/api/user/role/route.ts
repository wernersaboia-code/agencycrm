// app/api/user/role/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ role: null }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        })

        return NextResponse.json({ role: dbUser?.role || "USER" })
    } catch (error) {
        return NextResponse.json({ role: null }, { status: 500 })
    }
}