// Formulário de contato do FAQ.
//
// Rota de API em vez de Server Action de propósito: o ID de uma Server Action
// é derivado do build, então aba aberta durante um deploy manda um ID que já
// não existe e recebe 404 (`UnrecognizedActionError`). Numa página que é o
// único canal de captação de contato do site, falhar assim custa lead. O
// caminho `/api/faq` é fixo e sobrevive a qualquer deploy.

import { NextResponse } from 'next/server'
import { submitFaqQuestion } from '@/lib/faq/submit-question'

export async function POST(request: Request) {
    let payload: unknown

    try {
        payload = await request.json()
    } catch {
        // Corpo ilegível: a validação lá dentro devolveria o mesmo "invalid",
        // mas nem chega a rodar se o parse estourar antes.
        return NextResponse.json({ success: false, error: 'invalid' }, { status: 400 })
    }

    const result = await submitFaqQuestion(payload)

    // 200 mesmo em falha de validação ou rate limit: o cliente diferencia pelo
    // campo `error`, e o honeypot depende de responder sucesso sem dar pista.
    return NextResponse.json(result)
}
