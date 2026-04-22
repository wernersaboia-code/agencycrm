// app/(marketplace)/checkout/cancel/page.tsx.bak
import { XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: "Compra Cancelada | LeadStore",
    description: "Sua compra foi cancelada",
}

export default function CancelPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    {/* Ícone de Cancelamento */}
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-10 w-10 text-red-600" />
                    </div>

                    {/* Título */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Compra Cancelada
                    </h1>
                    <p className="text-gray-500 mb-8">
                        Sua compra não foi finalizada. Você pode tentar novamente quando quiser.
                    </p>

                    {/* Ações */}
                    <div className="space-y-3">
                        <Button className="w-full h-12 bg-[#4a2c5a] hover:bg-[#5d3a70]" asChild>
                            <Link href="/catalog">
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Voltar ao Catálogo
                            </Link>
                        </Button>

                        <Button variant="outline" className="w-full h-12" asChild>
                            <Link href="/">
                                Ir para Página Inicial
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}