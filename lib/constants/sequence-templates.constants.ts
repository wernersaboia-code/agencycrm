// lib/constants/sequence-templates.constants.ts

export interface SequenceTemplatePreset {
    id: string
    name: string
    description: string
    category: "generic" | "marketing" | "consulting" | "saas"
    categoryLabel: string
    steps: {
        order: number
        subject: string
        content: string
        delayDays: number
        delayHours: number
        condition: "always" | "not_opened" | "opened" | "not_clicked" | "clicked"
    }[]
}

// ============================================================
// TEMPLATES GENÉRICOS (Qualquer negócio)
// ============================================================

const GENERIC_PROSPECTING: SequenceTemplatePreset = {
    id: "generic-prospecting",
    name: "Prospecção Genérica",
    description: "Sequência versátil para qualquer tipo de negócio B2B",
    category: "generic",
    categoryLabel: "Genérico",
    steps: [
        {
            order: 1,
            subject: "{{empresa}} + {{minhaEmpresa}} - Oportunidade de parceria",
            content: `<p>Olá {{nome}},</p>

<p>Tudo bem?</p>

<p>Sou {{meuNome}} da {{minhaEmpresa}} e encontrei a {{empresa}} enquanto pesquisava empresas do segmento de {{segmento}}.</p>

<p>Ajudamos empresas como a sua a <strong>[principal benefício]</strong>, e acredito que podemos fazer o mesmo por vocês.</p>

<p>Alguns resultados que entregamos:</p>
<ul>
  <li>✅ [Resultado 1]</li>
  <li>✅ [Resultado 2]</li>
  <li>✅ [Resultado 3]</li>
</ul>

<p>Você teria 15 minutos esta semana para uma conversa rápida?</p>

<p>Abraço,<br>
{{meuNome}}<br>
{{minhaEmpresa}}</p>`,
            delayDays: 0,
            delayHours: 0,
            condition: "always",
        },
        {
            order: 2,
            subject: "Re: {{empresa}} + {{minhaEmpresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Sei que sua agenda deve estar corrida, então vou ser breve.</p>

<p>Enviei uma mensagem há alguns dias sobre como podemos ajudar a {{empresa}} a [benefício principal].</p>

<p>Caso tenha interesse, posso enviar um material mais detalhado ou agendar uma call de 15 minutos.</p>

<p>O que funciona melhor para você?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 3,
            delayHours: 0,
            condition: "not_opened",
        },
        {
            order: 3,
            subject: "Case de sucesso - {{segmento}}",
            content: `<p>Olá {{nome}},</p>

<p>Vi que você abriu meu email anterior - obrigado pelo interesse!</p>

<p>Queria compartilhar um caso rápido:</p>

<p><strong>[Nome do Cliente]</strong>, empresa do mesmo segmento que a {{empresa}}, conseguiu:</p>
<ul>
  <li>📈 [Métrica 1 - ex: Aumentar vendas em 40%]</li>
  <li>⏱️ [Métrica 2 - ex: Reduzir tempo de processo em 60%]</li>
  <li>💰 [Métrica 3 - ex: ROI de 5x em 6 meses]</li>
</ul>

<p>Posso mostrar como replicar esses resultados na {{empresa}}?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 2,
            delayHours: 0,
            condition: "opened",
        },
        {
            order: 4,
            subject: "Última tentativa - {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Tenho tentado contato há algumas semanas e imagino que:</p>

<p><strong>A)</strong> Não é o momento certo<br>
<strong>B)</strong> Já tem um fornecedor para isso<br>
<strong>C)</strong> Não é prioridade agora</p>

<p>Se for A ou C, posso voltar a entrar em contato daqui a alguns meses?</p>

<p>Se for B, adoraria saber como podemos ser uma alternativa no futuro.</p>

<p>De qualquer forma, fico à disposição!</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 5,
            delayHours: 0,
            condition: "not_opened",
        },
        {
            order: 5,
            subject: "Fechando o ciclo - {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Esta é minha última mensagem (prometo! 😅).</p>

<p>Vou arquivar nosso contato por enquanto, mas saiba que a porta está sempre aberta.</p>

<p>Se no futuro precisar de ajuda com [seu serviço], é só responder este email.</p>

<p>Desejo muito sucesso para a {{empresa}}!</p>

<p>Abraço,<br>
{{meuNome}}<br>
{{minhaEmpresa}}</p>

<p style="font-size: 12px; color: #666;">
<a href="{{linkUnsubscribe}}">Não desejo receber mais emails</a>
</p>`,
            delayDays: 7,
            delayHours: 0,
            condition: "not_opened",
        },
    ],
}

// ============================================================
// TEMPLATES MARKETING DIGITAL
// ============================================================

