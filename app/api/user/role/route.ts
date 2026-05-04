// app/api/user/role/route.ts
import { NextResponse } from "next/server"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"

export async function GET() {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ role: null }, { status: 401 })
        }
        return NextResponse.json({ role: user.role })
    } catch {
        return NextResponse.json({ role: null }, { status: 500 })
    }
}
