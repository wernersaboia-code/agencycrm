// app/(marketplace)/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Globe,
    CheckCircle,
    TrendingUp,
    ArrowRight,
    Building2,
    Mail,
    Phone,
    Shield
} from "lucide-react"

export default function MarketplacePage() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                            Leads Qualificados de{" "}
                            <span className="text-primary">Comércio Exterior</span>
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            Encontre compradores e fornecedores internacionais com dados
                            verificados e prontos para prospecção.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link href="/catalog">
                                    Ver Catálogo
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="#como-funciona">
                                    Saiba Mais
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 border-y bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <Stat icon={Globe} value="+50.000" label="Empresas" />
                        <Stat icon={CheckCircle} value="85%+" label="Emails Verificados" />
                        <Stat icon={Building2} value="12" label="Setores" />
                        <Stat icon={TrendingUp} value="30" label="Países" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Por que escolher o LeadStore?
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={Globe}
                            title="Dados Internacionais"
                            description="Empresas da Europa, Ásia e América do Norte prontas para negociar."
                        />
                        <FeatureCard
                            icon={CheckCircle}
                            title="Verificados"
                            description="Emails testados e dados atualizados nos últimos 6 meses."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Curadoria Especializada"
                            description="30 anos de experiência em comércio exterior."
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Integração com CRM"
                            description="Importe direto para o AgencyCRM e comece a prospectar."
                        />
                    </div>
                </div>
            </section>

            {/* Como Funciona */}
            <section id="como-funciona" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Como Funciona
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <StepCard
                            number="1"
                            title="Escolha"
                            description="Navegue pelo catálogo e escolha as listas que interessam ao seu negócio."
                        />
                        <StepCard
                            number="2"
                            title="Pague"
                            description="Finalize sua compra de forma segura com PayPal."
                        />
                        <StepCard
                            number="3"
                            title="Prospecte"
                            description="Baixe os dados ou importe direto para o CRM e comece a vender."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Pronto para expandir seus negócios?
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            Acesse nosso catálogo e encontre os leads perfeitos para sua empresa.
                        </p>
                        <Button size="lg" asChild>
                            <Link href="/catalog">
                                Ver Catálogo Completo
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

// Componentes auxiliares

function Stat({
                  icon: Icon,
                  value,
                  label
              }: {
    icon: React.ElementType
    value: string
    label: string
}) {
    return (
        <div className="text-center">
            <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl lg:text-3xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    )
}

function FeatureCard({
                         icon: Icon,
                         title,
                         description
                     }: {
    icon: React.ElementType
    title: string
    description: string
}) {
    return (
        <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

function StepCard({
                      number,
                      title,
                      description
                  }: {
    number: string
    title: string
    description: string
}) {
    return (
        <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold mb-4">
                {number}
            </div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}