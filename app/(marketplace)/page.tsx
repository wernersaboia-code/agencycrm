// app/(marketing)/page.tsx.bak
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    ShoppingBag,
    Database,
    Globe,
    Download,
    Shield,
    TrendingUp,
    CheckCircle,
    ArrowRight
} from "lucide-react"

export default function EasyProspectLanding() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[#4a2c5a] to-[#5d3a70] text-white">
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
                            <ShoppingBag className="h-4 w-4" />
                            <span className="text-sm">Marketplace de Leads B2B</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Encontre Leads Qualificados para{" "}
                            <span className="text-[#2ec4b6]">Comércio Exterior</span>
                        </h1>

                        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                            Acesse nossa base com milhares de empresas internacionais.
                            Compre apenas a lista que precisa, sem assinatura.
                        </p>

                        <div className="flex gap-4 justify-center">
                            <Button
                                size="lg"
                                className="bg-[#2ec4b6] hover:bg-[#1ba399] text-white"
                                asChild
                            >
                                <Link href="/catalog">
                                    Explorar Catálogo
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-white text-white hover:bg-white/10"
                                asChild
                            >
                                <Link href="#como-funciona">
                                    Como Funciona
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        <StatCard
                            value="50k+"
                            label="Leads Disponíveis"
                            icon={Database}
                        />
                        <StatCard
                            value="30+"
                            label="Países"
                            icon={Globe}
                        />
                        <StatCard
                            value="15+"
                            label="Setores"
                            icon={TrendingUp}
                        />
                        <StatCard
                            value="100%"
                            label="Emails Verificados"
                            icon={Shield}
                        />
                    </div>
                </div>
            </section>

            {/* Como Funciona */}
            <section id="como-funciona" className="py-20">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-12">
                        Como Funciona
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <StepCard
                            step={1}
                            title="Escolha a Lista"
                            description="Navegue pelo catálogo e filtre por país, setor e categoria"
                            icon={ShoppingBag}
                        />
                        <StepCard
                            step={2}
                            title="Pagamento Seguro"
                            description="Pague via PayPal de forma rápida e segura"
                            icon={Shield}
                        />
                        <StepCard
                            step={3}
                            title="Download Imediato"
                            description="Receba o arquivo CSV/Excel na hora e comece a prospectar"
                            icon={Download}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="bg-gradient-to-br from-[#2ec4b6] to-[#1ba399] text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Pronto para escalar suas vendas?
                    </h2>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                        Acesse leads qualificados e comece a prospectar hoje mesmo
                    </p>
                    <Button
                        size="lg"
                        className="bg-white text-[#2ec4b6] hover:bg-white/90"
                        asChild
                    >
                        <Link href="/catalog">
                            Ver Catálogo Completo
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    )
}

function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
    return (
        <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#4a2c5a]/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-8 w-8 text-[#4a2c5a]" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">{value}</div>
            <div className="text-gray-600">{label}</div>
        </div>
    )
}

function StepCard({ step, title, description, icon: Icon }: any) {
    return (
        <div className="text-center p-6">
            <div className="w-20 h-20 rounded-full bg-[#4a2c5a] text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                {step}
            </div>
            <div className="w-12 h-12 rounded-full bg-[#2ec4b6]/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-6 w-6 text-[#2ec4b6]" />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}