// prisma/_authcleanup.ts — TEMPORÁRIO. Remove teste1 do Supabase Auth. Apagar depois.
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

function loadEnv(file: string): Record<string, string> {
    try {
        const out: Record<string, string> = {}
        for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
            if (!m) continue
            let v = m[2].trim()
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
            out[m[1]] = v
        }
        return out
    } catch {
        return {}
    }
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
})

const TARGET_EMAIL = "wernersaboia+teste1@gmail.com"

async function main() {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
    if (error) throw error
    const target = data.users.find((u) => (u.email ?? "").toLowerCase() === TARGET_EMAIL.toLowerCase())
    if (!target) {
        console.log(`SKIP: ${TARGET_EMAIL} não está no Auth (já removido?)`)
        return
    }
    const { error: delErr } = await supabase.auth.admin.deleteUser(target.id)
    console.log(delErr ? `ERRO: ${delErr.message}` : `OK removido do Auth: ${TARGET_EMAIL} (${target.id})`)

    const { data: after } = await supabase.auth.admin.listUsers({ perPage: 200 })
    if (after) {
        console.log(`\nUsuários restantes no Auth (${after.users.length}): ${after.users.map((u) => u.email).join(", ")}`)
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
