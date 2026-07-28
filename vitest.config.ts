import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        environment: "node",
        include: ["**/*.test.ts"],
        // `.claude` guarda worktrees de sessões antigas — cópias inteiras do
        // projeto, com testes de versões anteriores do código. Rodá-los mistura
        // resultado de código que não é mais o do repositório.
        exclude: ["node_modules", ".next", ".claude"],
        server: {
            deps: {
                inline: ["next-intl", "next"],
            },
        },
    },
    resolve: {
        alias: {
            "@": new URL("./", import.meta.url).pathname,
        },
    },
})
