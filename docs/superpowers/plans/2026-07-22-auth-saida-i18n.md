# Saída e i18n das telas de autenticação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar às telas `/sign-in` e `/sign-up` uma saída (logo clicável para a home) e traduzi-las aos 7 idiomas publicados, sem reintroduzir header e sem mover a auth para dentro de `[locale]`.

**Architecture:** A auth permanece fora de `[locale]`. O idioma chega por `?lang`, resolvido no **server component da página** (layouts não recebem `searchParams`), que carrega `messages/<locale>.json` e envolve o conteúdo num `AuthShell` com `NextIntlClientProvider`. O shell adiciona logo + seletor de idioma. Os formulários viram componentes client que consomem `useTranslations("auth")`.

**Tech Stack:** Next.js 16 (App Router), next-intl, React, Supabase Auth, Tailwind, shadcn/ui, vitest.

## Global Constraints

- **Estilo de código do repo:** 4 espaços de indentação, aspas duplas, **sem ponto e vírgula**.
- **Auth fora de `[locale]`:** usar `next/link` e `next/navigation` puros na auth. **Não** usar os wrappers `LocaleLink`/`@/lib/i18n/navigation` (há `no-restricted-imports` proibindo isso fora do segmento).
- **Locale do provider = locale de mensagens:** sempre `resolveAuthLocale(lang)`; oferecer só `PUBLISHED_LOCALES` no seletor.
- **Preservar params existentes** (`redirect`, `from`) ao acrescentar `lang`.
- **Registro T–V por idioma** (igual aos namespaces já existentes): pt informal (você), en neutro, de formal (Sie/Ihre), fr formal (vous), nl formal (u/uw), it informal (tu), es informal (tú).
- **Nomes próprios verbatim:** `Easy Prospect`, `CRM`, `PayPal`, `CSV`, `Excel`; manter o emoji `🎉`.
- **Locale padrão** é `pt` (`DEFAULT_LOCALE`), sem prefixo — `/` já é a home pt.

---

## File Structure

**Criar:**
- `lib/i18n/auth-locale.ts` — `resolveAuthLocale(lang)` e `withLangParam(search, lang)` (puros).
- `lib/i18n/auth-locale.test.ts` — testes das duas funções.
- `lib/i18n/load-messages.ts` — `loadMessages(locale)` (import dinâmico do JSON).
- `lib/i18n/messages-auth.test.ts` — paridade do namespace `auth` nos 7 locales.
- `components/auth/auth-shell.tsx` — provider + moldura (server).
- `components/auth/auth-brand.tsx` — logo clicável (client).
- `components/auth/auth-locale-switcher.tsx` — seletor `?lang` (client).
- `components/auth/sign-in-form.tsx` — corpo client do sign-in, i18n.
- `components/auth/sign-up-form.tsx` — corpo client do sign-up, i18n.

**Modificar:**
- `messages/pt.json`, `de.json`, `en.json`, `es.json`, `fr.json`, `it.json`, `nl.json` — namespace `auth`.
- `app/(auth)/sign-in/page.tsx` — vira server component.
- `app/(auth)/sign-up/page.tsx` — vira server component.
- `components/marketplace/marketplace-header.tsx`, `marketplace-footer.tsx`, `buy-now-button.tsx`, `components/checkout/paypal-buttons.tsx`, `app/[locale]/checkout/success/page.tsx`, `app/[locale]/my-purchases/page.tsx` — anexar `lang`.

**Inalterado:** `app/(auth)/layout.tsx` (segue só centralizando).

---

## Task 1: Helpers puros de locale da auth

**Files:**
- Create: `lib/i18n/auth-locale.ts`
- Create: `lib/i18n/load-messages.ts`
- Test: `lib/i18n/auth-locale.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_LOCALE`, `isLocale`, `resolveMessagesLocale`, `type Locale` de `@/lib/i18n/locales`.
- Produces:
  - `resolveAuthLocale(lang?: string | null): Locale`
  - `withLangParam(search: string, lang: string): string`
  - `loadMessages(locale: Locale): Promise<AbstractIntlMessages>`

- [ ] **Step 1: Escrever o teste que falha**

Create `lib/i18n/auth-locale.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { resolveAuthLocale, withLangParam } from "./auth-locale"

describe("resolveAuthLocale", () => {
    it("devolve o próprio locale quando publicado", () => {
        expect(resolveAuthLocale("de")).toBe("de")
        expect(resolveAuthLocale("it")).toBe("it")
    })

    it("cai no pt para locale roteável não publicado, desconhecido ou ausente", () => {
        expect(resolveAuthLocale("ar")).toBe("pt")
        expect(resolveAuthLocale("xx")).toBe("pt")
        expect(resolveAuthLocale(undefined)).toBe("pt")
        expect(resolveAuthLocale(null)).toBe("pt")
    })
})

describe("withLangParam", () => {
    it("define lang preservando os demais params", () => {
        const out = withLangParam("redirect=%2Fcheckout&from=marketplace", "de")
        const params = new URLSearchParams(out)
        expect(params.get("redirect")).toBe("/checkout")
        expect(params.get("from")).toBe("marketplace")
        expect(params.get("lang")).toBe("de")
    })

    it("substitui um lang já presente", () => {
        const out = withLangParam("lang=pt&redirect=%2F", "fr")
        const params = new URLSearchParams(out)
        expect(params.get("lang")).toBe("fr")
        expect(params.get("redirect")).toBe("/")
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run lib/i18n/auth-locale.test.ts`
Expected: FAIL — `Cannot find module './auth-locale'`.

- [ ] **Step 3: Implementar os helpers**

Create `lib/i18n/auth-locale.ts`:

```ts
import { DEFAULT_LOCALE, isLocale, resolveMessagesLocale, type Locale } from "@/lib/i18n/locales"

// Locale efetivo da tela de auth a partir do ?lang. A auth vive fora do
// segmento [locale], então o idioma não vem da rota — vem deste parâmetro.
// Reusa resolveMessagesLocale para cair no padrão quando o locale é roteável
// mas ainda não publicado (ver PUBLISHED_LOCALES).
export function resolveAuthLocale(lang?: string | null): Locale {
    const requested = lang && isLocale(lang) ? lang : DEFAULT_LOCALE
    return resolveMessagesLocale(requested)
}

// Query string com `lang` definido, preservando os demais params (redirect,
// from). Usado pelo seletor de idioma da auth e pelos pontos de entrada.
export function withLangParam(search: string, lang: string): string {
    const params = new URLSearchParams(search)
    params.set("lang", lang)
    return params.toString()
}
```

Create `lib/i18n/load-messages.ts`:

