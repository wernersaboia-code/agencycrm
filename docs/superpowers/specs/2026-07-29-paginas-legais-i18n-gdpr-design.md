# Páginas legais: i18n, GDPR e conteúdo honesto

**Data:** 2026-07-29
**Contexto:** `/terms` e `/privacy` estão em português fixo, fora do segmento de
idioma, com `noindex`. O público-alvo é europeu (o produto são importadores
europeus, vendidos em 7 idiomas), o que traz GDPR. O FAQ nos 7 idiomas aponta
para `/privacy`. É a maior exposição aberta do projeto hoje.

**Não é aconselhamento jurídico.** Esta fase entrega a arquitetura correta e um
texto de partida que descreve honestamente o que o sistema faz. As decisões
jurídicas — base legal do tratamento das listas, necessidade de representante na
UE, redação final dos compromissos — dependem de advogado e estão registradas
como pendências rastreadas, não preenchidas por conta própria.

## Estado atual

| | |
|---|---|
| `app/(app)/terms/page.tsx` | 97 linhas, 9 seções, pt fixo, `robots: { index: false }` |
| `app/(app)/privacy/page.tsx` | 85 linhas, 7 seções, pt fixo, `robots: { index: false }` |
| Quem linka | rodapé do funil, banner de cookies, formulário do FAQ — **todos cientes de idioma** |
| FAQ | resposta 8, nos 7 idiomas, trata de LGPD/GDPR e remete à política |

### Defeito encontrado

`app/(app)/privacy/page.tsx:12` e o equivalente em `terms` renderizam
`{new Date().toLocaleDateString("pt-BR")}` como "Última atualização". **A página
afirma ter sido atualizada hoje, todo dia.** Numa política de privacidade isso é
pior que não ter data: sugere revisão contínua inexistente e impede saber qual
versão o usuário viu.

### Lacunas de GDPR no conteúdo atual

- **Identidade do controlador** — Art. 13(1)(a). Hoje só há "canal de suporte da
  plataforma", que não identifica ninguém.
- **Base legal de cada tratamento** — Art. 6. A página diz *o que* faz com os
  dados, nunca *com que fundamento*. Maior lacuna.
- **Transferências internacionais** — Arts. 44-49. O Supabase do projeto está em
  `sa-east-1` (Brasil); dado de europeu sai da UE e isso não é declarado.
- **Reclamação à autoridade de controle** — Art. 13(2)(d), ausente da seção de
  direitos.
- **Representante na UE** — Art. 27, ausente.
- **Dados de terceiros nas listas** — Art. 14. As listas contêm nome e cargo de
  pessoa de contato, coletados de fontes públicas, sem contato com o titular.
  É a exposição central do produto e a política não a sustenta.

## Decisões tomadas

**Opera como pessoa física.** Não há empresa constituída, e não haverá enquanto o
site não der retorno. Isso **não** afasta o GDPR: a isenção do Art. 2º(2)(c) vale
para atividade doméstica ou pessoal, não comercial. As obrigações recaem sobre a
pessoa. O texto reflete essa realidade em vez de falar de "a empresa" — afirmar
existência de pessoa jurídica inexistente é exatamente o tipo de coisa que este
projeto não faz.

**Identificação, confirmada pelo responsável em 2026-07-29:**

- Nome: **Werner Wild Saboia Carvalho Marinho**
- Contato: **contato@easyprospect.com.br**

Endereço postal continua pendente — não há endereço comercial, e endereço
residencial não vai ao ar. A norma pede "dados de contato", e o e-mail cumpre
essa função enquanto não houver alternativa.

Vale conferir que o nome exibido no recibo do Stripe conte a mesma história que
a política. Se o painel estiver configurado com nome comercial "Easy Prospect" e
a política trouxer o nome da pessoa, tudo bem — mas os dois documentos precisam
ser coerentes entre si.

## Arquitetura

```
content/legal/
    types.ts                → LegalDocument, LegalSection
    privacy.pt.ts … privacy.nl.ts    (7 arquivos)
    terms.pt.ts   … terms.nl.ts      (7 arquivos)
    pendencias.ts           → lacunas conhecidas, aceitas e rastreadas
    index.ts                → getLegalDocument(kind, locale)
```

```ts
type LegalSection = { id: string; heading: string; body: string[] | LegalList }
type LegalDocument = {
    lastUpdated: string      // ISO literal, nunca gerado
    title: string
    sections: LegalSection[]
}
```

Texto jurídico muda **em bloco** e é revisado por inteiro. Um arquivo por idioma
permite mandar um `.ts` fechado ao advogado, em vez de garimpar chaves entre
`"Adicionar ao carrinho"` e `"Ver catálogo"` em `messages/*.json`. Também evita
inflar em milhares de linhas arquivos que hoje servem à UI.

