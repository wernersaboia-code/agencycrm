# Cadastro Próprio e E-mails Transacionais nos 7 Idiomas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O comprador se cadastra no idioma que escolheu, recebe a confirmação de cadastro e a de compra nesse idioma, e a tela de cadastro deixa de mencionar o CRM.

**Architecture:** O idioma passa a morar em `User.language`, escrito uma vez no cadastro e lido por uma função única. O cadastro sai do `supabase.auth.signUp()` do navegador e vira rota nossa, que cria o usuário sem enviar nada (`generateLink`) e manda o e-mail pelo nosso SMTP. Os três e-mails compartilham uma casca e um namespace `emails` nos 7 arquivos de `messages/`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma 6 + PostgreSQL (Supabase), supabase-js, zod 4, vitest 4, next-intl 4, nodemailer.

**Spec:** `docs/superpowers/specs/2026-08-06-cadastro-e-emails-i18n-design.md`

## Global Constraints

- **Branch:** `feat/cadastro-e-emails-i18n`, criada a partir da `main` (`04118d5`). O trabalho do Paddle vive em outra branch e **não** deve ser trazido, exceto o cherry-pick da Task 1.
- **Linha de base da suíte: 69 arquivos, 628 testes passando.** Toda task termina com a suíte verde.
- **Nenhum teste toca banco ou rede.** Função pura, ou dependência injetada por parâmetro com mock (molde de `lib/checkout/fulfillment.test.ts`).
- **Indentação: 4 espaços. Sem ponto e vírgula** no fim das linhas.
- **Comentários e mensagens de commit em português.** O comentário explica *por que*, não *o que*. Mensagem de commit sem acentuação, no estilo do histórico.
- **Chave de tradução nova entra nos 7 arquivos** `messages/{pt,en,de,fr,es,it,nl}.json`.
- **Migrations Prisma rodam sem shadow database** neste projeto.
- **Node não está no PATH por padrão.** Antes de qualquer `npm`/`npx`, no Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.
- **`npm run lint` com exit 0 é inatingível** (erros pré-existentes). O critério é **zero problema novo nos arquivos tocados**, com `npx eslint <arquivos>`.
- **Nunca usar `git add <diretório>`** — o Werner edita em paralelo. Sempre listar os arquivos explicitamente.
- **Dev server só pelo preview (`.claude/launch.json`), porta 3001, nunca pelo Bash.** `npm run build` exige o dev server parado no Windows (o Prisma falha com `EPERM ... query_engine-windows.dll.node`).
- **`SUPABASE_SERVICE_ROLE_KEY` nunca é importada em código client.** Só `lib/supabase/admin.ts` e quem roda no servidor.

---

### Task 1: Cherry-pick do conserto do primeiro acesso

O commit `d6fbd73` conserta a corrida do P2002 em `getAuthenticatedDbUser` — a mesma função que a Task 2 vai modificar. Ele vive só na branch do Paddle, não tem relação com pagamento, e o bug derruba o primeiro acesso de todo cliente novo em produção.

**Files:**
- Modify: `lib/auth.ts` (pelo cherry-pick, sem edição manual)

**Interfaces:**
- Consumes: nada.
- Produces: `getAuthenticatedUser` e `getAuthenticatedDbUser` tratando `P2002` e relendo, via `isUniqueViolation(error)`.

- [ ] **Step 1: Aplicar o cherry-pick**

```bash
git cherry-pick d6fbd73
```

Expected: aplica limpo, um arquivo alterado. Se houver conflito, **pare e reporte** — significa que a `main` andou desde o levantamento e o desenho precisa ser reavaliado.

- [ ] **Step 2: Conferir que a proteção chegou**

Run: `grep -c "isUniqueViolation" lib/auth.ts`
Expected: `3` (a definição e os dois usos).

- [ ] **Step 3: Rodar a suíte**

Run: `npm test`
Expected: PASS — 628 testes.

Nada a commitar: o cherry-pick já criou o commit.

---

### Task 2: O idioma do usuário

`User.language` nasce `"pt-BR"`, mas os locales do projeto são `"pt"`, `"de"`… Esta task normaliza o valor, cria a função única de leitura e faz o cadastro escrever.

**Files:**
- Modify: `prisma/schema.prisma:155`
- Create: `prisma/migrations/<timestamp>_normalize_user_language/migration.sql`
- Create: `lib/i18n/user-locale.ts`
- Create: `lib/i18n/user-locale.test.ts`
- Modify: `lib/auth.ts` (bloco de criação dentro de `getAuthenticatedDbUser`)

**Interfaces:**
- Consumes: `isLocale`, `resolveMessagesLocale`, `DEFAULT_LOCALE`, `type Locale` de `@/lib/i18n/locales`.
- Produces: `localeFromUserLanguage(language: string | null | undefined): Locale`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/i18n/user-locale.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { localeFromUserLanguage } from "./user-locale"

