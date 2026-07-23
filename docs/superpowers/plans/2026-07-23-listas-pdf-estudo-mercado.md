# Listas como PDF de estudo de mercado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar as listas do marketplace em PDFs de estudo de mercado enviados por upload, entregues ao comprador como PDF, com idioma (bandeira) e introdução, removendo nº de leads e valor/lead das telas públicas.

**Architecture:** Novos campos em `LeadList` (`introduction`, `language`, `studyPdfUrl`, `studyPdfName`). PDF fica em bucket privado do Supabase; upload por route handler server-side (admin) e download por route handler que valida a compra e redireciona a uma signed URL curta. Telas públicas (card, catálogo, detalhe) perdem métricas de lead e ganham idioma/introdução. Cadastro de leads (import CSV/Excel) permanece intacto para uso interno.

**Tech Stack:** Next.js (App Router), Prisma/Postgres, Supabase Storage (`@supabase/supabase-js` service role), react-hook-form + zod, next-intl, Vitest.

## Global Constraints

- **Entrega ao comprador:** apenas PDF. Rotas CSV/Excel (`app/api/purchases/[id]/download/route.ts`, `.../download-excel/route.ts`) **permanecem no código sem uso** — não deletar.
- **Cadastro de leads permanece:** não remover import wizard, `MarketplaceLead`, nem `totalLeads`/`price` do schema (usados internamente e pelo carrinho).
- **Bucket privado:** `list-studies`. Produto pago → sem URL pública.
- **Mapa língua → bandeira (flagcdn, código de país):** `pt`→`br`, `en`→`gb`, `de`→`de`, `fr`→`fr`, `es`→`es`, `it`→`it`, `nl`→`nl`. Uma língua por lista.
- **Migrations Prisma sem shadow DB** neste ambiente: se `prisma migrate dev` falhar por shadow DB, usar `npx prisma db push`.
- **Textos do admin e do card de compra** são PT hardcoded (padrão existente desses arquivos) — não precisam de i18n. Telas públicas do catálogo/detalhe usam `next-intl`.
- Rodar verificação com `npx tsc --noEmit` e `npm run lint` ao final de cada task que toca `.ts/.tsx`.

---

### Task 1: Campos novos na `LeadList` (schema + migração)

**Files:**
- Modify: `prisma/schema.prisma` (model `LeadList`, ~linhas 512-547)

**Interfaces:**
- Produces: campos Prisma `LeadList.introduction: string | null`, `LeadList.language: string | null`, `LeadList.studyPdfUrl: string | null`, `LeadList.studyPdfName: string | null`.

- [ ] **Step 1: Adicionar os campos ao model**

Em `prisma/schema.prisma`, dentro de `model LeadList`, após o bloco `previewData Json?` (linha ~535), adicionar:

```prisma
  // Estudo de mercado (PDF)
  introduction String? @db.Text
  language     String? // 'pt' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl'
  studyPdfUrl  String?
  studyPdfName String?
```

- [ ] **Step 2: Gerar a migração**

Run: `npx prisma migrate dev --name add_list_study_fields`
Expected: cria migração e aplica. Se falhar por shadow DB, rodar `npx prisma db push` e depois `npx prisma generate`.

- [ ] **Step 3: Verificar client gerado**

Run: `npx tsc --noEmit`
Expected: PASS (sem erros; tipos Prisma reconhecem os novos campos).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(marketplace): campos de estudo em PDF na LeadList"
```

---

### Task 2: Constante de idiomas da lista (TDD)

**Files:**
- Create: `lib/constants/list-languages.ts`
- Test: `lib/constants/list-languages.test.ts`

**Interfaces:**
- Produces:
  - `type ListLanguageCode = "pt" | "en" | "de" | "fr" | "es" | "it" | "nl"`
  - `LIST_LANGUAGES: ReadonlyArray<{ code: ListLanguageCode; label: string; flagCode: string }>`
  - `getListLanguage(code: string | null | undefined): { code: ListLanguageCode; label: string; flagCode: string } | null`

- [ ] **Step 1: Escrever o teste que falha**

Create `lib/constants/list-languages.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { LIST_LANGUAGES, getListLanguage } from "./list-languages"

