# Blog premium — primeiro corte (edição, limpeza de colagem e pré-visualização)

**Data:** 2026-07-31
**Estado:** desenho aprovado, implementação não iniciada

## Objetivo

Tornar o editor de posts utilizável para o fluxo real do Werner — **texto escrito
fora (IA, Word, Google Docs) e colado no painel** — e dar a ele uma forma de ver o
post exatamente como o leitor verá, antes de publicar.

## Estado atual (verificado em 2026-07-31)

- O editor **já é rich text** (TipTap 3): `components/ui/rich-text-editor/`. A barra
  tem negrito, itálico, sublinhado, tachado, listas, link, H1, H2, desfazer/refazer.
- O **mesmo componente serve os templates de cold mail**, e por isso o editor de post
  exibe hoje um menu de variáveis (`{{nome}}`) que não pertence a um artigo.
- **Não existe pré-visualização.** O editor mostra `prose prose-sm` (`rich-text-editor.tsx`);
  a página pública usa `prose prose-indigo` com `max-w-3xl` (`app/[locale]/blog/[slug]/page.tsx`).
  O que o autor vê não é o que sai.
- **A sanitização do servidor já permite `style`, `align`, `img` e `table`**
  (`lib/utils/html-sanitizer.ts`, `parseStyleAttributes: false`). Centralização,
  imagem e tabela não esbarram em segurança — falta o editor saber produzi-las.
  O outro lado dessa permissividade: **todo o lixo de `style` do Word também passa.**
- Post é multilíngue: `BlogPost` + `BlogPostTranslation` (um `contentHtml` por locale,
  7 locales), abas por idioma no editor.
- As actions do blog (`actions/admin/blog.ts`) **já devolvem erro como valor**, não
  como exceção — padrão correto, mantido aqui.

## Decisões

**1. Limpar na colagem e guardar limpo.**
A alternativa de guardar o HTML como veio e limpar na exibição foi descartada: cria
duas verdades (o que está no banco e o que aparece) e obriga toda tela que renderiza
post — pública, prévia, editor — a lembrar de limpar. Migrar o blog para Markdown foi
descartado como projeto próprio: exigiria migrar os posts existentes e reescrever o
editor, e colar do Word em Markdown perde formatação de qualquer jeito.

**2. A limpeza roda duas vezes: no editor e no servidor.**
No editor para o autor ver o resultado na hora; no servidor porque o cliente é
burlável e o `style` passa sem filtro pelo sanitizador. Ordem no servidor:
**limpar → sanitizar**. A sanitização continua sendo a última palavra em segurança.

**3. Um componente de editor, dois presets.**
`preset: "email" | "article"`. `email` mantém exatamente o comportamento de hoje
(inclusive as variáveis); `article` liga os recursos de artigo e **não** mostra
variáveis. Nenhuma linha do editor de templates muda de comportamento.

**4. A prévia mostra o que está salvo, e avisa quando há alteração pendente.**
Salvar sozinho antes de abrir a prévia publicaria a alteração de um post já
publicado sem o autor pedir. O botão avisa em vez de salvar.

## Arquitetura

### 1. Preset do editor

`components/ui/rich-text-editor/rich-text-editor.tsx` ganha:

```ts
preset?: "email" | "article"   // default: "email" — preserva os call sites atuais
```

O preset decide **quais extensões TipTap são carregadas** e **quais botões a barra
mostra**. `RichTextToolbar` recebe o mesmo preset.

No preset `article` entram, além do que já existe:

| Recurso | Extensão | Observação |
|---|---|---|
| Alinhamento (esq./centro/dir./justificado) | `@tiptap/extension-text-align` (nova dep) | aplica a `heading` e `paragraph`; grava `style="text-align: …"`, que o sanitizador preserva |
| H3 | já em `StarterKit` (`levels: [1,2,3]`) | só falta botão |
| Citação e linha divisória | já em `StarterKit` | só faltam botões |
| Imagem no corpo | `@tiptap/extension-image` (nova dep) | ver seção 4 |
| Limpar formatação | comando nativo (`unsetAllMarks` + `clearNodes`) | rede de segurança para o que escapar da limpeza |

O menu de variáveis (`VariableDropdown`) só aparece no preset `email`.

`components/admin/blog/post-editor.tsx` passa `preset="article"`.

### 2. Limpeza de colagem

**Arquivo novo:** `lib/blog/paste-cleanup.ts` — função pura, sem React e sem DOM do
navegador. Implementada sobre `sanitize-html` (o mesmo `transformTags`/`htmlparser2`
que já roda no servidor), **uma implementação só para os dois lados**: duas
implementações da mesma regra divergiriam, e a divergência apareceria como "colei e
ficou diferente do que salvou".

