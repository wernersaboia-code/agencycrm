# "Como funciona" informativa — os fatos da compra na home

Data: 2026-09-05
Estado: aprovado, aguardando plano de implementação

## Problema

A seção `HowItWorksSection` são três cartões (Filtre / Compre / Baixe) com uma
frase cada. Ela descreve o *percurso* e não responde nenhuma das perguntas que
alguém prestes a pagar realmente faz: em que formato o estudo chega, quando ele
chega, como se paga, e o que acontece se a página for fechada depois do
pagamento.

Essas respostas existem — no `/faq`, página que quase ninguém abre antes de
comprar. O objetivo é trazer os fatos práticos da compra para o ponto da home em
que a dúvida aparece.

Recorte declarado: esta é uma mudança de **conteúdo** da seção. Estrutura da
página, ordem das seções, `tone`, âncora e ícones ficam como estão.

## Fatos apurados no código (05/09/2026)

Nenhuma afirmação da nova seção entra sem uma linha de código que a sustente.
Três suposições da conversa inicial caíram nesta conferência — o registro fica
porque é o argumento a favor de conferir antes de redigir.

| Afirmação candidata | Veredito | Onde se confere |
|---|---|---|
| Estudo em PDF | **verdadeiro** | `lib/checkout/fulfillment.ts`; FAQ "Em quais formatos" |
| Estudos redigidos em inglês | **verdadeiro** | 59 de 61 estudos em `en` (apuração de 02/09, spec da vitrine v3) |
| Liberação na confirmação do pagamento | **verdadeiro** | `fulfillment.ts`: transição `pending -> paid` é o que libera |
| "Download imediato" | **FALSO como promessa** | `checkout.mpPending`: o Mercado Pago tem estado pendente explícito |
| "Pagamento com cartão internacional" | **não sustentável** | provedor é ligado por env (`isStripeConfigured`, `MERCADOPAGO_ACCESS_TOKEN`) |
| Provedor nomeado na home | **recusado** | `fulfillment.ts`: "hoje só o Mercado Pago está visível"; muda por env, e a home é estática |
| E-mail com link de acesso após a compra | **verdadeiro** | `generateMagicLinkUrl` em `fulfillment.ts:201`; `lib/email/purchase.ts` |
| Acesso permanente em Minhas compras | **verdadeiro** | FAQ "permanece sempre acessível na sua conta" |
| Compra avulsa, sem recorrência | **verdadeiro** | não há assinatura no domínio de checkout |

Consequência das duas linhas em negrito: a entrega se descreve como
*"liberado assim que o pagamento é confirmado"* — a formulação que o FAQ já usa —
e o pagamento se descreve como *"checkout externo, processado por provedor
certificado"*, verdadeiro com Stripe, com Mercado Pago e com os dois desligados.

## Decisões tomadas

| Decisão | Escolhido | Alternativa recusada e por quê |
|---|---|---|
| Onde os fatos entram | 3 passos mais densos **+ faixa de 4 fatos** | Só engordar os cartões: os fatos ficam diluídos em texto corrido. Mini-FAQ na home: repete o `/faq` e cria segunda fonte a manter |
| Idioma de origem | **Alemão**, revisado antes dos outros | Português primeiro faria do alemão — mercado principal — tradução de tradução |
| Moeda da cobrança | **fora** | O MP cobra sempre em BRL; dizer isso na home dá mais medo do que segurança, e o aviso já existe no checkout (`brlChargeNotice`) |
| Prazo em horas ou dias | **fora** | Nenhuma promessa de prazo é sustentada pelo código |
| Reembolso | **fora** | Existe `/refund`; citar reembolso dentro do passo de compra planta a dúvida em vez de tirá-la |
| Ícone novo na faixa | **não** | Quatro ícones a mais competiriam com os três cartões, que são o elemento principal |

## Desenho

### Estrutura

`components/landing/how-it-works-section.tsx` continua sendo a seção. Preserva-se,
sem tocar: o `id` de âncora (`ablauf` em alemão, `como-funciona` nos demais — o
header linka para ele), `tone` default, os três ícones (`Search`, `ShieldCheck`,
`Download`) e as animações `FadeInView` / `StaggerContainer`.

Muda: cada cartão passa a ter um segundo parágrafo, e abaixo da grade entra a
faixa de fatos — grade de 4 colunas em desktop, 2 em mobile, cada item com um
rótulo curto e uma linha de texto. Sem card e sem ícone, para que a faixa leia
como nota de rodapé dos passos e não como um segundo conjunto de cartões.

### O que cada passo diz

1. **Filtre** — como se encontra o estudo (país, região linguística, setor) e o
   que dá para ver antes de pagar (cobertura e conteúdo do estudo).
2. **Compre** — o que se revisa antes de fechar (cobertura, conteúdo, preço) e
   que o checkout é externo e certificado, numa compra avulsa.
3. **Baixe** — a liberação acontece na confirmação do pagamento, sai um e-mail
   com o link de acesso, e o arquivo fica na conta.

### A faixa de 4 fatos

| Rótulo | Conteúdo |
|---|---|
| Formato | PDF; os estudos são redigidos em inglês |
| Entrega | Liberado assim que o pagamento é confirmado |
| Pagamento | Checkout externo, provedor certificado; compra avulsa, sem recorrência |
| Acesso | Permanente em Minhas compras, mais o link enviado por e-mail |

### Conteúdo e i18n

As strings vivem em `landing.howItWorks` nos oito `messages/*.json`. A chave
`steps` ganha um campo novo por passo (o segundo parágrafo) e entra uma chave
`facts` com os quatro pares rótulo/texto — cerca de 14 strings novas por idioma.

Ordem de trabalho: **alemão primeiro**, aprovado pelo Werner; só então os outros
sete, redigidos no idioma em vez de traduzidos palavra a palavra. O árabe é
conferido em RTL.

Nota de voz, do `MEMORY.md` do projeto: nenhuma menção a IA como argumento de
venda, ninguém nomeado, e nenhum número sem base — a faixa não traz número.

## Verificação

1. `npx tsc --noEmit` e a suíte (`npx vitest run`, 885 testes hoje) verdes.
2. Paridade de chaves entre os oito `messages/*.json` — a suíte já cobre.
3. Seção conferida no navegador em desktop e mobile, e o árabe em RTL.
4. Cada afirmação da faixa rastreável à tabela de fatos acima.

## Fora de escopo

Reescrever o `/faq`, mexer em outras seções da home, tocar no checkout, ou
mudar a ordem/`tone` das seções da página.
