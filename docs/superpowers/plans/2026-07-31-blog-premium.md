# Blog Premium — Primeiro Corte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o autor cola um post vindo de IA/Word e ele entra limpo, com alinhamento e imagem no corpo, e consegue ver o resultado exatamente como o leitor verá antes de publicar.

**Architecture:** uma função pura de limpeza (`lib/blog/paste-cleanup.ts`) roda no editor ao colar e de novo no servidor ao salvar, sempre antes da sanitização de segurança que já existe. O editor de rich text ganha um `preset` (`"email"` mantém o comportamento atual dos templates de cold mail; `"article"` liga os recursos de artigo e esconde as variáveis). A renderização do post sai da página pública para um componente `PostArticle`, consumido tanto pela página pública quanto por uma rota nova de prévia, só para admin.

**Tech Stack:** Next.js 16 (App Router), TipTap 3, `sanitize-html`, Prisma + PostgreSQL (Supabase), next-intl, Vitest, Tailwind + `@tailwindcss/typography`.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-07-31-blog-premium-design.md`. Ler antes de começar.
- **A limpeza nunca altera o texto** — só marcação. Nenhuma regra pode remover, truncar ou reescrever conteúdo visível.
- **`text-align` é preservado** por toda a cadeia (limpeza → sanitização → banco → render). É a centralização que o usuário pediu.
- **Ordem no servidor: limpar → sanitizar.** A sanitização (`sanitizeHtmlForPreview`) continua sendo a última palavra em segurança e não pode ser afrouxada.
- **O preset `email` não muda de comportamento.** Os templates de cold mail dependem dos chips de variável (`renderTemplateVariablesForEditor`, `VariableDropdown`). Qualquer alteração visível ali é regressão.
- **Node não está no PATH desta máquina.** Todo comando de shell precisa de `export PATH="/c/Program Files/nodejs:$PATH"` antes (não persiste entre chamadas).
- **Vitest só coleta `**/*.test.ts`** (não `.tsx`) em ambiente `node`. Nenhuma tarefa escreve teste de componente React; o que precisa de teste vira função pura em `lib/`.
- **Nunca subir o dev server pelo Bash.** Usar o `.claude/launch.json` (porta 3001).
- **`npm run lint` exit 0 é impossível neste repositório** (linha de base de 2026-07-30: 1361 erros pré-existentes). O critério é **zero problema novo nos arquivos tocados**, com `npx eslint <arquivos da task>`.
- **O blog tem 8 locales** (`pt, de, en, es, fr, ar, it, nl` — `LOCALES` de `lib/i18n/locales.ts`, reexportado como `BLOG_LOCALES`), incluindo um RTL (`ar`). Toda tela nova respeita `dirForLocale(locale)`.
- Branch de trabalho: `feat/blog-premium` (já criada, com a spec commitada).

---

## Estrutura de arquivos

**Criados**

| Arquivo | Responsabilidade |
|---|---|
| `lib/blog/paste-cleanup.ts` | Função pura de limpeza de HTML colado |
| `lib/blog/paste-cleanup.test.ts` | Testes do acima |
| `components/blog/post-article.tsx` | Renderização do artigo (capa, título, data, corpo), usada pela página pública e pela prévia |
| `app/blog-preview/[id]/page.tsx` | Rota de prévia, só admin, `noindex` |
| `components/admin/blog/preview-button.tsx` | Botão "Ver como fica" com aviso de alteração não salva |

**Modificados**

| Arquivo | Mudança |
|---|---|
| `package.json` | `@tiptap/extension-text-align` e `@tiptap/extension-image` |
| `components/ui/rich-text-editor/rich-text-editor.tsx` | prop `preset`, extensões e limpeza ao colar por preset |
| `components/ui/rich-text-editor/rich-text-toolbar.tsx` | botões por preset (alinhamento, H3, citação, divisória, limpar formatação, imagem) |
| `components/admin/blog/post-editor.tsx` | `preset="article"` + botão de prévia |
| `actions/admin/blog.ts` | limpeza antes da sanitização em `sanitizeTranslations` |
| `lib/blog/storage.ts` | `uploadBlogImage(file, prefixo)` |
| `lib/blog/queries.ts` | `getPostForPreview(id, locale)` |
| `app/[locale]/blog/[slug]/page.tsx` | consome `PostArticle` |
| `lib/utils/html-sanitizer.test.ts` | caso da sequência limpar → sanitizar |
| `messages/{pt,en}.json` | chaves de `admin.blogEditor` para a prévia |

---

### Task 1: Limpeza de HTML colado (`lib/blog/paste-cleanup.ts`)

Função pura, sem React e sem DOM do navegador. É o coração da fase: as Tasks 2 e 3 só a plugam em lugares diferentes.

**Files:**
- Create: `lib/blog/paste-cleanup.ts`
- Test: `lib/blog/paste-cleanup.test.ts`

**Interfaces:**
- Consumes: `sanitize-html` (já é dependência do projeto).
- Produces: `limparHtmlDeColagem(html: string): string`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/blog/paste-cleanup.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { limparHtmlDeColagem } from "./paste-cleanup"

/** Texto visível, sem tags — usado para provar que nenhuma regra come conteúdo. */
function textoVisivel(html: string): string {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}