```ts
import type { AbstractIntlMessages } from "next-intl"
import type { Locale } from "@/lib/i18n/locales"

// Carrega o pacote de mensagens de um locale publicado. Caminho relativo (não
// alias) para o import dinâmico funcionar no bundler, igual a i18n/request.ts.
export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
    return (await import(`../../messages/${locale}.json`)).default
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run lib/i18n/auth-locale.test.ts`
Expected: PASS (6 assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/auth-locale.ts lib/i18n/load-messages.ts lib/i18n/auth-locale.test.ts
git commit -m "feat(auth): helpers de locale e carregamento de mensagens da auth"
```

---

## Task 2: Namespace `auth` nos 7 idiomas

**Files:**
- Modify: `messages/pt.json`, `messages/de.json`, `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/it.json`, `messages/nl.json`
- Test: `lib/i18n/messages-auth.test.ts`

**Interfaces:**
- Produces: namespace `auth` com as chaves consumidas pelos componentes das Tasks 3–5.

Adicionar o objeto `"auth": { … }` como uma nova chave de topo em cada arquivo (ao lado de `common`, `nav`, etc.). Conteúdo por idioma abaixo.

- [ ] **Step 1: Escrever o teste de paridade que falha**

Create `lib/i18n/messages-auth.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { PUBLISHED_LOCALES } from "./locales"

const REQUIRED_PATHS = [
    "backToHome",
    "language",
    "signIn.mainAccess",
    "signIn.cardDescription",
    "signIn.areas.purchases.title",
    "signIn.areas.admin.button",
    "signIn.areas.crm.shortTitle",
    "signIn.errLinkExpired",
    "signUp.mktTitle",
    "signUp.benefitsTitle",
    "signUp.step3",
]

function get(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key]
        return undefined
    }, obj)
}

describe("namespace auth nos locales publicados", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} tem todas as chaves de auth preenchidas`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            for (const path of REQUIRED_PATHS) {
                const value = get((messages as Record<string, unknown>).auth, path)
                expect(typeof value, `${locale} → auth.${path}`).toBe("string")
                expect((value as string).length, `${locale} → auth.${path}`).toBeGreaterThan(0)
            }
        })
    }
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run lib/i18n/messages-auth.test.ts`
Expected: FAIL — `auth.backToHome` é `undefined` em todos os locales.

- [ ] **Step 3: Adicionar o namespace `auth` em `messages/pt.json`**

```json
    "auth": {
        "backToHome": "Voltar ao início",
        "language": "Idioma",
        "signIn": {
            "chooseHeading": "Escolha para onde entrar",
            "mainAccess": "Acessos principais",
            "chooseHelp": "Suas compras ficam em primeiro, que é o acesso da maioria. A Área Administrativa é restrita a quem opera o sistema.",
            "cardDescription": "Digite seu email e senha para acessar esta área.",
            "emailLabel": "Email",
            "passwordLabel": "Senha",
            "emailPlaceholder": "seu@email.com",
            "passwordPlaceholder": "********",
            "noAccount": "Não tem uma conta?",
            "createAccount": "Criar conta",
            "success": "Login realizado com sucesso!",
            "error": "Erro ao fazer login",
            "errLinkExpired": "Esse link de confirmação expirou ou já foi usado. Entre com sua senha ou peça um novo cadastro.",
            "errLinkInvalid": "Não foi possível validar esse link de confirmação. Tente entrar com sua senha.",
            "errLinkIncomplete": "Esse link de confirmação está incompleto. Abra-o direto do e-mail, sem copiar e colar.",
            "errGeneric": "Não foi possível concluir a confirmação.",
            "areas": {
                "purchases": { "title": "Minhas compras", "shortTitle": "Ver compras", "description": "Listas compradas, pedidos e downloads de arquivos.", "button": "Entrar em Minhas compras" },
                "admin": { "title": "Área Administrativa", "shortTitle": "Área Administrativa", "description": "Gerenciar listas, usuários, vendas e configurações.", "button": "Entrar na Área Administrativa" },
                "crm": { "title": "CRM", "shortTitle": "Entrar no CRM", "description": "Leads, campanhas, chamadas, relatórios e rotina comercial.", "button": "Entrar no CRM" }
            }
        },
        "signUp": {
            "mktTitle": "Criar Conta - Easy Prospect",
            "crmTitle": "Criar conta no CRM",
            "mktSubtitle": "Crie sua conta para acessar suas compras",
            "crmSubtitle": "Preencha os dados abaixo para criar sua conta",
            "nameLabel": "Nome",
            "namePlaceholder": "Seu nome",
            "emailLabel": "Email",
            "emailPlaceholder": "seu@email.com",
            "passwordLabel": "Senha",
            "passwordPlaceholder": "••••••••",
            "submitMkt": "Criar Conta e Continuar",
            "submitCrm": "Criar conta",
            "haveAccount": "Já tem uma conta?",
            "enter": "Entrar",
            "createForPurchases": "← Criar conta para compras",
            "success": "Conta criada com sucesso!",
            "error": "Erro ao criar conta",
            "benefitsTitle": "Benefícios",
            "benefit1": "Acesso vitalício às listas compradas",
            "benefit2": "Downloads ilimitados em CSV e Excel",
            "benefit3": "Arquivos prontos para importar no seu CRM",
            "successTitle": "Conta criada com sucesso! 🎉",
            "verifySent": "Enviamos um email de verificação para:",
            "nextStepsTitle": "Próximos passos",
            "step1": "1. Abra seu e-mail e clique no link de confirmação.",
            "step2Mkt": "2. Você entra direto nas suas compras pelo link.",
            "step2Crm": "2. Você entra direto no CRM pelo link.",
            "step3": "3. Nos próximos acessos, use este e-mail e a senha que acabou de criar.",
            "ctaMkt": "Explorar Catálogo",
            "ctaCrm": "Ir para Dashboard",
            "spamHint": "Não recebeu o email? Verifique a pasta de spam"
        }
    }
```

- [ ] **Step 4: `messages/de.json`** (formal, Sie/Ihre)

```json
    "auth": {
        "backToHome": "Zur Startseite",
        "language": "Sprache",
        "signIn": {
            "chooseHeading": "Wählen Sie Ihren Zugang",
            "mainAccess": "Hauptzugänge",
            "chooseHelp": "Ihre Einkäufe stehen an erster Stelle – der Zugang für die meisten. Der Administrationsbereich ist denjenigen vorbehalten, die das System betreiben.",
            "cardDescription": "Geben Sie E-Mail und Passwort ein, um auf diesen Bereich zuzugreifen.",
            "emailLabel": "E-Mail",
            "passwordLabel": "Passwort",
            "emailPlaceholder": "ihre@email.com",
            "passwordPlaceholder": "********",
            "noAccount": "Noch kein Konto?",
            "createAccount": "Konto erstellen",
            "success": "Anmeldung erfolgreich!",
            "error": "Fehler bei der Anmeldung",
            "errLinkExpired": "Dieser Bestätigungslink ist abgelaufen oder wurde bereits verwendet. Melden Sie sich mit Ihrem Passwort an oder registrieren Sie sich erneut.",
            "errLinkInvalid": "Dieser Bestätigungslink konnte nicht validiert werden. Versuchen Sie, sich mit Ihrem Passwort anzumelden.",
            "errLinkIncomplete": "Dieser Bestätigungslink ist unvollständig. Öffnen Sie ihn direkt aus der E-Mail, ohne ihn zu kopieren.",
            "errGeneric": "Die Bestätigung konnte nicht abgeschlossen werden.",
            "areas": {
                "purchases": { "title": "Meine Einkäufe", "shortTitle": "Einkäufe ansehen", "description": "Gekaufte Listen, Bestellungen und Datei-Downloads.", "button": "Zu Meine Einkäufe" },
                "admin": { "title": "Administrationsbereich", "shortTitle": "Administrationsbereich", "description": "Listen, Nutzer, Verkäufe und Einstellungen verwalten.", "button": "Zum Administrationsbereich" },
                "crm": { "title": "CRM", "shortTitle": "Zum CRM", "description": "Leads, Kampagnen, Anrufe, Berichte und Vertriebsalltag.", "button": "Zum CRM" }
            }
        },
        "signUp": {
            "mktTitle": "Konto erstellen - Easy Prospect",
            "crmTitle": "CRM-Konto erstellen",
            "mktSubtitle": "Erstellen Sie Ihr Konto, um auf Ihre Einkäufe zuzugreifen",
            "crmSubtitle": "Füllen Sie die Felder aus, um Ihr Konto zu erstellen",
            "nameLabel": "Name",
            "namePlaceholder": "Ihr Name",
            "emailLabel": "E-Mail",
            "emailPlaceholder": "ihre@email.com",
            "passwordLabel": "Passwort",
            "passwordPlaceholder": "••••••••",
            "submitMkt": "Konto erstellen und fortfahren",
            "submitCrm": "Konto erstellen",
            "haveAccount": "Sie haben bereits ein Konto?",
            "enter": "Anmelden",
            "createForPurchases": "← Konto für Einkäufe erstellen",
            "success": "Konto erfolgreich erstellt!",
            "error": "Fehler beim Erstellen des Kontos",
            "benefitsTitle": "Vorteile",
            "benefit1": "Lebenslanger Zugriff auf gekaufte Listen",
            "benefit2": "Unbegrenzte Downloads als CSV und Excel",
            "benefit3": "Dateien bereit für den Import in Ihr CRM",
            "successTitle": "Konto erfolgreich erstellt! 🎉",
            "verifySent": "Wir haben eine Bestätigungs-E-Mail gesendet an:",
            "nextStepsTitle": "Nächste Schritte",
            "step1": "1. Öffnen Sie Ihre E-Mail und klicken Sie auf den Bestätigungslink.",
            "step2Mkt": "2. Über den Link gelangen Sie direkt zu Ihren Einkäufen.",
            "step2Crm": "2. Über den Link gelangen Sie direkt ins CRM.",
            "step3": "3. Verwenden Sie bei den nächsten Anmeldungen diese E-Mail und das gerade erstellte Passwort.",
            "ctaMkt": "Katalog entdecken",
            "ctaCrm": "Zum Dashboard",
            "spamHint": "Keine E-Mail erhalten? Prüfen Sie Ihren Spam-Ordner"
        }
    }
```

