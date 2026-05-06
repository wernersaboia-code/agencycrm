// app/(crm)/trial-expired/page.tsx.bak
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Download, ArrowRight, CheckCircle } from "lucide-react"

export default function TrialExpiredPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
                <CardHeader className="text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <Crown className="h-10 w-10 text-amber-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold mb-2">
                        Seu período de teste terminou
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Mas não se preocupe! Seus dados estão seguros e você pode continuar de onde parou.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Opções */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                            <h3 className="text-xl font-bold text-blue-900 mb-3">
                                Assinar Agora
                            </h3>
                            <p className="text-blue-700 mb-4">
                                Continue usando todas as funcionalidades sem interrupção
                            </p>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-sm text-blue-800">
                                    <CheckCircle className="h-4 w-4" />
                                    20% off no plano anual
                                </li>
                                <li className="flex items-center gap-2 text-sm text-blue-800">
                                    <CheckCircle className="h-4 w-4" />
                                    Acesso imediato
                                </li>
                                <li className="flex items-center gap-2 text-sm text-blue-800">
                                    <CheckCircle className="h-4 w-4" />
                                    Cancele quando quiser
                                </li>
                            </ul>
                            <Button className="w-full" asChild>
                                <Link href="/pricing">
                                    Ver Planos
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">
                                Exportar Dados
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Baixe todos os seus dados para usar em outra ferramenta
                            </p>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Download className="h-4 w-4" />
                                    Leads (CSV/Excel)
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Download className="h-4 w-4" />
                                    Histórico de campanhas
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Download className="h-4 w-4" />
                                    Relatórios
                                </li>
                            </ul>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/reports">
                                    Abrir relatórios
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Garantia */}
                    <div className="text-center pt-4 border-t">
                        <p className="text-sm text-gray-500">
                            💡 Dúvidas? Entre em contato com nosso suporte: suporte@agencycrm.com
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
