import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Termos de Uso",
    robots: { index: false },
}

export default function TermsPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
            <p className="mt-2 text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

            <div className="mt-8 space-y-8 text-sm leading-7 text-muted-foreground">
                <section>
                    <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos termos</h2>
                    <p className="mt-2">
                        Ao acessar ou usar a Easy Prospect, você concorda com estes termos.
                        Se não concordar, não utilize o serviço.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">2. Cadastro e conta</h2>
                    <p className="mt-2">
                        Você é responsável por manter a confidencialidade de suas credenciais.
                        Notifique-nos imediatamente sobre qualquer uso não autorizado da sua conta.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">3. Uso aceitável</h2>
                    <p className="mt-2">
                        Você concorda em não utilizar o serviço para:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Enviar spam, phishing ou conteúdo malicioso.</li>
                        <li>Importar ou processar dados de leads sem consentimento adequado.</li>
                        <li>Tentar acessar dados de outros usuários ou workspaces.</li>
                        <li>Realizar engenharia reversa ou explorar vulnerabilidades.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">4. Propriedade intelectual</h2>
                    <p className="mt-2">
                        Os dados de leads que você importa ou adquire permanecem sob sua responsabilidade.
                        A plataforma não reivindica propriedade sobre seus dados, exceto conforme necessário
                        para operar o serviço.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">5. Pagamentos e reembolsos</h2>
                    <p className="mt-2">
                        Compras no marketplace são processadas via PayPal. Reembolsos são avaliados caso a caso
                        e podem ser solicitados em até 7 dias após a compra, desde que os arquivos não tenham
                        sido baixados.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">6. Limitação de responsabilidade</h2>
                    <p className="mt-2">
                        O serviço é fornecido &quot;como está&quot;. Não garantimos disponibilidade ininterrupta
                        ou resultados específicos de prospecção. Nossa responsabilidade limita-se ao valor
                        pago pelo serviço nos últimos 12 meses.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">7. Rescisão</h2>
                    <p className="mt-2">
                        Podemos suspender ou encerrar contas que violem estes termos.
                        Você pode encerrar sua conta a qualquer momento pelas configurações do CRM.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">8. Alterações</h2>
                    <p className="mt-2">
                        Podemos atualizar estes termos periodicamente. Alterações materiais serão notificadas
                        com antecedência. O uso continuado após alterações constitui aceitação.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">9. Idade mínima</h2>
                    <p className="mt-2">
                        O serviço é destinado a usuários com 18 anos ou mais. Menores de idade não devem
                        utilizar a plataforma sem supervisão de um responsável legal.
                    </p>
                </section>
            </div>
        </div>
    )
}