const MARKETING_AGENCY: SequenceTemplatePreset = {
    id: "marketing-agency",
    name: "Agência de Marketing",
    description: "Para agências oferecendo serviços de marketing digital",
    category: "marketing",
    categoryLabel: "Marketing Digital",
    steps: [
        {
            order: 1,
            subject: "Análise gratuita do marketing da {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Analisei rapidamente a presença digital da {{empresa}} e identifiquei algumas oportunidades interessantes.</p>

<p><strong>O que encontrei:</strong></p>
<ul>
  <li>🔍 SEO: [observação sobre o site]</li>
  <li>📱 Redes Sociais: [observação]</li>
  <li>🎯 Tráfego Pago: [observação]</li>
</ul>

<p>Preparei uma análise mais detalhada (gratuita) com recomendações específicas para vocês.</p>

<p>Posso enviar?</p>

<p>Abraço,<br>
{{meuNome}}<br>
{{minhaEmpresa}}</p>`,
            delayDays: 0,
            delayHours: 0,
            condition: "always",
        },
        {
            order: 2,
            subject: "Re: Análise da {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Passando rapidamente para ver se recebeu meu email sobre a análise de marketing.</p>

<p>Sei que gestores recebem dezenas de propostas por dia, então vou direto ao ponto:</p>

<p><strong>Ajudamos empresas do segmento {{segmento}} a:</strong></p>
<ul>
  <li>📈 Aumentar leads qualificados em até 3x</li>
  <li>💰 Reduzir custo por aquisição em 40%</li>
  <li>🎯 Melhorar conversão do site</li>
</ul>

<p>15 minutos de conversa podem fazer a diferença. Topa?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 3,
            delayHours: 0,
            condition: "not_opened",
        },
        {
            order: 3,
            subject: "Como a [Cliente] triplicou os leads",
            content: `<p>Olá {{nome}},</p>

<p>Percebi que abriu meu email - fico feliz pelo interesse!</p>

<p>Deixa eu compartilhar um caso real:</p>

<p><strong>Cliente: [Nome similar ao prospect]</strong><br>
<strong>Segmento: {{segmento}}</strong></p>

<p><strong>Desafio:</strong> Geravam poucos leads pelo digital e dependiam de indicações.</p>

<p><strong>Solução:</strong> Implementamos estratégia de conteúdo + tráfego pago + automação.</p>

<p><strong>Resultados em 6 meses:</strong></p>
<ul>
  <li>✅ Leads: de 20/mês para 85/mês</li>
  <li>✅ Custo por lead: reduziu 55%</li>
  <li>✅ Vendas: aumentaram 180%</li>
</ul>

<p>Quer saber como podemos fazer o mesmo pela {{empresa}}?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 2,
            delayHours: 0,
            condition: "opened",
        },
        {
            order: 4,
            subject: "Proposta especial para {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Estou fechando a agenda de novos clientes para este mês e gostaria de incluir a {{empresa}}.</p>

<p><strong>Proposta especial:</strong></p>
<ul>
  <li>🎁 Diagnóstico completo gratuito (valor: R$ X)</li>
  <li>📊 Plano de ação personalizado</li>
  <li>💰 Condição especial no primeiro trimestre</li>
</ul>

<p>Essa oferta é válida até [data].</p>

<p>Posso agendar uma conversa rápida?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 4,
            delayHours: 0,
            condition: "not_clicked",
        },
        {
            order: 5,
            subject: "Encerrando contato - {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Esta é minha última tentativa de contato.</p>

<p>Entendo que o timing pode não ser o ideal, e tudo bem!</p>

<p>Vou deixar nosso material aqui caso queira consultar no futuro:</p>
<ul>
  <li>📚 <a href="[link]">Cases de sucesso</a></li>
  <li>📖 <a href="[link]">Blog com dicas gratuitas</a></li>
  <li>📞 Meu WhatsApp: [número]</li>
</ul>

<p>Quando precisar de ajuda com marketing digital, é só chamar!</p>

<p>Sucesso para a {{empresa}}! 🚀</p>

<p>Abraço,<br>
{{meuNome}}</p>

<p style="font-size: 12px; color: #666;">
<a href="{{linkUnsubscribe}}">Não desejo receber mais emails</a>
</p>`,
            delayDays: 7,
            delayHours: 0,
            condition: "not_opened",
        },
    ],
}

// ============================================================
// TEMPLATES CONSULTORIA B2B
// ============================================================

const CONSULTING_B2B: SequenceTemplatePreset = {
    id: "consulting-b2b",
    name: "Consultoria B2B",
    description: "Para consultorias e prestadores de serviços empresariais",
    category: "consulting",
    categoryLabel: "Consultoria",
    steps: [
        {
            order: 1,
            subject: "Ideia para {{empresa}} - {{nome}}",
            content: `<p>Olá {{nome}},</p>

<p>Acompanho o trabalho da {{empresa}} há algum tempo e tenho uma ideia que pode interessar.</p>

<p>Trabalho com [área de atuação] e ajudo empresas do segmento {{segmento}} a resolver desafios como:</p>

<ul>
  <li>🎯 [Desafio 1 comum do segmento]</li>
  <li>📊 [Desafio 2]</li>
  <li>⚙️ [Desafio 3]</li>
</ul>

<p>Recentemente, ajudei a [empresa similar] a [resultado específico].</p>

<p>Você teria interesse em uma conversa de 20 minutos para explorar se faz sentido para a {{empresa}}?</p>

<p>Sem compromisso - só troca de ideias.</p>

<p>Abraço,<br>
{{meuNome}}<br>
{{minhaEmpresa}}</p>`,
            delayDays: 0,
            delayHours: 0,
            condition: "always",
        },
        {
            order: 2,
            subject: "Re: Ideia para {{empresa}}",
            content: `<p>{{nome}}, tudo bem?</p>

<p>Tentei contato na semana passada sobre uma possível colaboração.</p>

<p>Para contextualizar melhor: nos últimos 12 meses, ajudamos X empresas do segmento {{segmento}} a:</p>

<ul>
  <li>✅ [Resultado quantificável 1]</li>
  <li>✅ [Resultado quantificável 2]</li>
</ul>

<p>Se isso faz sentido para o momento da {{empresa}}, podemos marcar uma call rápida.</p>

<p>Se não for o momento, sem problemas - me avisa que não insisto mais.</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 4,
            delayHours: 0,
            condition: "not_opened",
        },
        {
            order: 3,
            subject: "Metodologia que usamos - {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Vi que demonstrou interesse no meu email anterior - obrigado!</p>

<p>Queria explicar brevemente nossa metodologia:</p>

<p><strong>Fase 1 - Diagnóstico (1 semana)</strong><br>
Entendemos a fundo os desafios e oportunidades.</p>

<p><strong>Fase 2 - Plano de Ação (2 semanas)</strong><br>
Desenvolvemos estratégia personalizada.</p>

<p><strong>Fase 3 - Implementação (X meses)</strong><br>
Executamos junto com sua equipe.</p>

<p><strong>Fase 4 - Acompanhamento</strong><br>
Garantimos que os resultados se mantenham.</p>

<p>Posso detalhar como isso funcionaria para a {{empresa}}?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 2,
            delayHours: 0,
            condition: "opened",
        },
        {
            order: 4,
            subject: "Pergunta rápida, {{nome}}",
            content: `<p>Olá {{nome}},</p>

<p>Vou ser direto: estou tentando entender se minha solução faz sentido para você.</p>

<p>Pode me ajudar respondendo com A, B ou C?</p>

<p><strong>A)</strong> Tenho interesse, mas não é prioridade agora<br>
<strong>B)</strong> Não é para mim, mas conheço alguém que pode se interessar<br>
<strong>C)</strong> Não tenho interesse</p>

<p>Qualquer resposta me ajuda a não tomar mais do seu tempo.</p>

<p>Obrigado!<br>
{{meuNome}}</p>`,
            delayDays: 5,
            delayHours: 0,
            condition: "not_opened",
        },
        {
            order: 5,
            subject: "Último contato - {{nome}}",
            content: `<p>Olá {{nome}},</p>

<p>Prometo que este é meu último email! 😊</p>

<p>Vou arquivar nosso contato, mas deixo a porta aberta para quando fizer sentido.</p>

<p><strong>Formas de me encontrar:</strong></p>
<ul>
  <li>📧 [seu email]</li>
  <li>📱 [seu telefone]</li>
  <li>💼 <a href="[linkedin]">LinkedIn</a></li>
</ul>

<p>Desejo muito sucesso para a {{empresa}} e para você!</p>

<p>Abraço,<br>
{{meuNome}}<br>
{{minhaEmpresa}}</p>

<p style="font-size: 12px; color: #666;">
<a href="{{linkUnsubscribe}}">Não desejo receber mais emails</a>
</p>`,
            delayDays: 7,
            delayHours: 0,
            condition: "not_opened",
        },
    ],
}