```ts
export function limparHtmlDeColagem(html: string): string
```

Regras:

1. **Descarta** dos `style`: `font-family`, `font-size`, `color`, `background`,
   `background-color`, `line-height`, `margin*`, `padding*`, `mso-*`.
2. **Preserva `text-align`** — é a centralização pedida, e ela precisa sobreviver.
3. **Remove `class`** (é por onde entram `MsoNormal`, `MsoListParagraph`).
4. **Desembrulha `<span>`** que ficou sem nenhum atributo depois de (1)–(3).
5. **Converte para semântico:** `<b>`→`<strong>`, `<i>`→`<em>`, e
   `style="font-weight:700|bold"`→`<strong>`, `style="font-style:italic"`→`<em>`
   (o Google Docs cola assim).
6. **Remove parágrafos vazios** (`<p></p>`, `<p>&nbsp;</p>`) e comentários
   condicionais do Word (`<!--[if …]>`).
7. **Não altera o texto** — só marcação. Nenhuma regra remove ou reescreve conteúdo.

**Onde roda:**

- Cliente: `editorProps.transformPastedHTML` do TipTap, **apenas no preset `article`**
  (não mexer na colagem dos templates de e-mail, que dependem dos chips de variável).
- Servidor: dentro de `sanitizeTranslations` em `actions/admin/blog.ts`, antes de
  `sanitizeHtmlForPreview`.

### 3. Pré-visualização

**Extração:** o corpo do artigo sai de `app/[locale]/blog/[slug]/page.tsx` para
`components/blog/post-article.tsx`:

```tsx
<PostArticle
  locale={BlogLocale}
  categoryName={string | null}
  title={string}
  dateLabel={string}          // já formatado por quem chama
  coverImageUrl={string | null}
  contentHtml={string}        // sanitizado na escrita
/>
```

O componente carrega a tipografia real (`prose prose-indigo`, `max-w-3xl`, `dir` por
locale). A página pública passa a consumi-lo, mantendo por lá o que é dela: metadata,
JSON-LD e o seletor de idiomas.

**Rota nova:** `app/blog-preview/[id]/page.tsx`

Fora de `app/(app)` **de propósito**: o layout do super-admin traz barra lateral e
cabeçalho próprios, e a prévia com metade da largura da real não serviria para o que
ela existe. Fora de `app/[locale]` também, porque o idioma vem de `?locale=` e não
do caminho — a prévia não é uma página do site.

- `requireAdmin()` na própria página (o gate de role do `proxy.ts` cobre
  `/super-admin`; esta rota nova precisa do seu próprio, e ele é o da página).
- `robots: { index: false, follow: false }` na metadata.
- Lê o post por **id** (não por slug) e **inclui rascunho** — a consulta atual
  (`getPostBySlug`) filtra por publicado, então a prévia usa uma consulta própria
  em `lib/blog/queries.ts` (`getPostForPreview(id, locale)`).
- `?locale=xx` escolhe a tradução; sem tradução naquele idioma, mostra um aviso em
  vez de 404 (o autor pode estar pré-visualizando um idioma que ainda não escreveu).
- Renderiza `<PostArticle>` com os mesmos dados que o público renderizaria.

**Botão no editor:** "Ver como fica", abre `target="_blank"` no locale da aba ativa.
Quando há alteração não salva, mostra o aviso *"você tem alterações não salvas; a
prévia mostra a última versão salva"* — comparando o estado atual do formulário com
o `initial` recebido do servidor. Post ainda não criado (sem id) não tem prévia: o
botão fica desabilitado com a explicação.

### 4. Imagem no corpo do texto

- `lib/blog/storage.ts` ganha um parâmetro de pasta: `uploadBlogImage(file, prefixo = "covers")`,
  e o corpo usa `"body"`. Sem isso, imagem de corpo e capa se misturam no bucket.
- O botão de imagem da barra abre um diálogo com **arquivo + texto alternativo**.
  O alt é **obrigatório** — imagem sem alt é falha de acessibilidade e o site tem
  compromisso de SEO estruturado. Alt vazio bloqueia a inserção.
- Limites e formatos são os que já existem (PNG/JPG/WebP, 4 MB).

## Testes

Seguindo a regra do repositório (Vitest coleta só `**/*.test.ts` em ambiente `node`;
nada de teste de componente React):