`getLegalDocument` cai no `pt` quando o idioma não tem arquivo — mesmo princípio
do `loadMessages` já existente.

As páginas viram renderizadores genéricos: recebem o documento e desenham as
seções. Nenhum texto no componente.

## Rotas

`app/(app)/{terms,privacy}` → `app/[locale]/{terms,privacy}`.

Com `localePrefix: "as-needed"`, **`/terms` e `/privacy` continuam idênticas** —
português, sem prefixo. `/de/privacy`, `/en/privacy` etc. passam a existir.
Nenhuma URL quebra.

Ganham:
- `alternates` via `alternatesFor()`, que já existe
- entrada no `app/sitemap.ts`
- remoção do `robots: { index: false }` — política de privacidade com noindex é
  incomum e enfraquece justamente a página que deveria gerar confiança

Efeito colateral desejável: sob `[locale]` as páginas herdam o header e o rodapé
do funil, em vez do shell de `app/(app)/`.

## Conteúdo

### Privacidade: 7 → 12 seções

Mantidas as 7 atuais. Entram cinco:

| Seção nova | O que diz |
|---|---|
| Quem é o responsável | Werner Wild Saboia Carvalho Marinho, contato@easyprospect.com.br. Endereço postal pendente |
| Base legal de cada tratamento | Execução de contrato (compra e entrega), interesse legítimo (composição das listas), consentimento (analytics) — sujeito a revisão jurídica |
| Transferências internacionais | Onde cada subprocessador opera e que dado sai da UE |
| Dados de contato nas listas | Art. 14: origem pública, categorias, direito de oposição e como exercê-lo |
| Representante na UE | **Pendente.** Seção não publicada até haver decisão |

Mais o direito de reclamação à autoridade de controle, dentro da seção de
direitos existente.

### Termos: 9 → 10 seções

Acrescenta **lei aplicável e foro**, hoje inexistente — sem isso, litígio com
comprador europeu fica indefinido.

## Pendências que não podem vazar para o ar

O pior desfecho desta fase seria publicar compromisso jurídico inventado.

`content/legal/pendencias.ts` exporta a lista de lacunas que dependem do
responsável ou do advogado. Um teste compara o que está pendente nos documentos
com essa lista aceita — mesmo padrão do `LACUNAS_CONHECIDAS` em
`lib/i18n/messages-integridade.test.ts:28`.

Efeito: a lacuna fica **registrada e visível**, não bloqueia o lançamento, e sai
da lista só quando for de fato preenchida. Seção marcada como pendente não é
renderizada — a página nunca mostra um texto de mentira nem um `TODO`.

Pendências iniciais (a identificação do responsável **não** está entre elas —
foi confirmada e entra preenchida):

- `responsavel.enderecoPostal` — enquanto não houver endereço comercial
- `representanteUE` — Art. 27, decisão jurídica e contratação
- `baseLegal.listas` — o fundamento do tratamento dos dados das listas
- `foro` — comarca e lei aplicável

## Testes

- **Paridade de seções:** todo idioma tem os mesmos `id`, na mesma ordem, que o
  `pt`. Falha se uma tradução esquecer ou inventar seção.
- **Pendências:** nenhuma pendência fora da lista aceita.
- **Data literal:** `lastUpdated` é string ISO constante. Um teste garante que
  nenhum documento gera a data em tempo de execução — foi exatamente o defeito
  corrigido.
- **Sem mojibake**, mesmo critério já usado nos arquivos de mensagens.

## Fora de escopo, registrado

**Redação jurídica final.** Entregamos estrutura e texto de partida honesto. Os
compromissos que criam obrigação — base legal das listas, representante na UE,
foro — precisam de advogado de proteção de dados.

**Tributação da operação como pessoa física.** Recebimento de moeda estrangeira,
IR e nota fiscal são questões contábeis, fora desta fase e fora da minha alçada.

**Consentimento de cookies.** O banner já existe (`components/cookie-consent.tsx`)
e o analytics já respeita a escolha. Rever a granularidade do consentimento é
trabalho próprio.

## Verificação de aceite

- [ ] `/terms` e `/privacy` respondem 200 e mostram o conteúdo em português
- [ ] `/de/privacy`, `/en/terms` e os demais respondem 200 traduzidos
- [ ] Nenhuma das duas páginas tem `robots: { index: false }`
- [ ] `curl /sitemap.xml` inclui as duas rotas nos 7 idiomas
- [ ] "Última atualização" mostra data fixa, e não muda ao recarregar amanhã
- [ ] `grep -rn "new Date()" content/legal app/\[locale\]/terms app/\[locale\]/privacy` não retorna nada
- [ ] Nenhuma seção pendente é renderizada em nenhum idioma
- [ ] O rodapé, o banner de cookies e o formulário do FAQ levam à página no
      idioma corrente
- [ ] `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` — exit 0