describe("limparHtmlDeColagem", () => {
    it("descarta font-family, font-size e cor do Word", () => {
        const colado =
            '<p class="MsoNormal" style="font-family:Calibri; font-size:11pt; color:#1F497D">Texto</p>'
        const limpo = limparHtmlDeColagem(colado)

        expect(limpo).not.toMatch(/font-family/i)
        expect(limpo).not.toMatch(/font-size/i)
        expect(limpo).not.toMatch(/color/i)
        expect(limpo).not.toMatch(/MsoNormal/)
        expect(limpo).toContain("Texto")
    })

    it("PRESERVA text-align — é a centralização que o autor aplicou", () => {
        const limpo = limparHtmlDeColagem('<p style="text-align: center; font-size: 14pt">Meio</p>')

        expect(limpo).toMatch(/text-align:\s*center/)
        expect(limpo).not.toMatch(/font-size/i)
    })

    it("converte negrito e itálico do Google Docs em marcação semântica", () => {
        expect(limparHtmlDeColagem('<span style="font-weight:700">Forte</span>')).toBe(
            "<strong>Forte</strong>"
        )
        expect(limparHtmlDeColagem('<span style="font-style:italic">Ênfase</span>')).toBe(
            "<em>Ênfase</em>"
        )
    })

    it("converte b e i em strong e em", () => {
        expect(limparHtmlDeColagem("<b>a</b><i>b</i>")).toBe("<strong>a</strong><em>b</em>")
    })

    it("desembrulha span que ficou sem atributo, mantendo o texto", () => {
        expect(limparHtmlDeColagem('<p><span style="font-size:12pt">Frase</span></p>')).toBe(
            "<p>Frase</p>"
        )
    })

    it("remove parágrafos vazios que o Word gera em série", () => {
        const limpo = limparHtmlDeColagem("<p>Um</p><p></p><p>&nbsp;</p><p> </p><p>Dois</p>")

        expect(limpo).toBe("<p>Um</p><p>Dois</p>")
    })

    it("remove comentários condicionais do Word", () => {
        const limpo = limparHtmlDeColagem("<!--[if gte mso 9]><xml>lixo</xml><![endif]--><p>Ok</p>")

        expect(limpo).toBe("<p>Ok</p>")
    })

    it("mantém a estrutura que o autor quer: títulos, listas, links e imagens", () => {
        const colado =
            '<h2 style="font-family:Arial">Título</h2>' +
            "<ul><li>Item</li></ul>" +
            '<a href="https://exemplo.com" style="color:#0000EE">Link</a>' +
            '<img src="https://exemplo.com/a.png" alt="Alt">'
        const limpo = limparHtmlDeColagem(colado)

        expect(limpo).toContain("<h2>Título</h2>")
        expect(limpo).toContain("<li>Item</li>")
        expect(limpo).toContain('href="https://exemplo.com"')
        expect(limpo).toContain('alt="Alt"')
    })

    it("não altera uma letra do texto visível", () => {
        const colado =
            '<p class="MsoNormal" style="font-family:Calibri">Primeiro <b>parágrafo</b> com ' +
            '<span style="color:red">cor</span>.</p><p>&nbsp;</p><p>Segundo.</p>'

        expect(textoVisivel(limparHtmlDeColagem(colado))).toBe(
            textoVisivel(colado)
        )
    })

    it("aguenta entrada vazia e HTML malformado", () => {
        expect(limparHtmlDeColagem("")).toBe("")
        expect(limparHtmlDeColagem("<p>sem fechar")).toContain("sem fechar")
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/blog/paste-cleanup.test.ts
```

Esperado: FAIL, `Failed to resolve import "./paste-cleanup"`.

- [ ] **Step 3: Implementar**

Criar `lib/blog/paste-cleanup.ts`:

```ts
import sanitizeHtml from "sanitize-html"

/**
 * Limpeza de HTML colado de Word, Google Docs e saídas de IA.
 *
 * Isto NÃO é sanitização de segurança — quem faz isso é
 * `lib/utils/html-sanitizer.ts`, que roda depois desta função no servidor e é
 * a última palavra. Aqui o assunto é consistência visual: o `style` passa
 * inteiro pelo sanitizador (`parseStyleAttributes: false`), então sem esta
 * limpeza um post colado carrega Calibri 11pt e azul #1F497D para dentro do
 * tema do site.
 *
 * Regra que não se quebra: nenhuma linha daqui altera texto visível. Só
 * marcação.
 */

/** Propriedades de aparência que o tema do site já define. */
const PROPRIEDADES_DESCARTADAS = [
    "font", "font-family", "font-size", "font-weight", "font-style", "font-variant",
    "color", "background", "background-color", "line-height", "letter-spacing",
    "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
    "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
    "text-indent", "width", "height",
]

/** O que sobrevive: só o que carrega intenção do autor, não aparência herdada. */
const PROPRIEDADES_MANTIDAS = ["text-align"]

function ehNegrito(style: string): boolean {
    return /font-weight\s*:\s*(bold|[6-9]00)/i.test(style)
}

function ehItalico(style: string): boolean {
    return /font-style\s*:\s*italic/i.test(style)
}

/** Reescreve o `style`, mantendo só as propriedades da lista branca. */
function filtrarStyle(style: string | undefined): string | undefined {
    if (!style) return undefined

    const mantidas = style
        .split(";")
        .map((decl) => decl.trim())
        .filter((decl) => decl.length > 0)
        .filter((decl) => {
            const propriedade = decl.split(":")[0]?.trim().toLowerCase() ?? ""
            return PROPRIEDADES_MANTIDAS.includes(propriedade)
        })

    return mantidas.length > 0 ? mantidas.join("; ") : undefined
}

function atributosLimpos(attribs: Record<string, string>): Record<string, string> {
    const limpos: Record<string, string> = {}

    for (const [nome, valor] of Object.entries(attribs)) {
        // `class` é por onde entram MsoNormal/MsoListParagraph.
        if (nome === "class" || nome === "id" || nome.startsWith("data-mce")) continue

        if (nome === "style") {
            const style = filtrarStyle(valor)
            if (style) limpos.style = style
            continue
        }

        limpos[nome] = valor
    }

    return limpos
}

export function limparHtmlDeColagem(html: string): string {
    if (!html.trim()) return ""

    const limpo = sanitizeHtml(html, {
        // Mesma lista de tags do sanitizador de segurança, menos as de tabela
        // que o preset de artigo não produz. Tag fora da lista é descartada,
        // mas seu TEXTO permanece (comportamento padrão do sanitize-html).
        allowedTags: [
            "a", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4", "h5", "h6",
            "hr", "img", "li", "ol", "p", "pre", "s", "strong", "sub", "sup", "u", "ul",
            "table", "thead", "tbody", "tr", "th", "td",
        ],
        allowedAttributes: {
            "*": ["style", "align"],
            a: ["href", "title", "target", "style"],
            img: ["src", "alt", "title", "width", "height", "style"],
            td: ["colspan", "rowspan", "style"],
            th: ["colspan", "rowspan", "style"],
        },
        allowedSchemes: ["http", "https", "mailto", "tel"],
        // Descarta o conteúdo destas, em vez de deixar o texto solto na página.
        nonTextTags: ["script", "style", "textarea", "option", "noscript", "xml"],
        parseStyleAttributes: false,
        transformTags: {
            b: "strong",
            i: "em",
            // O Google Docs cola negrito/itálico como <span style=...>. Vira
            // marcação semântica; span sem nada a dizer é desembrulhado na
            // limpeza final abaixo.
            span: (tagName, attribs) => {
                const style = attribs.style ?? ""
                if (ehNegrito(style)) return { tagName: "strong", attribs: {} }
                if (ehItalico(style)) return { tagName: "em", attribs: {} }
                return { tagName: "span", attribs: atributosLimpos(attribs) }
            },
            "*": (tagName, attribs) => ({ tagName, attribs: atributosLimpos(attribs) }),
        },
    })

    return (
        limpo
            // <span> que sobrou sem atributo nenhum não diz nada: some, o texto fica.
            .replace(/<span>([\s\S]*?)<\/span>/g, "$1")
            // Parágrafo vazio (inclusive só com &nbsp;) é ruído do Word.
            .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, "")
            .trim()
    )
}
```

**Nota para quem implementa:** `transformTags["*"]` e uma entrada específica (`span`) coexistem — o `sanitize-html` aplica a específica quando existe, então `atributosLimpos` é chamado dentro da função de `span` de propósito. Se ao rodar os testes o `class` sobreviver em `<span>`, é este ponto.

- [ ] **Step 4: Rodar e ver passar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/blog/paste-cleanup.test.ts
```

Esperado: PASS, 10 testes. Se `<p>Um</p><p>Dois</p>` sair com espaço entre as tags, ajustar a regex de parágrafo vazio — não afrouxar o teste.

- [ ] **Step 5: Commit**

```bash
git add lib/blog/paste-cleanup.ts lib/blog/paste-cleanup.test.ts
git commit -m "feat(blog): limpeza de HTML colado de Word e Google Docs"
```

---

### Task 2: Limpeza no servidor, antes da sanitização

**Files:**
- Modify: `actions/admin/blog.ts:62-64`
- Test: `lib/utils/html-sanitizer.test.ts` (acrescentar bloco)

**Interfaces:**
- Consumes: `limparHtmlDeColagem` (Task 1), `sanitizeHtmlForPreview`.
- Produces: nada novo — `sanitizeTranslations` passa a limpar antes de sanitizar.

- [ ] **Step 1: Escrever o teste da sequência**

Acrescentar ao final de `lib/utils/html-sanitizer.test.ts`:

```ts
import { limparHtmlDeColagem } from "@/lib/blog/paste-cleanup"

describe("limpar e depois sanitizar (ordem usada ao salvar post)", () => {
    const pipeline = (html: string) => sanitizeHtmlForPreview(limparHtmlDeColagem(html))

    it("a limpeza não reabre javascript: para o sanitizador", () => {
        expect(pipeline('<a href="javascript:alert(1)" style="font-size:11pt">x</a>')).not.toContain(
            "javascript:"
        )
    })

    it("script continua sendo descartado com o conteúdo", () => {
        expect(pipeline('<p style="font-family:Calibri">ok</p><script>alert(1)</script>')).toBe(
            "<p>ok</p>"
        )
    })

    it("text-align sobrevive às duas etapas", () => {
        expect(pipeline('<p style="text-align:center; color:red">meio</p>')).toMatch(
            /text-align:\s*center/
        )
    })
})
```

- [ ] **Step 2: Rodar e ver o estado atual**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/utils/html-sanitizer.test.ts
```

Esperado: PASS (a função de limpeza já existe desde a Task 1; este bloco fixa a ordem para que ninguém a inverta depois).

- [ ] **Step 3: Ligar no salvamento**

Em `actions/admin/blog.ts`, importar no topo:

```ts
import { limparHtmlDeColagem } from "@/lib/blog/paste-cleanup"
```

E trocar `sanitizeTranslations` (linhas 62-64) por:

```ts
// Limpar ANTES de sanitizar. A limpeza é sobre consistência visual e o
// sanitizador é sobre segurança — se a ordem se inverter, o sanitizador
// deixa de ser a última palavra sobre o que vai ao banco.
//
// Roda aqui mesmo com a limpeza já tendo rodado no editor: o cliente é
// burlável, e `style` passa inteiro pelo sanitizador.
function sanitizeTranslations<T extends { contentHtml: string }>(translations: T[]): T[] {
    return translations.map((t) => ({
        ...t,
        contentHtml: sanitizeHtmlForPreview(limparHtmlDeColagem(t.contentHtml)),
    }))
}
```

- [ ] **Step 4: Verificar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint actions/admin/blog.ts lib/utils/html-sanitizer.test.ts
```

Esperado: exit 0 nos três.

- [ ] **Step 5: Commit**

```bash
git add actions/admin/blog.ts lib/utils/html-sanitizer.test.ts
git commit -m "feat(blog): limpa HTML colado no servidor antes de sanitizar"
```

---

### Task 3: Preset do editor e limpeza ao colar

Aqui o editor deixa de ser um só para dois usos diferentes. **O preset `email` não pode mudar de comportamento** — os templates de cold mail dependem dele.

**Files:**
- Modify: `components/ui/rich-text-editor/rich-text-editor.tsx`, `components/ui/rich-text-editor/rich-text-toolbar.tsx`, `components/admin/blog/post-editor.tsx:238`
- Modify: `package.json` (dependência nova)

**Interfaces:**
- Consumes: `limparHtmlDeColagem` (Task 1).
- Produces: `RichTextEditor` e `RichTextToolbar` aceitam `preset?: "email" | "article"` (default `"email"`).

- [ ] **Step 1: Instalar a extensão de alinhamento**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm install @tiptap/extension-text-align@^3.22.5
```

Esperado: instala sem alterar a versão das outras `@tiptap/*` (todas em `^3.22.5`).

- [ ] **Step 2: Aceitar o preset no editor**

Em `components/ui/rich-text-editor/rich-text-editor.tsx`, trocar a interface de props e o começo do componente:

```tsx
import TextAlign from "@tiptap/extension-text-align"
import { limparHtmlDeColagem } from "@/lib/blog/paste-cleanup"

/**
 * `email` é o comportamento histórico: chips de variável ({{nome}}) e nada
 * mais. `article` serve o blog — alinhamento, mais níveis de título e limpeza
 * do que for colado de Word/Google Docs/IA.
 *
 * Os dois convivem no mesmo componente de propósito: o editor de template e o
 * editor de post compartilham quase tudo, e duas cópias divergiriam.
 */
export type RichTextPreset = "email" | "article"

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    preset?: RichTextPreset
}

export function RichTextEditor({
    content,
    onChange,
    placeholder = "Escreva a mensagem como ela deve chegar ao lead...",
    className,
    disabled = false,
    preset = "email",
}: RichTextEditorProps) {
    const ehArtigo = preset === "article"
    // Chip de variável só existe no mundo do cold mail.
    const editorContent = ehArtigo ? content : renderTemplateVariablesForEditor(content)
```

- [ ] **Step 3: Ligar extensão e limpeza por preset**

No mesmo arquivo, dentro de `useEditor`, acrescentar a extensão à lista e o `transformPastedHTML` ao `editorProps`:

```tsx
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline",
                },
            }),
            Underline,
            Placeholder.configure({
                placeholder,
            }),
            // Grava style="text-align: …", que o sanitizador do servidor preserva.
            ...(ehArtigo
                ? [TextAlign.configure({ types: ["heading", "paragraph"] })]
                : []),
        ],