- `lib/blog/paste-cleanup.test.ts` — o grosso da cobertura:
  - HTML real do Word (com `MsoNormal`, `font-family`, `<o:p>`) sai limpo;
  - HTML real do Google Docs (`font-weight:700` em `<span>`) vira `<strong>`;
  - `text-align: center` **sobrevive**;
  - `<span>` sem atributo é desembrulhado, e o texto dentro dele permanece;
  - parágrafos vazios em série somem, mas `<p>` com conteúdo fica;
  - o texto visível é idêntico antes e depois (nenhuma regra come conteúdo);
  - entrada vazia e HTML malformado não quebram.
- `lib/utils/html-sanitizer.test.ts` (já existe) — acrescentar o caso
  **limpar → sanitizar** em sequência, provando que a ordem não reabre `javascript:`.
- Sem teste automatizado para o editor e a rota de prévia: exigem navegador e login
  de ADMIN. Ficam na verificação de aceite manual.

## Fora do escopo

Tabela, bloco de código com destaque de sintaxe, índice automático, salvamento
automático, histórico de versões, comparação entre idiomas lado a lado, e tradução
assistida entre as abas. Nenhum deles serve ao problema declarado (post colado de
IA/Word) e cada um é um projeto próprio.

## Riscos

- **A limpeza pode remover formatação intencional.** Mitigação: as regras só
  descartam propriedades de aparência que o tema do site já define, `text-align` é
  preservado, e nenhuma regra toca no texto. O botão "limpar formatação" continua
  disponível para o resto.
- **`PostArticle` é consumido pela página pública.** Um erro na extração quebra o
  blog inteiro, não só a prévia. Mitigação: extração é a primeira tarefa e é
  puramente mecânica (mesmo markup), verificada por comparação do HTML servido antes
  e depois.
- **Duas dependências novas** (`@tiptap/extension-text-align`, `@tiptap/extension-image`),
  ambas do mesmo pacote e versão do TipTap já instalado.
- **`sanitize-html` no pacote do cliente.** A limpeza roda também no navegador, e a
  biblioteca é de origem Node — ela empacota, mas pesa, e só o painel do admin a
  carrega. Se o `next build` reclamar de módulo de Node (o projeto já apanhou disso
  com jsdom, ver o cabeçalho de `lib/utils/html-sanitizer.ts`), o plano B é manter a
  limpeza **só no servidor** e trocar a limpeza ao colar por um botão "colar limpo"
  no editor — o resultado salvo é o mesmo, muda só o momento em que o autor vê.
  Decidir isso na primeira tarefa, medindo, e não no meio da implementação.

## Verificação de aceite

Estado em 2026-07-31 (`[x]` conferido, `[~]` conferido só onde não exige login de
ADMIN em navegador, `[ ]` não conferido). Werner faz os `[~]`/`[ ]` na tela.

- [~] Colar um post inteiro do Word no editor não traz `font-family` nem `MsoNormal`
      para o HTML salvo (conferir no banco, não só na tela)
      → SQL em `BlogPostTranslation`: nenhuma das 5 traduções salvas tem `font-family`
      nem `Mso`. Mas nenhuma delas veio comprovadamente de uma colagem do Word, então
      isto é ausência de defeito, não prova da colagem. A limpeza em si está travada
      por `lib/blog/paste-cleanup.test.ts`.
- [ ] Centralizar um parágrafo sobrevive a salvar, recarregar e publicar
      → nenhuma tradução no banco tem `text-align`: o recurso nunca foi exercido de verdade.
- [~] O menu de variáveis `{{nome}}` não aparece mais no editor de post, e continua
      aparecendo no editor de template de cold mail
      → conferido no código (`rich-text-toolbar.tsx:359`, `{!ehArtigo && …}`), não na tela.
- [ ] Inserir imagem no corpo exige texto alternativo e o arquivo vai para `body/`
      → nenhuma tradução no banco tem `<img>`: o recurso nunca foi exercido de verdade.
- [ ] "Ver como fica" abre o post com a tipografia, a largura e a capa reais
- [ ] A prévia funciona com post em rascunho e com idioma ainda não traduzido
- [~] A prévia exige login de ADMIN e não é indexável
      → conferido no código: `requireAdmin()` na página e `robots: { index: false }` em
      `app/blog-preview/layout.tsx`. Falta o teste ponta a ponta com usuário não-ADMIN.
- [~] Editar um post publicado e clicar em "Ver como fica" **não** publica a alteração
      → estrutural: `PreviewButton` só abre uma aba, não chama nenhuma action de escrita,
      e `getPostForPreview` lê o banco. Falta conferir na tela.
- [x] `npx tsc --noEmit && npx vitest run && npm run build` — exit 0; `npx eslint`
      sem problema novo nos arquivos tocados
      → 2026-07-31: tsc exit 0; 57 arquivos / 485 testes passam; build exit 0; eslint
      com 1 aviso só, o `<img>` de `post-editor.tsx` que já existia na `main`.
