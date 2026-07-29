import type { LegalDocument } from "./types"

const privacyPt: LegalDocument = {
    title: "Política de Privacidade",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "responsavel",
            heading: "1. Quem é o responsável",
            blocks: [
                { kind: "paragrafo", texto: "O Easy Prospect é operado por Werner Wild Saboia Carvalho Marinho, pessoa física, responsável pelas decisões sobre o tratamento dos dados descritos nesta política." },
                { kind: "paragrafo", texto: "Para qualquer assunto relativo a dados pessoais, incluindo o exercício dos direitos descritos abaixo, escreva para contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Dados que tratamos",
            blocks: [
                { kind: "paragrafo", texto: "Tratamos as informações necessárias para operar o serviço:" },
                { kind: "lista", itens: [
                    "Dados de conta: nome, e-mail e avatar, fornecidos por você no cadastro e gerenciados pelo Supabase Auth.",
                    "Dados de compra: itens adquiridos, valor, moeda e histórico de download.",
                    "Dados de pagamento: identificadores da transação no Stripe. Não recebemos nem armazenamos números de cartão.",
                    "Dados de uso do site: páginas acessadas e eventos de navegação, apenas quando você aceita os cookies de medição.",
                    "Dados inseridos por você no CRM: contatos, empresas e registros de atividade que você importa ou cadastra.",
                    "Dados de contato profissional de terceiros: as empresas e pessoas de contato que compõem as listas do catálogo. Ver a seção específica abaixo.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Base legal de cada tratamento",
            blocks: [
                { kind: "lista", itens: [
                    "Criar e manter a sua conta, processar a compra e entregar o estudo adquirido: execução do contrato entre nós.",
                    "Enviar mensagens sobre a sua compra, como confirmação e liberação do download: execução do contrato.",
                    "Guardar registros de venda pelos prazos exigidos: cumprimento de obrigação legal.",
                    "Medir o uso do site: consentimento, que você pode recusar ou retirar a qualquer momento pelo banner de cookies.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. Como usamos os dados",
            blocks: [
                { kind: "lista", itens: [
                    "Operar o catálogo, o checkout e a entrega dos estudos adquiridos.",
                    "Dar acesso permanente às suas compras na área Minhas compras.",
                    "Enviar notificações transacionais relacionadas à sua conta e às suas compras.",
                    "Operar o CRM para os dados que você mesmo cadastra ou importa.",
                ] },
                { kind: "paragrafo", texto: "Não vendemos dados pessoais de usuários e não usamos os seus dados de conta para treinar modelos." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Com quem compartilhamos",
            blocks: [
                { kind: "paragrafo", texto: "Utilizamos prestadores de serviço para operações específicas, cada um com acesso apenas ao necessário:" },
                { kind: "lista", itens: [
                    "Supabase — banco de dados, autenticação e armazenamento de arquivos.",
                    "Stripe — processamento de pagamentos.",
                    "Resend — envio de e-mails transacionais e de campanha.",
                    "Vercel — hospedagem da aplicação e medição de desempenho.",
                    "Zoho — caixa do endereço de contato.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. Transferências internacionais",
            blocks: [
                { kind: "paragrafo", texto: "O banco de dados está hospedado no Brasil. Os demais prestadores listados acima operam infraestrutura em vários países, incluindo Estados Unidos e União Europeia." },
                { kind: "paragrafo", texto: "Se você está na União Europeia, isso significa que seus dados podem ser tratados fora do Espaço Econômico Europeu. O Brasil não possui, nesta data, decisão de adequação da Comissão Europeia." },
            ],
        },
        {
            id: "listas",
            heading: "7. Dados de contato nas listas do catálogo",
            blocks: [
                { kind: "paragrafo", texto: "As listas vendidas no catálogo reúnem dados de contato profissional de empresas: nome da empresa, país, setor, site, e-mails e telefones institucionais. Em algumas listas consta também o nome e o cargo de uma pessoa de contato." },
                { kind: "paragrafo", texto: "Esses dados são obtidos de fontes públicas — sites institucionais, registros empresariais e outras informações de acesso público — e não são coletados junto à própria pessoa." },
                { kind: "paragrafo", texto: "Se você identificou dados seus em uma de nossas listas e quer acessá-los, corrigi-los, se opor ao tratamento ou solicitar a remoção, escreva para contato@easyprospect.com.br. Solicitações desse tipo são atendidas." },
            ],
        },
        {
            id: "direitos",
            heading: "8. Seus direitos",
            blocks: [
                { kind: "paragrafo", texto: "Você pode solicitar, a qualquer momento:" },
                { kind: "lista", itens: [
                    "Acesso aos dados que tratamos sobre você.",
                    "Correção de dados incompletos ou desatualizados.",
                    "Exclusão dos seus dados, ressalvadas as obrigações legais de guarda.",
                    "Portabilidade dos dados que você nos forneceu.",
                    "Oposição a um tratamento e retirada do consentimento, quando for essa a base.",
                ] },
                { kind: "paragrafo", texto: "Basta escrever para contato@easyprospect.com.br. Você também tem o direito de apresentar reclamação a uma autoridade de proteção de dados — a ANPD, no Brasil, ou a autoridade de controle do seu país, na União Europeia." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookies e medição",
            blocks: [
                { kind: "paragrafo", texto: "Usamos cookies essenciais para autenticação e para lembrar suas preferências, como idioma. Eles são necessários para o site funcionar e não dependem de consentimento." },
                { kind: "paragrafo", texto: "Cookies de medição de uso só são carregados depois que você aceita, no banner exibido na primeira visita. Recusar não limita nenhuma funcionalidade." },
            ],
        },
        {
            id: "retencao",
            heading: "10. Por quanto tempo guardamos",
            blocks: [
                { kind: "paragrafo", texto: "Mantemos seus dados de conta enquanto ela existir. Após a exclusão da conta, os dados pessoais são removidos ou anonimizados em até 90 dias." },
                { kind: "paragrafo", texto: "Registros de compra são mantidos pelos prazos exigidos pela legislação fiscal, mesmo após a exclusão da conta." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Alterações e contato",
            blocks: [
                { kind: "paragrafo", texto: "Esta política pode ser atualizada. A data no topo indica a última revisão, e alterações relevantes são anunciadas no site." },
                { kind: "paragrafo", texto: "Dúvidas sobre esta política: contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyPt
