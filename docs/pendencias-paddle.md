# Pendências para reaplicar ao Paddle

Atualizado em 2026-08-23. **Publicado em produção** no commit `ac17b27`.

## Em uma frase

O Paddle reprovou `easyprospect.com.br` enquadrando o site em *Direct Marketing
Services* e *Mass Marketing Products*. O produto foi reposicionado — de venda de
base de contatos para estudo de entrada em mercado — e **o site novo está no ar**
desde 2026-08-23, então a pré-consulta ao Paddle já pode ser feita.

## O deploy (feito em 2026-08-23)

`main` foi para `origin` com 23 commits que nunca tinham sido publicados: os 8 da
vitrine e mais 14 da frente de auth i18n + e-mails transacionais, que estavam
mergeados em `main` local desde antes. Conferido no ar:

| | antes | agora |
|---|---|---|
| `<title>` | Listas de importadores e distribuidores | Estudos de entrada em mercado |
| `/refund` | 307 (não existia) | 200 nos 7 idiomas |
| Privacidade §7 | "Dados de contato nas listas do catálogo" | "Dados de contato nos estudos do catálogo" |
| Privacidade §2 | "listas do catálogo" | "estudos do catálogo" (`ac17b27`) |

A migration `20260806T131808_normalize_user_language` foi aplicada pelo próprio
build (`vercel.json` roda `prisma migrate deploy`), registrada em
`_prisma_migrations`, e não sobrou nenhum usuário com `pt-BR`. Sem erros de
runtime nas duas horas seguintes.

> Refazer a verificação a qualquer momento:
> ```
> curl -s https://www.easyprospect.com.br/ | grep -o '<title>[^<]*'
> curl -s -o /dev/null -w '%{http_code}' https://www.easyprospect.com.br/refund
> ```

## O que já está feito (publicado)

| Commit | O quê |
|---|---|
| `84b7a98` | Vitrine vende o estudo, não a base. Amostra perde a coluna de e-mail; "O que está incluído" lista conteúdo analítico |
| `b8baedc` | `/refund` nos 7 idiomas, incondicional, 14 dias. Stripe fora dos Termos. Cidade/estado/país na privacidade. Teste garantindo página legal em rota pública + sitemap |
| `0bba939` | Upload de PDF com contato pessoal devolve 422 e exige confirmação, registrada em auditoria |
| `63da696` | Detector passa a julgar pela linha, não só pelo endereço (achava 65, passou a achar 85) |
| `dc4d6de` | Privacidade §7 e FAQ declaram que não há canal pessoal — verdade só depois da edição dos PDFs |
| `af13557` | Tira "Leads Qualificados" do `<title>`/OG/Twitter, remove `keywords`, tira Stripe da privacidade |
| `85b37df` | "Perfis das empresas" no lugar de "diretório de importadores" |
| `ac17b27` | §2 da privacidade ainda dizia "listas do catálogo" nos 7 idiomas, contradizendo a §7 |

**Fora do git, já em produção:** os 49 estudos no ar foram reeditados (59 contatos
pessoais removidos, 26 nomes de registro público mantidos) e verificados por
download de volta do storage. Originais intactos em `C:\Projetos\Easy Prospect\No site`;
editados em `No site - revisado`.

Registro completo: https://claude.ai/code/artifact/cf798535-ddeb-4e1e-8d23-e56e912bb25d

## Pendências por dono

### Werner
1. ~~**Merge e deploy da branch**~~ — feito em 2026-08-23, commit `ac17b27`.
2. **E-mail de pré-consulta ao Paddle** — responder ao e-mail da reprovação descrevendo
   as mudanças e perguntar se a oferta revisada se enquadra na AUP, antes de aplicar
   formalmente. Evita acumular uma segunda recusa no domínio.
3. **E-mail do Cross Border do Mercado Pago** (`crm_regionales@mercadopago.com`) —
   nunca foi pedido. É a única via internacional que não depende de Merchant of Record,
   e hoje o Paddle é ponto único de falha.
4. **Estudo da Estônia** — editado, nunca publicado no catálogo.
5. **Capa dos PDFs** — ainda diz "A guide and importer directory for international
   suppliers", desalinhada do vocabulário novo do site. Vale alinhar nos próximos
   estudos; os 51 existentes podem ser ajustados em lote pela mesma técnica de edição.

### Advogado
6. **`terms.foroLei`** — os Termos não declaram foro nem lei aplicável.
7. **`privacy.baseLegal.listas`** — a §3 declara base legal para conta, compra, registros
   e analytics, mas **nenhuma para os nomes e cargos dentro dos estudos**, que a §7 agora
   declara existirem. Seria legítimo interesse com teste de balanceamento.
8. **`privacy.representanteUE`** — representante na UE (GDPR Art. 27) para controlador
   fora da UE que oferece serviços a titulares na UE.

Os três estão rastreados em [`content/legal/pendencias.ts`](../content/legal/pendencias.ts).

## Sequência recomendada

1. ~~Merge + deploy~~ — feito
2. ~~Conferir o site no ar~~ — feito
3. **Próximo passo:** e-mail de pré-consulta ao Paddle **e** e-mail do Cross Border do MP
   (em paralelo)
4. Aplicação nova no Paddle só depois da resposta

## Onde as coisas moram

- Detector de contato pessoal: `lib/marketplace/contatos-pessoais.ts` (puro, testado)
  e `lib/marketplace/pdf-contatos.ts` (extração via `unpdf`)
- Gate do upload: `app/api/admin/lists/[id]/pdf/route.ts`
- Documentos legais: `content/legal/`
- Rotas públicas (uma página legal fora daqui responde 307 e some para o revisor):
  `proxy.ts`, lista `marketplaceRoutes`

## Armadilhas já pagas — não repetir

- **Verificar pelo mesmo critério que gerou a lista não prova nada.** A primeira edição
  dos PDFs passou na própria validação e mesmo assim deixou contato pessoal. Só apareceu
  ao reprocessar o arquivo editado do zero.
- **Tarja em PDF não apaga texto.** Só remoção real dos glifos; senão a política de
  privacidade passa a desmentir o arquivo.
- **`messages/*.json` não prova o que a tela mostra.** Chaves como `perLead` existiam sem
  nenhum componente as renderizando. Conferir o componente antes de afirmar.
- **`grep` no HTML publicado dá falso positivo.** O payload RSC traz o bundle de
  mensagens inteiro, inclusive strings de checkout e do super-admin. Procurar "Stripe"
  em `/privacy` acha ocorrências que não estão no texto da política. Conferir o contexto
  ao redor antes de concluir que sobrou algo — foi assim que a §2 apareceu de verdade,
  com as duas expressões na mesma página.
- **O bloco `admin` existe em pt, en E de.** Adicionar chave só em pt e de quebra o teste
  de integridade.