```

```tsx
        editorProps: {
            // Colar num artigo limpa na hora: o autor vê o resultado real, não
            // uma versão bonita que muda ao salvar. No preset de e-mail nada
            // muda — os chips de variável dependem do HTML colado como veio.
            ...(ehArtigo
                ? { transformPastedHTML: (html: string) => limparHtmlDeColagem(html) }
                : {}),
            attributes: {
                class: cn(
```

E passar o preset adiante, na linha do `<RichTextToolbar>`:

```tsx
            <RichTextToolbar editor={editor} disabled={disabled} preset={preset} />
```

- [ ] **Step 4: Barra de ferramentas por preset**

Em `components/ui/rich-text-editor/rich-text-toolbar.tsx`, acrescentar aos imports de ícones:

```tsx
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Heading3,
    Minus,
    Quote,
    RemoveFormatting,
} from "lucide-react"
```

Trocar a interface e a assinatura:

```tsx
import type { RichTextPreset } from "./rich-text-editor"

interface RichTextToolbarProps {
    editor: Editor
    disabled?: boolean
    preset?: RichTextPreset
}

export function RichTextToolbar({ editor, disabled, preset = "email" }: RichTextToolbarProps) {
    const ehArtigo = preset === "article"
```

Depois do botão de "Título 2" (hoje na linha 109), acrescentar os botões de artigo:

```tsx
            {ehArtigo && (
                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 3 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    disabled={disabled}
                    title="Título 3"
                >
                    <Heading3 className="h-4 w-4" />
                </Toggle>
            )}
```

E, logo antes do bloco de link (hoje na linha 175), o grupo de alinhamento e blocos:

```tsx
            {ehArtigo && (
                <>
                    <Separator orientation="vertical" className="mx-1 h-6" />

                    {([
                        ["left", AlignLeft, "Alinhar à esquerda"],
                        ["center", AlignCenter, "Centralizar"],
                        ["right", AlignRight, "Alinhar à direita"],
                        ["justify", AlignJustify, "Justificar"],
                    ] as const).map(([alinhamento, Icone, titulo]) => (
                        <Toggle
                            key={alinhamento}
                            size="sm"
                            pressed={editor.isActive({ textAlign: alinhamento })}
                            onPressedChange={() =>
                                editor.chain().focus().setTextAlign(alinhamento).run()
                            }
                            disabled={disabled}
                            title={titulo}
                        >
                            <Icone className="h-4 w-4" />
                        </Toggle>
                    ))}

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Toggle
                        size="sm"
                        pressed={editor.isActive("blockquote")}
                        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                        disabled={disabled}
                        title="Citação"
                    >
                        <Quote className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={false}
                        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
                        disabled={disabled}
                        title="Linha divisória"
                    >
                        <Minus className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={false}
                        onPressedChange={() =>
                            editor.chain().focus().unsetAllMarks().clearNodes().run()
                        }
                        disabled={disabled}
                        title="Limpar formatação"
                    >
                        <RemoveFormatting className="h-4 w-4" />
                    </Toggle>
                </>
            )}
```

Por fim, esconder as variáveis fora do e-mail — trocar a última linha (hoje `<VariableDropdown … />`, linha 226) por:

```tsx
            {!ehArtigo && (
                <>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <VariableDropdown onSelect={insertVariable} disabled={disabled} />
                </>
            )}
```

O `<Separator />` que precedia o dropdown (linha 223) entra no bloco acima; remova o solto para não sobrar uma barra vertical no fim da barra do artigo.

- [ ] **Step 5: Usar o preset no editor de post**

Em `components/admin/blog/post-editor.tsx`, trocar a linha 238:

```tsx
                    <RichTextEditor
                        content={current.contentHtml}
                        onChange={(html) => setField("contentHtml", html)}
                        preset="article"
                        placeholder="Cole ou escreva o texto do post..."
                    />
```

- [ ] **Step 6: Verificar que o build aguenta a limpeza no cliente**

Este é o ponto de decisão registrado na spec: `sanitize-html` é biblioteca de origem Node e agora entra no pacote do navegador.

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm run build
```

Esperado: exit 0 nos dois. **Se o build falhar com erro de módulo de Node** (`ERR_REQUIRE_ESM`, `Can't resolve 'fs'` ou similar — o projeto já apanhou disso com jsdom, ver o cabeçalho de `lib/utils/html-sanitizer.ts`), aplicar o plano B da spec **nesta task, sem improvisar**: remover o `transformPastedHTML` do Step 3 e acrescentar à barra do artigo um botão "colar limpo" que lê `navigator.clipboard.readText()`, passa por `limparHtmlDeColagem` **no servidor** (uma server action nova `limparHtmlColado` em `actions/admin/blog.ts`, protegida por `requireAdmin`) e insere o resultado. O HTML salvo é o mesmo — a Task 2 garante isso; muda só o momento em que o autor vê.

- [ ] **Step 7: Verificar na tela**

Subir o dev server pelo `.claude/launch.json` (porta 3001, **nunca** via Bash) e, logado como admin:
- em `/super-admin/blog/new`, a barra mostra alinhamento, H3, citação, divisória e limpar formatação, e **não** mostra o menu de variáveis;
- em um template de cold mail (`/settings` → templates), a barra continua **exatamente** como era, com o menu de variáveis;
- colar um trecho do Word no editor de post não traz fonte nem cor.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json components/ui/rich-text-editor/ components/admin/blog/post-editor.tsx
git commit -m "feat(blog): preset de artigo no editor, com alinhamento e limpeza ao colar"
```

---

### Task 4: Imagem no corpo do texto

**Files:**
- Modify: `lib/blog/storage.ts:23`, `components/ui/rich-text-editor/rich-text-toolbar.tsx`
- Modify: `package.json` (dependência nova)

**Interfaces:**
- Consumes: `uploadBlogImage`.
- Produces: `uploadBlogImage(file: File, prefixo?: "covers" | "body"): Promise<BlogUploadResult>`.

- [ ] **Step 1: Instalar a extensão de imagem**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm install @tiptap/extension-image@^3.22.5
```

- [ ] **Step 2: Separar capa de imagem de corpo no bucket**

Em `lib/blog/storage.ts`, trocar a assinatura e a linha do nome do arquivo:

```ts
/**
 * `prefixo` separa capa de imagem de corpo dentro do bucket. Sem isso as duas
 * se misturam numa pasta só e não dá para saber o que está em uso onde.
 */
export async function uploadBlogImage(
    file: File,
    prefixo: "covers" | "body" = "covers"
): Promise<BlogUploadResult> {
```

```ts
    const fileName = `${prefixo}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
```

Nenhum call site quebra: o parâmetro tem default e a capa continua em `covers/`.

- [ ] **Step 3: Ligar a extensão no preset de artigo**

Em `components/ui/rich-text-editor/rich-text-editor.tsx`, importar e acrescentar à lista de extensões, junto do `TextAlign`:

```tsx
import Image from "@tiptap/extension-image"
```

```tsx
            ...(ehArtigo
                ? [
                    TextAlign.configure({ types: ["heading", "paragraph"] }),
                    Image.configure({ HTMLAttributes: { class: "rounded-lg" } }),
                ]
                : []),
```

- [ ] **Step 4: Botão de imagem com texto alternativo obrigatório**

Em `components/ui/rich-text-editor/rich-text-toolbar.tsx`, acrescentar ao topo:

```tsx
import { ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { uploadBlogImage } from "@/lib/blog/storage"
```

Dentro do componente, o estado e o handler:

```tsx
    const [imagePopoverOpen, setImagePopoverOpen] = useState(false)
    const [imageAlt, setImageAlt] = useState("")
    const [enviandoImagem, setEnviandoImagem] = useState(false)

    // O alt é obrigatório: imagem sem texto alternativo é falha de
    // acessibilidade, e este site publica dado estruturado sobre o próprio
    // conteúdo — descrever imagem não é opcional aqui.
    const inserirImagem = async (file: File) => {
        if (!imageAlt.trim()) {
            toast.error("Descreva a imagem no texto alternativo antes de enviar.")
            return
        }

        setEnviandoImagem(true)
        const res = await uploadBlogImage(file, "body")
        setEnviandoImagem(false)

        if (!res.success || !res.url) {
            toast.error(res.error ?? "Falha no upload.")
            return
        }

        editor.chain().focus().setImage({ src: res.url, alt: imageAlt.trim() }).run()
        setImageAlt("")
        setImagePopoverOpen(false)
    }
```

E o controle na barra, dentro do bloco `{ehArtigo && (…)}` criado na Task 3, logo depois do botão de "Limpar formatação":

```tsx
                    <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Toggle size="sm" pressed={false} disabled={disabled} title="Inserir imagem">
                                <ImagePlus className="h-4 w-4" />
                            </Toggle>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                            <div className="space-y-3">
                                <Label htmlFor="image-alt">Texto alternativo *</Label>
                                <Input
                                    id="image-alt"
                                    placeholder="O que a imagem mostra"
                                    value={imageAlt}
                                    onChange={(e) => setImageAlt(e.target.value)}
                                />
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    disabled={!imageAlt.trim() || enviandoImagem}
                                    onChange={(e) => e.target.files?.[0] && inserirImagem(e.target.files[0])}
                                />
                                <p className="text-xs text-muted-foreground">
                                    PNG, JPG ou WebP, até 4 MB. O campo de arquivo libera depois
                                    que a imagem estiver descrita.
                                </p>
                            </div>
                        </PopoverContent>
                    </Popover>
```

- [ ] **Step 5: Verificar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint components/ui/rich-text-editor/rich-text-toolbar.tsx components/ui/rich-text-editor/rich-text-editor.tsx lib/blog/storage.ts
```

Esperado: exit 0 nos três.

Com o dev server no ar: inserir uma imagem num post, conferir que o campo de arquivo só libera com o alt preenchido, e que o arquivo caiu em `body/` no bucket `blog` do Supabase.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/ui/rich-text-editor/ lib/blog/storage.ts
git commit -m "feat(blog): imagem no corpo do post, com texto alternativo obrigatorio"
```

---

### Task 5: Extrair `PostArticle` da página pública

Tarefa mecânica e de risco alto se feita com pressa: esta é a página de post do site inteiro. O markup não muda — só de lugar.

**Files:**
- Create: `components/blog/post-article.tsx`
- Modify: `app/[locale]/blog/[slug]/page.tsx:62-77`

**Interfaces:**
- Consumes: `dirForLocale`, `BlogLocale`.
- Produces: `<PostArticle locale categoryName title dateLabel coverImageUrl contentHtml />`.

- [ ] **Step 1: Guardar o HTML atual para comparar depois**

Com o dev server no ar e um post publicado à mão (pegue um slug em `/blog`):

```bash
curl -s "http://localhost:3001/blog/<slug>" > /tmp/post-antes.html && wc -c /tmp/post-antes.html
```

- [ ] **Step 2: Criar o componente**

Criar `components/blog/post-article.tsx`:

```tsx
import { dirForLocale, type BlogLocale } from "@/lib/blog/locales"

interface PostArticleProps {
    locale: BlogLocale
    categoryName: string | null
    title: string
    /** Já formatado por quem chama — a prévia e o público formatam igual. */
    dateLabel: string
    coverImageUrl: string | null
    /** Sanitizado no servidor no momento da escrita (actions/admin/blog.ts). */
    contentHtml: string
    children?: React.ReactNode
}

/**
 * Renderização do artigo, compartilhada pela página pública e pela prévia do
 * admin. Existe para que a prévia não possa divergir do publicado: se
 * divergir, é bug nos dois.
 *
 * Segurança: `contentHtml` já passou por limpeza e sanitização no servidor ao
 * salvar. Não acrescentar sanitização aqui — ver o comentário em
 * `lib/utils/html-sanitizer.ts` sobre por que isso não roda no cliente.
 */
export function PostArticle({
    locale,
    categoryName,
    title,
    dateLabel,
    coverImageUrl,
    contentHtml,
    children,
}: PostArticleProps) {
    return (
        <article className="min-h-screen bg-white text-gray-950" dir={dirForLocale(locale)}>
            <div className="mx-auto max-w-3xl px-4 py-14">
                {categoryName && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                        {categoryName}
                    </p>
                )}
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
                {dateLabel && <p className="mt-3 text-sm text-gray-500">{dateLabel}</p>}
                {coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImageUrl} alt="" className="mt-6 w-full rounded-lg object-cover" />
                )}
                <div
                    className="prose prose-indigo mt-8 max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
                {children}
            </div>
        </article>
    )
}
```

- [ ] **Step 3: Consumir na página pública**

Em `app/[locale]/blog/[slug]/page.tsx`, trocar todo o `return` (do `<article …>` até `</article>`) por:

```tsx
    return (
        <>
            {post.publishedAt && (
                <JsonLd
                    data={buildBlogPostingSchema({
                        title: translation.title,
                        description: translation.metaDescription ?? translation.excerpt,
                        slug: localeSlugs[locale] ?? slug,
                        locale,
                        publishedAt: post.publishedAt,
                        updatedAt: post.updatedAt,
                        imageUrl: translation.ogImageUrl ?? post.coverImageUrl,
                    })}
                />
            )}
            <PostArticle
                locale={locale as BlogLocale}
                categoryName={categoryName}
                title={translation.title}
                dateLabel={dateLabel}
                coverImageUrl={post.coverImageUrl}
                contentHtml={translation.contentHtml}
            >
                <LanguageSwitcher
                    locale={locale as BlogLocale}
                    availableLocales={availableLocales}
                    localeSlugs={localeSlugs}
                />
            </PostArticle>
        </>
    )
```

Importar `PostArticle` e remover o import de `dirForLocale` se ele não for mais usado no arquivo (o `tsc`/eslint acusa).

- [ ] **Step 4: Provar que a página não mudou**

```bash
curl -s "http://localhost:3001/blog/<slug>" > /tmp/post-depois.html && diff <(grep -o '<article[\s\S]*</article>' /tmp/post-antes.html) <(grep -o '<article[\s\S]*</article>' /tmp/post-depois.html) && echo "IDENTICO"
```

Esperado: `IDENTICO`. Diferença em atributo de hidratação do React (`data-reactroot`, ids de Suspense) é aceitável; **diferença de classe, tag ou ordem não é** — nesse caso, corrigir o componente até bater.

- [ ] **Step 5: Verificar e commitar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint components/blog/post-article.tsx "app/[locale]/blog/[slug]/page.tsx"
git add components/blog/post-article.tsx "app/[locale]/blog/[slug]/page.tsx"
git commit -m "refactor(blog): extrai PostArticle para publico e previa compartilharem"
```

---

### Task 6: Consulta e rota de prévia

**Files:**
- Modify: `lib/blog/queries.ts`
- Create: `app/blog-preview/[id]/page.tsx`

**Interfaces:**
- Consumes: `PostArticle` (Task 5), `requireAdmin`, `getBlogLabels`, `isBlogLocale`.
- Produces: `getPostForPreview(id: string, locale: BlogLocale)`, devolvendo `{ post, translation, categoryName } | null` — `translation` pode ser `null` quando o idioma ainda não foi escrito.

- [ ] **Step 1: Consulta que enxerga rascunho**

Acrescentar ao final de `lib/blog/queries.ts`:

```ts
/**
 * Consulta da PRÉVIA: busca por id e **não** filtra por publicado — é
 * exatamente o que `getPostBySlug` recusa a fazer, e por isso não dá para
 * reaproveitá-la. Só é chamada de rota protegida por requireAdmin.
 *
 * `translation` volta null quando o idioma pedido ainda não foi escrito: a
 * prévia mostra um aviso, em vez de 404 num post que existe.
 */
export async function getPostForPreview(id: string, locale: BlogLocale) {
    const post = await prisma.blogPost.findUnique({
        where: { id },
        include: {
            translations: { where: { locale } },
            category: { include: { translations: { where: { locale } } } },
        },
    })

    if (!post) return null

    return {
        post,
        translation: post.translations[0] ?? null,
        categoryName: post.category?.translations[0]?.name ?? null,
    }
}
```

- [ ] **Step 2: Criar a rota**

Criar `app/blog-preview/[id]/page.tsx`:

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { getPostForPreview } from "@/lib/blog/queries"
import { getBlogLabels } from "@/lib/blog/i18n"
import { isBlogLocale, DEFAULT_BLOG_LOCALE, type BlogLocale } from "@/lib/blog/locales"
import { PostArticle } from "@/components/blog/post-article"

// Prévia nunca é indexada: é conteúdo não publicado, atrás de login.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

/**
 * Prévia do post como o leitor verá.
 *
 * Fora de `app/(app)` de propósito: o layout do super-admin traz barra lateral
 * e cabeçalho, e uma prévia com metade da largura real não serviria para nada.
 * Fora de `app/[locale]` também — o idioma vem de `?locale=`, e isto não é uma
 * página do site.
 *
 * O gate de role do proxy.ts cobre /super-admin; esta rota traz o seu próprio.
 */
export default async function BlogPreviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ locale?: string }>
}) {
    await requireAdmin()

    const { id } = await params
    const { locale: localeParam } = await searchParams
    // isBlogLocale recebe string, não string | undefined — daí o `?? ""`.
    const candidato = localeParam ?? ""
    const locale: BlogLocale = isBlogLocale(candidato) ? candidato : DEFAULT_BLOG_LOCALE

    const data = await getPostForPreview(id, locale)
    if (!data) notFound()

    const labels = getBlogLabels(locale)

    if (!data.translation) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-14">
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    Este post ainda não tem tradução em <strong>{locale.toUpperCase()}</strong>.
                    Escreva o título e o conteúdo nessa aba e salve para pré-visualizar.
                </p>
            </div>
        )
    }

    const dateLabel = data.post.publishedAt
        ? `${labels.publishedOn} ${new Date(data.post.publishedAt).toLocaleDateString(locale)}`
        : ""

    return (
        <>
            {data.post.status === "DRAFT" && (
                <p className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
                    Rascunho — esta página não está publicada.
                </p>
            )}
            <PostArticle
                locale={locale}
                categoryName={data.categoryName}
                title={data.translation.title}
                dateLabel={dateLabel}
                coverImageUrl={data.post.coverImageUrl}
                contentHtml={data.translation.contentHtml}
            />
        </>
    )
}
```

- [ ] **Step 3: Verificar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint lib/blog/queries.ts "app/blog-preview/[id]/page.tsx"
```

