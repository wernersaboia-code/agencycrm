import Link from "next/link"
import { redirect } from "next/navigation"
import type { ComponentType } from "react"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUserId } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight, CheckCircle, Download, Mail, Rocket, ShoppingBag } from "lucide-react"

interface SuccessPageProps {
    searchParams: Promise<{ purchaseId?: string }>
}

type PurchaseItemWithList = Prisma.PurchaseItemGetPayload<{
    include: {
        list: true
    }
}>

export const metadata = {
    title: "Compra Confirmada | LeadStore",
    description: "Sua compra foi confirmada com sucesso",
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { purchaseId } = await searchParams
    const userId = await getAuthenticatedUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    if (!purchaseId) {
        redirect("/catalog")
    }

    const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId, userId },
        include: {
            items: {
                include: {
                    list: true,
                },
            },
        },
    })

    if (!purchase) {
        redirect("/catalog")
    }

    const totalLeads = purchase.items.reduce(
        (sum: number, item: PurchaseItemWithList) => sum + item.list.totalLeads,
        0
    )

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-3xl">
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-emerald-100">
                        <CheckCircle className="h-9 w-9 text-emerald-600" />
                    </div>

                    <h1 className="mb-2 text-3xl font-bold text-gray-950">
                        Compra confirmada
                    </h1>
                    <p className="mx-auto mb-8 max-w-xl text-gray-500">
                        Seu pedido foi aprovado e as listas já estão disponíveis para download.
                    </p>

                    <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-5 text-left">
                        <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className="text-sm text-gray-500">Pedido</span>
                                <div className="font-mono text-sm font-medium text-gray-900">
                                    #{purchase.id.slice(0, 8)}
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="text-sm text-gray-500">Leads liberados</span>
                                <div className="font-semibold text-gray-900">{totalLeads.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="mb-4 space-y-3">
                            {purchase.items.map((item: PurchaseItemWithList) => (
                                <div key={item.id} className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="truncate font-medium text-gray-900">
                                            {item.list.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {item.list.totalLeads.toLocaleString()} leads
                                        </div>
                                    </div>
                                    <span className="shrink-0 font-medium text-gray-900">
                                        {formatCurrency(Number(item.price), purchase.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                            <span className="font-semibold text-gray-900">Total pago</span>
                            <span className="text-xl font-bold text-[#4a2c5a]">
                                {formatCurrency(Number(purchase.total), purchase.currency)}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <NextStep icon={Download} title="Baixe" text="Acesse CSV ou Excel em Minhas Compras." />
                        <NextStep icon={Rocket} title="Prospecção" text="Importe os leads no CRM e crie campanhas." />
                        <NextStep icon={Mail} title="Confirmação" text="O recibo foi enviado para seu email." />
                    </div>

                    <div className="mt-8 space-y-3">
                        <Button className="h-12 w-full bg-[#4a2c5a] hover:bg-[#5d3a70]" asChild>
                            <Link href="/my-purchases">
                                <ShoppingBag className="h-5 w-5" />
                                Acessar minhas compras
                            </Link>
                        </Button>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Button variant="outline" className="h-12" asChild>
                                <Link href="/dashboard">
                                    Usar CRM
                                </Link>
                            </Button>

                            <Button variant="outline" className="h-12" asChild>
                                <Link href="/catalog">
                                    Continuar comprando
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function NextStep({
    icon: Icon,
    title,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    title: string
    text: string
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-left">
            <Icon className="mb-3 h-5 w-5 text-[#2ec4b6]" />
            <div className="font-semibold text-gray-900">{title}</div>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
        </div>
    )
}