- [ ] **Step 5: `messages/en.json`** (neutro)

```json
    "auth": {
        "backToHome": "Back to home",
        "language": "Language",
        "signIn": {
            "chooseHeading": "Choose where to sign in",
            "mainAccess": "Main access",
            "chooseHelp": "Your purchases come first — that's where most people go. The Administration Area is restricted to those who operate the system.",
            "cardDescription": "Enter your email and password to access this area.",
            "emailLabel": "Email",
            "passwordLabel": "Password",
            "emailPlaceholder": "you@email.com",
            "passwordPlaceholder": "********",
            "noAccount": "Don't have an account?",
            "createAccount": "Create account",
            "success": "Signed in successfully!",
            "error": "Error signing in",
            "errLinkExpired": "This confirmation link has expired or has already been used. Sign in with your password or request a new registration.",
            "errLinkInvalid": "We couldn't validate this confirmation link. Try signing in with your password.",
            "errLinkIncomplete": "This confirmation link is incomplete. Open it directly from the email, without copying and pasting.",
            "errGeneric": "We couldn't complete the confirmation.",
            "areas": {
                "purchases": { "title": "My purchases", "shortTitle": "View purchases", "description": "Purchased lists, orders and file downloads.", "button": "Go to My purchases" },
                "admin": { "title": "Administration Area", "shortTitle": "Administration Area", "description": "Manage lists, users, sales and settings.", "button": "Go to Administration Area" },
                "crm": { "title": "CRM", "shortTitle": "Go to CRM", "description": "Leads, campaigns, calls, reports and daily sales work.", "button": "Go to CRM" }
            }
        },
        "signUp": {
            "mktTitle": "Create Account - Easy Prospect",
            "crmTitle": "Create a CRM account",
            "mktSubtitle": "Create your account to access your purchases",
            "crmSubtitle": "Fill in the details below to create your account",
            "nameLabel": "Name",
            "namePlaceholder": "Your name",
            "emailLabel": "Email",
            "emailPlaceholder": "you@email.com",
            "passwordLabel": "Password",
            "passwordPlaceholder": "••••••••",
            "submitMkt": "Create Account and Continue",
            "submitCrm": "Create account",
            "haveAccount": "Already have an account?",
            "enter": "Sign in",
            "createForPurchases": "← Create an account for purchases",
            "success": "Account created successfully!",
            "error": "Error creating account",
            "benefitsTitle": "Benefits",
            "benefit1": "Lifetime access to purchased lists",
            "benefit2": "Unlimited downloads in CSV and Excel",
            "benefit3": "Files ready to import into your CRM",
            "successTitle": "Account created successfully! 🎉",
            "verifySent": "We've sent a verification email to:",
            "nextStepsTitle": "Next steps",
            "step1": "1. Open your email and click the confirmation link.",
            "step2Mkt": "2. The link takes you straight to your purchases.",
            "step2Crm": "2. The link takes you straight to the CRM.",
            "step3": "3. For future sign-ins, use this email and the password you just created.",
            "ctaMkt": "Explore Catalog",
            "ctaCrm": "Go to Dashboard",
            "spamHint": "Didn't get the email? Check your spam folder"
        }
    }
```

- [ ] **Step 6: `messages/es.json`** (informal, tú)

```json
    "auth": {
        "backToHome": "Volver al inicio",
        "language": "Idioma",
        "signIn": {
            "chooseHeading": "Elige por dónde entrar",
            "mainAccess": "Accesos principales",
            "chooseHelp": "Tus compras van primero, que es el acceso de la mayoría. El Área Administrativa está restringida a quienes operan el sistema.",
            "cardDescription": "Introduce tu email y contraseña para acceder a esta área.",
            "emailLabel": "Email",
            "passwordLabel": "Contraseña",
            "emailPlaceholder": "tu@email.com",
            "passwordPlaceholder": "********",
            "noAccount": "¿No tienes una cuenta?",
            "createAccount": "Crear cuenta",
            "success": "¡Sesión iniciada correctamente!",
            "error": "Error al iniciar sesión",
            "errLinkExpired": "Este enlace de confirmación ha caducado o ya se ha usado. Inicia sesión con tu contraseña o solicita un nuevo registro.",
            "errLinkInvalid": "No se pudo validar este enlace de confirmación. Intenta iniciar sesión con tu contraseña.",
            "errLinkIncomplete": "Este enlace de confirmación está incompleto. Ábrelo directamente desde el correo, sin copiar y pegar.",
            "errGeneric": "No se pudo completar la confirmación.",
            "areas": {
                "purchases": { "title": "Mis compras", "shortTitle": "Ver compras", "description": "Listas compradas, pedidos y descargas de archivos.", "button": "Entrar en Mis compras" },
                "admin": { "title": "Área Administrativa", "shortTitle": "Área Administrativa", "description": "Gestionar listas, usuarios, ventas y configuración.", "button": "Entrar en el Área Administrativa" },
                "crm": { "title": "CRM", "shortTitle": "Entrar en el CRM", "description": "Leads, campañas, llamadas, informes y rutina comercial.", "button": "Entrar en el CRM" }
            }
        },
        "signUp": {
            "mktTitle": "Crear Cuenta - Easy Prospect",
            "crmTitle": "Crear cuenta en el CRM",
            "mktSubtitle": "Crea tu cuenta para acceder a tus compras",
            "crmSubtitle": "Completa los datos a continuación para crear tu cuenta",
            "nameLabel": "Nombre",
            "namePlaceholder": "Tu nombre",
            "emailLabel": "Email",
            "emailPlaceholder": "tu@email.com",
            "passwordLabel": "Contraseña",
            "passwordPlaceholder": "••••••••",
            "submitMkt": "Crear Cuenta y Continuar",
            "submitCrm": "Crear cuenta",
            "haveAccount": "¿Ya tienes una cuenta?",
            "enter": "Iniciar sesión",
            "createForPurchases": "← Crear cuenta para compras",
            "success": "¡Cuenta creada correctamente!",
            "error": "Error al crear la cuenta",
            "benefitsTitle": "Beneficios",
            "benefit1": "Acceso de por vida a las listas compradas",
            "benefit2": "Descargas ilimitadas en CSV y Excel",
            "benefit3": "Archivos listos para importar en tu CRM",
            "successTitle": "¡Cuenta creada correctamente! 🎉",
            "verifySent": "Hemos enviado un correo de verificación a:",
            "nextStepsTitle": "Próximos pasos",
            "step1": "1. Abre tu correo y haz clic en el enlace de confirmación.",
            "step2Mkt": "2. Con el enlace entras directo a tus compras.",
            "step2Crm": "2. Con el enlace entras directo al CRM.",
            "step3": "3. En los próximos accesos, usa este correo y la contraseña que acabas de crear.",
            "ctaMkt": "Explorar Catálogo",
            "ctaCrm": "Ir al Panel",
            "spamHint": "¿No recibiste el correo? Revisa tu carpeta de spam"
        }
    }
```

