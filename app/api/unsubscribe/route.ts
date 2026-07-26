import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"
import { verifySignature } from "@/lib/signing"
import { addSuppression } from "@/lib/campaigns/suppression"

// Escapa valores antes de interpolar no HTML desta rota. sid/sig já são
// validados por HMAC antes de chegar aqui, mas escapamos como defesa em
// profundidade (e para o campo message, que é texto literal do código).
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

// Resolve o lead a partir do envio assinado. Retorna null se a assinatura
// nao conferir ou o envio nao existir.
async function resolveLead(
    sid: string | null,
    sig: string | null
): Promise<{ leadId: string; email: string; workspaceId: string } | null> {
    if (!sid || !verifySignature(sid, sig)) {
        return null
    }

    const emailSend = await prisma.emailSend.findUnique({
        where: { id: sid },
        select: {
            leadId: true,
            lead: { select: { email: true, workspaceId: true } },
        },
    })

    if (!emailSend?.lead) {
        return null
    }

    return {
        leadId: emailSend.leadId,
        email: emailSend.lead.email,
        workspaceId: emailSend.lead.workspaceId,
    }
}

function confirmationPage(sid: string, sig: string, message?: string): NextResponse {
    const safeSid = escapeHtml(sid)
    const safeSig = escapeHtml(sig)
    const safeMessage = message ? escapeHtml(message) : undefined

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
        safeMessage
            ? `<p class="msg">${safeMessage}</p>`
            : `<p>Confirme que não deseja mais receber e-mails deste remetente.</p>
    <form method="POST">
      <input type="hidden" name="sid" value="${safeSid}" />
      <input type="hidden" name="sig" value="${safeSig}" />
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

    const resolved = await resolveLead(sid, sig)
    if (!resolved || !sid || !sig) {
        return confirmationPage("", "", "Link inválido ou expirado.")
    }

    return confirmationPage(sid, sig)
}

// POST executa o cancelamento de fato.
export async function POST(request: Request) {
    const url = new URL(request.url)
    const contentType = request.headers.get("content-type") || ""

    // One-click (RFC 8058) faz POST com corpo "List-Unsubscribe=One-Click" e
    // mantém sid/sig na query string — por isso a query é a primeira fonte.
    let sid: string | null = url.searchParams.get("sid")
    let sig: string | null = url.searchParams.get("sig")
    let isOneClick = false

    if (contentType.includes("application/json")) {
        const body = await request.json().catch(() => ({}))
        sid = sid ?? (typeof body.sid === "string" ? body.sid : null)
        sig = sig ?? (typeof body.sig === "string" ? body.sig : null)
    } else if (contentType) {
        const form = await request.formData().catch(() => null)
        if (form) {
            sid = sid ?? (form.get("sid")?.toString() ?? null)
            sig = sig ?? (form.get("sig")?.toString() ?? null)
            isOneClick = form.get("List-Unsubscribe")?.toString() === "One-Click"
        }
    }

    const resolved = await resolveLead(sid, sig)
    if (!resolved) {
        if (isOneClick) {
            return new NextResponse("Invalid link", { status: 400 })
        }
        return confirmationPage("", "", "Link inválido ou expirado.")
    }

    try {
        await prisma.lead.update({
            where: { id: resolved.leadId },
            data: { status: LeadStatus.UNSUBSCRIBED },
        })

        // Descadastro também entra na supressão: o lead pode existir em outra
        // campanha do mesmo workspace, e ali o status do lead não seria checado.
        await addSuppression(prisma, {
            email: resolved.email,
            workspaceId: resolved.workspaceId,
            reason: "unsubscribe",
        })
    } catch (error) {
        console.error("[Unsubscribe] Error:", error)
        if (isOneClick) {
            return new NextResponse("Error", { status: 500 })
        }
        return confirmationPage("", "", "Não foi possível processar o cancelamento. Tente novamente.")
    }

    if (isOneClick) {
        return new NextResponse("Unsubscribed", {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    }

    return confirmationPage("", "", "Inscrição cancelada. Você não receberá mais e-mails.")
}
