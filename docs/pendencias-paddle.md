# Pendências para reaplicar ao Paddle

Atualizado em 2026-08-23. Branch: `vitrine-estudo-de-mercado` (7 commits, **não publicada**).

## Em uma frase

O Paddle reprovou `easyprospect.com.br` enquadrando o site em *Direct Marketing
Services* e *Mass Marketing Products*. O produto foi reposicionado — de venda de
base de contatos para estudo de entrada em mercado — mas **nada disso está no ar**,
e é isso que bloqueia a nova aplicação.

## A pendência que bloqueia todas as outras

**Merge + deploy.** Produção ainda serve o site antigo:

| | produção | branch |
|---|---|---|
| `<title>` | Listas de importadores e distribuidores | Estudos de entrada em mercado |
| `/refund` | 307 (não existe) | 200 |
| Privacidade §7 | "Dados de contato nas listas do catálogo" | "Dados de contato nos estudos do catálogo" |

Reaplicar antes do deploy faz o Paddle analisar exatamente o site que já reprovou.

> Verificar depois do deploy:
> ```
> curl -s https://www.easyprospect.com.br/ | grep -o '<title>[^<]*'
> curl -s -o /dev/null -w '%{http_code}' https://www.easyprospect.com.br/refund
> ```

## O que já está feito (na branch)

| Commit | O quê |
|---|---|
| `84b7a98` | Vitrine vende o estudo, não a base. Amostra perde a coluna de e-mail; "O que está incluído" lista conteúdo analítico |
| `b8baedc` | `/refund` nos 7 idiomas, incondicional, 14 dias. Stripe fora dos Termos. Cidade/estado/país na privacidade. Teste garantindo página legal em rota pública + sitemap |
| `0bba939` | Upload de PDF com contato pessoal devolve 422 e exige confirmação, registrada em auditoria |
| `63da696` | Detector passa a julgar pela linha, não só pelo endereço (achava 65, passou a achar 85) |
| `dc4d6de` | Privacidade §7 e FAQ declaram que não há canal pessoal — verdade só depois da edição dos PDFs |
| `af13557` | Tira "Leads Qualificados" do `<title>`/OG/Twitter, remove `keywords`, tira Stripe da privacidade |
| `85b37df` | "Perfis das empresas" no lugar de "diretório de importadores" |

**Fora do git, já em produção:** os 49 estudos no ar foram reeditados (59 contatos
pessoais removidos, 26 nomes de registro público mantidos) e verificados por
download de volta do storage. Originais intactos em `C:\Projetos\Easy Prospect\No site`;
editados em `No site - revisado`.

Registro completo: https://claude.ai/code/artifact/cf798535-ddeb-4e1e-8d23-e56e912bb25d

## Pendências por dono

### Werner
1. **Merge e deploy da branch** — bloqueia tudo.
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

1. Merge + deploy
2. Conferir o site no ar
3. E-mail de pré-consulta ao Paddle **e** e-mail do Cross Border do MP (em paralelo)
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
- **O bloco `admin` existe em pt, en E de.** Adicionar chave só em pt e de quebra o teste
  de integridade.