- [ ] **Step 7: `messages/fr.json`** (formal, vous)

```json
    "auth": {
        "backToHome": "Retour à l'accueil",
        "language": "Langue",
        "signIn": {
            "chooseHeading": "Choisissez où vous connecter",
            "mainAccess": "Accès principaux",
            "chooseHelp": "Vos achats passent en premier, c'est l'accès de la plupart des utilisateurs. L'Espace administration est réservé à ceux qui gèrent le système.",
            "cardDescription": "Saisissez votre e-mail et votre mot de passe pour accéder à cet espace.",
            "emailLabel": "E-mail",
            "passwordLabel": "Mot de passe",
            "emailPlaceholder": "vous@email.com",
            "passwordPlaceholder": "********",
            "noAccount": "Vous n'avez pas de compte ?",
            "createAccount": "Créer un compte",
            "success": "Connexion réussie !",
            "error": "Erreur de connexion",
            "errLinkExpired": "Ce lien de confirmation a expiré ou a déjà été utilisé. Connectez-vous avec votre mot de passe ou demandez une nouvelle inscription.",
            "errLinkInvalid": "Impossible de valider ce lien de confirmation. Essayez de vous connecter avec votre mot de passe.",
            "errLinkIncomplete": "Ce lien de confirmation est incomplet. Ouvrez-le directement depuis l'e-mail, sans copier-coller.",
            "errGeneric": "Impossible de finaliser la confirmation.",
            "areas": {
                "purchases": { "title": "Mes achats", "shortTitle": "Voir les achats", "description": "Listes achetées, commandes et téléchargements de fichiers.", "button": "Accéder à Mes achats" },
                "admin": { "title": "Espace administration", "shortTitle": "Espace administration", "description": "Gérer les listes, utilisateurs, ventes et paramètres.", "button": "Accéder à l'Espace administration" },
                "crm": { "title": "CRM", "shortTitle": "Accéder au CRM", "description": "Leads, campagnes, appels, rapports et activité commerciale.", "button": "Accéder au CRM" }
            }
        },
        "signUp": {
            "mktTitle": "Créer un compte - Easy Prospect",
            "crmTitle": "Créer un compte CRM",
            "mktSubtitle": "Créez votre compte pour accéder à vos achats",
            "crmSubtitle": "Remplissez les champs ci-dessous pour créer votre compte",
            "nameLabel": "Nom",
            "namePlaceholder": "Votre nom",
            "emailLabel": "E-mail",
            "emailPlaceholder": "vous@email.com",
            "passwordLabel": "Mot de passe",
            "passwordPlaceholder": "••••••••",
            "submitMkt": "Créer un compte et continuer",
            "submitCrm": "Créer un compte",
            "haveAccount": "Vous avez déjà un compte ?",
            "enter": "Se connecter",
            "createForPurchases": "← Créer un compte pour les achats",
            "success": "Compte créé avec succès !",
            "error": "Erreur lors de la création du compte",
            "benefitsTitle": "Avantages",
            "benefit1": "Accès à vie aux listes achetées",
            "benefit2": "Téléchargements illimités en CSV et Excel",
            "benefit3": "Fichiers prêts à importer dans votre CRM",
            "successTitle": "Compte créé avec succès ! 🎉",
            "verifySent": "Nous avons envoyé un e-mail de vérification à :",
            "nextStepsTitle": "Prochaines étapes",
            "step1": "1. Ouvrez votre e-mail et cliquez sur le lien de confirmation.",
            "step2Mkt": "2. Le lien vous amène directement à vos achats.",
            "step2Crm": "2. Le lien vous amène directement au CRM.",
            "step3": "3. Lors de vos prochaines connexions, utilisez cet e-mail et le mot de passe que vous venez de créer.",
            "ctaMkt": "Explorer le catalogue",
            "ctaCrm": "Accéder au tableau de bord",
            "spamHint": "Vous n'avez pas reçu l'e-mail ? Vérifiez votre dossier spam"
        }
    }
```

- [ ] **Step 8: `messages/it.json`** (informal, tu)

```json
    "auth": {
        "backToHome": "Torna all'inizio",
        "language": "Lingua",
        "signIn": {
            "chooseHeading": "Scegli dove entrare",
            "mainAccess": "Accessi principali",
            "chooseHelp": "I tuoi acquisti vengono prima, è l'accesso della maggior parte. L'Area amministrazione è riservata a chi gestisce il sistema.",
            "cardDescription": "Inserisci email e password per accedere a quest'area.",
            "emailLabel": "Email",
            "passwordLabel": "Password",
            "emailPlaceholder": "tua@email.com",
            "passwordPlaceholder": "********",
            "noAccount": "Non hai un account?",
            "createAccount": "Crea account",
            "success": "Accesso effettuato con successo!",
            "error": "Errore durante l'accesso",
            "errLinkExpired": "Questo link di conferma è scaduto o è già stato usato. Accedi con la tua password o richiedi una nuova registrazione.",
            "errLinkInvalid": "Non è stato possibile validare questo link di conferma. Prova ad accedere con la password.",
            "errLinkIncomplete": "Questo link di conferma è incompleto. Aprilo direttamente dall'email, senza copiarlo e incollarlo.",
            "errGeneric": "Non è stato possibile completare la conferma.",
            "areas": {
                "purchases": { "title": "I miei acquisti", "shortTitle": "Vedi acquisti", "description": "Liste acquistate, ordini e download dei file.", "button": "Entra in I miei acquisti" },
                "admin": { "title": "Area amministrazione", "shortTitle": "Area amministrazione", "description": "Gestisci liste, utenti, vendite e impostazioni.", "button": "Entra nell'Area amministrazione" },
                "crm": { "title": "CRM", "shortTitle": "Entra nel CRM", "description": "Lead, campagne, chiamate, report e attività commerciale.", "button": "Entra nel CRM" }
            }
        },
        "signUp": {
            "mktTitle": "Crea account - Easy Prospect",
            "crmTitle": "Crea un account CRM",
            "mktSubtitle": "Crea il tuo account per accedere ai tuoi acquisti",
            "crmSubtitle": "Compila i campi qui sotto per creare il tuo account",
            "nameLabel": "Nome",
            "namePlaceholder": "Il tuo nome",
            "emailLabel": "Email",
            "emailPlaceholder": "tua@email.com",
            "passwordLabel": "Password",
            "passwordPlaceholder": "••••••••",
            "submitMkt": "Crea account e continua",
            "submitCrm": "Crea account",
            "haveAccount": "Hai già un account?",
            "enter": "Accedi",
            "createForPurchases": "← Crea un account per gli acquisti",
            "success": "Account creato con successo!",
            "error": "Errore durante la creazione dell'account",
            "benefitsTitle": "Vantaggi",
            "benefit1": "Accesso a vita alle liste acquistate",
            "benefit2": "Download illimitati in CSV ed Excel",
            "benefit3": "File pronti da importare nel tuo CRM",
            "successTitle": "Account creato con successo! 🎉",
            "verifySent": "Abbiamo inviato un'email di verifica a:",
            "nextStepsTitle": "Prossimi passi",
            "step1": "1. Apri la tua email e clicca sul link di conferma.",
            "step2Mkt": "2. Con il link entri direttamente nei tuoi acquisti.",
            "step2Crm": "2. Con il link entri direttamente nel CRM.",
            "step3": "3. Nei prossimi accessi, usa questa email e la password che hai appena creato.",
            "ctaMkt": "Esplora il catalogo",
            "ctaCrm": "Vai alla Dashboard",
            "spamHint": "Non hai ricevuto l'email? Controlla la cartella spam"
        }
    }
```

