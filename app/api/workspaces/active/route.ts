// app/api/workspaces/active/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            select: {
                id: true,
                name: true,
                plan: true,
                trialEndsAt: true,
                subscriptionStatus: true,
            }
        })

        return NextResponse.json({ workspace })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}