Esperado: exit 0 nos três.

Com o dev server no ar e logado como admin, abrir `/blog-preview/<id de um post>?locale=pt`: aparece o post com a tipografia real. Trocar para um idioma sem tradução mostra o aviso. Deslogado (ou como usuário comum), a rota **não** pode renderizar o conteúdo.

- [ ] **Step 4: Commit**

```bash
git add lib/blog/queries.ts "app/blog-preview/[id]/page.tsx"
git commit -m "feat(blog): rota de previa do post, so para admin"
```

---

### Task 7: Botão "Ver como fica" no editor

**Files:**
- Create: `components/admin/blog/preview-button.tsx`
- Modify: `components/admin/blog/post-editor.tsx`, `messages/{pt,en}.json`

**Interfaces:**
- Consumes: a rota da Task 6.
- Produces: `<PreviewButton postId={string | undefined} locale={BlogLocale} temAlteracaoNaoSalva={boolean} />`.

- [ ] **Step 1: Criar o botão**

Criar `components/admin/blog/preview-button.tsx`:

```tsx
"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BlogLocale } from "@/lib/blog/locales"

/**
 * A prévia lê o BANCO, não a tela. Por isso o botão avisa quando há alteração
 * pendente em vez de salvar sozinho: salvar sozinho um post já publicado
 * publicaria a alteração sem o autor pedir.
 */
export function PreviewButton({
    postId,
    locale,
    temAlteracaoNaoSalva,
}: {
    postId?: string
    locale: BlogLocale
    temAlteracaoNaoSalva: boolean
}) {
    const t = useTranslations("admin.blogEditor")

    if (!postId) {
        return (
            <Button type="button" variant="outline" disabled title={t("previewNeedsSave")}>
                <ExternalLink className="h-4 w-4" />
                {t("preview")}
            </Button>
        )
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => {
                if (temAlteracaoNaoSalva) toast.info(t("previewIsSavedVersion"))
                window.open(`/blog-preview/${postId}?locale=${locale}`, "_blank", "noopener")
            }}
        >
            <ExternalLink className="h-4 w-4" />
            {t("preview")}
        </Button>
    )
}
```