- [ ] **Step 9: `messages/nl.json`** (formal, u/uw)

```json
    "auth": {
        "backToHome": "Terug naar start",
        "language": "Taal",
        "signIn": {
            "chooseHeading": "Kies waar u wilt inloggen",
            "mainAccess": "Hoofdtoegang",
            "chooseHelp": "Uw aankopen staan voorop — dat is de toegang voor de meeste mensen. De Beheeromgeving is voorbehouden aan wie het systeem beheert.",
            "cardDescription": "Voer uw e-mail en wachtwoord in om deze omgeving te openen.",
            "emailLabel": "E-mail",
            "passwordLabel": "Wachtwoord",
            "emailPlaceholder": "u@email.com",
            "passwordPlaceholder": "********",
            "noAccount": "Nog geen account?",
            "createAccount": "Account aanmaken",
            "success": "Succesvol ingelogd!",
            "error": "Fout bij het inloggen",
            "errLinkExpired": "Deze bevestigingslink is verlopen of al gebruikt. Log in met uw wachtwoord of vraag een nieuwe registratie aan.",
            "errLinkInvalid": "We konden deze bevestigingslink niet valideren. Probeer in te loggen met uw wachtwoord.",
            "errLinkIncomplete": "Deze bevestigingslink is onvolledig. Open hem rechtstreeks vanuit de e-mail, zonder kopiëren en plakken.",
            "errGeneric": "We konden de bevestiging niet voltooien.",
            "areas": {
                "purchases": { "title": "Mijn aankopen", "shortTitle": "Aankopen bekijken", "description": "Gekochte lijsten, bestellingen en bestand-downloads.", "button": "Naar Mijn aankopen" },
                "admin": { "title": "Beheeromgeving", "shortTitle": "Beheeromgeving", "description": "Lijsten, gebruikers, verkopen en instellingen beheren.", "button": "Naar de Beheeromgeving" },
                "crm": { "title": "CRM", "shortTitle": "Naar het CRM", "description": "Leads, campagnes, gesprekken, rapporten en dagelijkse verkoop.", "button": "Naar het CRM" }
            }
        },
        "signUp": {
            "mktTitle": "Account aanmaken - Easy Prospect",
            "crmTitle": "CRM-account aanmaken",
            "mktSubtitle": "Maak uw account aan om uw aankopen te bekijken",
            "crmSubtitle": "Vul de onderstaande gegevens in om uw account aan te maken",
            "nameLabel": "Naam",
            "namePlaceholder": "Uw naam",
            "emailLabel": "E-mail",
            "emailPlaceholder": "u@email.com",
            "passwordLabel": "Wachtwoord",
            "passwordPlaceholder": "••••••••",
            "submitMkt": "Account aanmaken en doorgaan",
            "submitCrm": "Account aanmaken",
            "haveAccount": "Heeft u al een account?",
            "enter": "Inloggen",
            "createForPurchases": "← Account aanmaken voor aankopen",
            "success": "Account succesvol aangemaakt!",
            "error": "Fout bij het aanmaken van het account",
            "benefitsTitle": "Voordelen",
            "benefit1": "Levenslange toegang tot gekochte lijsten",
            "benefit2": "Onbeperkt downloaden in CSV en Excel",
            "benefit3": "Bestanden klaar om te importeren in uw CRM",
            "successTitle": "Account succesvol aangemaakt! 🎉",
            "verifySent": "We hebben een verificatie-e-mail gestuurd naar:",
            "nextStepsTitle": "Volgende stappen",
            "step1": "1. Open uw e-mail en klik op de bevestigingslink.",
            "step2Mkt": "2. Via de link komt u direct bij uw aankopen.",
            "step2Crm": "2. Via de link komt u direct in het CRM.",
            "step3": "3. Gebruik bij volgende keren dit e-mailadres en het wachtwoord dat u zojuist heeft aangemaakt.",
            "ctaMkt": "Catalogus verkennen",
            "ctaCrm": "Naar Dashboard",
            "spamHint": "Geen e-mail ontvangen? Controleer uw spammap"
        }
    }
```

- [ ] **Step 10: Rodar o teste de paridade e validar JSON**

Run: `npx vitest run lib/i18n/messages-auth.test.ts && node -e "['pt','de','en','es','fr','it','nl'].forEach(l=>JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8')));console.log('JSON ok')"`
Expected: PASS (7 testes) e `JSON ok`.

- [ ] **Step 11: Commit**

```bash
git add messages/*.json lib/i18n/messages-auth.test.ts
git commit -m "feat(auth): namespace de traduções auth nos 7 idiomas publicados"
```

---

## Task 3: AuthShell, AuthBrand e AuthLocaleSwitcher

**Files:**
- Create: `components/auth/auth-brand.tsx`
- Create: `components/auth/auth-locale-switcher.tsx`
- Create: `components/auth/auth-shell.tsx`

**Interfaces:**
- Consumes: `withLangParam` (Task 1); namespace `auth` (Task 2); `PUBLISHED_LOCALES`, `type Locale` de `@/lib/i18n/locales`.
- Produces: `AuthShell({ locale, messages, children })`, usado pelas páginas nas Tasks 4–5.

- [ ] **Step 1: Criar `components/auth/auth-brand.tsx`**

```tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

// Logo de marca das telas de auth. Substitui o header (ausente de propósito)
// como única saída de volta ao site. `/` é a home pt (localePrefix as-needed).
export function AuthBrand() {
    const t = useTranslations("auth")

    return (
        <Link
            href="/"
            aria-label={t("backToHome")}
            className="flex items-center gap-2 opacity-90 transition-opacity hover:opacity-100"
        >
            <Image src="/logo-icon.png" alt="Easy Prospect" width={32} height={32} className="h-8 w-8" priority />
            <span className="text-xl font-bold">Easy Prospect</span>
        </Link>
    )
}
```

- [ ] **Step 2: Criar `components/auth/auth-locale-switcher.tsx`**

