// prisma/seed-templates.ts

import { PrismaClient, TemplateCategory } from "@prisma/client"

const prisma = new PrismaClient()

// ============================================================
// TEMPLATES INDIVIDUAIS (para campanhas single)
// ============================================================

const INDIVIDUAL_TEMPLATES = [
    {
        name: "Primeiro Contato - Genérico",
        category: "PROSPECTING" as TemplateCategory,
        subject: "{{firstName}}, podemos ajudar a {{company}}?",
        body: `<p>Olá {{firstName}},</p>

<p>Meu nome é [Seu Nome] e trabalho na [Sua Empresa].</p>

<p>Notei que a <strong>{{company}}</strong> atua no segmento de {{industry}} e acredito que podemos ajudar vocês a alcançar melhores resultados.</p>

<p>Alguns benefícios que entregamos:</p>
<ul>
  <li>✅ [Benefício 1]</li>
  <li>✅ [Benefício 2]</li>
  <li>✅ [Benefício 3]</li>
</ul>

<p>Podemos agendar uma conversa rápida de 15 minutos?</p>

<p>Abraço,<br>
[Seu Nome]<br>
[Seu Telefone]</p>`,
    },
    {
        name: "Follow-up - Não Respondeu",
        category: "FOLLOW_UP" as TemplateCategory,
        subject: "Re: {{firstName}}, ainda posso ajudar?",
        body: `<p>Olá {{firstName}},</p>

<p>Entrei em contato há alguns dias e não obtive retorno. Imagino que você esteja ocupado(a).</p>

<p>Continuo à disposição caso queira conhecer como podemos ajudar a {{company}}.</p>

<p>Se preferir, pode responder este email com o melhor horário para conversarmos.</p>

<p>Abraço,<br>
[Seu Nome]</p>`,
    },
    {
        name: "Follow-up - Abriu mas Não Respondeu",
        category: "FOLLOW_UP" as TemplateCategory,
        subject: "{{firstName}}, vi que você abriu meu email",
        body: `<p>Olá {{firstName}},</p>

<p>Percebi que você viu minha mensagem anterior - obrigado pelo interesse!</p>

<p>Fico à disposição para tirar qualquer dúvida sobre como podemos ajudar a {{company}}.</p>

<p>Que tal uma conversa rápida de 15 minutos? Posso me adaptar à sua agenda.</p>

<p>Abraço,<br>
[Seu Nome]</p>`,
    },
    {
        name: "Proposta Comercial",
        category: "PROPOSAL" as TemplateCategory,
        subject: "Proposta para {{company}} - {{firstName}}",
        body: `<p>Olá {{firstName}},</p>

<p>Conforme conversamos, segue nossa proposta para a {{company}}.</p>

<p><strong>O que está incluso:</strong></p>
<ul>
  <li>📋 [Item 1]</li>
  <li>📋 [Item 2]</li>
  <li>📋 [Item 3]</li>
</ul>

<p><strong>Investimento:</strong> R$ [valor]</p>

<p><strong>Condições:</strong> [condições de pagamento]</p>

<p>Fico à disposição para esclarecer qualquer dúvida.</p>

<p>Abraço,<br>
[Seu Nome]<br>
[Seu Telefone]</p>`,
    },
    {
        name: "Agradecimento - Pós Reunião",
        category: "THANK_YOU" as TemplateCategory,
        subject: "{{firstName}}, obrigado pela conversa!",
        body: `<p>Olá {{firstName}},</p>

<p>Foi um prazer conversar com você hoje!</p>

<p>Como combinamos, seguem os próximos passos:</p>
<ol>
  <li>[Próximo passo 1]</li>
  <li>[Próximo passo 2]</li>
  <li>[Próximo passo 3]</li>
</ol>

<p>Qualquer dúvida, é só chamar!</p>

<p>Abraço,<br>
[Seu Nome]</p>`,
    },
    {
        name: "Reativação - Lead Frio",
        category: "REACTIVATION" as TemplateCategory,
        subject: "{{firstName}}, faz tempo! Novidades da [Sua Empresa]",
        body: `<p>Olá {{firstName}},</p>

<p>Faz um tempo que não conversamos e queria retomar o contato.</p>

<p>Desde então, tivemos algumas novidades que podem interessar à {{company}}:</p>
<ul>
  <li>🚀 [Novidade 1]</li>
  <li>🚀 [Novidade 2]</li>
  <li>🚀 [Novidade 3]</li>
</ul>

<p>Será que faz sentido retomarmos a conversa?</p>

<p>Abraço,<br>
[Seu Nome]</p>`,
    },
    {
        name: "Último Contato - Despedida",
        category: "FOLLOW_UP" as TemplateCategory,
        subject: "Encerrando contato - {{company}}",
        body: `<p>Olá {{firstName}},</p>

<p>Tentei contato algumas vezes e imagino que não seja o momento ideal.</p>

<p>Vou arquivar nosso contato por enquanto, mas a porta está sempre aberta!</p>

<p>Quando precisar de ajuda com [seu serviço], é só responder este email.</p>

<p>Desejo muito sucesso para a {{company}}!</p>

<p>Abraço,<br>
[Seu Nome]</p>

<p style="font-size: 12px; color: #666;">
<a href="{{linkUnsubscribe}}">Não desejo receber mais emails</a>
</p>`,
    },
    {
        name: "Newsletter - Novidades",
        category: "NEWSLETTER" as TemplateCategory,
        subject: "📰 Novidades de [Mês] - [Sua Empresa]",
        body: `<p>Olá {{firstName}},</p>

<p>Confira as novidades deste mês:</p>

<h3>📌 Destaque</h3>
<p>[Conteúdo do destaque]</p>

<h3>📚 Artigos do Blog</h3>
<ul>
  <li><a href="[link]">[Título do artigo 1]</a></li>
  <li><a href="[link]">[Título do artigo 2]</a></li>
</ul>

<h3>🎉 Novidades</h3>
<p>[Novidades da empresa]</p>

<p>Até a próxima!</p>

<p>[Sua Empresa]</p>

<p style="font-size: 12px; color: #666;">
<a href="{{linkUnsubscribe}}">Descadastrar</a>
</p>`,
    },
]

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

