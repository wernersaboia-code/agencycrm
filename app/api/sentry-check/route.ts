// ROTA TEMPORÁRIA — verificação de ponta a ponta da integração do Sentry.
// Deve ser removida assim que o evento aparecer no painel.
//
// Fica atrás de um parâmetro fixo para que crawler ou visitante não dispare
// evento sem querer: a cota do plano gratuito é mensal e finita.

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TOKEN = 'verificacao-2026-08-01'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)

    if (searchParams.get('token') !== TOKEN) {
        return NextResponse.json({ ok: true, hint: 'token ausente' }, { status: 200 })
    }

    const error = new Error(
        'Easy Prospect — teste de integração do Sentry (rota temporária, pode ignorar)'
    )

    const eventId = Sentry.captureException(error)

    // Em ambiente serverless a função pode ser congelada assim que responde,
    // antes do SDK conseguir enviar o evento. Sem este flush, o teste passaria
    // localmente e falharia em produção — exatamente o caso que queremos cobrir.
    const flushed = await Sentry.flush(5000)

    return NextResponse.json({
        eventId,
        flushed,
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
        dsnConfigured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    })
}