```tsx
"use client"

import { Globe2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"
import { withLangParam } from "@/lib/i18n/auth-locale"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Seletor de idioma da auth. Diferente do LocaleSwitcher do site (que troca o
// prefixo da URL): aqui a auth vive fora de [locale], então o idioma é o
// parâmetro ?lang — trocar é reescrever a query preservando redirect/from.
export function AuthLocaleSwitcher() {
    const locale = useLocale()
    const t = useTranslations("auth")
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const switchTo = (target: Locale) => {
        if (target === locale) return
        const query = withLangParam(searchParams.toString(), target)
        router.replace(`${pathname}?${query}`)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={t("language")}>
                    <Globe2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase">{locale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {PUBLISHED_LOCALES.map((l) => (
                    <DropdownMenuItem
                        key={l}
                        onClick={() => switchTo(l)}
                        className={l === locale ? "font-semibold" : undefined}
                    >
                        {l.toUpperCase()}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
```

- [ ] **Step 3: Criar `components/auth/auth-shell.tsx`**

```tsx
import type { ReactNode } from "react"
import type { AbstractIntlMessages } from "next-intl"
import { NextIntlClientProvider } from "next-intl"
import type { Locale } from "@/lib/i18n/locales"
import { AuthBrand } from "./auth-brand"
import { AuthLocaleSwitcher } from "./auth-locale-switcher"

// Moldura i18n das telas de auth: provê o contexto de tradução (locale +
// messages resolvidos na página, a partir de ?lang) e a marca/seletor. O
// AuthLayout continua só centralizando; este shell é quem sabe o idioma.
export function AuthShell({
    locale,
    messages,
    children,
}: {
    locale: Locale
    messages: AbstractIntlMessages
    children: ReactNode
}) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="relative w-full">
                <div className="absolute right-0 top-0">
                    <AuthLocaleSwitcher />
                </div>
                <div className="mb-8 flex justify-center">
                    <AuthBrand />
                </div>
                {children}
            </div>
        </NextIntlClientProvider>
    )
}
```

- [ ] **Step 4: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros nos três arquivos novos (AuthShell ainda não referenciado é ok).

- [ ] **Step 5: Commit**

```bash
git add components/auth/auth-brand.tsx components/auth/auth-locale-switcher.tsx components/auth/auth-shell.tsx
git commit -m "feat(auth): shell i18n com logo de saída e seletor de idioma"
```

---

## Task 4: Sign-in — server page + SignInForm i18n

**Files:**
- Create: `components/auth/sign-in-form.tsx`
- Modify: `app/(auth)/sign-in/page.tsx` (substituir todo o conteúdo)

**Interfaces:**
- Consumes: `AuthShell` (Task 3); `resolveAuthLocale` + `loadMessages` (Task 1); namespace `auth` (Task 2); `getAreaFromRedirect`, `normalizeRedirect`, `resolvePostLoginRedirect`, `type AccessAreaId` de `@/lib/auth/access-areas`.
- Produces: `SignInForm` (client) e a página server `SignInPage`.

- [ ] **Step 1: Criar `components/auth/sign-in-form.tsx`**

Move o corpo client de hoje, trocando textos por `useTranslations("auth")`. As áreas guardam só campos estruturais; os textos vêm por `id`. Os cards preservam o `?lang` atual.

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType, FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, CheckCircle2, Loader2, ShieldCheck, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import {
    getAreaFromRedirect,
    normalizeRedirect,
    resolvePostLoginRedirect,
    type AccessAreaId,
} from "@/lib/auth/access-areas"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { cn } from "@/lib/utils"

// Só os campos estruturais ficam aqui; título/descrição/botão vêm das
// traduções por id (auth.signIn.areas.<id>). `visivel` controla se aparece na
// lista de escolha — o CRM é interno, resolve como destino mas não é ofertado.
type AccessArea = {
    id: AccessAreaId
    redirect: string
    icon: ComponentType<{ className?: string }>
    visivel: boolean
}

const accessAreas: AccessArea[] = [
    { id: "purchases", redirect: "/my-purchases", icon: ShoppingBag, visivel: true },
    { id: "admin", redirect: "/super-admin", icon: ShieldCheck, visivel: true },
    { id: "crm", redirect: "/dashboard", icon: Building2, visivel: false },
]

const areasVisiveis = accessAreas.filter((area) => area.visivel)