describe("localeFromUserLanguage", () => {
    it("aceita o locale simples", () => {
        expect(localeFromUserLanguage("de")).toBe("de")
        expect(localeFromUserLanguage("nl")).toBe("nl")
    })

    it("reduz a tag BCP 47 ao locale", () => {
        // A coluna nasceu com "pt-BR" e existem linhas antigas assim. Ler
        // "de-DE" como "de" é o que impede o e-mail de cair no padrao por
        // causa do formato do valor.
        expect(localeFromUserLanguage("pt-BR")).toBe("pt")
        expect(localeFromUserLanguage("de-DE")).toBe("de")
    })

    it("ignora caixa", () => {
        expect(localeFromUserLanguage("DE")).toBe("de")
    })

    it("cai no padrao quando nao ha valor", () => {
        expect(localeFromUserLanguage(null)).toBe("pt")
        expect(localeFromUserLanguage(undefined)).toBe("pt")
        expect(localeFromUserLanguage("")).toBe("pt")
    })

    it("cai no padrao quando o valor nao e um locale nosso", () => {
        expect(localeFromUserLanguage("xx")).toBe("pt")
        expect(localeFromUserLanguage("klingon")).toBe("pt")
    })

    it("cai no padrao quando o locale e roteavel mas nao publicado", () => {
        // "ar" existe em LOCALES mas nao em PUBLISHED_LOCALES: nao ha
        // traducao, e mandar e-mail com chave crua seria pior que portugues.
        expect(localeFromUserLanguage("ar")).toBe("pt")
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/i18n/user-locale.test.ts`
Expected: FAIL — `Failed to resolve import "./user-locale"`.

- [ ] **Step 3: Escrever `lib/i18n/user-locale.ts`**

```ts
// lib/i18n/user-locale.ts
//
// O idioma de um usuario, lido de User.language.
//
// Existe como funcao unica porque a coluna guarda historia: nasceu com o
// default "pt-BR", que nao e um locale nosso, e admin-locale.ts ja dependia
// dela cair no padrao por acidente. Concentrar a leitura aqui significa que o
// dia em que o formato mudar de novo, muda num lugar so.

import { DEFAULT_LOCALE, isLocale, resolveMessagesLocale, type Locale } from "@/lib/i18n/locales"

/**
 * Devolve sempre um locale PUBLICADO, tolerando valor ausente, mal formado ou
 * de um idioma sem traducao. E-mail com chave crua no lugar do texto e pior
 * para o comprador do que e-mail no idioma padrao.
 */
export function localeFromUserLanguage(language: string | null | undefined): Locale {
    if (!language) {
        return DEFAULT_LOCALE
    }

    const base = language.split("-")[0].toLowerCase()

    if (!isLocale(base)) {
        return DEFAULT_LOCALE
    }

    return resolveMessagesLocale(base)
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- lib/i18n/user-locale.test.ts`
Expected: PASS — 6 testes.

- [ ] **Step 5: Trocar o default no schema**

Em `prisma/schema.prisma`, linha 155:

```prisma
  language String     @default("pt")
```

- [ ] **Step 6: Gerar a migration e acrescentar a normalização**

Run: `npx prisma migrate dev --name normalize_user_language --create-only`

Abrir o `migration.sql` gerado e **acrescentar ao final** a linha que normaliza as linhas existentes (o Prisma só gera a troca de default):

```sql
-- As linhas antigas guardam "pt-BR", que nao e um locale do projeto. Sem esta
-- linha elas continuariam dependendo do fallback para funcionar.
UPDATE "User" SET "language" = 'pt' WHERE "language" = 'pt-BR';
```

Depois:

Run: `npx prisma migrate deploy`
Run: `npx prisma generate`
Expected: migration aplicada, client regenerado.

- [ ] **Step 7: Gravar o locale na criação do usuário**

Em `lib/auth.ts`, dentro de `getAuthenticatedDbUser`, no objeto `data` da criação, acrescentar o campo `language`. O bloco fica assim:

```ts
    if (!user) {
        const data = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name ??
                supabaseUser.user_metadata?.full_name ??
                supabaseUser.email.split('@')[0],
            // O idioma escolhido no cadastro viaja no metadata do Supabase e
            // e copiado aqui, no primeiro acesso confirmado. Criar a linha
            // antes disso seria criar usuario para e-mail nao confirmado.
            language: localeFromUserLanguage(supabaseUser.user_metadata?.locale),
        }

        try {
            user = await prisma.user.create({ data, select })
        } catch (error) {
            // Era esta a linha sem proteção: o P2002 subia até derrubar o
            // render com "Erro crítico" no primeiro acesso do cliente novo.
            if (!isUniqueViolation(error)) throw error
            user = await prisma.user.findUnique({ where: { id: supabaseUser.id }, select })
        }
    }
```

E o import no topo do arquivo, junto dos outros:

```ts
import { localeFromUserLanguage } from '@/lib/i18n/user-locale'
```

- [ ] **Step 8: Verificar tipos, suíte e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm test`
Expected: PASS — 634 testes (628 + 6).

Run: `npx eslint lib/i18n/user-locale.ts lib/i18n/user-locale.test.ts lib/auth.ts`
Expected: zero problema novo.

- [ ] **Step 9: Commit**

```bash
git add lib/i18n/user-locale.ts lib/i18n/user-locale.test.ts lib/auth.ts prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat(i18n): idioma do usuario passa a valer em User.language"
```

> Exceção consciente ao "nunca `git add <diretório>`": o diretório da migration é novo e criado por esta task inteira. Confira com `git status --short` antes que nada de fora dele entrou.

---

### Task 3: O namespace `emails` nos 7 idiomas

Os textos dos três e-mails, e o teste que garante que nenhum idioma fica para trás.

**Files:**
- Modify: `messages/pt.json`, `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/es.json`, `messages/it.json`, `messages/nl.json`
- Create: `lib/email/i18n.ts`
- Create: `lib/email/i18n.test.ts`
- Create: `lib/i18n/messages-emails.test.ts`

**Interfaces:**
- Consumes: `loadMessages` de `@/lib/i18n/load-messages`; `type Locale` de `@/lib/i18n/locales`.
- Produces:
  - `type EmailBlock = Record<string, string>`
  - `loadEmailBlock(locale: Locale, block: "signup" | "accountExists" | "purchase"): Promise<EmailBlock>`
  - `loadEmailCommon(locale: Locale): Promise<EmailBlock>`
  - `interpolate(template: string, vars: Record<string, string>): string`

- [ ] **Step 1: Acrescentar o namespace `emails` em `messages/pt.json`**

No nível de topo do objeto (irmão de `common`, `auth`, `nav`…):

```json
    "emails": {
        "common": {
            "tagline": "Easy Prospect — listas qualificadas para comércio internacional",
            "support": "Dúvidas? Responda este e-mail ou fale com o suporte."
        },
        "signup": {
            "subject": "Confirme seu e-mail — Easy Prospect",
            "heading": "Confirme seu e-mail",
            "greeting": "Olá {nome},",
            "intro": "Falta um passo para sua conta ficar pronta. Clique no botão abaixo para confirmar este endereço de e-mail.",
            "button": "Confirmar meu e-mail",
            "expires": "Este link vale por 24 horas.",
            "ignore": "Se você não criou esta conta, ignore esta mensagem."
        },
        "accountExists": {
            "subject": "Você já tem uma conta — Easy Prospect",
            "heading": "Você já tem uma conta",
            "greeting": "Olá,",
            "intro": "Alguém tentou criar uma conta com este e-mail, e ele já está cadastrado. Nenhuma conta nova foi criada.",
            "button": "Entrar na minha conta",
            "resetHint": "Se você esqueceu a senha, use a opção de recuperação na tela de entrada.",
            "ignore": "Se não foi você, pode ignorar esta mensagem com segurança."
        },
        "purchase": {
            "subject": "Sua compra foi confirmada — pedido #{pedido}",
            "heading": "Compra confirmada",
            "greeting": "Olá {nome},",
            "intro": "Seu pagamento foi confirmado e suas listas estão prontas para download.",
            "orderLabel": "Pedido",
            "dateLabel": "Data",
            "totalLabel": "Total",
            "itemsTitle": "Itens comprados",
            "accessIntro": "Clique no botão abaixo para acessar sua área de compras e baixar as listas:",
            "accessButton": "Acessar minhas compras",
            "linkNote": "Este link é pessoal e vale por 24 horas.",
            "catalogTitle": "Amplie o alcance da sua campanha",
            "catalogText": "Explore listas de outros mercados e setores para alcançar mais parceiros comerciais.",
            "catalogButton": "Ver catálogo"
        }
    },
```

- [ ] **Step 2: Acrescentar o mesmo namespace em `messages/en.json`**

```json
    "emails": {
        "common": {
            "tagline": "Easy Prospect — qualified lists for international trade",
            "support": "Questions? Reply to this email or contact support."
        },
        "signup": {
            "subject": "Confirm your email — Easy Prospect",
            "heading": "Confirm your email",
            "greeting": "Hello {nome},",
            "intro": "One step left before your account is ready. Click the button below to confirm this email address.",
            "button": "Confirm my email",
            "expires": "This link is valid for 24 hours.",
            "ignore": "If you did not create this account, please ignore this message."
        },
        "accountExists": {
            "subject": "You already have an account — Easy Prospect",
            "heading": "You already have an account",
            "greeting": "Hello,",
            "intro": "Someone tried to create an account with this email address, and it is already registered. No new account was created.",
            "button": "Sign in to my account",
            "resetHint": "If you forgot your password, use the recovery option on the sign-in screen.",
            "ignore": "If this was not you, you can safely ignore this message."
        },
        "purchase": {
            "subject": "Your purchase is confirmed — order #{pedido}",
            "heading": "Purchase confirmed",
            "greeting": "Hello {nome},",
            "intro": "Your payment has been confirmed and your lists are ready to download.",
            "orderLabel": "Order",
            "dateLabel": "Date",
            "totalLabel": "Total",
            "itemsTitle": "Items purchased",
            "accessIntro": "Click the button below to open your purchases area and download the lists:",
            "accessButton": "Go to my purchases",
            "linkNote": "This link is personal and valid for 24 hours.",
            "catalogTitle": "Widen your campaign's reach",
            "catalogText": "Explore lists from other markets and sectors to reach more trading partners.",
            "catalogButton": "Browse the catalogue"
        }
    },
```

- [ ] **Step 3: Acrescentar o mesmo namespace em `messages/de.json`**

```json
    "emails": {
        "common": {
            "tagline": "Easy Prospect — qualifizierte Listen für den internationalen Handel",
            "support": "Fragen? Antworten Sie auf diese E-Mail oder wenden Sie sich an den Support."
        },
        "signup": {
            "subject": "Bestätigen Sie Ihre E-Mail-Adresse — Easy Prospect",
            "heading": "Bestätigen Sie Ihre E-Mail-Adresse",
            "greeting": "Hallo {nome},",
            "intro": "Nur noch ein Schritt, bis Ihr Konto bereit ist. Klicken Sie auf die Schaltfläche unten, um diese E-Mail-Adresse zu bestätigen.",
            "button": "E-Mail-Adresse bestätigen",
            "expires": "Dieser Link ist 24 Stunden gültig.",
            "ignore": "Wenn Sie dieses Konto nicht erstellt haben, ignorieren Sie diese Nachricht bitte."
        },
        "accountExists": {
            "subject": "Sie haben bereits ein Konto — Easy Prospect",
            "heading": "Sie haben bereits ein Konto",
            "greeting": "Hallo,",
            "intro": "Jemand hat versucht, mit dieser E-Mail-Adresse ein Konto zu erstellen; sie ist bereits registriert. Es wurde kein neues Konto angelegt.",
            "button": "Bei meinem Konto anmelden",
            "resetHint": "Falls Sie Ihr Passwort vergessen haben, nutzen Sie die Wiederherstellung auf der Anmeldeseite.",
            "ignore": "Falls Sie das nicht waren, können Sie diese Nachricht bedenkenlos ignorieren."
        },
        "purchase": {
            "subject": "Ihr Kauf ist bestätigt — Bestellung #{pedido}",
            "heading": "Kauf bestätigt",
            "greeting": "Hallo {nome},",
            "intro": "Ihre Zahlung wurde bestätigt und Ihre Listen stehen zum Download bereit.",
            "orderLabel": "Bestellung",
            "dateLabel": "Datum",
            "totalLabel": "Gesamt",
            "itemsTitle": "Gekaufte Artikel",
            "accessIntro": "Klicken Sie auf die Schaltfläche unten, um Ihren Kaufbereich zu öffnen und die Listen herunterzuladen:",
            "accessButton": "Zu meinen Käufen",
            "linkNote": "Dieser Link ist persönlich und 24 Stunden gültig.",
            "catalogTitle": "Erweitern Sie die Reichweite Ihrer Kampagne",
            "catalogText": "Entdecken Sie Listen aus anderen Märkten und Branchen, um mehr Handelspartner zu erreichen.",
            "catalogButton": "Katalog ansehen"
        }
    },
```

- [ ] **Step 4: Acrescentar o mesmo namespace em `messages/fr.json`**

```json
    "emails": {
        "common": {
            "tagline": "Easy Prospect — des listes qualifiées pour le commerce international",
            "support": "Une question ? Répondez à cet e-mail ou contactez le support."
        },
        "signup": {
            "subject": "Confirmez votre adresse e-mail — Easy Prospect",
            "heading": "Confirmez votre adresse e-mail",
            "greeting": "Bonjour {nome},",
            "intro": "Il ne reste qu'une étape avant que votre compte soit prêt. Cliquez sur le bouton ci-dessous pour confirmer cette adresse e-mail.",
            "button": "Confirmer mon adresse e-mail",
            "expires": "Ce lien est valable 24 heures.",
            "ignore": "Si vous n'avez pas créé ce compte, ignorez ce message."
        },
        "accountExists": {
            "subject": "Vous avez déjà un compte — Easy Prospect",
            "heading": "Vous avez déjà un compte",
            "greeting": "Bonjour,",
            "intro": "Quelqu'un a tenté de créer un compte avec cette adresse e-mail, et elle est déjà enregistrée. Aucun nouveau compte n'a été créé.",
            "button": "Me connecter à mon compte",
            "resetHint": "Si vous avez oublié votre mot de passe, utilisez l'option de récupération sur la page de connexion.",
            "ignore": "Si ce n'était pas vous, vous pouvez ignorer ce message en toute sécurité."
        },
        "purchase": {
            "subject": "Votre achat est confirmé — commande #{pedido}",
            "heading": "Achat confirmé",
            "greeting": "Bonjour {nome},",
            "intro": "Votre paiement a été confirmé et vos listes sont prêtes à être téléchargées.",
            "orderLabel": "Commande",
            "dateLabel": "Date",
            "totalLabel": "Total",
            "itemsTitle": "Articles achetés",
            "accessIntro": "Cliquez sur le bouton ci-dessous pour ouvrir votre espace d'achats et télécharger les listes :",
            "accessButton": "Accéder à mes achats",
            "linkNote": "Ce lien est personnel et valable 24 heures.",
            "catalogTitle": "Élargissez la portée de votre campagne",
            "catalogText": "Explorez des listes d'autres marchés et secteurs pour atteindre davantage de partenaires commerciaux.",
            "catalogButton": "Voir le catalogue"
        }
    },
```

- [ ] **Step 5: Acrescentar o mesmo namespace em `messages/es.json`**

```json
    "emails": {
        "common": {
            "tagline": "Easy Prospect — listas cualificadas para el comercio internacional",
            "support": "¿Dudas? Responda a este correo o escriba al soporte."
        },
        "signup": {
            "subject": "Confirme su correo electrónico — Easy Prospect",
            "heading": "Confirme su correo electrónico",
            "greeting": "Hola {nome}:",
            "intro": "Falta un paso para que su cuenta esté lista. Haga clic en el botón de abajo para confirmar esta dirección de correo.",
            "button": "Confirmar mi correo",
            "expires": "Este enlace es válido durante 24 horas.",
            "ignore": "Si usted no creó esta cuenta, ignore este mensaje."
        },
        "accountExists": {
            "subject": "Ya tiene una cuenta — Easy Prospect",
            "heading": "Ya tiene una cuenta",
            "greeting": "Hola:",
            "intro": "Alguien intentó crear una cuenta con este correo, y ya está registrado. No se creó ninguna cuenta nueva.",
            "button": "Entrar en mi cuenta",
            "resetHint": "Si olvidó su contraseña, use la opción de recuperación en la pantalla de acceso.",
            "ignore": "Si no fue usted, puede ignorar este mensaje con tranquilidad."
        },
        "purchase": {
            "subject": "Su compra está confirmada — pedido #{pedido}",
            "heading": "Compra confirmada",
            "greeting": "Hola {nome}:",
            "intro": "Su pago se ha confirmado y sus listas están listas para descargar.",
            "orderLabel": "Pedido",
            "dateLabel": "Fecha",
            "totalLabel": "Total",
            "itemsTitle": "Artículos comprados",
            "accessIntro": "Haga clic en el botón de abajo para abrir su área de compras y descargar las listas:",
            "accessButton": "Ir a mis compras",
            "linkNote": "Este enlace es personal y válido durante 24 horas.",
            "catalogTitle": "Amplíe el alcance de su campaña",
            "catalogText": "Explore listas de otros mercados y sectores para llegar a más socios comerciales.",
            "catalogButton": "Ver el catálogo"
        }
    },
```

- [ ] **Step 6: Acrescentar o mesmo namespace em `messages/it.json`**

```json
    "emails": {
        "common": {
            "tagline": "Easy Prospect — liste qualificate per il commercio internazionale",
            "support": "Domande? Risponda a questa e-mail o contatti l'assistenza."
        },
        "signup": {
            "subject": "Confermi il suo indirizzo e-mail — Easy Prospect",
            "heading": "Confermi il suo indirizzo e-mail",
            "greeting": "Buongiorno {nome},",
            "intro": "Manca un passaggio perché il suo account sia pronto. Clicchi sul pulsante qui sotto per confermare questo indirizzo e-mail.",
            "button": "Conferma il mio indirizzo",
            "expires": "Questo link è valido per 24 ore.",
            "ignore": "Se non ha creato questo account, ignori questo messaggio."
        },
        "accountExists": {
            "subject": "Ha già un account — Easy Prospect",
            "heading": "Ha già un account",
            "greeting": "Buongiorno,",
            "intro": "Qualcuno ha provato a creare un account con questo indirizzo e-mail, che risulta già registrato. Nessun nuovo account è stato creato.",
            "button": "Accedi al mio account",
            "resetHint": "Se ha dimenticato la password, usi l'opzione di recupero nella schermata di accesso.",
            "ignore": "Se non è stato lei, può ignorare tranquillamente questo messaggio."
        },
        "purchase": {
            "subject": "Il suo acquisto è confermato — ordine #{pedido}",
            "heading": "Acquisto confermato",
            "greeting": "Buongiorno {nome},",
            "intro": "Il suo pagamento è stato confermato e le sue liste sono pronte per il download.",
            "orderLabel": "Ordine",
            "dateLabel": "Data",
            "totalLabel": "Totale",
            "itemsTitle": "Articoli acquistati",
            "accessIntro": "Clicchi sul pulsante qui sotto per aprire l'area acquisti e scaricare le liste:",
            "accessButton": "Vai ai miei acquisti",
            "linkNote": "Questo link è personale e valido per 24 ore.",
            "catalogTitle": "Ampli la portata della sua campagna",
            "catalogText": "Esplori liste di altri mercati e settori per raggiungere più partner commerciali.",
            "catalogButton": "Vedi il catalogo"
        }
    },
```

- [ ] **Step 7: Acrescentar o mesmo namespace em `messages/nl.json`**

```json
    "emails": {
        "common": {
            "tagline": "Easy Prospect — gekwalificeerde lijsten voor internationale handel",
            "support": "Vragen? Beantwoord deze e-mail of neem contact op met de klantenservice."
        },
        "signup": {
            "subject": "Bevestig uw e-mailadres — Easy Prospect",
            "heading": "Bevestig uw e-mailadres",
            "greeting": "Hallo {nome},",
            "intro": "Nog één stap en uw account is klaar. Klik op de knop hieronder om dit e-mailadres te bevestigen.",
            "button": "Mijn e-mailadres bevestigen",
            "expires": "Deze link is 24 uur geldig.",
            "ignore": "Hebt u dit account niet aangemaakt, negeer dan dit bericht."
        },
        "accountExists": {
            "subject": "U hebt al een account — Easy Prospect",
            "heading": "U hebt al een account",
            "greeting": "Hallo,",
            "intro": "Iemand probeerde een account aan te maken met dit e-mailadres; het is al geregistreerd. Er is geen nieuw account aangemaakt.",
            "button": "Inloggen op mijn account",
            "resetHint": "Bent u uw wachtwoord vergeten, gebruik dan de hersteloptie op het inlogscherm.",
            "ignore": "Was u dit niet, dan kunt u dit bericht gerust negeren."
        },
        "purchase": {
            "subject": "Uw aankoop is bevestigd — bestelling #{pedido}",
            "heading": "Aankoop bevestigd",
            "greeting": "Hallo {nome},",
            "intro": "Uw betaling is bevestigd en uw lijsten staan klaar om te downloaden.",
            "orderLabel": "Bestelling",
            "dateLabel": "Datum",
            "totalLabel": "Totaal",
            "itemsTitle": "Gekochte artikelen",
            "accessIntro": "Klik op de knop hieronder om uw aankopenoverzicht te openen en de lijsten te downloaden:",
            "accessButton": "Naar mijn aankopen",
            "linkNote": "Deze link is persoonlijk en 24 uur geldig.",
            "catalogTitle": "Vergroot het bereik van uw campagne",
            "catalogText": "Ontdek lijsten uit andere markten en sectoren om meer handelspartners te bereiken.",
            "catalogButton": "Bekijk de catalogus"
        }
    },
```

- [ ] **Step 8: Escrever o teste de paridade**

Criar `lib/i18n/messages-emails.test.ts`, no molde de `messages-auth.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { PUBLISHED_LOCALES } from "./locales"

// Todas as chaves do namespace `emails`. E o teste que pega a traducao
// esquecida, que e o modo mais provavel de isso quebrar: o e-mail sai, so que
// no idioma errado, e ninguem percebe ate um cliente reclamar.
const REQUIRED_PATHS = [
    "common.tagline",
    "common.support",
    "signup.subject",
    "signup.heading",
    "signup.greeting",
    "signup.intro",
    "signup.button",
    "signup.expires",
    "signup.ignore",
    "accountExists.subject",
    "accountExists.heading",
    "accountExists.greeting",
    "accountExists.intro",
    "accountExists.button",
    "accountExists.resetHint",
    "accountExists.ignore",
    "purchase.subject",
    "purchase.heading",
    "purchase.greeting",
    "purchase.intro",
    "purchase.orderLabel",
    "purchase.dateLabel",
    "purchase.totalLabel",
    "purchase.itemsTitle",
    "purchase.accessIntro",
    "purchase.accessButton",
    "purchase.linkNote",
    "purchase.catalogTitle",
    "purchase.catalogText",
    "purchase.catalogButton",
]

function get(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key]
        return undefined
    }, obj)
}

describe("namespace emails nos locales publicados", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} tem todas as chaves de emails preenchidas`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            for (const path of REQUIRED_PATHS) {
                const value = get((messages as Record<string, unknown>).emails, path)
                expect(typeof value, `${locale} → emails.${path}`).toBe("string")
                expect((value as string).length, `${locale} → emails.${path}`).toBeGreaterThan(0)
            }
        })
    }
})