- [ ] **Step 2: Detectar alteração não salva e montar o botão**

Em `components/admin/blog/post-editor.tsx`, acrescentar o import:

```tsx
import { PreviewButton } from "@/components/admin/blog/preview-button"
```

Depois da linha `const current = tr[active] ?? EMPTY` (hoje linha 110), acrescentar:

```tsx
    // Comparação contra o que veio do servidor. Serialização basta: os dois
    // lados são objetos simples de string, montados pelo mesmo código.
    const temAlteracaoNaoSalva =
        JSON.stringify(tr) !== JSON.stringify(initial.translations) ||
        cover !== initial.coverImageUrl ||
        categoryId !== (initial.categoryId ?? "") ||
        status !== initial.status
```

E trocar o rodapé de botões (hoje linhas 267-269) por:

```tsx
            <div className="flex justify-end gap-2">
                <PreviewButton
                    postId={initial.id}
                    locale={active}
                    temAlteracaoNaoSalva={temAlteracaoNaoSalva}
                />
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? t("saving") : t("save")}
                </Button>
            </div>
```

- [ ] **Step 3: Traduzir os rótulos**

Acrescentar ao namespace `admin.blogEditor`, em `messages/pt.json`:

```json
                "preview": "Ver como fica",
                "previewNeedsSave": "Salve o post uma vez para poder pré-visualizar.",
                "previewIsSavedVersion": "Você tem alterações não salvas; a prévia mostra a última versão salva.",
```

