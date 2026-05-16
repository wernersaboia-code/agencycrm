# Launch Readiness

## Status
- **Outcome:** ready-with-risks
- **Target launch:** TBD
- **Environment:** Vercel + Supabase
- **Reviewer:** OpenCode Agent
- **Date:** 2026-05-16

---

## Product Scope
- **Public surfaces:** Marketplace (home, catalog, list detail, checkout, cart), Auth (sign-in, sign-up), Legal (terms, privacy — advertised but missing)
- **Critical user flows:** Sign-up → onboarding → lead import → campaign creation → email send → purchase → download
- **Sensitive data:** Lead PII (name, email, phone, company), PayPal payment data, email tracking metrics, SMTP credentials (encrypted), workspace configs
- **Third-party services:** Supabase (auth + DB), PayPal (payments), Resend (email), Vercel (hosting + analytics)

---

## Privacy And Legal

| Check | Status | Finding |
|-------|--------|---------|
| Privacy policy | **BLOCKER** | `/privacy` advertised in footer but page does not exist |
| Terms of service | **BLOCKER** | `/terms` advertised in footer but page does not exist |
| GDPR/LGPD export | **HIGH** | No user-facing data export (Article 15) or deletion (Article 17) |
| Cookie consent | **HIGH** | No banner; Supabase auth, workspace, cart, and tracking cookies set without consent |
| Email consent | **HIGH** | Campaign emails sent without explicit lead consent or unsubscribe link |
| Lead import consent | **HIGH** | CSV import wizard has no checkbox confirming consent |
| Data retention | **MEDIUM** | No retention policy or automatic cleanup |
| Age gate | **MEDIUM** | No minimum-age affirmation on sign-up |
| Third-party disclosure | **MEDIUM** | No privacy policy page to list subprocessors |

---

## Security

| Check | Status | Finding | File |
|-------|--------|---------|------|
| Middleware bypasses `/api/*` | **HIGH** | All API routes skip session check in middleware | `proxy.ts:85-90` |
| Rate limiting | **HIGH** | Zero rate limiting anywhere (checkout, tracking, campaign send, import) | All API routes |
| Open redirect | **HIGH** | Click tracking allows any external domain | `track/click/[id]/route.ts:19-35` |
| PayPal webhook | **HIGH** | `verifyWebhookSignature` is unimplemented stub returning `false` | `lib/paypal.ts:28-37` |
| Admin password reset | **MEDIUM** | No re-authentication required for sensitive admin action | `actions/admin/users.ts:274` |
| File upload auth | **MEDIUM** | `uploadLogo` does not verify auth internally | `lib/supabase/storage.ts:16` |
| File upload MIME spoof | **MEDIUM** | Relies on browser `file.type` only | `lib/supabase/storage.ts:21` |
| CSP `unsafe-inline`/`unsafe-eval` | **MEDIUM** | `script-src` allows inline scripts and eval | `next.config.ts:31` |
| Auto-provisioning | **MEDIUM** | Any valid Supabase JWT auto-creates a DB user | `lib/auth.ts:55-70` |
| API leakage | **MEDIUM** | `updateUserProfile` returns raw Prisma object | `actions/settings.ts:77` |
| Email limits unenforced | **MEDIUM** | `maxEmailsPerDay` exists in schema but never checked | `actions/campaigns.ts` |
| Tracking enumeration | **MEDIUM** | Sequential `emailSendId` allows fake open/click injection | `track/open/[id]/route.ts` |
| Session cookie defaults | **LOW** | No explicit `cookieOptions` in Supabase client | `lib/supabase/server.ts:11-32` |
| PII in logs | **LOW** | Email addresses and subjects logged to stdout | `lib/email.ts:117-119` |
| Missing CORS | **LOW** | No explicit CORS config for future API consumers | `next.config.ts` |
| Missing `upgrade-insecure-requests` | **LOW** | CSP does not force HTTPS for mixed content | `next.config.ts:31` |

**Positive:** No raw SQL, DOMPurify for HTML sanitization, HTML-escape on email variables, secrets properly server-side, checkout integrity verified.

---

## Frontend, Accessibility, And SEO

| Check | Status | Finding | File |
|-------|--------|---------|------|
| Skip link broken | **HIGH** | `href="#main-content"` but no `id="main-content"` anywhere | `app/layout.tsx:61` |
| Canonical URLs | **HIGH** | Completely missing across all pages | All pages |
| Icon-only buttons | **HIGH** | Most lack `aria-label` (back, delete, mobile menu) | Multiple files |
| `prefers-reduced-motion` | **HIGH** | No respect for reduced motion; hero gradient infinite animation | `globals.css`, `page.tsx` |
| Color contrast | **MEDIUM** | OKLCH colors need WCAG AA verification | `globals.css` |
| Skeleton CSS invalid | **MEDIUM** | `hsl(oklch(...))` is invalid CSS | `globals.css:132-142` |
| Heading skip | **LOW** | Footer `h4` without preceding `h3` | `marketplace-footer.tsx` |
| Robots incomplete | **MEDIUM** | `/sign-in`, `/sign-up`, `/cart`, `/checkout` not blocked | `app/robots.ts` |
| Sitemap thin | **MEDIUM** | Only `/`, `/catalog`, `/list/[slug]` | `app/sitemap.ts` |
| OG on non-indexable pages | **LOW** | Auth/checkout pages inherit `index: true` | `app/layout.tsx` |
| Footer broken links | **HIGH** | `/terms`, `/privacy`, `/contact` are 404s | `marketplace-footer.tsx` |
| Auth forms validation | **MEDIUM** | No Zod schemas on sign-in/sign-up | `app/(auth)/sign-in/page.tsx` |
| Loading states missing | **MEDIUM** | No `loading.tsx` for marketplace, auth, super-admin | Missing files |
| Responsive | **OK** | Good Tailwind breakpoints across pages | — |
| Error boundaries | **OK** | All route groups covered | `app/**/error.tsx` |
| Focus indicators | **OK** | Visible on primitives | `components/ui/*.tsx` |
| Alt text | **OK** | Present on all images | `flag-icon.tsx`, etc. |