describe("placeholders do namespace emails", () => {
    // Um {nome} que virou {name} na traducao aparece cru no e-mail do
    // comprador. O teste compara contra o portugues, que e a fonte.
    const COM_PLACEHOLDER: Array<[string, string]> = [
        ["signup.greeting", "{nome}"],
        ["purchase.greeting", "{nome}"],
        ["purchase.subject", "{pedido}"],
    ]

    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} preserva os placeholders`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            for (const [path, placeholder] of COM_PLACEHOLDER) {
                const value = get((messages as Record<string, unknown>).emails, path) as string
                expect(value, `${locale} → emails.${path}`).toContain(placeholder)
            }
        })
    }
})
```

- [ ] **Step 9: Rodar e confirmar que passa**

Run: `npm test -- lib/i18n/messages-emails.test.ts`
Expected: PASS — 14 testes (7 locales × 2 describes).

Se falhar, é chave faltando ou placeholder traduzido por engano em algum idioma. Consertar o JSON, não o teste.

- [ ] **Step 10: Escrever o teste do helper de i18n**

Criar `lib/email/i18n.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { interpolate, loadEmailBlock, loadEmailCommon } from "./i18n"

describe("interpolate", () => {
    it("troca o placeholder pelo valor", () => {
        expect(interpolate("Olá {nome},", { nome: "Werner" })).toBe("Olá Werner,")
    })

    it("troca todas as ocorrências do mesmo placeholder", () => {
        expect(interpolate("{a} e {a}", { a: "x" })).toBe("x e x")
    })

    it("deixa intacto o placeholder sem valor", () => {
        // Melhor deixar visivel do que trocar por "undefined": quem ler o
        // e-mail de teste percebe na hora que faltou passar a variavel.
        expect(interpolate("Olá {nome},", {})).toBe("Olá {nome},")
    })

    it("nao quebra com texto sem placeholder", () => {
        expect(interpolate("Compra confirmada", { nome: "x" })).toBe("Compra confirmada")
    })
})

describe("loadEmailBlock", () => {
    it("devolve o bloco no idioma pedido", async () => {
        const bloco = await loadEmailBlock("de", "signup")
        expect(bloco.button).toBe("E-Mail-Adresse bestätigen")
    })

    it("devolve o bloco do e-mail de compra", async () => {
        const bloco = await loadEmailBlock("nl", "purchase")
        expect(bloco.heading).toBe("Aankoop bevestigd")
    })
})

describe("loadEmailCommon", () => {
    it("devolve o rodape no idioma pedido", async () => {
        const comum = await loadEmailCommon("fr")
        expect(comum.support).toContain("support")
    })
})
```

- [ ] **Step 11: Rodar e confirmar que falha**

Run: `npm test -- lib/email/i18n.test.ts`
Expected: FAIL — `Failed to resolve import "./i18n"`.

- [ ] **Step 12: Escrever `lib/email/i18n.ts`**

```ts
// lib/email/i18n.ts
//
// Textos dos e-mails, por idioma.
//
// Os e-mails vivem fora do React, entao nao ha contexto do next-intl e nao da
// para usar useTranslations. O que sobra e ler o mesmo messages/<locale>.json
// que a interface usa — mesma fonte, mesma revisao de traducao — e interpolar
// na mao.
//
// A interpolacao usa a mesma sintaxe do next-intl ({nome}) de proposito: quem
// mexer numa chave de e-mail nao precisa lembrar que ali a regra e outra.

import { loadMessages } from "@/lib/i18n/load-messages"
import type { Locale } from "@/lib/i18n/locales"

export type EmailBlock = Record<string, string>

export type EmailBlockName = "signup" | "accountExists" | "purchase"

/** Troca {chave} pelo valor. Placeholder sem valor fica visivel, em vez de virar "undefined". */
export function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (original, chave: string) => {
        return chave in vars ? vars[chave] : original
    })
}

async function emailsDe(locale: Locale): Promise<Record<string, EmailBlock>> {
    // loadMessages ja funde o locale com o portugues, entao chave sem
    // traducao cai no texto em portugues em vez de sumir do e-mail.
    const messages = (await loadMessages(locale)) as unknown as {
        emails: Record<string, EmailBlock>
    }

    return messages.emails
}

export async function loadEmailBlock(locale: Locale, block: EmailBlockName): Promise<EmailBlock> {
    return (await emailsDe(locale))[block]
}

export async function loadEmailCommon(locale: Locale): Promise<EmailBlock> {
    return (await emailsDe(locale)).common
}
```

- [ ] **Step 13: Rodar e confirmar que passa**

Run: `npm test -- lib/email/i18n.test.ts`
Expected: PASS — 7 testes.

- [ ] **Step 14: Rodar a suíte inteira e o lint**

Run: `npm test`
Expected: PASS — 655 testes (634 + 14 + 7).

Run: `npx eslint lib/email/i18n.ts lib/email/i18n.test.ts lib/i18n/messages-emails.test.ts`
Expected: zero problema novo.

- [ ] **Step 15: Commit**

```bash
git add messages/pt.json messages/en.json messages/de.json messages/fr.json messages/es.json messages/it.json messages/nl.json
git add lib/email/i18n.ts lib/email/i18n.test.ts lib/i18n/messages-emails.test.ts
git commit -m "feat(email): textos dos e-mails transacionais nos 7 idiomas"
```

---

### Task 4: A casca compartilhada e o e-mail de compra no idioma do comprador

A casca (cabeçalho com logo, card, rodapé) sai de dentro do template de compra e vira módulo próprio. O e-mail de compra passa a receber locale.

**Files:**
- Create: `lib/email/templates/layout.ts`
- Modify: `lib/email/templates/purchase-confirmation.ts` (reescrita)
- Create: `lib/email/templates/purchase-confirmation.test.ts`
- Modify: `lib/email/purchase.ts`

**Interfaces:**
- Consumes: `loadEmailBlock`, `loadEmailCommon`, `interpolate` (Task 3); `localeFromUserLanguage` (Task 2); `htmlLangFor` de `@/lib/i18n/locales`.
- Produces:
  - `renderEmailLayout(params: { heading: string; tagline: string; support: string; bodyHtml: string }): string` — a URL da aplicação sai de `getPublicAppUrl()` dentro do módulo, não por parâmetro
  - `renderEmailButton(href: string, label: string): string`
  - `generatePurchaseConfirmationEmail(data: PurchaseConfirmationTemplateData, locale: Locale): Promise<{ subject: string; html: string }>` — **agora assíncrona e com segundo parâmetro**

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/email/templates/purchase-confirmation.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { generatePurchaseConfirmationEmail } from "./purchase-confirmation"

const DADOS = {
    userName: "Heitor",
    purchaseId: "cmsgu5l1d0001l704ekvxhxe1",
    purchaseDate: new Date("2026-08-06T09:30:00Z"),
    total: 5,
    currency: "EUR",
    items: [{ name: "Estudo de mercado — Alemanha", price: 5 }],
    accessUrl: "https://www.easyprospect.com.br/my-purchases?token=abc",
}

describe("generatePurchaseConfirmationEmail", () => {
    it("sai em portugues quando o locale e pt", async () => {
        const { subject, html } = await generatePurchaseConfirmationEmail(DADOS, "pt")

        expect(subject).toContain("Sua compra foi confirmada")
        expect(html).toContain("Compra confirmada")
        expect(html).toContain("Olá Heitor")
    })

    it("sai em alemao quando o locale e de", async () => {
        // O caso que motivou o trabalho: comprador alemao, e-mail em alemao.
        const { subject, html } = await generatePurchaseConfirmationEmail(DADOS, "de")

        expect(subject).toContain("Ihr Kauf ist bestätigt")
        expect(html).toContain("Kauf bestätigt")
        expect(html).toContain("Hallo Heitor")
        expect(html).not.toContain("Compra confirmada")
    })

    it("formata o valor no padrao do locale", async () => {
        const alemao = await generatePurchaseConfirmationEmail(DADOS, "de")
        const portugues = await generatePurchaseConfirmationEmail(DADOS, "pt")

        // Alemao usa virgula decimal e o simbolo depois do numero.
        expect(alemao.html).toContain("5,00")
        expect(portugues.html).toContain("5,00")
        expect(alemao.html).not.toEqual(portugues.html)
    })

    it("formata a data no padrao do locale", async () => {
        const { html } = await generatePurchaseConfirmationEmail(DADOS, "en")

        // en-US escreve mes/dia; pt-BR escreveria 06/08.
        expect(html).toContain("08/06/2026")
    })

    it("mostra o numero curto do pedido no assunto", async () => {
        const { subject } = await generatePurchaseConfirmationEmail(DADOS, "pt")

        expect(subject).toContain("cmsgu5l1")
        expect(subject).not.toContain("l704ekvxhxe1")
    })

    it("leva o link de acesso e os itens", async () => {
        const { html } = await generatePurchaseConfirmationEmail(DADOS, "pt")

        expect(html).toContain(DADOS.accessUrl)
        expect(html).toContain("Estudo de mercado — Alemanha")
    })

    it("nao deixa placeholder cru no HTML", async () => {
        const { subject, html } = await generatePurchaseConfirmationEmail(DADOS, "it")

        expect(subject).not.toMatch(/\{\w+\}/)
        expect(html).not.toMatch(/\{\w+\}/)
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/email/templates/purchase-confirmation.test.ts`
Expected: FAIL — a função de hoje é síncrona e ignora o segundo parâmetro, então `subject` sai em português no caso alemão.

- [ ] **Step 3: Escrever `lib/email/templates/layout.ts`**

```ts
// lib/email/templates/layout.ts
//
// A casca comum dos e-mails que o Easy Prospect manda em nome proprio.
//
// Nasceu de dentro de purchase-confirmation.ts: com tres e-mails na mesma
// marca, manter tres copias do cabecalho significaria que trocar a logo ou a
// cor exigiria lembrar de tres lugares — e o terceiro sempre fica para tras.

import { getPublicAppUrl } from "@/lib/env"

export interface EmailLayoutParams {
    /** Titulo grande no cabecalho colorido. */
    heading: string
    /** Linha de assinatura sob o titulo. */
    tagline: string
    /** Linha de suporte no rodape. */
    support: string
    /** Miolo ja renderizado, entre o cabecalho e o rodape. */
    bodyHtml: string
}

export function renderEmailLayout(params: EmailLayoutParams): string {
    const appUrl = getPublicAppUrl()

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">

          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #003048 0%, #0C4160 100%); border-radius: 16px 16px 0 0;">
              <!-- A maioria dos clientes de e-mail bloqueia imagem remota por
                   padrão, então o nome vem em texto logo abaixo: se a logo não
                   carregar, o cabeçalho continua identificando o remetente. -->
              <img src="${appUrl}/logo-icon.png" width="56" height="56" alt="Easy Prospect"
                   style="display: block; margin: 0 auto 16px; border-radius: 12px;" />
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">${params.heading}</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">${params.tagline}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              ${params.bodyHtml}

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 13px; margin: 0;">
                  ${params.support}<br>
                  ${params.tagline}
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/** Botao principal, na cor da marca. Repetido nos tres e-mails. */
export function renderEmailButton(href: string, label: string): string {
    return `
                <a href="${href}"
                   style="display: inline-block; background-color: #2ec4b6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(46, 196, 182, 0.3);">
                  ${label}
                </a>
  `
}
```

- [ ] **Step 4: Reescrever `lib/email/templates/purchase-confirmation.ts`**

Substituir o arquivo inteiro por:

```ts
// lib/email/templates/purchase-confirmation.ts
//
// E-mail de confirmacao de compra, no idioma do comprador.
//
// Era fixo em portugues, com toLocaleDateString("pt-BR") cravado — e o mercado
// principal e a Alemanha. O locale entra como parametro em vez de sair de uma
// variavel global porque o webhook do provedor chega sem sessao: quem sabe o
// idioma e a Purchase, via User.language.

import { getPublicAppUrl } from "@/lib/env"
import { htmlLangFor, type Locale } from "@/lib/i18n/locales"
import { loadEmailBlock, loadEmailCommon, interpolate } from "@/lib/email/i18n"
import { renderEmailLayout, renderEmailButton } from "./layout"

interface PurchaseConfirmationTemplateData {
    userName: string
    purchaseId: string
    purchaseDate: Date
    total: number
    currency: string
    items: Array<{
        name: string
        price: number
    }>
    accessUrl: string
}

export async function generatePurchaseConfirmationEmail(
    data: PurchaseConfirmationTemplateData,
    locale: Locale
): Promise<{ subject: string; html: string }> {
    const appUrl = getPublicAppUrl()
    const t = await loadEmailBlock(locale, "purchase")
    const comum = await loadEmailCommon(locale)

    // htmlLangFor devolve a tag BCP 47 ("de" -> "de-DE"), que e o que o Intl
    // exige: "de" sozinho nao define separador decimal nem formato de data.
    const tagIntl = htmlLangFor(locale)

    const formattedDate = data.purchaseDate.toLocaleDateString(tagIntl, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })

    const dinheiro = new Intl.NumberFormat(tagIntl, {
        style: "currency",
        currency: data.currency,
    })

    const numeroCurto = data.purchaseId.slice(0, 8)

    const itemsHtml = data.items
        .map(
            (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #111827;">${item.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <strong style="color: #111827;">${dinheiro.format(item.price)}</strong>
      </td>
    </tr>
  `
        )
        .join("")

    const subject = interpolate(t.subject, { pedido: numeroCurto })

    const bodyHtml = `
              <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                ${interpolate(t.greeting, { nome: data.userName })}<br><br>
                ${t.intro}
              </p>

              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="33%" style="padding-bottom: 16px;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">${t.orderLabel}</span>
                      <strong style="color: #111827; font-size: 16px;">#${numeroCurto}</strong>
                    </td>
                    <td width="33%" style="padding-bottom: 16px;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">${t.dateLabel}</span>
                      <strong style="color: #111827; font-size: 16px;">${formattedDate}</strong>
                    </td>
                    <td width="33%" style="padding-bottom: 16px; text-align: right;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">${t.totalLabel}</span>
                      <strong style="color: #2ec4b6; font-size: 20px;">${dinheiro.format(data.total)}</strong>
                    </td>
                  </tr>
                </table>
              </div>

              <h2 style="color: #4a2c5a; font-size: 18px; margin: 0 0 16px;">${t.itemsTitle}</h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${itemsHtml}
              </table>

              <div style="text-align: center; margin-bottom: 32px;">
                <p style="color: #374151; font-size: 15px; margin: 0 0 20px;">${t.accessIntro}</p>
                ${renderEmailButton(data.accessUrl, t.accessButton)}
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">🔒 ${t.linkNote}</p>
              </div>

              <div style="background: linear-gradient(135deg, #003048 0%, #0C4160 100%); border-radius: 8px; padding: 24px; text-align: center; margin-top: 24px;">
                <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">${t.catalogTitle}</h3>
                <p style="color: rgba(255,255,255,0.95); font-size: 14px; margin: 0 0 16px;">${t.catalogText}</p>
                <a href="${appUrl}/catalog"
                   style="display: inline-block; background-color: #ffffff; color: #003048; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  ${t.catalogButton}
                </a>
              </div>
  `

    return {
        subject,
        html: renderEmailLayout({
            heading: t.heading,
            tagline: comum.tagline,
            support: comum.support,
            bodyHtml,
        }),
    }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npm test -- lib/email/templates/purchase-confirmation.test.ts`
Expected: PASS — 7 testes.

- [ ] **Step 6: Passar o locale no chamador**

Em `lib/email/purchase.ts`, no `select` do usuário dentro do `findUnique` da compra, acrescentar `language`:

```ts
                user: {
                    select: {
                        email: true,
                        name: true,
                        language: true,
                    },
                },
```

E a chamada ao template passa a ser assíncrona e com locale:

```ts
        // O idioma sai da conta do comprador, nao da requisicao: o webhook do
        // provedor chega sem sessao e sem cabecalho de idioma.
        const { subject, html } = await generatePurchaseConfirmationEmail({
            userName: purchase.user.name || purchase.user.email.split("@")[0],
            purchaseId: purchase.id,
            purchaseDate: purchase.createdAt,
            total: Number(purchase.total),
            currency: purchase.currency,
            // Sem leadsCount: as listas ativas têm totalLeads = 0 desde que o
            // produto virou o estudo em PDF, e o e-mail anunciava "0 leads" ao
            // comprador que acabou de pagar. Saiu do funil em 48e8b4c; o
            // e-mail tinha ficado de fora daquela limpeza.
            items: purchase.items.map((item) => ({
                name: item.list.name,
                price: Number(item.price),
            })),
            accessUrl,
        }, localeFromUserLanguage(purchase.user.language))
```

E o import, junto dos outros no topo:

```ts
import { localeFromUserLanguage } from "@/lib/i18n/user-locale"
```

- [ ] **Step 7: Verificar tipos, suíte e lint**

Run: `npx tsc --noEmit`
Expected: sem erros. Se aparecer erro em `lib/email/purchase.ts` sobre `Promise`, é o `await` faltando na chamada do template.

Run: `npm test`
Expected: PASS — 662 testes (655 + 7).

Run: `npx eslint lib/email/templates/layout.ts lib/email/templates/purchase-confirmation.ts lib/email/templates/purchase-confirmation.test.ts lib/email/purchase.ts`
Expected: zero problema novo.

- [ ] **Step 8: Commit**

```bash
git add lib/email/templates/layout.ts lib/email/templates/purchase-confirmation.ts lib/email/templates/purchase-confirmation.test.ts lib/email/purchase.ts
git commit -m "feat(email): confirmacao de compra no idioma do comprador"
```

---

### Task 5: A política de senha

Módulo puro, para a tela e a rota compartilharem a mesma regra. Devolve um **código**, não uma frase — quem traduz é a tela.

**Files:**
- Create: `lib/auth/password-policy.ts`
- Create: `lib/auth/password-policy.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `PASSWORD_MIN_LENGTH: 8`
  - `type PasswordProblem = "curta" | "semLetra" | "semNumero"`
  - `validarSenha(senha: string): PasswordProblem | null` — `null` quando está boa

> **Sem schema zod aqui de propósito.** A rota não valida senha pelo zod: ela precisa do
> *código* do problema para a tela traduzir, e um `ZodError` só diria "inválida". Manter o
> módulo sem dependência também o deixa barato de importar no componente client.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/auth/password-policy.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { validarSenha, PASSWORD_MIN_LENGTH } from "./password-policy"

describe("validarSenha", () => {
    it("aceita senha com 8 caracteres, letra e numero", () => {
        expect(validarSenha("prospect1")).toBeNull()
    })

    it("recusa senha curta", () => {
        expect(validarSenha("abc123")).toBe("curta")
    })

    it("recusa senha so de numeros", () => {
        // O caso que a regra existe para pegar.
        expect(validarSenha("12345678")).toBe("semLetra")
    })

    it("recusa senha so de letras", () => {
        expect(validarSenha("prospect")).toBe("semNumero")
    })

    it("reclama do tamanho antes do resto", () => {
        // Uma mensagem por vez: dizer "curta, sem letra e sem numero" de uma
        // vez so faz a pessoa reescrever tudo as cegas.
        expect(validarSenha("abc")).toBe("curta")
    })

    it("aceita letra acentuada como letra", () => {
        // \p{L} cobre alfabetos alem do ASCII — o mercado e europeu.
        expect(validarSenha("münchen1")).toBeNull()
    })

    it("aceita simbolo, sem exigir", () => {
        expect(validarSenha("prospect1!")).toBeNull()
    })

    it("conta o comprimento em caracteres visiveis", () => {
        expect(PASSWORD_MIN_LENGTH).toBe(8)
        expect(validarSenha("a1234567")).toBeNull()
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/auth/password-policy.test.ts`
Expected: FAIL — `Failed to resolve import "./password-policy"`.

- [ ] **Step 3: Escrever `lib/auth/password-policy.ts`**

```ts
// lib/auth/password-policy.ts
//
// A regra de senha do cadastro, num lugar so.
//
// Devolve CODIGO, nao frase: a tela precisa da mensagem traduzida nos 7
// idiomas, e uma frase em portugues vinda daqui seria exatamente o problema
// que este trabalho esta consertando.
//
// A regra vale em tres camadas — tela, rota e painel do Supabase. A tela e
// burlavel, entao a que realmente conta e a da rota; a da tela existe para a
// pessoa ler o motivo antes de enviar.

export const PASSWORD_MIN_LENGTH = 8

export type PasswordProblem = "curta" | "semLetra" | "semNumero"

/** Devolve o primeiro problema encontrado, ou null quando a senha passa. */
export function validarSenha(senha: string): PasswordProblem | null {
    if (senha.length < PASSWORD_MIN_LENGTH) {
        return "curta"
    }

    // \p{L} em vez de [a-z]: o mercado e europeu e "münchen" tem letras.
    if (!/\p{L}/u.test(senha)) {
        return "semLetra"
    }

    if (!/\d/.test(senha)) {
        return "semNumero"
    }

    return null
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- lib/auth/password-policy.test.ts`
Expected: PASS — 8 testes.

- [ ] **Step 5: Lint e commit**

Run: `npx eslint lib/auth/password-policy.ts lib/auth/password-policy.test.ts`
Expected: zero problema novo.

```bash
git add lib/auth/password-policy.ts lib/auth/password-policy.test.ts
git commit -m "feat(auth): regra de senha do cadastro em modulo proprio"
```

---

### Task 6: Os templates de cadastro e de "já existe conta"

**Files:**
- Create: `lib/email/templates/signup-confirmation.ts`
- Create: `lib/email/templates/account-exists.ts`
- Create: `lib/email/templates/auth-emails.test.ts`

**Interfaces:**
- Consumes: `loadEmailBlock`, `loadEmailCommon`, `interpolate` (Task 3); `renderEmailLayout`, `renderEmailButton` (Task 4).
- Produces:
  - `generateSignupConfirmationEmail(data: { userName: string; confirmUrl: string }, locale: Locale): Promise<{ subject: string; html: string }>`
  - `generateAccountExistsEmail(data: { signInUrl: string }, locale: Locale): Promise<{ subject: string; html: string }>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/email/templates/auth-emails.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { generateSignupConfirmationEmail } from "./signup-confirmation"
import { generateAccountExistsEmail } from "./account-exists"

const CONFIRM_URL = "https://www.easyprospect.com.br/auth/confirm?token_hash=abc&next=%2Fmy-purchases"
const SIGN_IN_URL = "https://www.easyprospect.com.br/sign-in?lang=de"

describe("generateSignupConfirmationEmail", () => {
    it("sai em alemao quando o locale e de", async () => {
        const { subject, html } = await generateSignupConfirmationEmail(
            { userName: "Heitor", confirmUrl: CONFIRM_URL },
            "de"
        )

        expect(subject).toBe("Bestätigen Sie Ihre E-Mail-Adresse — Easy Prospect")
        expect(html).toContain("Hallo Heitor")
        expect(html).toContain("E-Mail-Adresse bestätigen")
    })

    it("sai em portugues quando o locale e pt", async () => {
        const { subject, html } = await generateSignupConfirmationEmail(
            { userName: "Werner", confirmUrl: CONFIRM_URL },
            "pt"
        )

        expect(subject).toContain("Confirme seu e-mail")
        expect(html).toContain("Olá Werner")
    })

    it("leva o link de confirmacao", async () => {
        const { html } = await generateSignupConfirmationEmail(
            { userName: "Werner", confirmUrl: CONFIRM_URL },
            "pt"
        )

        expect(html).toContain(CONFIRM_URL)
    })

    it("nao deixa placeholder cru", async () => {
        const { subject, html } = await generateSignupConfirmationEmail(
            { userName: "Werner", confirmUrl: CONFIRM_URL },
            "nl"
        )

        expect(subject).not.toMatch(/\{\w+\}/)
        expect(html).not.toMatch(/\{\w+\}/)
    })
})

describe("generateAccountExistsEmail", () => {
    it("sai no idioma pedido", async () => {
        const { subject, html } = await generateAccountExistsEmail({ signInUrl: SIGN_IN_URL }, "de")

        expect(subject).toBe("Sie haben bereits ein Konto — Easy Prospect")
        expect(html).toContain("Bei meinem Konto anmelden")
    })

    it("leva o link de entrada e nenhum link de confirmacao", async () => {
        // Este e-mail nunca pode carregar token: ele vai para o dono do
        // endereco depois de UMA TENTATIVA de terceiro. Um link de confirmacao
        // aqui entregaria a conta a quem tentou o cadastro.
        const { html } = await generateAccountExistsEmail({ signInUrl: SIGN_IN_URL }, "pt")

        expect(html).toContain(SIGN_IN_URL)
        expect(html).not.toContain("token_hash")
    })

    it("nao trata o destinatario pelo nome", async () => {
        // Nao sabemos quem tentou o cadastro, e o nome digitado por um
        // terceiro nao deve aparecer no e-mail do titular.
        const { html } = await generateAccountExistsEmail({ signInUrl: SIGN_IN_URL }, "pt")

        expect(html).toContain("Olá,")
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/email/templates/auth-emails.test.ts`
Expected: FAIL — `Failed to resolve import "./signup-confirmation"`.

- [ ] **Step 3: Escrever `lib/email/templates/signup-confirmation.ts`**

```ts
// lib/email/templates/signup-confirmation.ts
//
// E-mail de confirmacao de cadastro.
//
// Ate aqui quem mandava era o Supabase, com o template do painel: um so, em
// ingles de fabrica, fora do git. Este passa a sair pelo nosso SMTP, no idioma
// que a pessoa escolheu na tela.

import type { Locale } from "@/lib/i18n/locales"
import { loadEmailBlock, loadEmailCommon, interpolate } from "@/lib/email/i18n"
import { renderEmailLayout, renderEmailButton } from "./layout"

export async function generateSignupConfirmationEmail(
    data: { userName: string; confirmUrl: string },
    locale: Locale
): Promise<{ subject: string; html: string }> {
    const t = await loadEmailBlock(locale, "signup")
    const comum = await loadEmailCommon(locale)

    const bodyHtml = `
              <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                ${interpolate(t.greeting, { nome: data.userName })}<br><br>
                ${t.intro}
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                ${renderEmailButton(data.confirmUrl, t.button)}
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">🔒 ${t.expires}</p>
              </div>

              <p style="color: #6b7280; font-size: 13px; margin: 0;">${t.ignore}</p>
  `

    return {
        subject: t.subject,
        html: renderEmailLayout({
            heading: t.heading,
            tagline: comum.tagline,
            support: comum.support,
            bodyHtml,
        }),
    }
}
```

- [ ] **Step 4: Escrever `lib/email/templates/account-exists.ts`**

```ts
// lib/email/templates/account-exists.ts
//
// E-mail de "voce ja tem uma conta".
//
// Existe por causa de uma escolha de seguranca: a rota de cadastro responde
// IGUAL para e-mail novo e e-mail ja cadastrado, senao qualquer um descobriria
// quem e cliente testando enderecos. O silencio na resposta se paga com este
// aviso, que vai para o dono do endereco.
//
// Sem token e sem nome de proposito: quem disparou o cadastro pode ser um
// terceiro, e nem o link de confirmacao nem o nome digitado por ele tem o que
// fazer na caixa do titular.

import type { Locale } from "@/lib/i18n/locales"
import { loadEmailBlock, loadEmailCommon } from "@/lib/email/i18n"
import { renderEmailLayout, renderEmailButton } from "./layout"

export async function generateAccountExistsEmail(
    data: { signInUrl: string },
    locale: Locale
): Promise<{ subject: string; html: string }> {
    const t = await loadEmailBlock(locale, "accountExists")
    const comum = await loadEmailCommon(locale)

    const bodyHtml = `
              <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                ${t.greeting}<br><br>
                ${t.intro}
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                ${renderEmailButton(data.signInUrl, t.button)}
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">${t.resetHint}</p>
              </div>

              <p style="color: #6b7280; font-size: 13px; margin: 0;">${t.ignore}</p>
  `

    return {
        subject: t.subject,
        html: renderEmailLayout({
            heading: t.heading,
            tagline: comum.tagline,
            support: comum.support,
            bodyHtml,
        }),
    }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npm test -- lib/email/templates/auth-emails.test.ts`
Expected: PASS — 7 testes.

- [ ] **Step 6: Lint e commit**

Run: `npx eslint lib/email/templates/signup-confirmation.ts lib/email/templates/account-exists.ts lib/email/templates/auth-emails.test.ts`
Expected: zero problema novo.

```bash
git add lib/email/templates/signup-confirmation.ts lib/email/templates/account-exists.ts lib/email/templates/auth-emails.test.ts
git commit -m "feat(email): templates de confirmacao de cadastro e de conta existente"
```

---

### Task 7: O núcleo do cadastro

A regra do cadastro, separada da rota, com as dependências injetadas — é o que torna possível testar "e-mail já existe responde igual" sem tocar rede.

**Files:**
- Create: `lib/auth/sign-up.ts`
- Create: `lib/auth/sign-up.test.ts`

**Interfaces:**
- Consumes: `validarSenha` (Task 5); `generateSignupConfirmationEmail`, `generateAccountExistsEmail` (Task 6); `type Locale`.
- Produces:
  - `type SignUpInput = { name: string; email: string; password: string; locale: Locale }`
  - `type SignUpDeps = { criarUsuario: (input: { email: string; password: string; metadata: Record<string, string> }) => Promise<CriarUsuarioResult>; enviarEmail: (params: { to: string; subject: string; html: string }) => Promise<{ success: boolean }>; appUrl: string }`
  - `type CriarUsuarioResult = { situacao: "criado"; tokenHash: string } | { situacao: "ja_existe" }`
  - `type SignUpOutcome = { status: "ok" } | { status: "senha_fraca"; problema: PasswordProblem } | { status: "erro" }`
  - `registrarUsuario(deps: SignUpDeps, input: SignUpInput): Promise<SignUpOutcome>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/auth/sign-up.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"
import { registrarUsuario, type SignUpDeps } from "./sign-up"

const ENTRADA = {
    name: "Heitor",
    email: "heitor@teste.com",
    password: "prospect1",
    locale: "de" as const,
}

function criarDeps(over: Partial<SignUpDeps> = {}): SignUpDeps {
    return {
        criarUsuario: vi.fn().mockResolvedValue({ situacao: "criado", tokenHash: "hash-1" }),
        enviarEmail: vi.fn().mockResolvedValue({ success: true }),
        appUrl: "https://www.easyprospect.com.br",
        ...over,
    }
}

describe("registrarUsuario", () => {
    it("cria o usuario e manda a confirmacao no idioma da tela", async () => {
        const deps = criarDeps()

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "ok" })
        expect(deps.enviarEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "heitor@teste.com",
                subject: "Bestätigen Sie Ihre E-Mail-Adresse — Easy Prospect",
            })
        )
    })

    it("guarda o locale no metadata, que e de onde User.language sai depois", async () => {
        const deps = criarDeps()

        await registrarUsuario(deps, ENTRADA)

        expect(deps.criarUsuario).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "heitor@teste.com",
                metadata: expect.objectContaining({ name: "Heitor", locale: "de", source: "marketplace" }),
            })
        )
    })

    it("monta o link de confirmacao apontando para /auth/confirm", async () => {
        const deps = criarDeps()

        await registrarUsuario(deps, ENTRADA)

        const [{ html }] = (deps.enviarEmail as ReturnType<typeof vi.fn>).mock.calls[0]
        expect(html).toContain("https://www.easyprospect.com.br/auth/confirm?token_hash=hash-1")
        expect(html).toContain("next=%2Fmy-purchases")
    })

    it("e-mail ja cadastrado responde IGUAL ao caso novo", async () => {
        // O ponto central: a resposta nao pode contar quem e cliente.
        const deps = criarDeps({
            criarUsuario: vi.fn().mockResolvedValue({ situacao: "ja_existe" }),
        })

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "ok" })
    })

    it("e-mail ja cadastrado recebe o aviso, nao a confirmacao", async () => {
        const deps = criarDeps({
            criarUsuario: vi.fn().mockResolvedValue({ situacao: "ja_existe" }),
        })

        await registrarUsuario(deps, ENTRADA)

        const [{ subject, html }] = (deps.enviarEmail as ReturnType<typeof vi.fn>).mock.calls[0]
        expect(subject).toBe("Sie haben bereits ein Konto — Easy Prospect")
        expect(html).not.toContain("token_hash")
    })

    it("recusa senha fraca sem chamar o Supabase", async () => {
        const deps = criarDeps()

        const resultado = await registrarUsuario(deps, { ...ENTRADA, password: "12345678" })

        expect(resultado).toEqual({ status: "senha_fraca", problema: "semLetra" })
        expect(deps.criarUsuario).not.toHaveBeenCalled()
        expect(deps.enviarEmail).not.toHaveBeenCalled()
    })

    it("falha na criacao vira erro, sem mandar e-mail", async () => {
        const deps = criarDeps({
            criarUsuario: vi.fn().mockRejectedValue(new Error("supabase fora do ar")),
        })

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "erro" })
        expect(deps.enviarEmail).not.toHaveBeenCalled()
    })

    it("falha no envio vira erro, para a tela nao prometer e-mail que nao saiu", async () => {
        const deps = criarDeps({
            enviarEmail: vi.fn().mockResolvedValue({ success: false }),
        })

        const resultado = await registrarUsuario(deps, ENTRADA)

        expect(resultado).toEqual({ status: "erro" })
    })

    it("normaliza o e-mail antes de criar", async () => {
        const deps = criarDeps()

        await registrarUsuario(deps, { ...ENTRADA, email: "  Heitor@Teste.com " })

        expect(deps.criarUsuario).toHaveBeenCalledWith(
            expect.objectContaining({ email: "heitor@teste.com" })
        )
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/auth/sign-up.test.ts`
Expected: FAIL — `Failed to resolve import "./sign-up"`.

- [ ] **Step 3: Escrever `lib/auth/sign-up.ts`**

```ts
// lib/auth/sign-up.ts
//
// A regra do cadastro, separada da rota.
//
// Fica aqui, e nao no route.ts, porque e a parte que precisa de teste: a
// promessa de que e-mail ja cadastrado responde igual a e-mail novo nao pode
// depender de alguem lembrar dela na proxima edicao. A rota vira fiacao.
//
// As dependencias entram por parametro pelo mesmo motivo de
// lib/checkout/fulfillment.ts: nenhum teste toca rede.

import type { Locale } from "@/lib/i18n/locales"
import { validarSenha, type PasswordProblem } from "./password-policy"
import { generateSignupConfirmationEmail } from "@/lib/email/templates/signup-confirmation"
import { generateAccountExistsEmail } from "@/lib/email/templates/account-exists"

/** Para onde a pessoa vai depois de confirmar. O CRM nao e destino de cadastro externo. */
const DESTINO_APOS_CONFIRMAR = "/my-purchases"

export type SignUpInput = {
    name: string
    email: string
    password: string
    locale: Locale
}

export type CriarUsuarioResult =
    | { situacao: "criado"; tokenHash: string }
    | { situacao: "ja_existe" }

export type SignUpDeps = {
    criarUsuario: (input: {
        email: string
        password: string
        metadata: Record<string, string>
    }) => Promise<CriarUsuarioResult>
    enviarEmail: (params: { to: string; subject: string; html: string }) => Promise<{ success: boolean }>
    appUrl: string
}

export type SignUpOutcome =
    | { status: "ok" }
    | { status: "senha_fraca"; problema: PasswordProblem }
    | { status: "erro" }

function urlDeConfirmacao(appUrl: string, tokenHash: string, locale: Locale): string {
    const params = new URLSearchParams({
        token_hash: tokenHash,
        next: DESTINO_APOS_CONFIRMAR,
        lang: locale,
    })

    return `${appUrl}/auth/confirm?${params.toString()}`
}

function urlDeEntrada(appUrl: string, locale: Locale): string {
    return `${appUrl}/sign-in?lang=${locale}`
}

export async function registrarUsuario(
    deps: SignUpDeps,
    input: SignUpInput
): Promise<SignUpOutcome> {
    const problema = validarSenha(input.password)
    if (problema) {
        return { status: "senha_fraca", problema }
    }

    // O endereco vira a identidade da conta; espaco invisivel e caixa alta
    // criariam duas contas para a mesma pessoa.
    const email = input.email.trim().toLowerCase()

    let resultado: CriarUsuarioResult
    try {
        resultado = await deps.criarUsuario({
            email,
            password: input.password,
            metadata: {
                name: input.name.trim(),
                locale: input.locale,
                // A variante CRM saiu da tela; todo cadastro externo e do
                // marketplace.
                source: "marketplace",
            },
        })
    } catch (error) {
        console.error("[SignUp] Falha ao criar usuario:", error)
        return { status: "erro" }
    }

    const { subject, html } =
        resultado.situacao === "criado"
            ? await generateSignupConfirmationEmail(
                  {
                      userName: input.name.trim(),
                      confirmUrl: urlDeConfirmacao(deps.appUrl, resultado.tokenHash, input.locale),
                  },
                  input.locale
              )
            : await generateAccountExistsEmail(
                  { signInUrl: urlDeEntrada(deps.appUrl, input.locale) },
                  input.locale
              )

    const envio = await deps.enviarEmail({ to: email, subject, html })

    if (!envio.success) {
        // A tela promete "abra seu e-mail". Prometer isso quando o envio
        // falhou deixa a pessoa esperando uma mensagem que nunca vem.
        return { status: "erro" }
    }

    return { status: "ok" }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- lib/auth/sign-up.test.ts`
Expected: PASS — 9 testes.

- [ ] **Step 5: Suíte, lint e commit**

Run: `npm test`
Expected: PASS — 686 testes (662 + 8 da Task 5 + 7 da Task 6 + 9).

Run: `npx eslint lib/auth/sign-up.ts lib/auth/sign-up.test.ts`
Expected: zero problema novo.

```bash
git add lib/auth/sign-up.ts lib/auth/sign-up.test.ts
git commit -m "feat(auth): nucleo do cadastro com resposta igual para e-mail ja cadastrado"
```

---

### Task 8: As rotas

A fiação: a rota que recebe o formulário e a que consome o link do e-mail.

**Files:**
- Create: `app/api/auth/sign-up/route.ts`
- Create: `app/(app)/auth/confirm/route.ts`

**Interfaces:**
- Consumes: `registrarUsuario`, `SignUpDeps` (Task 7); `createAdminClient`; `getSystemSmtpConfig`; `sendEmail`; `checkPersistentRateLimit`, `getClientIp`; `getPublicAppUrl`; `isLocale`, `DEFAULT_LOCALE`.
- Produces:
  - `POST /api/auth/sign-up` → `200 { ok: true }` | `400 { error: "senha_fraca", problema }` | `400 { error: "dados_invalidos" }` | `429` | `500`
  - `GET /auth/confirm?token_hash=&next=&lang=` → redirect

- [ ] **Step 1: Escrever a rota de cadastro**

Criar `app/api/auth/sign-up/route.ts`:

```ts
// app/api/auth/sign-up/route.ts
//
// Cadastro.
//
// Ate aqui o navegador chamava supabase.auth.signUp() direto, e o e-mail saia
// do template do painel — um so, em ingles. Passando por aqui, o e-mail e
// nosso e sai no idioma da tela.
//
// generateLink cria o usuario SEM enviar nada e devolve o token; o envio e a
// linha seguinte, nossa. A regra em si mora em lib/auth/sign-up.ts, que e onde
// os testes estao.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { getSystemSmtpConfig } from "@/lib/email/system-smtp"
import { checkPersistentRateLimit, getClientIp } from "@/lib/rate-limit"
import { getPublicAppUrl } from "@/lib/env"
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales"
import { registrarUsuario, type CriarUsuarioResult } from "@/lib/auth/sign-up"

const corpoSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    // A senha NAO e validada aqui: quem valida e validarSenha, para a tela
    // receber o codigo do problema e traduzir. Aqui so limitamos o tamanho,
    // porque hash de senha gigante e trabalho de CPU de graca para quem ataca.
    password: z.string().min(1).max(200),
    locale: z.string().optional(),
})

function localeDoCorpo(valor: string | undefined): Locale {
    return valor && isLocale(valor) ? valor : DEFAULT_LOCALE
}

export async function POST(request: NextRequest) {
    try {
        // O cadastro nao tem sessao, entao o balde e por IP. O teto e baixo de
        // proposito: era a protecao que vinha de graca com o signUp do
        // Supabase e agora e nossa.
        const permitido = await checkPersistentRateLimit(
            "auth:sign-up",
            getClientIp(request),
            5,
            60_000
        )
        if (!permitido) {
            return NextResponse.json({ error: "too_many_requests" }, { status: 429 })
        }

        const corpo = corpoSchema.safeParse(await request.json())

        if (!corpo.success) {
            return NextResponse.json({ error: "dados_invalidos" }, { status: 400 })
        }

        const smtp = getSystemSmtpConfig()

        if (!smtp) {
            console.error("[SignUp] Nenhuma configuracao SMTP disponivel")
            return NextResponse.json({ error: "servico_indisponivel" }, { status: 503 })
        }

        const admin = createAdminClient()

        const resultado = await registrarUsuario(
            {
                appUrl: getPublicAppUrl(),
                criarUsuario: async ({ email, password, metadata }): Promise<CriarUsuarioResult> => {
                    const { data, error } = await admin.auth.admin.generateLink({
                        type: "signup",
                        email,
                        password,
                        options: { data: metadata },
                    })

                    if (error) {
                        // E-mail ja cadastrado nao e falha: e o outro caminho
                        // previsto, e quem decide o que fazer com ele e
                        // registrarUsuario. O Supabase sinaliza por codigo ou
                        // por 422, dependendo da versao.
                        const jaExiste =
                            error.code === "email_exists" ||
                            error.status === 422 ||
                            /already registered|already exists/i.test(error.message)

                        if (jaExiste) {
                            return { situacao: "ja_existe" }
                        }

                        throw error
                    }

                    const tokenHash = data?.properties?.hashed_token

                    if (!tokenHash) {
                        throw new Error("generateLink devolveu link sem hashed_token")
                    }

                    return { situacao: "criado", tokenHash }
                },
                enviarEmail: async ({ to, subject, html }) => {
                    const envio = await sendEmail({ to, subject, html }, smtp)
                    return { success: envio.success }
                },
            },
            {
                name: corpo.data.name,
                email: corpo.data.email,
                password: corpo.data.password,
                locale: localeDoCorpo(corpo.data.locale),
            }
        )

        if (resultado.status === "senha_fraca") {
            return NextResponse.json(
                { error: "senha_fraca", problema: resultado.problema },
                { status: 400 }
            )
        }

        if (resultado.status === "erro") {
            return NextResponse.json({ error: "falha_no_cadastro" }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("[SignUp] Erro inesperado:", error)
        return NextResponse.json({ error: "falha_no_cadastro" }, { status: 500 })
    }
}
```

- [ ] **Step 2: Escrever a rota de confirmação**

Criar `app/(app)/auth/confirm/route.ts`:

```ts
// app/(app)/auth/confirm/route.ts
//
// Destino do link do NOSSO e-mail de confirmacao.
//
// Existe separada de /auth/callback porque o parametro e outro: o callback
// troca o `code` do fluxo PKCE, que e o que o Supabase manda nos e-mails dele
// (recuperacao de senha, por ora). Aqui chega o `token_hash` do generateLink,
// que se troca por sessao com verifyOtp. Juntar os dois num arquivo so
// significaria um if no meio de dois fluxos de autenticacao sem nada em comum.
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeInternalPath } from "@/lib/auth/safe-redirect"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const tokenHash = searchParams.get("token_hash")
    const next = safeInternalPath(searchParams.get("next"))

    if (!tokenHash) {
        return NextResponse.redirect(`${origin}/sign-in?erro=link_incompleto`)
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({ type: "signup", token_hash: tokenHash })

    if (error) {
        // Caso mais comum: link ja usado ou fora da validade.
        return NextResponse.redirect(`${origin}/sign-in?erro=link_expirado`)
    }

    return NextResponse.redirect(`${origin}${next}`)
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

Se `error.code` não existir no tipo de `AuthError` da versão instalada, trocar a leitura por `(error as { code?: string }).code`.

- [ ] **Step 4: Rodar a suíte e o lint**

Run: `npm test`
Expected: PASS — 686 testes (as rotas não trazem testes próprios; a regra delas está na Task 7).

Run: `npx eslint app/api/auth/sign-up/route.ts "app/(app)/auth/confirm/route.ts"`
Expected: zero problema novo.

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/sign-up/route.ts "app/(app)/auth/confirm/route.ts"
git commit -m "feat(auth): rotas de cadastro proprio e de confirmacao por token_hash"
```

---

### Task 9: A tela de cadastro

A variante do CRM sai, a senha ganha mensagem traduzida, e o formulário passa a chamar a rota nova.

**Files:**
- Modify: `components/auth/sign-up-form.tsx` (reescrita)
- Modify: `messages/{pt,en,de,fr,es,it,nl}.json` (remover 5 chaves, acrescentar 3)
- Modify: `lib/i18n/messages-auth.test.ts`
- Modify: `docs/variaveis-de-ambiente.md`

**Interfaces:**
- Consumes: `POST /api/auth/sign-up` (Task 8); `PASSWORD_MIN_LENGTH` (Task 5).
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Trocar as chaves nos 7 arquivos**

Em cada `messages/<locale>.json`, dentro de `auth.signUp`, **remover** `crmTitle`, `crmSubtitle`, `submitCrm`, `step2Crm`, `ctaCrm` e `createForPurchases`, e **acrescentar** as três mensagens de senha:

| arquivo | `pwdShort` | `pwdNoLetter` | `pwdNoDigit` |
|---|---|---|---|
| `pt.json` | "A senha precisa de pelo menos 8 caracteres." | "A senha precisa de pelo menos uma letra." | "A senha precisa de pelo menos um número." |
| `en.json` | "The password needs at least 8 characters." | "The password needs at least one letter." | "The password needs at least one number." |
| `de.json` | "Das Passwort benötigt mindestens 8 Zeichen." | "Das Passwort benötigt mindestens einen Buchstaben." | "Das Passwort benötigt mindestens eine Ziffer." |
| `fr.json` | "Le mot de passe doit contenir au moins 8 caractères." | "Le mot de passe doit contenir au moins une lettre." | "Le mot de passe doit contenir au moins un chiffre." |
| `es.json` | "La contraseña necesita al menos 8 caracteres." | "La contraseña necesita al menos una letra." | "La contraseña necesita al menos un número." |
| `it.json` | "La password deve avere almeno 8 caratteri." | "La password deve contenere almeno una lettera." | "La password deve contenere almeno un numero." |
| `nl.json` | "Het wachtwoord heeft minimaal 8 tekens nodig." | "Het wachtwoord heeft minimaal één letter nodig." | "Het wachtwoord heeft minimaal één cijfer nodig." |

- [ ] **Step 2: Atualizar o teste de paridade da auth**

Em `lib/i18n/messages-auth.test.ts`, no array `REQUIRED_PATHS`, acrescentar as três chaves novas:

```ts
    "signUp.pwdShort",
    "signUp.pwdNoLetter",
    "signUp.pwdNoDigit",
```

- [ ] **Step 3: Rodar e confirmar que passa**

Run: `npm test -- lib/i18n/messages-auth.test.ts`
Expected: PASS — 7 testes. Falha aqui significa chave faltando em algum idioma.

- [ ] **Step 4: Conferir que nenhuma chave do CRM sobrou**

Run: `grep -rn "crmTitle\|crmSubtitle\|submitCrm\|step2Crm\|ctaCrm\|createForPurchases" messages/ components/ app/`
Expected: nenhuma saída.

- [ ] **Step 5: Reescrever `components/auth/sign-up-form.tsx`**

Substituir o arquivo inteiro por:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ShoppingBag, CheckCircle, Mail } from "lucide-react"
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
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { PASSWORD_MIN_LENGTH, validarSenha, type PasswordProblem } from "@/lib/auth/password-policy"

// A variante "CRM" saiu daqui: o CRM foi desabilitado para uso externo, e a
// tela de login ja tinha fechado essa porta (area `crm` com visivel: false).
// Todo cadastro e do marketplace.

const MENSAGEM_DE_SENHA: Record<PasswordProblem, string> = {
    curta: "signUp.pwdShort",
    semLetra: "signUp.pwdNoLetter",
    semNumero: "signUp.pwdNoDigit",
}

export function SignUpForm() {
    const router = useRouter()
    const t = useTranslations("auth")
    const locale = useLocale() as Locale
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [erroDeSenha, setErroDeSenha] = useState<PasswordProblem | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    // Preserva o idioma ao pular entre sign-up e sign-in.
    const langSuffix = locale !== DEFAULT_LOCALE ? `?lang=${locale}` : ""
    const signInHref = `/sign-in${langSuffix}`

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // A mesma regra roda na rota. Aqui ela existe para a pessoa ler o
        // motivo no idioma dela antes de enviar — o erro do servidor volta
        // como codigo, nao como frase.
        const problema = validarSenha(password)
        if (problema) {
            setErroDeSenha(problema)
            return
        }

        setErroDeSenha(null)
        setIsLoading(true)

        try {
            const resposta = await fetch("/api/auth/sign-up", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, locale }),
            })

            if (!resposta.ok) {
                const corpo = await resposta.json().catch(() => ({}))

                if (corpo.error === "senha_fraca" && corpo.problema) {
                    setErroDeSenha(corpo.problema as PasswordProblem)
                    return
                }

                toast.error(t("signUp.error"))
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
                            <li>{t("signUp.step2Mkt")}</li>
                            <li>{t("signUp.step3")}</li>
                        </ol>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        className="w-full bg-[#4a2c5a] hover:bg-[#5d3a70]"
                        onClick={() => router.push("/catalog")}
                    >
                        {t("signUp.ctaMkt")}
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
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a2c5a] to-[#5d3a70] flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-white" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">{t("signUp.mktTitle")}</CardTitle>
                <CardDescription>{t("signUp.mktSubtitle")}</CardDescription>
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
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setErroDeSenha(null)
                            }}
                            required
                            minLength={PASSWORD_MIN_LENGTH}
                            aria-invalid={erroDeSenha !== null}
                            aria-describedby={erroDeSenha ? "erro-senha" : undefined}
                            disabled={isLoading}
                        />
                        {erroDeSenha && (
                            <p id="erro-senha" className="text-sm text-destructive">
                                {t(MENSAGEM_DE_SENHA[erroDeSenha])}
                            </p>
                        )}
                    </div>

                    <div className="bg-gradient-to-r from-[#4a2c5a]/5 to-[#2ec4b6]/5 rounded-lg p-4 border border-[#2ec4b6]/20">
                        <h3 className="mb-2 font-medium text-foreground">{t("signUp.benefitsTitle")}</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>✓ {t("signUp.benefit1")}</li>
                            <li>✓ {t("signUp.benefit2")}</li>
                            <li>✓ {t("signUp.benefit3")}</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full bg-[#4a2c5a] hover:bg-[#5d3a70]"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("signUp.submitMkt")}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        {t("signUp.haveAccount")}{" "}
                        <Link href={signInHref} className="text-primary hover:underline">
                            {t("signUp.enter")}
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
```

- [ ] **Step 6: Documentar a configuração manual do painel**

Em `docs/variaveis-de-ambiente.md`, acrescentar ao final:

```markdown
## Configuração manual no painel do Supabase

Não vivem no git e precisam ser conferidas depois de qualquer troca de projeto.

- **Authentication → Sign In / Providers → Password:** mínimo de 8 caracteres e
  requisito "Letters and digits". É a rede de fundo da regra que
  `lib/auth/password-policy.ts` aplica na tela e na rota.
- **Authentication → URL Configuration:** a URL do site precisa ser o domínio com
  `www`, que é o canônico. O apex devolve 308 e quebra o link de confirmação.
- **Templates de e-mail (Authentication → Emails):** o de "Confirm sign up" deixou de
  ser usado — quem manda a confirmação de cadastro é `POST /api/auth/sign-up`, pelo nosso
  SMTP. Os demais (recuperação de senha, troca de e-mail) seguem no template do painel,
  em inglês, até entrarem na mesma estrutura.
```

- [ ] **Step 7: Verificar tipos, suíte e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm test`
Expected: PASS — 686 testes.

Run: `npx eslint components/auth/sign-up-form.tsx lib/i18n/messages-auth.test.ts`
Expected: zero problema novo.

- [ ] **Step 8: Conferir no navegador**

Subir o preview (`.claude/launch.json`, porta 3001) e abrir `/sign-up?lang=de`.

Esperado: título em alemão, sem menção a CRM; senha `12345678` mostra a mensagem alemã de "precisa de uma letra" sem enviar o formulário; senha `prospect1` envia e a tela de sucesso aparece.

O envio real do e-mail depende de SMTP configurado no ambiente — se não houver, a rota responde 503 e a tela mostra o toast de erro. Isso é o comportamento correto, não um defeito.

- [ ] **Step 9: Commit**

```bash
git add components/auth/sign-up-form.tsx lib/i18n/messages-auth.test.ts docs/variaveis-de-ambiente.md
git add messages/pt.json messages/en.json messages/de.json messages/fr.json messages/es.json messages/it.json messages/nl.json
git commit -m "feat(auth): tela de cadastro sem variante de CRM e com regra de senha traduzida"
```

---

## Encerramento

Ao fim das 9 tasks:

- Suíte em **686 testes** (linha de base 628 + 58).
- `npx tsc --noEmit` limpo, `npx eslint` sem problema novo nos arquivos tocados.
- A branch **não** contém nada do Paddle além do cherry-pick da Task 1.

**Fora do escopo, registrado de propósito:** recuperação de senha e troca de e-mail seguem
no template do Supabase, em inglês; não há seletor de idioma no perfil, então quem se
cadastrou antes fica com `pt`; e a configuração de senha no painel do Supabase é manual, o
que significa que um projeto novo do Supabase nasce sem ela.