async function seedTemplates(workspaceId: string) {
    console.log(`\n🌱 Iniciando seed de templates para workspace: ${workspaceId}\n`)

    let created = 0
    let skipped = 0

    for (const template of INDIVIDUAL_TEMPLATES) {
        // Verificar se já existe
        const existing = await prisma.emailTemplate.findFirst({
            where: {
                workspaceId,
                name: template.name,
            },
        })

        if (existing) {
            console.log(`⏭️  Pulando: "${template.name}" (já existe)`)
            skipped++
            continue
        }

        // Criar template
        await prisma.emailTemplate.create({
            data: {
                ...template,
                workspaceId,
                isActive: true,
            },
        })

        console.log(`✅ Criado: "${template.name}"`)
        created++
    }

    console.log(`\n📊 Resumo:`)
    console.log(`   ✅ Criados: ${created}`)
    console.log(`   ⏭️  Pulados: ${skipped}`)
    console.log(`   📧 Total de templates: ${INDIVIDUAL_TEMPLATES.length}\n`)
}

// ============================================================
// EXECUTAR
// ============================================================

async function main() {
    const workspaceId = process.argv[2]

    if (!workspaceId) {
        console.error("\n❌ Erro: Informe o ID do workspace!")
        console.log("\nUso: npx ts-node prisma/seed-templates.ts <workspaceId>\n")
        console.log("Para encontrar o ID do workspace:")
        console.log("1. Abra o AgencyCRM")
        console.log("2. Vá em Configurações")
        console.log("3. O ID está na URL: /settings?workspace=<ID>\n")
        process.exit(1)
    }

    // Verificar se workspace existe
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
    })

    if (!workspace) {
        console.error(`\n❌ Erro: Workspace "${workspaceId}" não encontrado!\n`)
        process.exit(1)
    }

    console.log(`\n🏢 Workspace: ${workspace.name}`)

    await seedTemplates(workspaceId)

    console.log("✨ Seed concluído!\n")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })