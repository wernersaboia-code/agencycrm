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