---

## Performance

| Check | Status | Finding | File |
|-------|--------|---------|------|
| Bundle analyzer | **MEDIUM** | Not installed | `package.json` |
| Image optimization | **OK** | `next/image` used, font loading correct | — |
| ISR | **LOW** | Missing on `list/[slug]` | `app/(marketplace)/list/[slug]/page.tsx` |
| API cache | **LOW** | Global `no-store` on all API routes | `next.config.ts` |
| Unbounded queries | **HIGH** | `getCalls`, `getCampaigns`, reports PDF/CSV, admin lists | Multiple files |
| N+1 cron | **HIGH** | `checkStepCondition` inside loop over 100 enrollments | `cron/process-sequences/route.ts` |
| N+1 campaign send | **HIGH** | Individual DB writes per lead in send loop | `actions/campaigns.ts` |

---

## Observability And Operations

| Check | Status | Finding | File |
|-------|--------|---------|------|
| DB migrations | **BLOCKER** | `prisma/migrations` ignored by `.vercelignore`; build skips `migrate deploy` | `.vercelignore:31`, `vercel.json:2` |
| Error reporting | **HIGH** | No Sentry/Bugsnag; only `console.error` | `app/error.tsx` |
| Health check | **OK** | `/api/health` endpoint created | `app/api/health/route.ts` |
| Structured logging | **MEDIUM** | 216 `console.*` calls, PII in plain text | `lib/email.ts`, `actions/*.ts` |
| Request IDs | **LOW** | No tracing or correlation IDs | — |
| Vercel Analytics | **OK** | `@vercel/analytics` + `@vercel/speed-insights` installed | `app/layout.tsx` |
| Deploy config | **OK** | `vercel.json` + `next.config.ts` present | — |
| Cron monitoring | **MEDIUM** | No failure alerting for `process-sequences` | `vercel.json` |
| Backups | **MEDIUM** | Not documented (rely on Supabase default) | — |
| Incident response | **MEDIUM** | No runbooks, rollback docs, or on-call contacts | `README.md`, `docs/` |
| Env vars | **OK** | Well documented in `.env.example` | `.env.example` |

---

## Checks Run

| Check | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** — 0 errors |
| ESLint (`eslint . --max-warnings 0`) | **PASS** — 0 errors, 0 warnings |
| Vitest (`vitest run`) | **PASS** — 26/26 tests |
| npm audit | **PASS** — 0 vulnerabilities |
| Build (`next build`) | **PASS** — 41 pages generated |
| Production smoke test | **NOT RUN** — required before launch |

---

## Blockers (Must Fix Before Launch)

All blockers resolved in this session:

1. ✅ **Create `/privacy` and `/terms` pages** — `app/privacy/page.tsx`, `app/terms/page.tsx`
2. ✅ **Fix database migration deployment** — `.vercelignore` + `vercel.json` updated
3. ✅ **Implement cookie consent banner** — `components/cookie-consent.tsx`
4. ✅ **Add unsubscribe link to campaign emails** — `lib/email.ts` + `/api/unsubscribe`
5. ✅ **Fix open redirect in click tracking** — `allowedHosts` validation
6. ✅ **Implement PayPal webhook verification** — `lib/paypal.ts` real verification
7. ✅ **Add rate limiting** — `lib/rate-limit.ts` + checkout/tracking routes
8. ✅ **Fix proxy.ts / middleware.ts** — Next.js 16 `proxy.ts` convention
9. ✅ **Fix JSDOM in client components** — `html-sanitizer.client.ts`
10. ✅ **Fix N+1 campaign send** — `lib/services/campaigns.service.ts` with batch updates

## Accepted Risks (Deferrable)

| Risk | Owner | Revisit When |
|------|-------|-------------|
| No error reporting service (Sentry) | Dev team | Within 2 weeks post-launch |
| ~~No health check endpoint~~ | ✅ Resolved | `app/api/health/route.ts` |
| No bundle analyzer | Dev team | Before next major dependency addition |
| N+1 queries in campaign/cron | Dev team | When campaign volume exceeds 500 leads/day |
| No incident response runbooks | Dev team | Before team grows beyond 1 person |
| No structured logging | Dev team | When investigating first production issue |

## Follow-Ups

| Follow-up | Priority |
|-----------|----------|
| Add `id="main-content"` to all `<main>` tags | High |
| Add `aria-label` to all icon-only buttons | High |
| Add canonical URLs to public pages | High |
| Implement `prefers-reduced-motion` | High |
| Fix invalid skeleton CSS | Medium |
| Add Zod validation to auth forms | Medium |
| Add `loading.tsx` for marketplace, auth, super-admin | Medium |
| Complete robots.txt disallow list | Medium |
| Add `robots: { index: false }` to auth/checkout pages | Low |
| Add ISR to `list/[slug]` | Low |