describe("list-languages", () => {
    it("tem as 7 línguas do app", () => {
        expect(LIST_LANGUAGES.map((l) => l.code)).toEqual([
            "pt", "en", "de", "fr", "es", "it", "nl",
        ])
    })

    it("mapeia português para a bandeira do Brasil", () => {
        expect(getListLanguage("pt")).toEqual({ code: "pt", label: "Português", flagCode: "br" })
    })

    it("mapeia inglês para a bandeira do Reino Unido", () => {
        expect(getListLanguage("en")?.flagCode).toBe("gb")
    })

    it("retorna null para código desconhecido ou vazio", () => {
        expect(getListLanguage("xx")).toBeNull()
        expect(getListLanguage(null)).toBeNull()
        expect(getListLanguage(undefined)).toBeNull()
    })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run lib/constants/list-languages.test.ts`
Expected: FAIL ("Cannot find module './list-languages'").

- [ ] **Step 3: Implementar a constante**

Create `lib/constants/list-languages.ts`:

```ts
// lib/constants/list-languages.ts
export type ListLanguageCode = "pt" | "en" | "de" | "fr" | "es" | "it" | "nl"

export interface ListLanguage {
    code: ListLanguageCode
    label: string
    /** Código de país para o flagcdn (FlagIcon). */
    flagCode: string
}

export const LIST_LANGUAGES: ReadonlyArray<ListLanguage> = [
    { code: "pt", label: "Português", flagCode: "br" },
    { code: "en", label: "English", flagCode: "gb" },
    { code: "de", label: "Deutsch", flagCode: "de" },
    { code: "fr", label: "Français", flagCode: "fr" },
    { code: "es", label: "Español", flagCode: "es" },
    { code: "it", label: "Italiano", flagCode: "it" },
    { code: "nl", label: "Nederlands", flagCode: "nl" },
]

export function getListLanguage(code: string | null | undefined): ListLanguage | null {
    if (!code) return null
    return LIST_LANGUAGES.find((l) => l.code === code) ?? null
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run lib/constants/list-languages.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/constants/list-languages.ts lib/constants/list-languages.test.ts
git commit -m "feat(marketplace): constante de idiomas da lista"
```

---

### Task 3: Storage do PDF (env + client service-role + helpers)

**Files:**
- Modify: `lib/env.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/supabase/list-studies.ts`
- Test: `lib/supabase/list-studies.test.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js` (já instalado), `getServiceSupabaseConfig()`.
- Produces:
  - `lib/env.ts`: `getServiceSupabaseConfig(): { url: string; serviceRoleKey: string }`
  - `lib/supabase/admin.ts`: `createAdminClient(): SupabaseClient`
  - `lib/supabase/list-studies.ts`:
    - `LIST_STUDIES_BUCKET = "list-studies"`
    - `validatePdfFile(file: { type: string; size: number }): { ok: true } | { ok: false; error: string }`
    - `uploadListPdf(file: File, listId: string): Promise<{ url: string; path: string }>`
    - `removeListPdfByPath(path: string): Promise<void>`
    - `createStudySignedUrl(path: string, expiresInSeconds?: number): Promise<string>`
    - `extractStudyPathFromUrl(publicOrPath: string): string` (retorna o caminho relativo ao bucket)

> **Setup manual (documentar no PR, não é passo de código):**
> 1. Criar o bucket privado `list-studies` no Supabase (SQL: `insert into storage.buckets (id, name, public) values ('list-studies','list-studies', false) on conflict do nothing;`).
> 2. Definir `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` e no ambiente de deploy (Vercel). É uma chave **server-only** (nunca `NEXT_PUBLIC_`).

- [ ] **Step 1: Escrever o teste que falha (validação pura)**

Create `lib/supabase/list-studies.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { validatePdfFile, extractStudyPathFromUrl, LIST_STUDIES_BUCKET } from "./list-studies"

describe("validatePdfFile", () => {
    it("aceita PDF dentro do limite", () => {
        expect(validatePdfFile({ type: "application/pdf", size: 1_000_000 })).toEqual({ ok: true })
    })

    it("rejeita tipo não-PDF", () => {
        const r = validatePdfFile({ type: "image/png", size: 100 })
        expect(r.ok).toBe(false)
    })

    it("aceita PDF grande dentro do teto do bucket (40MB)", () => {
        expect(validatePdfFile({ type: "application/pdf", size: 40 * 1024 * 1024 })).toEqual({ ok: true })
    })

    it("rejeita arquivo acima de 50MB", () => {
        const r = validatePdfFile({ type: "application/pdf", size: 51 * 1024 * 1024 })
        expect(r.ok).toBe(false)
    })
})

describe("extractStudyPathFromUrl", () => {
    it("extrai o caminho relativo ao bucket a partir de uma URL", () => {
        const url = `https://x.supabase.co/storage/v1/object/sign/${LIST_STUDIES_BUCKET}/abc/study-1.pdf?token=y`
        expect(extractStudyPathFromUrl(url)).toBe("abc/study-1.pdf")
    })

    it("retorna o próprio valor quando já é um caminho", () => {
        expect(extractStudyPathFromUrl("abc/study-1.pdf")).toBe("abc/study-1.pdf")
    })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run lib/supabase/list-studies.test.ts`
Expected: FAIL ("Cannot find module './list-studies'").

- [ ] **Step 3: Adicionar o acessor de env service-role**

Em `lib/env.ts`, adicionar ao final do arquivo:

```ts
export function getServiceSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao configurada")
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada")

    return { url, serviceRoleKey }
}
```

- [ ] **Step 4: Criar o client service-role**

Create `lib/supabase/admin.ts`:

```ts
// lib/supabase/admin.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getServiceSupabaseConfig } from "@/lib/env"

/**
 * Client com service role para operações server-side de storage (bucket privado).
 * NUNCA importar em código client — usa a chave secreta.
 */
export function createAdminClient(): SupabaseClient {
    const { url, serviceRoleKey } = getServiceSupabaseConfig()
    return createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
```

- [ ] **Step 5: Implementar os helpers de storage**

Create `lib/supabase/list-studies.ts`:

```ts
// lib/supabase/list-studies.ts
import { createAdminClient } from "@/lib/supabase/admin"

export const LIST_STUDIES_BUCKET = "list-studies"
const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB — alinhado ao teto por arquivo do bucket

export function validatePdfFile(file: { type: string; size: number }):
    | { ok: true }
    | { ok: false; error: string } {
    if (file.type !== "application/pdf") {
        return { ok: false, error: "Formato inválido. Envie um arquivo PDF." }
    }
    if (file.size > MAX_PDF_SIZE) {
        return { ok: false, error: "Arquivo muito grande. Máximo 50MB." }
    }
    return { ok: true }
}

/** Extrai o caminho relativo ao bucket a partir de uma URL de storage ou de um caminho. */
export function extractStudyPathFromUrl(publicOrPath: string): string {
    const marker = `/${LIST_STUDIES_BUCKET}/`
    const idx = publicOrPath.indexOf(marker)
    if (idx === -1) return publicOrPath
    const afterBucket = publicOrPath.slice(idx + marker.length)
    return afterBucket.split("?")[0]
}

export async function uploadListPdf(
    file: File,
    listId: string
): Promise<{ url: string; path: string }> {
    const supabase = createAdminClient()
    const path = `${listId}/study-${Date.now()}.pdf`

    // Remove PDFs anteriores da lista.
    const { data: existing } = await supabase.storage.from(LIST_STUDIES_BUCKET).list(listId)
    if (existing && existing.length > 0) {
        await supabase.storage
            .from(LIST_STUDIES_BUCKET)
            .remove(existing.map((f) => `${listId}/${f.name}`))
    }

    const { error } = await supabase.storage
        .from(LIST_STUDIES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" })

    if (error) throw new Error(`Falha no upload do PDF: ${error.message}`)

    return { url: path, path }
}

export async function removeListPdfByPath(path: string): Promise<void> {
    const supabase = createAdminClient()
    await supabase.storage.from(LIST_STUDIES_BUCKET).remove([extractStudyPathFromUrl(path)])
}

export async function createStudySignedUrl(
    path: string,
    expiresInSeconds = 120
): Promise<string> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
        .from(LIST_STUDIES_BUCKET)
        .createSignedUrl(extractStudyPathFromUrl(path), expiresInSeconds)

    if (error || !data) throw new Error(`Falha ao gerar link do PDF: ${error?.message}`)
    return data.signedUrl
}
```

> Nota: `studyPdfUrl` guarda o **caminho relativo ao bucket** (ex.: `abc/study-1.pdf`), não uma URL pública — o download sempre passa por signed URL.

- [ ] **Step 6: Rodar o teste e ver passar**

Run: `npx vitest run lib/supabase/list-studies.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 7: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/env.ts lib/supabase/admin.ts lib/supabase/list-studies.ts lib/supabase/list-studies.test.ts
git commit -m "feat(storage): helpers de PDF de estudo em bucket privado"
```

---

### Task 4: Persistir `introduction` e `language` nas actions

**Files:**
- Modify: `actions/admin/lists.ts`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `CreateListData` e `SerializedList` passam a incluir `introduction?: string` e `language?: string`; `serializeList` inclui `introduction`, `language`, `studyPdfUrl`, `studyPdfName` (via spread já existente).

- [ ] **Step 1: Estender `CreateListData`**

Em `actions/admin/lists.ts`, na interface `CreateListData` (linhas ~11-22), adicionar após `description?: string`:

```ts
    introduction?: string
    language?: string
```

- [ ] **Step 2: Estender o zod schema**

Em `listDataSchema` (linhas ~24-35), adicionar após a linha `description`:

```ts
    introduction: z.string().trim().max(10000).optional(),
    language: z.enum(["pt", "en", "de", "fr", "es", "it", "nl"]).optional(),
```

- [ ] **Step 3: Estender `SerializedList`**

Na interface `SerializedList` (linhas ~38-54), adicionar após `description: string | null`:

```ts
    introduction: string | null
    language: string | null
    studyPdfUrl: string | null
    studyPdfName: string | null
```

- [ ] **Step 4: Gravar os campos em create e update**

Em `createList`, no objeto `data:` do `prisma.leadList.create` (após `description: ...`), adicionar:

```ts
            introduction: validated.introduction || null,
            language: validated.language || null,
```

Em `updateList`, no objeto `data:` do `prisma.leadList.update` (após `description: ...`), adicionar as mesmas duas linhas.

> `serializeList` usa spread `...list`, então `introduction`/`language`/`studyPdfUrl`/`studyPdfName` já entram no retorno automaticamente.

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add actions/admin/lists.ts
git commit -m "feat(admin): persistir introdução e idioma da lista"
```

---

### Task 5: Route handler de upload do PDF (admin)

**Files:**
- Create: `app/api/admin/lists/[id]/pdf/route.ts`

**Interfaces:**
- Consumes: `requireAdmin` (`@/lib/auth`), `uploadListPdf`/`removeListPdfByPath`/`validatePdfFile` (`@/lib/supabase/list-studies`), `prisma`.
- Produces: `POST /api/admin/lists/:id/pdf` (multipart, campo `file`) → `{ studyPdfName: string }`; `DELETE /api/admin/lists/:id/pdf` → `{ ok: true }`.

- [ ] **Step 1: Implementar o route handler**

Create `app/api/admin/lists/[id]/pdf/route.ts`:

```ts
// app/api/admin/lists/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import {
    uploadListPdf,
    removeListPdfByPath,
    validatePdfFile,
} from "@/lib/supabase/list-studies"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({ where: { id }, select: { id: true, studyPdfUrl: true } })
        if (!list) {
            return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
        }

        const formData = await request.formData()
        const file = formData.get("file")
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 })
        }

        const check = validatePdfFile({ type: file.type, size: file.size })
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 })
        }

        const { url } = await uploadListPdf(file, id)

        await prisma.leadList.update({
            where: { id },
            data: { studyPdfUrl: url, studyPdfName: file.name },
        })

        return NextResponse.json({ studyPdfName: file.name })
    } catch (error) {
        console.error("Error uploading study PDF:", error)
        return NextResponse.json({ error: "Falha no upload" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({ where: { id }, select: { studyPdfUrl: true } })
        if (list?.studyPdfUrl) {
            await removeListPdfByPath(list.studyPdfUrl)
        }

        await prisma.leadList.update({
            where: { id },
            data: { studyPdfUrl: null, studyPdfName: null },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("Error removing study PDF:", error)
        return NextResponse.json({ error: "Falha ao remover" }, { status: 500 })
    }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/lists
git commit -m "feat(admin): route de upload do PDF de estudo"
```

---

### Task 6: Formulário admin — idioma, introdução e upload do PDF

**Files:**
- Modify: `components/admin/list-form.tsx`
- Modify: `app/super-admin/marketplace/lists/[id]/leads/page.tsx` (apenas se serializar a lista para o form — verificar no Step 1)

**Interfaces:**
- Consumes: `LIST_LANGUAGES` (`@/lib/constants/list-languages`), `FlagIcon` (`@/components/ui/flag-icon`), rota `POST/DELETE /api/admin/lists/:id/pdf`.
- Produces: form envia `introduction` e `language` em `createList`/`updateList`; envia o PDF à rota após ter o `list.id`.

- [ ] **Step 1: Estender o tipo, o schema e os defaults do form**

Em `components/admin/list-form.tsx`:

Adicionar ao `listSchema` (após `description`):

```ts
    introduction: z.string().optional(),
    language: z.string().optional(),
```

Adicionar à interface `SerializedLeadList` (após `description: string | null`):

```ts
    introduction: string | null
    language: string | null
    studyPdfUrl: string | null
    studyPdfName: string | null
```

Adicionar aos `defaultValues` (após `description`):

```ts
            introduction: list?.introduction || "",
            language: list?.language || "",
```

Importar a constante e um ícone de arquivo no topo:

```ts
import { LIST_LANGUAGES } from "@/lib/constants/list-languages"
import { FlagIcon } from "@/components/ui/flag-icon"
import { FileText } from "lucide-react"
```

- [ ] **Step 2: Adicionar estado do PDF**

Após `const [preparedLeads, setPreparedLeads] = ...`, adicionar:

```ts
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [pdfName, setPdfName] = useState<string | null>(list?.studyPdfName ?? null)
```

- [ ] **Step 3: Enviar o PDF no submit**

Em `onSubmit`, criar um helper local e chamá-lo após obter o id da lista (tanto no ramo de edição quanto no de criação). Adicionar, logo no início de `onSubmit` (após `setUploadProgress(0)` e antes do `try`), a função:

```ts
        const uploadPdf = async (listId: string) => {
            if (!pdfFile) return
            const body = new FormData()
            body.append("file", pdfFile)
            const res = await fetch(`/api/admin/lists/${listId}/pdf`, { method: "POST", body })
            if (!res.ok) throw new Error("Falha no upload do PDF")
        }
```

No ramo de edição (`if (list) { ... }`), após `await updateList(list.id, payload)` e antes do `toast.success(...)`:

```ts
                await uploadPdf(list.id)
```

No ramo de criação, após `const newList = await createList(payload)` (linha ~212), adicionar:

```ts
                await uploadPdf(newList.id)
```

- [ ] **Step 4: Incluir `introduction`/`language` no payload**

Em `onSubmit`, no objeto `payload` (linhas ~194-199), adicionar após `...data`:

```ts
                introduction: data.introduction || undefined,
                language: data.language || undefined,
```

(`...data` já traz os campos; estas linhas normalizam string vazia para `undefined`.)

- [ ] **Step 5: Adicionar o card de Idioma + Introdução no JSX**

No card "Informações Básicas", após o bloco de `description` (o `<div className="space-y-2">` do textarea de descrição, ~linha 385), adicionar:

```tsx
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="language">Idioma da lista</Label>
                                <Select
                                    value={form.watch("language")}
                                    onValueChange={(value) => form.setValue("language", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o idioma" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LIST_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                <span className="flex items-center gap-2">
                                                    <FlagIcon code={lang.flagCode} size="sm" />
                                                    {lang.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="introduction">Introdução</Label>
                            <Textarea
                                id="introduction"
                                placeholder="Texto de introdução ao estudo de mercado..."
                                rows={6}
                                {...form.register("introduction")}
                            />
                        </div>
```

- [ ] **Step 6: Adicionar o card de upload do PDF**

Após o card "Importar Leads" (o `</Card>` que fecha na ~linha 629), inserir um card novo:

```tsx
                {/* Card: Estudo de mercado (PDF) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Estudo de mercado (PDF)
                        </CardTitle>
                        <CardDescription>
                            Este é o arquivo que o comprador vai baixar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input
                            id="studyPdf"
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null
                                setPdfFile(file)
                                if (file) setPdfName(file.name)
                            }}
                        />
                        {pdfName && (
                            <p className="text-sm text-muted-foreground">
                                Arquivo atual: <span className="font-medium">{pdfName}</span>
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Formato: PDF. Máximo 50MB.
                        </p>
                    </CardContent>
                </Card>
```

- [ ] **Step 7: Ajustar a serialização que alimenta o form (se necessário)**

Run: `npx tsc --noEmit`
Expected: pode FALHAR se a página que monta `SerializedLeadList` não incluir os novos campos. Se falhar, abrir o arquivo apontado (provavelmente `app/super-admin/marketplace/lists/[id]/edit` ou a `page.tsx` que renderiza `<ListForm list={...} />`) e garantir que o objeto passado inclua `introduction`, `language`, `studyPdfUrl`, `studyPdfName` (o objeto Prisma já os tem; normalmente é só remover um `select` restritivo ou nada a fazer). Repetir `npx tsc --noEmit` até PASS.

- [ ] **Step 8: Verificar no navegador**

Abrir o preview (dev server), ir a super-admin → marketplace → nova lista. Confirmar: seletor de idioma com bandeiras, textarea de introdução, campo de upload de PDF. Criar uma lista com PDF e conferir toast de sucesso.

- [ ] **Step 9: Commit**

```bash
git add components/admin/list-form.tsx app/super-admin/marketplace/lists
git commit -m "feat(admin): idioma, introdução e upload de PDF no form da lista"
```

---

### Task 7: i18n — novas chaves e ajuste de cópia (7 arquivos)

**Files:**
- Modify: `messages/pt.json`, `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/es.json`, `messages/it.json`, `messages/nl.json`

**Interfaces:**
- Produces: chaves `catalog.statCountriesOnPage`, `listing.introductionTitle`, `listing.quickLanguage`, `listing.fieldLanguage`; cópia ajustada em `catalog.trustDownloadDesc`, `listing.includedFormats`, `cart.formats`, e renomeação `purchases.guidanceExcelTitle/Text` → `guidancePdfTitle/Text`.

- [ ] **Step 1: Adicionar/editar as chaves em cada arquivo**

Aplicar, em cada `messages/<lang>.json`, os valores da tabela abaixo. Adicionar as chaves novas nos namespaces indicados e substituir o texto das chaves editadas. Para `purchases`, **renomear** `guidanceExcelTitle`→`guidancePdfTitle` e `guidanceExcelText`→`guidancePdfText` (a página é atualizada na Task 8).

| Chave | pt | en | de | fr | es | it | nl |
|---|---|---|---|---|---|---|---|
| `catalog.statCountriesOnPage` | Países nesta página | Countries on this page | Länder auf dieser Seite | Pays sur cette page | Países en esta página | Paesi in questa pagina | Landen op deze pagina |
| `catalog.trustDownloadDesc` | Acesse o PDF do estudo assim que o pagamento for confirmado. | Get the study PDF as soon as payment is confirmed. | Erhalten Sie das Studien-PDF, sobald die Zahlung bestätigt ist. | Accédez au PDF de l'étude dès que le paiement est confirmé. | Accede al PDF del estudio en cuanto se confirme el pago. | Scarica il PDF dello studio non appena il pagamento è confermato. | Ontvang de studie-PDF zodra de betaling is bevestigd. |
| `listing.introductionTitle` | Introdução | Introduction | Einführung | Introduction | Introducción | Introduzione | Inleiding |
| `listing.quickLanguage` | Idioma | Language | Sprache | Langue | Idioma | Lingua | Taal |
| `listing.fieldLanguage` | Idioma | Language | Sprache | Langue | Idioma | Lingua | Taal |
| `listing.includedFormats` | Estudo em PDF | PDF study | Studie als PDF | Étude en PDF | Estudio en PDF | Studio in PDF | Studie in pdf |
| `cart.formats` | PDF | PDF | PDF | PDF | PDF | PDF | PDF |
| `purchases.guidancePdfTitle` | Baixe o PDF | Download the PDF | PDF herunterladen | Télécharger le PDF | Descarga el PDF | Scarica il PDF | Download de pdf |
| `purchases.guidancePdfText` | Baixe o estudo de mercado em PDF e use como referência na sua prospecção. | Download the market study PDF and use it as a reference for your outreach. | Laden Sie die Marktstudie als PDF herunter und nutzen Sie sie für Ihre Akquise. | Téléchargez l'étude de marché en PDF et utilisez-la pour votre prospection. | Descarga el estudio de mercado en PDF y úsalo como referencia en tu prospección. | Scarica lo studio di mercato in PDF e usalo come riferimento per la tua attività. | Download het marktonderzoek als pdf en gebruik het voor je prospச்ie. |

> Corrigir a última célula NL para: `Download het marktonderzoek als pdf en gebruik het als referentie voor je prospectie.`

- [ ] **Step 2: Validar JSON**

Run: `node -e "['pt','en','de','fr','es','it','nl'].forEach(l=>require('./messages/'+l+'.json'))" && echo OK`
Expected: `OK` (nenhum arquivo quebrado).

- [ ] **Step 3: Commit**

```bash
git add messages
git commit -m "i18n(marketplace): chaves de idioma, introdução e cópia PDF"
```

---

### Task 8: Comprador — botão único de PDF e cópia em my-purchases

**Files:**
- Modify: `components/marketplace/public-purchase-card.tsx`
- Modify: `app/[locale]/my-purchases/page.tsx`
- Create: `app/api/purchases/[id]/download-pdf/route.ts`

**Interfaces:**
- Consumes: `createStudySignedUrl` (`@/lib/supabase/list-studies`), `getAuthenticatedUserId` (`@/lib/auth`), `prisma`.
- Produces: `GET /api/purchases/:id/download-pdf` → redirect 302 para signed URL, ou 404 se a lista não tiver PDF.

- [ ] **Step 1: Criar a rota de download do PDF**

Create `app/api/purchases/[id]/download-pdf/route.ts`:

```ts
// app/api/purchases/[id]/download-pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUserId } from "@/lib/auth"
import { createStudySignedUrl } from "@/lib/supabase/list-studies"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const item = await prisma.purchaseItem.findFirst({
            where: { id, purchase: { userId } },
            include: { list: { select: { studyPdfUrl: true } } },
        })

        if (!item) {
            return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 })
        }
        if (!item.list.studyPdfUrl) {
            return NextResponse.json({ error: "Esta lista ainda não tem PDF disponível" }, { status: 404 })
        }

        await prisma.purchaseItem.update({
            where: { id },
            data: { downloadCount: { increment: 1 }, downloadedAt: new Date() },
        })

        const signedUrl = await createStudySignedUrl(item.list.studyPdfUrl)
        return NextResponse.redirect(signedUrl)
    } catch (error) {
        console.error("Error downloading study PDF:", error)
        return NextResponse.json({ error: "Falha no download" }, { status: 500 })
    }
}
```

- [ ] **Step 2: Trocar os botões CSV/Excel por PDF no card de compra**

Em `components/marketplace/public-purchase-card.tsx`:

Substituir a função `downloadFile` (linhas ~52-73) por:

```tsx
    const downloadPdf = (itemId: string) => {
        window.open(`/api/purchases/${itemId}/download-pdf`, "_blank")
    }
```

Substituir `handleDownload` (linhas ~75-87) por:

```tsx
    const handleDownload = (itemId: string) => {
        setDownloading(itemId)
        try {
            downloadPdf(itemId)
            toast.success("Download do PDF iniciado!")
        } catch (error) {
            toast.error("Erro ao fazer download")
            console.error(error)
        } finally {
            setDownloading(null)
        }
    }
```

Substituir `handleDownloadAll` (linhas ~89-105) por:

```tsx
    const handleDownloadAll = () => {
        setDownloading("all")
        try {
            for (const item of purchase.items) {
                downloadPdf(item.id)
            }
            toast.success("Downloads iniciados!")
        } catch (error) {
            toast.error("Erro ao fazer downloads")
            console.error(error)
        } finally {
            setDownloading(null)
        }
    }
```

Substituir o bloco dos dois botões por item (o `<div className="grid grid-cols-2 gap-2">...</div>`, linhas ~173-216) por um único botão:

```tsx
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDownload(item.id)
                                        }}
                                        disabled={downloading !== null}
                                    >
                                        <Download className={`h-4 w-4 ${downloading === item.id ? "animate-spin" : ""}`} />
                                        Baixar PDF
                                    </Button>
```

Substituir o bloco de botões "Baixar tudo" (o `{purchase.items.length > 1 && (...)}`, linhas ~222-259) por:

```tsx
                    {purchase.items.length > 1 && (
                        <div className="mt-4">
                            <Button
                                className="bg-brand hover:bg-brand-hover"
                                onClick={() => handleDownloadAll()}
                                disabled={downloading !== null}
                            >
                                <Download className={`h-4 w-4 ${downloading === "all" ? "animate-spin" : ""}`} />
                                Baixar tudo (PDF)
                            </Button>
                        </div>
                    )}
```

- [ ] **Step 3: Atualizar a orientação em my-purchases**

Em `app/[locale]/my-purchases/page.tsx`, no `GuidanceItem` que usa `guidanceExcelTitle`/`guidanceExcelText` (linhas ~181-185), trocar as chaves:

```tsx
                                <GuidanceItem
                                    icon={FileDown}
                                    title={t("guidancePdfTitle")}
                                    text={t("guidancePdfText")}
                                />
```

- [ ] **Step 4: Verificar tipos e navegador**

Run: `npx tsc --noEmit`
Expected: PASS.

Verificar no navegador: em Minhas compras, cada item mostra só "Baixar PDF"; clicar abre o PDF (com uma lista que tenha PDF) ou toast/erro amigável (sem PDF).

- [ ] **Step 5: Commit**

```bash
git add components/marketplace/public-purchase-card.tsx app/[locale]/my-purchases/page.tsx app/api/purchases/[id]/download-pdf
git commit -m "feat(marketplace): entrega da lista em PDF ao comprador"
```

---

### Task 9: Card do catálogo — remover métricas de lead, mostrar idioma

**Files:**
- Modify: `components/marketplace/list-card.tsx`

**Interfaces:**
- Consumes: `getListLanguage` (`@/lib/constants/list-languages`), `FlagIcon` (já importado).
- Produces: `MarketplaceListCardData` ganha `language: string | null`.

- [ ] **Step 1: Adicionar `language` ao tipo do card**

Em `components/marketplace/list-card.tsx`, na interface `MarketplaceListCardData` (após `industries: string[]`), adicionar:

```ts
    language: string | null
```

- [ ] **Step 2: Remover o cálculo de preço por lead**

Remover a linha (~47):

```ts
    const pricePerLead = list.totalLeads > 0 ? list.price / list.totalLeads : 0
```

Importar o helper no topo:

```ts
import { getListLanguage } from "@/lib/constants/list-languages"
```

E após `const { addItem } = useCart()`, adicionar:

```ts
    const language = getListLanguage(list.language)
```

- [ ] **Step 3: Remover a linha "X empresas"**

Remover o bloco (linhas ~103-106):

```tsx
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{t("companies", { count: list.totalLeads })}</span>
                        </div>
```

Se `Building2` ficar sem uso, remover do import de `lucide-react`.

- [ ] **Step 4: Mostrar a bandeira do idioma**

No cabeçalho do card, dentro do `<div className="flex items-center gap-1">` que lista as bandeiras de país (após o bloco `{list.countries.length > 3 && ...}`, ~linha 97), adicionar:

```tsx
                            {language && (
                                <span className="ml-1 flex items-center" title={language.label}>
                                    <FlagIcon code={language.flagCode} size="sm" className="shadow-sm ring-1 ring-brand-accent/40" />
                                </span>
                            )}
```

- [ ] **Step 5: Remover o "valor por lead" do rodapé**

Remover o bloco (linhas ~145-147):

```tsx
                            <div className="text-xs text-muted-foreground">
                                {t("perLead", { price: formatCurrency(pricePerLead, list.currency) })}
                            </div>
```

- [ ] **Step 6: Verificar tipos e navegador**

Run: `npx tsc --noEmit`
Expected: PASS.

Verificar no catálogo: card sem "X empresas" e sem "por lead"; bandeira do idioma ao lado das bandeiras de país.

- [ ] **Step 7: Commit**

```bash
git add components/marketplace/list-card.tsx
git commit -m "feat(catalog): card sem métricas de lead e com bandeira de idioma"
```

---

### Task 10: Resumo do catálogo — países em vez de leads

**Files:**
- Modify: `components/marketplace/catalog-stats.tsx`
- Modify: `app/[locale]/catalog/page.tsx`

**Interfaces:**
- Consumes: `catalog.statCountriesOnPage` (Task 7).
- Produces: `CatalogStats` recebe `visibleCountryTotal: number` em vez de `visibleLeadTotal`.

- [ ] **Step 1: Trocar a prop no componente**

Em `components/marketplace/catalog-stats.tsx`:

Na interface `CatalogStatsProps`, trocar `visibleLeadTotal: number` por `visibleCountryTotal: number`.

Na desestruturação do componente, trocar `visibleLeadTotal` por `visibleCountryTotal`.

No array `stats`, no segundo item, trocar:

```tsx
        {
            icon: Globe,
            value: visibleCountryTotal.toLocaleString(),
            label: t("statCountriesOnPage"),
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
```

Trocar o import de ícone: substituir `FileDown` por `Globe` no import de `lucide-react` (`import { Building2, Filter, Globe, Layers3 } from "lucide-react"`).

- [ ] **Step 2: Calcular o total de países na página do catálogo**

Em `app/[locale]/catalog/page.tsx`, substituir a linha (~77):

```ts
    const visibleLeadTotal = lists.reduce((sum, list) => sum + list.totalLeads, 0)
```

por:

```ts
    const visibleCountryTotal = new Set(lists.flatMap((list) => list.countries)).size
```

E no `<CatalogStats ... />` (linha ~167-173), trocar a prop `visibleLeadTotal={visibleLeadTotal}` por `visibleCountryTotal={visibleCountryTotal}`.

- [ ] **Step 3: Verificar tipos e navegador**

Run: `npx tsc --noEmit`
Expected: PASS.

Verificar no catálogo: segundo card do resumo mostra "Países nesta página" com a contagem de países distintos.

- [ ] **Step 4: Commit**

```bash
git add components/marketplace/catalog-stats.tsx app/[locale]/catalog/page.tsx
git commit -m "feat(catalog): resumo mostra países em vez de leads"
```

---

### Task 11: Página de detalhe — remover números, mostrar introdução e idioma

**Files:**
- Modify: `app/[locale]/list/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getListLanguage` (`@/lib/constants/list-languages`), `FlagIcon`, chaves `listing.quickLanguage`, `listing.fieldLanguage`, `listing.introductionTitle` (Task 7).

- [ ] **Step 1: Remover o cálculo de preço por lead**

Remover a linha (~69):

```ts
    const pricePerLead = list.totalLeads > 0 ? price / list.totalLeads : 0
```

Importar no topo:

```ts
import { getListLanguage } from "@/lib/constants/list-languages"
import { FlagIcon } from "@/components/ui/flag-icon"
```

Após `const updatedAt = ...`, adicionar:

```ts
    const language = getListLanguage(list.language)
```

- [ ] **Step 2: Ajustar os QuickMetric (grade do topo)**

Substituir a grade (linhas ~124-129):

```tsx
                            <div className="grid grid-cols-2 gap-3">
                                <QuickMetric label={t("quickLeads")} value={format.number(list.totalLeads)} />
                                <QuickMetric label={t("quickPricePerLead")} value={formatCurrency(pricePerLead, list.currency)} />
                                <QuickMetric label={t("quickCountries")} value={format.number(list.countries.length)} />
                                <QuickMetric label={t("quickUpdated")} value={updatedAt} />
                            </div>
```

por:

```tsx
                            <div className="grid grid-cols-2 gap-3">
                                <QuickMetric label={t("quickCountries")} value={format.number(list.countries.length)} />
                                <QuickMetric label={t("quickLanguage")} value={language?.label ?? t("notInformed")} />
                                <QuickMetric label={t("quickUpdated")} value={updatedAt} />
                            </div>
```

- [ ] **Step 3: Adicionar a introdução abaixo da descrição**

Após o bloco `{list.description && (...)}` (linha ~116-120), adicionar:

```tsx
                            {list.introduction && (
                                <div className="mt-6">
                                    <h2 className="text-lg font-semibold text-foreground">{t("introductionTitle")}</h2>
                                    <p className="mt-2 max-w-2xl whitespace-pre-line text-sm text-muted-foreground">
                                        {list.introduction}
                                    </p>
                                </div>
                            )}
```

- [ ] **Step 4: Ajustar a seção "Cobertura da lista"**

Substituir a grade de `DataItem` (linhas ~144-151) por (removendo total de leads e preço/lead, adicionando idioma):

```tsx
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DataItem label={t("fieldName")} value={list.name} icon={Building2} fallback={t("notInformed")} />
                            <DataItem label={t("fieldCountries")} value={list.countries.join(", ")} icon={Globe} fallback={t("notInformed")} />
                            <DataItem label={t("fieldLanguage")} value={language?.label ?? ""} icon={Globe} fallback={t("notInformed")} />
                            <DataItem label={t("fieldIndustries")} value={list.industries.join(", ")} icon={Target} fallback={t("notInformed")} />
                            <DataItem label={t("fieldUpdatedAt")} value={updatedAt} icon={Calendar} fallback={t("notInformed")} />
                        </div>
```

- [ ] **Step 5: Remover "por lead" e "leads incluídos" da aside de preço**

Remover o bloco (linhas ~185-187):

```tsx
                            <div className="mt-1 text-sm text-muted-foreground">
                                {t("perLead", { price: formatCurrency(pricePerLead, list.currency) })}
                            </div>
```

Substituir o bloco "leads incluídos" (linhas ~190-195) por (mantendo a nota de compra avulsa, sem contagem):

```tsx
                        <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                            <p>{t("oneOffNote")}</p>
                        </div>
```

- [ ] **Step 6: Limpar imports não usados**

Se `DollarSign` e `Users` ficarem sem uso após as remoções, retirá-los do import de `lucide-react`. Confirmar com `npx tsc --noEmit` e `npm run lint`.

- [ ] **Step 7: Verificar tipos, lint e navegador**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

Verificar no detalhe da lista: sem "Total de leads"/"Preço por lead"/"por lead"/"X leads incluídos"; com introdução e idioma (bandeira/label).

- [ ] **Step 8: Commit**

```bash
git add "app/[locale]/list/[slug]/page.tsx"
git commit -m "feat(listing): detalhe sem métricas de lead, com introdução e idioma"
```

---

### Task 12: Verificação final e limpeza

**Files:**
- Nenhum novo; verificação de ponta a ponta.

- [ ] **Step 1: Suite de testes**

Run: `npm run test`
Expected: PASS (inclui `list-languages` e `list-studies`).

- [ ] **Step 2: Typecheck + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3: Fluxo manual completo (navegador)**

1. Admin: criar lista com idioma + introdução + PDF; editar e trocar o PDF.
2. Catálogo: card sem métricas de lead, com bandeira de idioma; resumo com "Países nesta página".
3. Detalhe: introdução + idioma; sem números de lead/preço-por-lead.
4. Comprador (Minhas compras): botão único "Baixar PDF" abre o arquivo; lista sem PDF mostra erro amigável.

- [ ] **Step 4: Commit final (se houver ajustes)**

```bash
git add -A
git commit -m "chore(marketplace): ajustes finais do fluxo de listas em PDF"
```

---

## Self-review (cobertura do spec)

- Schema (`introduction`, `language`, `studyPdfUrl`, `studyPdfName`) → Task 1. ✔
- Storage privado + helpers + env service-role → Task 3 (+ setup manual do bucket/env documentado). ✔
- Upload admin server-side → Task 5; UI do form → Task 6. ✔
- Persistência de introdução/idioma → Task 4. ✔
- Idioma (constante + bandeira, PT→BR) → Task 2, usado em Tasks 6/9/11. ✔
- Introdução no detalhe → Task 11. ✔
- Entrega só PDF + rotas CSV/Excel mantidas sem uso → Task 8. ✔
- Remoção de nº de leads e valor/lead (card, resumo do catálogo, detalhe) → Tasks 9/10/11. ✔
- i18n (7 arquivos) + ajuste ".csv/.xlsx" → Task 7. ✔
- Fora de escopo (geração de PDF, remoção de leads, moeda/termos) → não tocado. ✔
