// app/api/admin/lists/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import {
    uploadListPdf,
    removeListPdfByPath,
    validatePdfFile,
    downloadListPdf,
    createStudySignedUrl,
} from "@/lib/supabase/list-studies"
import { compararConteudoDosPdfs } from "@/lib/marketplace/pdf-conteudo"
import { encontrarContatosPessoaisNoPdf } from "@/lib/marketplace/pdf-contatos"
import { contarEmpresasDoPdf } from "@/lib/marketplace/pdf-do-estudo"
import { regravarLeadsDoPdf } from "@/lib/marketplace/leads-do-pdf"

/**
 * Os leads do PDF (só do admin) acompanham o arquivo no ar. Falha aqui não
 * desfaz a troca do PDF: o estudo vale mais que a lista interna de empresas.
 */
async function regravarLeadsSemDerrubar(listId: string, bytes: Uint8Array | null) {
    try {
        await regravarLeadsDoPdf(listId, bytes)
    } catch (error) {
        console.error("[PDF] Não foi possível regravar os leads do estudo:", error)
    }
}

/**
 * Abre o PDF que está publicado, para a equipe conferir o que o comprador
 * recebe. Mesmo caminho do download do cliente (link assinado de 2 minutos),
 * mas sem compra e sem contar download: só admin passa.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params
        const list = await prisma.leadList.findUnique({
            where: { id },
            select: { studyPdfUrl: true, studyPdfPreviousUrl: true },
        })
        // ?versao=anterior abre o backup, para conferir antes de voltar a ele.
        const anterior = request.nextUrl.searchParams.get("versao") === "anterior"
        const path = anterior ? list?.studyPdfPreviousUrl : list?.studyPdfUrl
        if (!path) {
            return NextResponse.json({ error: "Esta lista não tem PDF" }, { status: 404 })
        }

        return NextResponse.redirect(await createStudySignedUrl(path))
    } catch (error) {
        console.error("Error opening study PDF:", error)
        return NextResponse.json({ error: "Falha ao abrir o PDF" }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({
            where: { id },
            select: { id: true, studyPdfUrl: true, studyPdfName: true, companyCountManual: true },
        })
        if (!list) {
            return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
        }

        const formData = await request.formData()
        const file = formData.get("file")
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 })
        }

        const check = validatePdfFile({ type: file.type, size: file.size })
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 })
        }

        // Contato pessoal dentro do estudo é o que fez o Paddle enquadrar o
        // site como marketing direto, e é o que expõe o comprador ao §7 da UWG
        // alemã. O bloqueio não é definitivo — o detector erra para menos e
        // para mais —, mas obrigar uma confirmação explícita impede que um PDF
        // volte a subir com e-mail nominal só porque ninguém reparou.
        const bytes = new Uint8Array(await file.arrayBuffer())
        const achados = await encontrarContatosPessoaisNoPdf(bytes)
        const confirmado = formData.get("confirmarContatosPessoais") === "true"

        if (achados.length > 0 && !confirmado) {
            return NextResponse.json(
                { error: "contatos_pessoais", achados: achados.slice(0, 40) },
                { status: 422 }
            )
        }

        // Troca de PDF (em geral, capa nova): o miolo tem de vir inteiro. A
        // comparação é com o arquivo que está na loja agora, antes de ele ser
        // apagado pelo upload. Perda acima do limite pede confirmação
        // explícita, que fica no log de auditoria.
        let comparacao: Awaited<ReturnType<typeof compararConteudoDosPdfs>> = null
        if (list.studyPdfUrl) {
            try {
                comparacao = await compararConteudoDosPdfs(
                    await downloadListPdf(list.studyPdfUrl),
                    // Cópia nova: a checagem de contatos acima pode ter esvaziado `bytes`.
                    new Uint8Array(await file.arrayBuffer())
                )
            } catch (error) {
                console.error("[PDF] Não foi possível baixar o estudo atual para comparar:", error)
            }
        }

        const perdaConfirmada = formData.get("confirmarPerdaDeConteudo") === "true"
        if (comparacao && !comparacao.aprovado && !perdaConfirmada) {
            return NextResponse.json(
                { error: "conteudo_faltando", comparacao },
                { status: 422 }
            )
        }

        // O PDF atual vira a versão anterior; o backup de antes dele é apagado.
        const { url } = await uploadListPdf(file, id, list.studyPdfUrl)

        if (comparacao) {
            await recordAudit({
                actorId: admin.id,
                actorEmail: admin.email,
                action: comparacao.aprovado ? "list.pdf.replaced" : "list.pdf.content_loss_confirmed",
                targetType: "list",
                targetId: id,
                metadata: {
                    file: file.name,
                    previous: list.studyPdfUrl,
                    paginasAntigas: comparacao.paginasAntigas,
                    paginasNovas: comparacao.paginasNovas,
                    totalPalavras: comparacao.totalPalavras,
                    palavrasFaltando: comparacao.palavrasFaltando,
                    trechosFaltando: comparacao.trechosFaltando,
                },
            })
        }

        if (achados.length > 0) {
            await recordAudit({
                actorId: admin.id,
                actorEmail: admin.email,
                action: "list.pdf.personal_contacts_confirmed",
                targetType: "list",
                targetId: id,
                metadata: {
                    file: file.name,
                    total: achados.length,
                    achados: achados.slice(0, 40),
                },
            })
        }

        // Estudo novo, diretório novo: a estimativa de empresas (só do admin)
        // é refeita, a não ser que o número tenha sido conferido à mão. PDF sem
        // diretório reconhecível mantém o número anterior.
        // Cópia nova dos bytes: o pdf.js pode transferir (e esvaziar) o buffer
        // que a checagem de contatos acima já leu.
        const contagem = list.companyCountManual
            ? null
            : await contarEmpresasDoPdf(new Uint8Array(await file.arrayBuffer()))

        await prisma.leadList.update({
            where: { id },
            data: {
                studyPdfUrl: url,
                studyPdfName: file.name,
                ...(list.studyPdfUrl
                    ? {
                          studyPdfPreviousUrl: list.studyPdfUrl,
                          studyPdfPreviousName: list.studyPdfName,
                          studyPdfReplacedAt: new Date(),
                      }
                    : {}),
                ...(contagem ? { companyCount: contagem.total, companyCountManual: false } : {}),
            },
        })

        await regravarLeadsSemDerrubar(id, new Uint8Array(await file.arrayBuffer()))

        return NextResponse.json({ studyPdfName: file.name })
    } catch (error) {
        console.error("Error uploading study PDF:", error)
        return NextResponse.json({ error: "Falha no upload" }, { status: 500 })
    }
}

/**
 * Volta à versão anterior do PDF. As duas trocam de lugar, então voltar de
 * novo desfaz a volta. A lista não é republicada sozinha: se o PDF tinha sido
 * removido, o admin reativa depois de conferir.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({
            where: { id },
            select: {
                studyPdfUrl: true,
                studyPdfName: true,
                studyPdfPreviousUrl: true,
                studyPdfPreviousName: true,
                companyCountManual: true,
            },
        })
        if (!list) {
            return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
        }
        if (!list.studyPdfPreviousUrl) {
            return NextResponse.json({ error: "Não há versão anterior" }, { status: 404 })
        }

        // A estimativa de empresas e os leads do PDF seguem o PDF que fica no ar.
        let bytesAnterior: Uint8Array | null = null
        try {
            bytesAnterior = await downloadListPdf(list.studyPdfPreviousUrl)
        } catch (error) {
            console.error("[PDF] Não foi possível baixar a versão anterior:", error)
        }
        let contagem: Awaited<ReturnType<typeof contarEmpresasDoPdf>> = null
        if (!list.companyCountManual && bytesAnterior) {
            contagem = await contarEmpresasDoPdf(new Uint8Array(bytesAnterior))
        }

        await prisma.leadList.update({
            where: { id },
            data: {
                studyPdfUrl: list.studyPdfPreviousUrl,
                studyPdfName: list.studyPdfPreviousName,
                studyPdfPreviousUrl: list.studyPdfUrl,
                studyPdfPreviousName: list.studyPdfUrl ? list.studyPdfName : null,
                studyPdfReplacedAt: new Date(),
                ...(contagem ? { companyCount: contagem.total, companyCountManual: false } : {}),
            },
        })

        if (bytesAnterior) await regravarLeadsSemDerrubar(id, bytesAnterior)

        await recordAudit({
            actorId: admin.id,
            actorEmail: admin.email,
            action: "list.pdf.restored",
            targetType: "list",
            targetId: id,
            metadata: {
                restored: list.studyPdfPreviousName,
                replaced: list.studyPdfName,
            },
        })

        return NextResponse.json({
            studyPdfName: list.studyPdfPreviousName,
            previousName: list.studyPdfUrl ? list.studyPdfName : null,
        })
    } catch (error) {
        console.error("Error restoring study PDF:", error)
        return NextResponse.json({ error: "Falha ao voltar à versão anterior" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({
            where: { id },
            select: {
                studyPdfUrl: true,
                studyPdfName: true,
                studyPdfPreviousUrl: true,
                isActive: true,
                name: true,
            },
        })

        // Remover também se desfaz: o PDF atual vira a versão anterior, e só o
        // backup de antes dele sai do bucket.
        if (list?.studyPdfUrl && list.studyPdfPreviousUrl) {
            await removeListPdfByPath(list.studyPdfPreviousUrl)
        }

        // Sem o PDF a lista não entrega nada: catálogo, página e checkout só
        // filtram por isActive, então mantê-la ativa deixa o comprador pagar e
        // esbarrar em "esta lista ainda não tem PDF disponível" no download.
        // Despublicar junto é a única forma de a remoção não virar venda vazia.
        await prisma.leadList.update({
            where: { id },
            data: {
                studyPdfUrl: null,
                studyPdfName: null,
                isActive: false,
                ...(list?.studyPdfUrl
                    ? {
                          studyPdfPreviousUrl: list.studyPdfUrl,
                          studyPdfPreviousName: list.studyPdfName,
                          studyPdfReplacedAt: new Date(),
                      }
                    : {}),
            },
        })

        await regravarLeadsSemDerrubar(id, null)

        const unpublished = list?.isActive === true

        if (unpublished) {
            await recordAudit({
                actorId: admin.id,
                actorEmail: admin.email,
                action: "list.unpublished",
                targetType: "list",
                targetId: id,
                metadata: { name: list?.name ?? null, reason: "study_pdf_removed" },
            })
        }

        return NextResponse.json({ ok: true, unpublished })
    } catch (error) {
        console.error("Error removing study PDF:", error)
        return NextResponse.json({ error: "Falha ao remover" }, { status: 500 })
    }
}