E em `messages/en.json`:

```json
                "preview": "Preview",
                "previewNeedsSave": "Save the post once before previewing.",
                "previewIsSavedVersion": "You have unsaved changes; the preview shows the last saved version.",
```

Os demais idiomas caem no português pelo fallback de `loadMessages` — o namespace `admin` está registrado em `LACUNAS_CONHECIDAS` no teste de paridade, então isto não reprova nada.

- [ ] **Step 4: Verificar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint components/admin/blog/ && npx vitest run lib/i18n/messages-integridade.test.ts
```

Esperado: exit 0 em todos.

Com o dev server no ar: em um post salvo, "Ver como fica" abre a prévia em outra aba no idioma da aba ativa; alterar um campo sem salvar e clicar mostra o aviso e **abre mesmo assim** (a versão salva); em `/super-admin/blog/new` o botão aparece desabilitado.

- [ ] **Step 5: Commit**

```bash
git add components/admin/blog/ messages/pt.json messages/en.json
git commit -m "feat(blog): botao Ver como fica no editor de post"
```

---

### Task 8: Verificação final e lista de aceite

**Files:** nenhum novo.

- [ ] **Step 1: Suíte completa**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npm run build && npx eslint $(git diff --name-only main...HEAD | grep -E "\.(ts|tsx)$")
```