// ============================================================
// TEMPLATES SAAS
// ============================================================

const SAAS_PRODUCT: SequenceTemplatePreset = {
    id: "saas-product",
    name: "Produto SaaS",
    description: "Para empresas de software vendendo para outras empresas",
    category: "saas",
    categoryLabel: "SaaS / Software",
    steps: [
        {
            order: 1,
            subject: "{{empresa}} usando [Produto] - uma ideia",
            content: `<p>Olá {{nome}},</p>

<p>Vi que a {{empresa}} atua no segmento de {{segmento}} e imaginei que vocês podem estar enfrentando [problema comum].</p>

<p>Criamos o [Nome do Produto] justamente para resolver isso.</p>

<p><strong>Em resumo:</strong> [uma frase que explica o produto]</p>

<p><strong>Empresas como a sua estão usando para:</strong></p>
<ul>
  <li>⚡ [Benefício 1 - foco em velocidade/eficiência]</li>
  <li>💰 [Benefício 2 - foco em economia]</li>
  <li>📈 [Benefício 3 - foco em crescimento]</li>
</ul>

<p>Temos um trial gratuito de 14 dias. Quer testar?</p>

<p>Abraço,<br>
{{meuNome}}<br>
{{minhaEmpresa}}</p>`,
            delayDays: 0,
            delayHours: 0,
            condition: "always",
        },
        {
            order: 2,
            subject: "Re: [Produto] para {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Sei que você deve receber muitos emails, então vou ser breve:</p>

<p>🎯 <strong>Problema:</strong> [problema que você resolve]<br>
💡 <strong>Solução:</strong> [nome do produto]<br>
⏱️ <strong>Tempo para ver resultados:</strong> [X dias/semanas]</p>

<p>Posso fazer uma demonstração de 15 minutos?</p>

<p>Sem compromisso - só mostro como funciona e você decide se faz sentido.</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 3,
            delayHours: 0,
            condition: "not_opened",
        },
        {
            order: 3,
            subject: "Como [Cliente] resolveu [problema]",
            content: `<p>Olá {{nome}},</p>

<p>Percebi que abriu meu email - obrigado!</p>

<p>Deixa eu contar rapidamente como a [Cliente do mesmo segmento] resolveu o problema de [problema]:</p>

<p><strong>Antes:</strong></p>
<ul>
  <li>❌ [Situação negativa 1]</li>
  <li>❌ [Situação negativa 2]</li>
</ul>

<p><strong>Depois de implementar [Produto]:</strong></p>
<ul>
  <li>✅ [Resultado positivo 1 com números]</li>
  <li>✅ [Resultado positivo 2 com números]</li>
</ul>

<p>Quer ver como funciona na prática?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 2,
            delayHours: 0,
            condition: "opened",
        },
        {
            order: 4,
            subject: "Oferta especial - {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Estamos com uma condição especial este mês e lembrei da {{empresa}}.</p>

<p><strong>🎁 Oferta:</strong></p>
<ul>
  <li>✅ Trial estendido: 30 dias (em vez de 14)</li>
  <li>✅ Setup gratuito (valor: R$ X)</li>
  <li>✅ Treinamento da equipe incluso</li>
</ul>

<p><strong>Válido até:</strong> [data]</p>

<p>Interesse em aproveitar?</p>

<p>Abraço,<br>
{{meuNome}}</p>`,
            delayDays: 4,
            delayHours: 0,
            condition: "not_clicked",
        },
        {
            order: 5,
            subject: "Arquivando contato - {{empresa}}",
            content: `<p>Olá {{nome}},</p>

<p>Vou parar de enviar emails, mas quero deixar algumas coisas úteis:</p>

<p><strong>📚 Recursos gratuitos:</strong></p>
<ul>
  <li><a href="[link]">Guia: Como resolver [problema]</a></li>
  <li><a href="[link]">Calculadora de ROI</a></li>
  <li><a href="[link]">Webinar gravado</a></li>
</ul>

<p><strong>🚀 Quando quiser testar:</strong><br>
<a href="[link trial]">Criar conta gratuita</a> (não precisa cartão)</p>

<p>Sucesso para a {{empresa}}!</p>

<p>Abraço,<br>
{{meuNome}}</p>

<p style="font-size: 12px; color: #666;">
<a href="{{linkUnsubscribe}}">Não desejo receber mais emails</a>
</p>`,
            delayDays: 7,
            delayHours: 0,
            condition: "not_opened",
        },
    ],
}

// ============================================================
// EXPORTAR TODOS OS TEMPLATES
// ============================================================

export const SEQUENCE_TEMPLATE_PRESETS: SequenceTemplatePreset[] = [
    GENERIC_PROSPECTING,
    MARKETING_AGENCY,
    CONSULTING_B2B,
    SAAS_PRODUCT,
]

export const SEQUENCE_CATEGORIES = [
    { value: "generic", label: "Genérico" },
    { value: "marketing", label: "Marketing Digital" },
    { value: "consulting", label: "Consultoria" },
    { value: "saas", label: "SaaS / Software" },
] as const

export function getPresetsByCategory(category: string): SequenceTemplatePreset[] {
    return SEQUENCE_TEMPLATE_PRESETS.filter((t) => t.category === category)
}

export function getPresetById(id: string): SequenceTemplatePreset | undefined {
    return SEQUENCE_TEMPLATE_PRESETS.find((t) => t.id === id)
}