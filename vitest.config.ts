import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        environment: "node",
        include: ["**/*.test.ts"],
        exclude: ["node_modules", ".next"],
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