export function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations("auth")
    const locale = useLocale() as Locale
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const explicitRedirect = searchParams.get("redirect")
    const selectedAreaId = getAreaFromRedirect(explicitRedirect, searchParams.get("from"))
    const selectedArea = useMemo(
        () => accessAreas.find((area) => area.id === selectedAreaId) ?? accessAreas[0],
        [selectedAreaId]
    )
    const SelectedIcon = selectedArea.icon

    // Card leva a /sign-in?redirect=... preservando o idioma atual (senão o
    // clique reiniciaria a tela em pt).
    const cardHref = (redirect: string) => {
        const params = new URLSearchParams({ redirect })
        if (locale !== DEFAULT_LOCALE) params.set("lang", locale)
        return `/sign-in?${params.toString()}`
    }

    const erro = searchParams.get("erro")
    useEffect(() => {
        if (!erro) return

        const mensagens: Record<string, string> = {
            link_expirado: t("signIn.errLinkExpired"),
            link_invalido: t("signIn.errLinkInvalid"),
            link_incompleto: t("signIn.errLinkIncomplete"),
        }

        toast.error(mensagens[erro] ?? t("signIn.errGeneric"))
    }, [erro, t])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signInWithPassword({ email, password })

            if (error) {
                toast.error(error.message)
                return
            }

            const intended = explicitRedirect
                ? normalizeRedirect(explicitRedirect)
                : selectedArea.redirect

            let role: string | null = null
            try {
                const response = await fetch("/api/user/role")
                if (response.ok) {
                    role = (await response.json()).role ?? null
                }
            } catch {
                // Sem o papel, resolvePostLoginRedirect escolhe o destino seguro.
            }

            const redirectTo = resolvePostLoginRedirect(intended, role)

            toast.success(t("signIn.success"))
            router.push(redirectTo)
            router.refresh()
        } catch {
            toast.error(t("signIn.error"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <section className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(20,40,36,0.04)]">
                <div className="mb-5">
                    <p className="text-sm font-bold uppercase text-primary">
                        {t("signIn.chooseHeading")}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground">
                        {t("signIn.mainAccess")}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {t("signIn.chooseHelp")}
                    </p>
                </div>

                <div className="grid gap-3">
                    {areasVisiveis.map((area) => {
                        const Icon = area.icon
                        const isSelected = area.id === selectedArea.id

                        return (
                            <Link
                                key={area.id}
                                href={cardHref(area.redirect)}
                                className={cn(
                                    "flex gap-4 rounded-lg border p-4 transition hover:border-primary/30 hover:bg-secondary/60",
                                    isSelected ? "border-primary bg-secondary" : "border-border bg-card"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold text-foreground">{t(`signIn.areas.${area.id}.title`)}</h2>
                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {t(`signIn.areas.${area.id}.description`)}
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </section>

            <Card className="w-full rounded-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary">
                            <SelectedIcon className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {t(`signIn.areas.${selectedArea.id}.shortTitle`)}
                    </CardTitle>
                    <CardDescription>{t("signIn.cardDescription")}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("signIn.emailLabel")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t("signIn.emailPlaceholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t("signIn.passwordLabel")}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={t("signIn.passwordPlaceholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t(`signIn.areas.${selectedArea.id}.button`)}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {t("signIn.noAccount")}{" "}
                            <Link href="/sign-up" className="text-primary hover:underline">
                                {t("signIn.createAccount")}
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
```

- [ ] **Step 2: Substituir `app/(auth)/sign-in/page.tsx`**

```tsx
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignInForm } from "@/components/auth/sign-in-form"
import { resolveAuthLocale } from "@/lib/i18n/auth-locale"
import { loadMessages } from "@/lib/i18n/load-messages"

// Server component: layouts não recebem searchParams, então o idioma (?lang) é
// resolvido aqui. O AuthShell abre o provider; SignInForm (client) consome as
// traduções e lê os demais params (redirect/from/erro) via useSearchParams.
export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ lang?: string }>
}) {
    const { lang } = await searchParams
    const locale = resolveAuthLocale(lang)
    const messages = await loadMessages(locale)

    return (
        <AuthShell locale={locale} messages={messages}>
            <Suspense
                fallback={
                    <div className="flex min-h-[50vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }
            >
                <SignInForm />
            </Suspense>
        </AuthShell>
    )
}
```

- [ ] **Step 3: Checar tipos e lint**

Run: `npx tsc --noEmit && npx next lint --file app/(auth)/sign-in/page.tsx --file components/auth/sign-in-form.tsx`
Expected: sem erros. (Confirmar que não há import de `@/lib/i18n/navigation` — a auth usa `next/navigation`.)

- [ ] **Step 4: Verificação rápida no preview**

Garantir dev server (Task 7 cria `.claude/launch.json` se faltar; se já rodando, seguir). Navegar `/(sign-in)`:
- `/sign-in` → pt; `/sign-in?lang=de` → alemão nos cards, form e botão.
- Trocar idioma no seletor mantém a tela e (se houver) o `?redirect`.
- Logo leva à home.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/sign-in/page.tsx components/auth/sign-in-form.tsx
git commit -m "feat(auth): sign-in i18n via ?lang com logo de saída"
```

---

## Task 5: Sign-up — server page + SignUpForm i18n

**Files:**
- Create: `components/auth/sign-up-form.tsx`
- Modify: `app/(auth)/sign-up/page.tsx` (substituir todo o conteúdo)

**Interfaces:**
- Consumes: `AuthShell` (Task 3); `resolveAuthLocale` + `loadMessages` (Task 1); namespace `auth` (Task 2).
- Produces: `SignUpForm` (client) e a página server `SignUpPage`.

- [ ] **Step 1: Criar `components/auth/sign-up-form.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ShoppingBag, Building2, CheckCircle, Mail } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"

export function SignUpForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations("auth")
    const locale = useLocale() as Locale
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)

    const from = searchParams.get("from")
    const isMarketplace = from === "marketplace"

    // Preserva o idioma ao pular entre sign-up e sign-in.
    const langSuffix = locale !== DEFAULT_LOCALE ? `lang=${locale}` : ""
    const signInHref = `/sign-in${[isMarketplace ? "from=marketplace" : "", langSuffix]
        .filter(Boolean)
        .reduce((acc, part, i) => (i === 0 ? `?${part}` : `${acc}&${part}`), "")}`
    const signUpMarketplaceHref = `/sign-up?from=marketplace${langSuffix ? `&${langSuffix}` : ""}`

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        source: isMarketplace ? "marketplace" : "crm",
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
                        isMarketplace ? "/my-purchases" : "/dashboard"
                    )}`,
                },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            setIsSuccess(true)
            toast.success(t("signUp.success"))
        } catch {
            toast.error(t("signUp.error"))
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-indigo-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t("signUp.successTitle")}</CardTitle>
                    <CardDescription>{t("signUp.verifySent")}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2">
                            <Mail className="h-5 w-5 text-[#2ec4b6]" />
                            <span className="font-medium text-gray-800">{email}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-4">
                        <h3 className="mb-2 font-medium text-foreground">{t("signUp.nextStepsTitle")}</h3>
                        <ol className="space-y-2 text-sm text-muted-foreground">
                            <li>{t("signUp.step1")}</li>
                            <li>{isMarketplace ? t("signUp.step2Mkt") : t("signUp.step2Crm")}</li>
                            <li>{t("signUp.step3")}</li>
                        </ol>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        className={`w-full ${isMarketplace ? "bg-[#4a2c5a] hover:bg-[#5d3a70]" : ""}`}
                        onClick={() => router.push(isMarketplace ? "/catalog" : "/dashboard")}
                    >
                        {isMarketplace ? t("signUp.ctaMkt") : t("signUp.ctaCrm")}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">{t("signUp.spamHint")}</p>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    {isMarketplace ? (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a2c5a] to-[#5d3a70] flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-white" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                    )}
                </div>
                <CardTitle className="text-2xl font-bold">
                    {isMarketplace ? t("signUp.mktTitle") : t("signUp.crmTitle")}
                </CardTitle>
                <CardDescription>
                    {isMarketplace ? t("signUp.mktSubtitle") : t("signUp.crmSubtitle")}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("signUp.nameLabel")}</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder={t("signUp.namePlaceholder")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t("signUp.emailLabel")}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t("signUp.emailPlaceholder")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t("signUp.passwordLabel")}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={t("signUp.passwordPlaceholder")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            disabled={isLoading}
                        />
                    </div>

                    {isMarketplace && (
                        <div className="bg-gradient-to-r from-[#4a2c5a]/5 to-[#2ec4b6]/5 rounded-lg p-4 border border-[#2ec4b6]/20">
                            <h3 className="mb-2 font-medium text-foreground">{t("signUp.benefitsTitle")}</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>✓ {t("signUp.benefit1")}</li>
                                <li>✓ {t("signUp.benefit2")}</li>
                                <li>✓ {t("signUp.benefit3")}</li>
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className={`w-full ${isMarketplace ? "bg-[#4a2c5a] hover:bg-[#5d3a70]" : ""}`}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isMarketplace ? t("signUp.submitMkt") : t("signUp.submitCrm")}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        {t("signUp.haveAccount")}{" "}
                        <Link href={signInHref} className="text-primary hover:underline">
                            {t("signUp.enter")}
                        </Link>
                    </p>

                    {!isMarketplace && (
                        <div className="text-center">
                            <Link href={signUpMarketplaceHref} className="text-sm text-[#2ec4b6] hover:underline">
                                {t("signUp.createForPurchases")}
                            </Link>
                        </div>
                    )}
                </CardFooter>
            </form>
        </Card>
    )
}
```

- [ ] **Step 2: Substituir `app/(auth)/sign-up/page.tsx`**

```tsx
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { resolveAuthLocale } from "@/lib/i18n/auth-locale"
import { loadMessages } from "@/lib/i18n/load-messages"

