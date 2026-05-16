import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Política de Privacidade",
    robots: { index: false },
}

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
            <p className="mt-2 text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

            <div className="mt-8 space-y-8 text-sm leading-7 text-muted-foreground">
                <section>
                    <h2 className="text-lg font-semibold text-foreground">1. Dados que coletamos</h2>
                    <p className="mt-2">
                        Coletamos informações necessárias para operar o serviço:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li><strong>Dados de conta:</strong> nome, e-mail, avatar (via Supabase Auth).</li>
                        <li><strong>Dados de leads:</strong> nome, e-mail, telefone, empresa, cargo, endereço (inseridos por você ou importados).</li>
                        <li><strong>Dados de uso:</strong> interações com campanhas (aberturas, cliques), registros de ligações, compras no marketplace.</li>
                        <li><strong>Dados de pagamento:</strong> dados de transações PayPal (não armazenamos cartões).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">2. Como usamos seus dados</h2>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Operar o CRM e o marketplace de leads.</li>
                        <li>Enviar e-mails de campanha (com rastreamento de abertura/clique, se ativado).</li>
                        <li>Processar pagamentos e entregar compras.</li>
                        <li>Enviar notificações transacionais (faturas, alertas de conta).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">3. Compartilhamento de dados</h2>
                    <p className="mt-2">
                        Não vendemos dados pessoais. Utilizamos subprocessores para operações específicas:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li><strong>Supabase</strong> — hospedagem de banco de dados, autenticação e armazenamento.</li>
                        <li><strong>PayPal</strong> — processamento de pagamentos.</li>
                        <li><strong>Resend</strong> — envio de e-mails transacionais e de campanha.</li>
                        <li><strong>Vercel</strong> — hospedagem da aplicação e analytics de performance.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">4. Seus direitos (LGPD/GDPR)</h2>
                    <p className="mt-2">
                        Você tem direito a acessar, corrigir, exportar ou excluir seus dados.
                        Para solicitações, entre em contato pelo e-mail de suporte indicado na sua conta.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">5. Cookies e rastreamento</h2>
                    <p className="mt-2">
                        Utilizamos cookies essenciais para autenticação (Supabase) e preferências de workspace.
                        Cookies de analytics (Vercel Analytics) são carregados apenas com seu consentimento.
                        Pixel de rastreamento de e-mail é inserido apenas em campanhas ativas.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">6. Retenção</h2>
                    <p className="mt-2">
                        Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta,
                        dados pessoais são anonimizados ou removidos em até 90 dias, salvo obrigações legais.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground">7. Contato</h2>
                    <p className="mt-2">
                        Dúvidas sobre esta política podem ser enviadas pelo canal de suporte da plataforma.
                    </p>
                </section>
            </div>
        </div>
    )
}
