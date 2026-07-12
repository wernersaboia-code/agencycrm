import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"
import { verifySignature } from "@/lib/signing"

// Resolve o lead a partir do envio assinado. Retorna null se a assinatura
// nao conferir ou o envio nao existir.
async function resolveLeadId(sid: string | null, sig: string | null): Promise<string | null> {
    if (!sid || !verifySignature(sid, sig)) {
        return null
    }

    const emailSend = await prisma.emailSend.findUnique({
        where: { id: sid },
        select: { leadId: true },
    })

    return emailSend?.leadId ?? null
}

function confirmationPage(sid: string, sig: string, message?: string): NextResponse {
    const body = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Cancelar inscrição</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f9fafb; color:#111827; margin:0; padding:40px 16px; }
  .card { max-width:440px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:32px; text-align:center; }
  h1 { font-size:20px; margin:0 0 12px; }
  p { color:#6b7280; line-height:1.5; margin:0 0 24px; }
  button { background:#111827; color:#fff; border:0; border-radius:8px; padding:12px 24px; font-size:15px; font-weight:600; cursor:pointer; }
  .msg { color:#374151; }
</style>
</head>
<body>
  <div class="card">
    <h1>Cancelar inscrição</h1>
    ${
        message
            ? `<p class="msg">${message}</p>`
            : `<p>Confirme que não deseja mais receber e-mails deste remetente.</p>
    <form method="POST">
      <input type="hidden" name="sid" value="${sid}" />
      <input type="hidden" name="sig" value="${sig}" />
      <button type="submit">Confirmar cancelamento</button>
    </form>`
    }
  </div>
</body>
</html>`

    return new NextResponse(body, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    })
}

// GET renderiza a confirmação — nunca muta estado, para que prefetch de links
// por scanners de e-mail não desinscreva o lead automaticamente.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sid = searchParams.get("sid")
    const sig = searchParams.get("sig")

    const leadId = await resolveLeadId(sid, sig)
    if (!leadId || !sid || !sig) {
        return confirmationPage("", "", "Link inválido ou expirado.")
    }

    return confirmationPage(sid, sig)
}

// POST executa o cancelamento de fato.
export async function POST(request: Request) {
    const contentType = request.headers.get("content-type") || ""
    let sid: string | null = null
    let sig: string | null = null

    if (contentType.includes("application/json")) {
        const body = await request.json().catch(() => ({}))
        sid = typeof body.sid === "string" ? body.sid : null
        sig = typeof body.sig === "string" ? body.sig : null
    } else {
        const form = await request.formData()
        sid = form.get("sid")?.toString() ?? null
        sig = form.get("sig")?.toString() ?? null
    }

    const leadId = await resolveLeadId(sid, sig)
    if (!leadId) {
        return confirmationPage("", "", "Link inválido ou expirado.")
    }

    try {
        await prisma.lead.update({
            where: { id: leadId },
            data: { status: LeadStatus.UNSUBSCRIBED },
        })
    } catch (error) {
        console.error("[Unsubscribe] Error:", error)
        return confirmationPage("", "", "Não foi possível processar o cancelamento. Tente novamente.")
    }

    return confirmationPage("", "", "Inscrição cancelada. Você não receberá mais e-mails.")
}
