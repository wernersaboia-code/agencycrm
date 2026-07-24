# Task 9 report — Impedir publicar/vender lista sem estudo em PDF

Nota: este arquivo continha anteriormente o relatório de outra tarefa ("Card do catálogo — remover
métricas de lead, mostrar idioma") de um run de SDD anterior sob o mesmo número de task. Substituído
pelo relatório desta tarefa conforme instruído no brief.

## Helper (TDD)

`lib/marketplace/list-publishing.ts` — `canPublishList(list: { studyPdfUrl: string | null })`.

RED → GREEN evidence:
- Wrote `lib/marketplace/list-publishing.test.ts` (3 cases from the brief) before the implementation existed.
  `npm test -- list-publishing` failed with `Cannot find module './list-publishing'` (RED, no tests collected).
- Implemented `canPublishList` exactly as specified in the brief (trims `studyPdfUrl`, rejects null/blank, returns
  pt-BR reason `"Anexe o estudo de mercado em PDF antes de publicar a lista."`).
- Reran: `npm test -- list-publishing` → 3/3 passed (GREEN).

## Where the gate is enforced

`actions/admin/lists.ts` (`requireAdmin()` kept as the first statement everywhere, untouched):

- **`toggleListActive`**: when `isActive === true`, loads the list's current `studyPdfUrl` and calls
  `canPublishList`; throws `new Error(check.reason)` before the `prisma.leadList.update` if it refuses.
- **`updateList`**: when `validated.isActive === true`, loads the list's *current* `studyPdfUrl` from the DB
  (the update payload never carries `studyPdfUrl` — that field is only ever written by the separate PDF upload
  route) and runs the same gate before writing.
- **`createList`**: see sequencing decision below — always creates with `isActive: false`, so no gate check is
  needed at creation time (a brand-new list literally cannot have a PDF yet).

No existing `recordAudit` calls lived in these three functions, so none were added or removed — nothing to
preserve/break there. All existing `revalidatePath` calls are untouched.

## `createList` sequencing decision

The admin flow (`components/admin/list-form.tsx`) creates a list first, then uploads the PDF to
`/api/admin/lists/[id]/pdf` (which needs the list's id). So at the moment `createList` runs, `studyPdfUrl` is
always `null` — enforcing the gate inside `createList` itself would make it **impossible to ever create an
active list**, even with a PDF selected, which is more disruptive than intended.

Chosen approach (the brief's suggested fallback): `createList` now **always writes `isActive: false`**
regardless of what the client sent. The admin then activates the list explicitly afterward (via the edit form
→ `updateList`, or the list table's toggle → `toggleListActive`), at which point the gate runs against the
now-uploaded `studyPdfUrl` and passes normally. This keeps `createList` simple (no exception-throwing on a path
that would always fail) and reuses the same gate for the real activation moment.

To make this good UX rather than a silent trap, `components/admin/list-form.tsx` was also updated:
- The "Lista Ativa" switch's helper text now says, in create mode, "Novas listas são criadas inativas — anexe
  o PDF e ative na edição."
- After a successful create where the admin had the switch on, a `toast.info` explains the list was created
  inactive and needs an explicit activation once the PDF is attached.
- For the **edit** flow, the client now uploads the PDF *before* calling `updateList` (previously it was
  update-then-upload). This avoids a same-submission race: an admin attaching a PDF and flipping "Lista Ativa"
  on in the same save now gets the PDF persisted first, so the server-side gate (reading DB state) sees it and
  the save succeeds in one step instead of requiring a second save.

## UI feedback

`components/admin/list-form.tsx`:
- Imports the same `canPublishList` helper (pure, no server-only deps) to reuse its exact reason text
  client-side rather than inventing new copy.
- In edit mode, if "Lista Ativa" is checked and the effective PDF state (existing `studyPdfUrl`, or a
  newly-selected `pdfFile` counted as satisfying it) fails the check, an inline `text-destructive` message with
  `check.reason` renders under the switch.
- `onSubmit` also runs the same check up front (edit mode only) and short-circuits with `toast.error(check.reason)`
  before hitting the server, so the admin isn't surprised by a round-trip failure.
- The catch block was changed from a hardcoded `"Erro ao salvar lista"` toast to surfacing `error.message`
  (falls back to the generic string if the error has no message), so the server-thrown `canPublishList` reason
  (from `toggleListActive`/`updateList`) reaches the admin verbatim instead of being swallowed.

## Verification

- `npx tsc --noEmit` → clean, no output.
- `npx eslint actions/admin/lists.ts components/admin/list-form.tsx lib/marketplace/list-publishing.ts lib/marketplace/list-publishing.test.ts` → clean, no output.
- `npm test` → 49 test files, 260 tests, all passed.

## Files changed

- `lib/marketplace/list-publishing.ts` (new)
- `lib/marketplace/list-publishing.test.ts` (new)
- `actions/admin/lists.ts` (modified: `createList`, `updateList`, `toggleListActive`)
- `components/admin/list-form.tsx` (modified: submit sequencing, gate reuse, copy)

## Concerns

- **Public catalogue/checkout untouched by design** (per task scope) — the gate only prevents *newly*
  activating a list without a PDF going forward. It does not retroactively hide/deactivate anything.
- **Existing data checked, read-only**: queried the current database for `isActive = true` lists with
  `studyPdfUrl` null or empty — **0 rows found**. So as of this task there are no already-active PDF-less lists
  in the data that this change leaves stranded. (Query was read-only via a throwaway script, deleted after.)
- `toggleListActive` and `updateList` now throw a plain `Error` on refusal; confirmed the existing callers
  (`list-form.tsx`'s `onSubmit`, and the super-admin lists table's toggle handler) already wrap these calls in
  `try/catch`, so this doesn't produce an unhandled rejection. I did not touch the lists-table toggle UI beyond
  what its existing catch already does, since the brief scoped UI feedback to `list-form.tsx` only — if that
  table shows a generic error instead of the thrown message, that's a possible follow-up outside this task.