export default async function SignUpPage({
    searchParams,
}: {
    searchParams: Promise<{ lang?: string }>
}) {
    const { lang } = await searchParams
    const locale = resolveAuthLocale(lang)
    const messages = await loadMessages(locale)

    return (
        <AuthShell locale={locale} messages={messages}>
            <Suspense
                fallback={
                    <div className="flex min-h-[50vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }
            >
                <SignUpForm />
            </Suspense>
        </AuthShell>
    )
}
```

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação rápida no preview**

`/sign-up?from=marketplace&lang=fr` → francês, variante marketplace (benefícios visíveis). `/sign-up` → pt, variante CRM. Enviar cadastro mostra a tela de sucesso traduzida.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/sign-up/page.tsx components/auth/sign-up-form.tsx
git commit -m "feat(auth): sign-up i18n via ?lang com logo de saída"
```

---

## Task 6: Pontos de entrada anexam `lang`

**Files:**
- Modify: `components/marketplace/marketplace-header.tsx:131`
- Modify: `components/marketplace/marketplace-footer.tsx:44`
- Modify: `components/marketplace/buy-now-button.tsx:48`
- Modify: `components/checkout/paypal-buttons.tsx` (2 pushes)
- Modify: `app/[locale]/checkout/success/page.tsx:47`
- Modify: `app/[locale]/my-purchases/page.tsx:78`

**Interfaces:**
- Consumes: locale local de cada componente (via `useLocale()` client ou `getLocale()`/prop server). Nenhuma nova exportação.

Cada entrada leva o idioma atual para a auth. Como pt é o padrão sem prefixo, anexar `lang` sempre é inofensivo (a auth resolve pt de qualquer forma), então mantemos simples: sempre anexar.

- [ ] **Step 1: `marketplace-header.tsx`** — já tem `const locale = useLocale()` (linha 36). Trocar o link de login:

De:
```tsx
                                    <Link href="/sign-in">
```
Para:
```tsx
                                    <Link href={`/sign-in?lang=${locale}`}>
```

- [ ] **Step 2: `marketplace-footer.tsx`** — já recebe `locale` (linha 8). Trocar:

De:
```tsx
                            <li><Link href="/sign-in" className="hover:text-foreground">{t("login")}</Link></li>
```
Para:
```tsx
                            <li><Link href={`/sign-in?lang=${locale}`} className="hover:text-foreground">{t("login")}</Link></li>
```

- [ ] **Step 3: `buy-now-button.tsx`** — adicionar `useLocale` ao import de `next-intl` e usar no push.

No import (linha 8) `import { useTranslations } from "next-intl"` → `import { useLocale, useTranslations } from "next-intl"`.

Dentro de `BuyNowButton`, ao lado de `const t = useTranslations("listing")`:
```tsx
    const locale = useLocale()
```
Trocar a linha 48:
```tsx
            plainRouter.push("/sign-in?redirect=/checkout")
```
Para:
```tsx
            plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
```

- [ ] **Step 4: `paypal-buttons.tsx`** — adicionar `useLocale` e usar nos dois pushes.

No import (linha 8) `import { useTranslations } from "next-intl"` → `import { useLocale, useTranslations } from "next-intl"`.

Ao lado de `const t = useTranslations("checkout")` (linha 47):
```tsx
    const locale = useLocale()
```
Trocar:
```tsx
                            plainRouter.push("/sign-in?redirect=/checkout")
```
Para:
```tsx
                            plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
```
E:
```tsx
                            plainRouter.push("/sign-in?redirect=/my-purchases")
```
Para:
```tsx
                            plainRouter.push(`/sign-in?redirect=/my-purchases&lang=${locale}`)
```

- [ ] **Step 5: `app/[locale]/checkout/success/page.tsx`** — já tem `const locale = await getLocale()` (linha 39). Trocar a linha 47:

De:
```tsx
        redirect(`/sign-in?redirect=${encodeURIComponent(target)}`)
```
Para:
```tsx
        redirect(`/sign-in?redirect=${encodeURIComponent(target)}&lang=${locale}`)
```

- [ ] **Step 6: `app/[locale]/my-purchases/page.tsx`** — adicionar `getLocale` ao import de `next-intl/server` e usar no redirect de `PurchasesContent`.

Linha 24: `import { getFormatter, getTranslations } from "next-intl/server"` → `import { getFormatter, getLocale, getTranslations } from "next-intl/server"`.

No início de `PurchasesContent` (função na linha 41), antes do bloco que faz o redirect (linha 78), obter o locale:
```tsx
    const locale = await getLocale()
```
Trocar a linha 78:
```tsx
        redirect("/sign-in?redirect=/my-purchases")
```
Para:
```tsx
        redirect(`/sign-in?redirect=/my-purchases&lang=${locale}`)
```

- [ ] **Step 7: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add components/marketplace/marketplace-header.tsx components/marketplace/marketplace-footer.tsx components/marketplace/buy-now-button.tsx components/checkout/paypal-buttons.tsx app/[locale]/checkout/success/page.tsx app/[locale]/my-purchases/page.tsx
git commit -m "feat(auth): pontos de entrada levam o idioma atual para o sign-in"
```

---

## Task 7: Verificação end-to-end no preview

**Files:**
- Create (se faltar): `.claude/launch.json`

**Interfaces:** nenhuma — verificação.

- [ ] **Step 1: Garantir `.claude/launch.json`**

Se não existir, criar:

```json
{
    "version": "0.0.1",
    "configurations": [
        {
            "name": "dev",
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "dev"],
            "port": 3001
        }
    ]
}
```

- [ ] **Step 2: Subir o preview e checar console/erros**

Iniciar o dev server (preview_start `{name:"dev"}`). Confirmar em `read_console_messages`/`preview_logs` que não há erro de hidratação nem "missing message" do next-intl.

- [ ] **Step 3: Matriz de verificação (read_page/screenshot)**

Verificar:
- `/sign-in` → pt; `/sign-in?lang=de` → de; `/sign-in?lang=it` → it; `/sign-in?lang=ar` → pt (fallback).
- `/sign-in?lang=de&redirect=/super-admin` → área admin selecionada, em de; trocar idioma no seletor preserva `redirect`.
- Logo (`AuthBrand`) navega para `/` e cai na home.
- `/sign-up?from=marketplace&lang=fr` → fr, variante marketplace com benefícios; `/sign-up` → pt, variante CRM.
- Fluxo real: no storefront em `/de/catalog`, o botão de login do header leva a `/sign-in?lang=de` (auth já em alemão).

- [ ] **Step 4: Suíte completa**

Run: `npx vitest run`
Expected: tudo verde (incluindo `auth-locale` e `messages-auth`).

- [ ] **Step 5: Commit (se launch.json criado)**

```bash
git add .claude/launch.json
git commit -m "chore(dev): configuração de preview do dev server"
```

---

## Self-Review

**Spec coverage:**
- Logo de saída → Tasks 3 (AuthBrand/AuthShell), 4, 5. ✓
- i18n via `?lang` fora de `[locale]` → Tasks 1 (resolveAuthLocale), 4, 5 (server pages). ✓
- Seletor próprio → Task 3 (AuthLocaleSwitcher). ✓
- Visita direta/callback caem no pt → `resolveAuthLocale(undefined)`, testado (Task 1). ✓
- Pontos de entrada anexam `lang` → Task 6 (os 6 arquivos do spec). ✓
- Namespace `auth` nos 7 idiomas → Task 2. ✓
- Analytics/Speed Insights, mover para `[locale]`, terms/privacy, moeda → fora de escopo, não há tasks (correto). ✓

**Placeholder scan:** nenhum "TBD/TODO"; todos os textos e códigos estão completos, incluindo as 7 traduções.

**Type consistency:** `resolveAuthLocale(lang?: string | null): Locale`, `withLangParam(search, lang): string`, `loadMessages(locale): Promise<AbstractIntlMessages>`, `AuthShell({locale, messages, children})`, `SignInForm`, `SignUpForm` — usados de forma idêntica entre as tasks. Chaves de tradução consumidas (`signIn.areas.<id>.{title,shortTitle,description,button}`, `signIn.err*`, `signUp.*`) batem com o namespace da Task 2.
