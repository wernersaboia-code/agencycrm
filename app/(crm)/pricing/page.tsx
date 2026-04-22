// app/(crm)/pricing/page.tsx.bak
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Star, Shield, Zap, Users, Mail, BarChart3, Globe } from "lucide-react"

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Planos que crescem com você
                    </h1>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto">
                        Escolha o plano ideal para sua agência e comece a prospectar melhor hoje mesmo
                    </p>

                    {/* Toggle Anual/Mensal */}
                    <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mt-8">
                        <span className="text-sm">Mensal</span>
                        <div className="w-12 h-6 bg-white/20 rounded-full relative">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm flex items-center gap-1">
                            Anual
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                                -20%
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="container mx-auto px-4 -mt-10">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Starter */}
                    <PricingCard
                        name="Starter"
                        description="Ideal para pequenas agências"
                        monthlyPrice={29}
                        yearlyPrice={23}
                        features={[
                            { text: "Até 5.000 leads", included: true },
                            { text: "1 usuário", included: true },
                            { text: "Campanhas de email", included: true },
                            { text: "3 templates de email", included: true },
                            { text: "Registro de ligações", included: true },
                            { text: "Relatórios básicos", included: true },
                            { text: "Sequências automáticas", included: false },
                            { text: "SMTP personalizado", included: false },
                            { text: "API de integração", included: false },
                        ]}
                        cta="Começar Teste Grátis"
                        popular={false}
                    />

                    {/* Professional */}
                    <PricingCard
                        name="Professional"
                        description="Para agências em crescimento"
                        monthlyPrice={49}
                        yearlyPrice={39}
                        features={[
                            { text: "Até 50.000 leads", included: true },
                            { text: "3 usuários", included: true },
                            { text: "Campanhas de email", included: true },
                            { text: "Templates ilimitados", included: true },
                            { text: "Registro de ligações", included: true },
                            { text: "Relatórios avançados", included: true },
                            { text: "Sequências automáticas", included: true },
                            { text: "SMTP personalizado", included: true },
                            { text: "API de integração", included: false },
                        ]}
                        cta="Teste Grátis 14 dias"
                        popular={true}
                    />

                    {/* Enterprise */}
                    <PricingCard
                        name="Enterprise"
                        description="Para grandes operações"
                        monthlyPrice={99}
                        yearlyPrice={79}
                        features={[
                            { text: "Leads ilimitados", included: true },
                            { text: "10 usuários", included: true },
                            { text: "Campanhas de email", included: true },
                            { text: "Templates ilimitados", included: true },
                            { text: "Registro de ligações", included: true },
                            { text: "Relatórios personalizados", included: true },
                            { text: "Sequências automáticas", included: true },
                            { text: "SMTP personalizado", included: true },
                            { text: "API de integração", included: true },
                        ]}
                        cta="Falar com Vendas"
                        popular={false}
                    />
                </div>
            </div>

            {/* Feature Comparison */}
            <div className="container mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold text-center mb-12">
                    Compare os Recursos
                </h2>

                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
                    <ComparisonTable />
                </div>
            </div>

            {/* FAQ */}
            <div className="container mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold text-center mb-12">
                    Perguntas Frequentes
                </h2>

                <div className="max-w-3xl mx-auto space-y-4">
                    <FAQItem
                        question="Como funciona o período de teste?"
                        answer="Você tem 14 dias para testar todas as funcionalidades do plano Professional. Sem necessidade de cartão de crédito."
                    />
                    <FAQItem
                        question="Posso cancelar a qualquer momento?"
                        answer="Sim! Você pode cancelar sua assinatura quando quiser, sem multas ou taxas adicionais."
                    />
                    <FAQItem
                        question="Meus dados ficam salvos se eu cancelar?"
                        answer="Seus dados ficam salvos por 30 dias após o cancelamento. Você pode exportá-los a qualquer momento."
                    />
                    <FAQItem
                        question="Posso mudar de plano depois?"
                        answer="Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento."
                    />
                </div>
            </div>

            {/* CTA Final */}
            <div className="bg-blue-900 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">
                        Comece seu teste grátis hoje
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        14 dias para testar. Sem compromisso.
                    </p>
                    <Button
                        size="lg"
                        className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold"
                        asChild
                    >
                        <Link href="/crm/sign-up">
                            Criar Conta Grátis
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

function PricingCard({ name, description, monthlyPrice, yearlyPrice, features, cta, popular }: any) {
    return (
        <div className={`
            bg-white rounded-2xl shadow-lg overflow-hidden
            ${popular ? 'ring-2 ring-blue-500 scale-105 md:scale-110 relative z-10' : ''}
        `}>
            {popular && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2">
                    <Star className="h-4 w-4 inline mr-1 fill-white" />
                    Mais Popular
                </div>
            )}

            <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{name}</h3>
                <p className="text-gray-600 mb-6">{description}</p>

                <div className="mb-6">
                    <span className="text-4xl font-bold">€{monthlyPrice}</span>
                    <span className="text-gray-600">/mês</span>
                    <p className="text-sm text-gray-500 mt-1">
                        ou €{yearlyPrice}/mês no plano anual
                    </p>
                </div>

                <Button
                    className={`w-full mb-6 ${popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={popular ? 'default' : 'outline'}
                    asChild
                >
                    <Link href="/crm/sign-up">
                        {cta}
                    </Link>
                </Button>

                <ul className="space-y-3">
                    {features.map((feature: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                            <CheckCircle className={`h-5 w-5 flex-shrink-0 ${
                                feature.included ? 'text-green-500' : 'text-gray-300'
                            }`} />
                            <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                                {feature.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

function ComparisonTable() {
    const features = [
        { name: "Leads", starter: "5.000", pro: "50.000", enterprise: "Ilimitado" },
        { name: "Usuários", starter: "1", pro: "3", enterprise: "10" },
        { name: "Templates", starter: "3", pro: "Ilimitado", enterprise: "Ilimitado" },
        { name: "Campanhas", starter: "✓", pro: "✓", enterprise: "✓" },
        { name: "Sequências", starter: "—", pro: "✓", enterprise: "✓" },
        { name: "SMTP Personalizado", starter: "—", pro: "✓", enterprise: "✓" },
        { name: "Relatórios", starter: "Básico", pro: "Avançado", enterprise: "Personalizado" },
        { name: "API", starter: "—", pro: "—", enterprise: "✓" },
        { name: "Suporte", starter: "Email", pro: "Prioritário", enterprise: "24/7" },
    ]

    return (
        <table className="w-full">
            <thead className="bg-gray-50 border-b">
            <tr>
                <th className="text-left p-4 font-semibold">Recurso</th>
                <th className="text-center p-4 font-semibold">Starter</th>
                <th className="text-center p-4 font-semibold bg-blue-50">Professional</th>
                <th className="text-center p-4 font-semibold">Enterprise</th>
            </tr>
            </thead>
            <tbody>
            {features.map((feature, i) => (
                <tr key={i} className="border-b last:border-0">
                    <td className="p-4 font-medium">{feature.name}</td>
                    <td className="text-center p-4">{feature.starter}</td>
                    <td className="text-center p-4 bg-blue-50">{feature.pro}</td>
                    <td className="text-center p-4">{feature.enterprise}</td>
                </tr>
            ))}
            </tbody>
        </table>
    )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-bold mb-2">{question}</h3>
            <p className="text-gray-600">{answer}</p>
        </div>
    )
}