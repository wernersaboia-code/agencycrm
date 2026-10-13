import type { LegalDocument } from "./types"

const termsPt: LegalDocument = {
    title: "Termos de Uso",
    lastUpdated: "2026-10-13",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Aceitação dos termos",
            blocks: [
                { kind: "paragrafo", texto: "O Easy Prospect é operado por Werner Wild Saboia Carvalho Marinho, pessoa física. Ao acessar ou usar o serviço, você concorda com estes termos. Se não concordar, não utilize o serviço." },
            ],
        },
        {
            id: "servico",
            heading: "2. O serviço",
            blocks: [
                { kind: "paragrafo", texto: "O Easy Prospect vende estudos de entrada em mercado, entregues em PDF. Depois da confirmação do pagamento, o estudo fica disponível para download na área Minhas compras." },
                { kind: "paragrafo", texto: "Os preços aparecem no catálogo na moeda escolhida, e a cobrança é feita pelo provedor de pagamento indicado no checkout." },
                { kind: "paragrafo", texto: "Os estudos são elaborados a partir de fontes públicas e refletem a situação na data de revisão informada na página de cada estudo. Empresas mudam de contato, de estrutura e de estratégia: confira as informações antes de tomar decisões comerciais." },
            ],
        },
        {
            id: "conta",
            heading: "3. Cadastro e conta",
            blocks: [
                { kind: "paragrafo", texto: "Você é responsável por manter a confidencialidade das suas credenciais. Avise imediatamente se identificar uso não autorizado da sua conta." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "4. Uso aceitável",
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
            heading: "5. Propriedade intelectual",
            blocks: [
                { kind: "paragrafo", texto: "Os estudos adquiridos destinam-se ao uso da sua empresa. Não é permitido revendê-los, redistribuí-los ou publicá-los." },
                { kind: "paragrafo", texto: "Os dados que você importa ou cadastra no CRM permanecem sob sua responsabilidade. Não reivindicamos propriedade sobre eles, exceto no necessário para operar o serviço." },
            ],
        },
        {
            id: "pagamentos",
            heading: "6. Pagamentos e reembolsos",
            blocks: [
                { kind: "paragrafo", texto: "Compras no catálogo são processadas por provedor de pagamento certificado. O reembolso é integral e incondicional em até 14 dias após a compra, nos termos da Política de Reembolso." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "7. Limitação de responsabilidade",
            blocks: [
                { kind: "paragrafo", texto: "O serviço é fornecido no estado em que se encontra. Não garantimos disponibilidade ininterrupta nem resultado comercial específico: o retorno de um projeto de exportação depende de fatores fora do nosso controle." },
                { kind: "paragrafo", texto: "Nossa responsabilidade limita-se ao valor que você pagou pelo serviço nos últimos 12 meses." },
            ],
        },
        {
            id: "rescisao",
            heading: "8. Rescisão",
            blocks: [
                { kind: "paragrafo", texto: "Podemos suspender ou encerrar contas que violem estes termos. Você pode pedir o encerramento da sua a qualquer momento escrevendo para contato@easyprospect.com.br; enquanto a conta existir, o acesso às compras já realizadas é mantido." },
            ],
        },
        {
            id: "alteracoes",
            heading: "9. Alterações",
            blocks: [
                { kind: "paragrafo", texto: "Estes termos podem ser atualizados. A data no topo indica a última revisão, e alterações relevantes são anunciadas com antecedência. O uso continuado após a alteração constitui aceitação." },
            ],
        },
        {
            id: "idade",
            heading: "10. Idade mínima",
            blocks: [
                { kind: "paragrafo", texto: "O serviço destina-se a maiores de 18 anos e a uso profissional." },
            ],
        },
        {
            id: "foroLei",
            heading: "11. Lei aplicável e foro",
            blocks: [
                { kind: "paragrafo", texto: "Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de Fortaleza, Ceará, para resolver qualquer controvérsia relacionada a eles." },
                { kind: "paragrafo", texto: "Se você contrata como consumidor, essa escolha não afasta os direitos que as normas obrigatórias de proteção ao consumidor lhe garantem, inclusive o de recorrer à Justiça do lugar onde mora." },
            ],
        },
    ],
}

export default termsPt
