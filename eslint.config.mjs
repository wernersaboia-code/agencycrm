import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "prefer-const": "warn",
    },
  },
  // Trava contra regressão: o funil (app/[locale]/**) vive sob rotas com
  // localePrefix "as-needed" (pt sem prefixo, os outros 7 idiomas com
  // prefixo). Navegar com next/link ou next/navigation puro (em vez do
  // wrapper de lib/i18n/navigation.ts) monta a URL sem o prefixo de idioma
  // e derruba o usuário de volta no locale padrão. Restrito aos diretórios
  // que pertencem exclusivamente ao funil — não se aplica a components/ui,
  // components/purchases nem a nada do CRM/super-admin.
  {
    files: [
      // minimatch (usado pelo ESLint flat config) não interpreta bem `\[`/`\]`
      // como escape literal — `[[]locale[]]` é o truque de classe de
      // caracteres (`[[]` = "[" literal, `[]]` = "]" literal) que faz o
      // glob casar com o diretório real `app/[locale]/`.
      "app/[[]locale[]]/**/*.{ts,tsx}",
      "components/marketplace/**/*.{ts,tsx}",
      "components/checkout/**/*.{ts,tsx}",
      "components/landing/**/*.{ts,tsx}",
      "components/faq/**/*.{ts,tsx}",
      "components/blog/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message:
                "Use o `Link` ciente de locale de \"@/lib/i18n/navigation\" para rotas do funil. Se o destino for fora do segmento de locale (ex.: /sign-in, /dashboard, /crm, /super-admin, /privacy, /terms), o import puro de next/link é legítimo — dispense esta regra só nessa linha com `// eslint-disable-next-line no-restricted-imports` e um comentário curto explicando o motivo.",
            },
            {
              name: "next/navigation",
              importNames: ["useRouter", "redirect"],
              message:
                "Use `useRouter`/`redirect` de \"@/lib/i18n/navigation\" para rotas do funil. Se o destino for fora do segmento de locale (ex.: /sign-in, /dashboard, /crm, /super-admin, /privacy, /terms), o import puro de next/navigation é legítimo — dispense esta regra só nessa linha com `// eslint-disable-next-line no-restricted-imports` e um comentário curto explicando o motivo.",
            },
          ],
        },
      ],
    },
  },
  // Trava contra regressão de RTL (fase 2 da expansão de idiomas, árabe
  // incluído): classe física do Tailwind onde existe equivalente lógico
  // some do funil e da UI compartilhada com o tempo se nada barrar. `dir`
  // já é aplicado no <html> via `dirForLocale`; sem propriedade lógica,
  // margem/padding/borda/canto ficam grudados no lado errado em RTL mesmo
  // assim.
  //
  // Cobre só os pares sem ambiguidade (ml/mr, pl/pr, text-left/right,
  // border-l/r-*, rounded-l/r-*). Fora da lista de propósito:
  // `left-`/`right-` de posicionamento (`inset`) — colidem com sufixos
  // físicos que não são de leitura, como `slide-in-from-right` do Tailwind
  // Animate e `data-[side=right]` do Radix Popper, que ficam errados se
  // virarem lógicos (ver components/ui/dropdown-menu.tsx, sheet.tsx,
  // scroll-area.tsx). Sinalizar aquilo pediria uma regra ciente de token
  // que esquery não faz bem; melhor deixar pra revisão manual.
  //
  // components/ui entra aqui (diferente da trava de import acima): rotas do
  // funil consomem os primitivos compartilhados, então uma classe física
  // nova ali também vaza pro RTL. Onde a exceção for legítima e revisada
  // (como as três acima), `// eslint-disable-next-line no-restricted-syntax`
  // com o motivo.
  {
    files: [
      "app/[[]locale[]]/**/*.{ts,tsx}",
      "components/marketplace/**/*.{ts,tsx}",
      "components/checkout/**/*.{ts,tsx}",
      "components/blog/**/*.{ts,tsx}",
      "components/auth/**/*.{ts,tsx}",
      "components/seo/**/*.{ts,tsx}",
      "components/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/\\b(ml|mr|pl|pr)-[\\w.]+\\b|\\btext-(left|right)\\b|\\bborder-[lr](-[\\w.]+)?\\b|\\brounded-[lr]-[\\w.]+\\b/]",
          message:
            "Classe física do Tailwind num diretório que renderiza em RTL (funil ou UI compartilhada). Troque pela lógica: ml→ms, mr→me, pl→ps, pr→pe, text-left→text-start, text-right→text-end, border-l→border-s, border-r→border-e, rounded-l→rounded-s, rounded-r→rounded-e. Se for physical de propósito (ex.: data-[side=] do Radix, slide-in-from-{left,right} do Tailwind Animate), dispense com `// eslint-disable-next-line no-restricted-syntax` e um comentário curto do motivo.",
        },
        {
          selector:
            "TemplateElement[value.raw=/\\b(ml|mr|pl|pr)-[\\w.]+\\b|\\btext-(left|right)\\b|\\bborder-[lr](-[\\w.]+)?\\b|\\brounded-[lr]-[\\w.]+\\b/]",
          message:
            "Classe física do Tailwind num template literal, num diretório que renderiza em RTL. Mesma troca da regra acima (ml→ms, mr→me, pl→ps, pr→pe, text-left→text-start, text-right→text-end, border-l/r→border-s/e, rounded-l/r→rounded-s/e). Exceção física legítima: `// eslint-disable-next-line no-restricted-syntax` com o motivo.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
