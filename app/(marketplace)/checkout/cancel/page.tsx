import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw, ShieldAlert, ShoppingCart } from "lucide-react"

export const metadata = {
    title: "Compra Cancelada | LeadStore",
    description: "Sua compra foi cancelada",
}

export default function CancelPage() {
    return (
        <div className="min-h-[70vh] bg-gray-50 px-4 py-16">
            <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-amber-100">
                    <ShieldAlert className="h-9 w-9 text-amber-600" />
                </div>

                <h1 className="mb-2 text-2xl font-bold text-gray-950">
                    Pagamento não finalizado
                </h1>
                <p className="mb-8 text-sm text-gray-500">
                    Nenhuma cobrança foi concluída. Você pode revisar o carrinho ou tentar o checkout novamente.
                </p>

                <div className="space-y-3">
                    <Button className="h-12 w-full bg-[#4a2c5a] hover:bg-[#5d3a70]" asChild>
                        <Link href="/checkout">
                            <RotateCcw className="h-5 w-5" />
                            Tentar novamente
                        </Link>
                    </Button>

                    <Button variant="outline" className="h-12 w-full" asChild>
                        <Link href="/cart">
                            <ShoppingCart className="h-5 w-5" />
                            Revisar carrinho
                        </Link>
                    </Button>

                    <Button variant="ghost" className="h-12 w-full" asChild>
                        <Link href="/catalog">
                            <ArrowLeft className="h-5 w-5" />
                            Voltar ao catálogo
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
