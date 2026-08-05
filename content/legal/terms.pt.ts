import type { LegalDocument } from "./types"

const termsPt: LegalDocument = {
    title: "Termos de Uso",
    lastUpdated: "2026-08-05",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Aceitação dos termos",
            blocks: [
                { kind: "paragrafo", texto: "O Easy Prospect é operado por Werner Wild Saboia Carvalho Marinho, pessoa física. Ao acessar ou usar o serviço, você concorda com estes termos. Se não concordar, não utilize o serviço." },
            ],
        },
        {
            id: "conta",
            heading: "2. Cadastro e conta",
            blocks: [
                { kind: "paragrafo", texto: "Você é responsável por manter a confidencialidade das suas credenciais. Avise imediatamente se identificar uso não autorizado da sua conta." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Uso aceitável",
            blocks: [
                { kind: "paragrafo", texto: "Você concorda em não utilizar o serviço para:" },
                { kind: "lista", itens: [
                    "Enviar spam, phishing ou conteúdo malicioso.",
                    "Tratar dados de contatos sem base legal adequada.",
                    "Tentar acessar dados de outros usuários ou áreas de trabalho.",
                    "Realizar engenharia reversa ou explorar vulnerabilidades.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "4. Propriedade intelectual",
            blocks: [
                { kind: "paragrafo", texto: "Os estudos e listas adquiridos destinam-se ao uso da sua empresa. Não é permitido revendê-los, redistribuí-los ou publicá-los." },
                { kind: "paragrafo", texto: "Os dados que você importa ou cadastra no CRM permanecem sob sua responsabilidade. Não reivindicamos propriedade sobre eles, exceto no necessário para operar o serviço." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Pagamentos e reembolsos",
            blocks: [
                { kind: "paragrafo", texto: "Compras em reais são processadas pelo Mercado Pago. Compras em euro ou dólar são processadas pelo Paddle, que atua como vendedor registrado (Merchant of Record) da transação e é o responsável pelo recolhimento dos impostos aplicáveis, incluindo o IVA na União Europeia. Nesses casos, a cobrança aparece no extrato em nome do Paddle." },
                { kind: "paragrafo", texto: "Reembolsos podem ser solicitados em até 14 dias após a compra, desde que o arquivo não tenha sido baixado. Escreva para contato@easyprospect.com.br. Compras processadas pelo Paddle são reembolsadas por ele, após a nossa autorização." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Limitação de responsabilidade",
            blocks: [
                { kind: "paragrafo", texto: "O serviço é fornecido no estado em que se encontra. Não garantimos disponibilidade ininterrupta nem resultado comercial específico: o retorno de um projeto de exportação depende de fatores fora do nosso controle." },
                { kind: "paragrafo", texto: "Nossa responsabilidade limita-se ao valor que você pagou pelo serviço nos últimos 12 meses." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Rescisão",
            blocks: [
                { kind: "paragrafo", texto: "Podemos suspender ou encerrar contas que violem estes termos. Você pode encerrar a sua a qualquer momento pelas configurações da conta; o acesso às compras já realizadas é mantido enquanto a conta existir." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Alterações",
            blocks: [
                { kind: "paragrafo", texto: "Estes termos podem ser atualizados. A data no topo indica a última revisão, e alterações relevantes são anunciadas com antecedência. O uso continuado após a alteração constitui aceitação." },
            ],
        },
        {
            id: "idade",
            heading: "9. Idade mínima",
            blocks: [
                { kind: "paragrafo", texto: "O serviço destina-se a maiores de 18 anos e a uso profissional." },
            ],
        },
    ],
}

export default termsPt