Esperado: exit 0 nos quatro. **O build precisa rodar com o dev server parado** — o Windows não deixa o Prisma renomear a DLL do query engine enquanto o servidor está no ar (`EPERM ... query_engine-windows.dll.node`).

- [ ] **Step 2: Percorrer a verificação de aceite da spec**

Abrir `docs/superpowers/specs/2026-07-31-blog-premium-design.md` e marcar item a item a seção "Verificação de aceite". Os itens que exigem login de ADMIN e navegador real (colar do Word, publicar, prévia, upload de imagem) **não podem ser marcados sem terem sido executados de fato** — se não houver acesso, relatar ao usuário quais itens ficaram por conferir, nominalmente.

Uma conferência que só o banco responde, e que vale fazer:

```sql
select left("contentHtml", 400) from blog_post_translations order by "updatedAt" desc limit 1;
```

Esperado: nenhum `font-family`, nenhum `class="Mso…"`, e `text-align` presente se o autor centralizou algo.

- [ ] **Step 3: Commit final, se houver ajuste**

```bash
git add -A
git commit -m "chore(blog): ajustes da verificacao final"
```

---

## Notas para quem executa

- **A Task 5 é a de maior risco** — ela mexe na página de post do site inteiro. O Step 4 dela (diff do HTML antes/depois) não é burocracia: é o que separa "extraí o componente" de "quebrei o blog".
- **O preset `email` é intocável.** Se em algum momento parecer necessário mudar o comportamento do editor de templates para o blog funcionar, a modelagem está errada — pare e pergunte.
- **A ordem limpar → sanitizar não se inverte.** Está fixada por teste na Task 2.
- **Nunca subir o dev server pelo Bash.** Use o `.claude/launch.json` (porta 3001).
