// app/providers.tsx

"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster position="top-right" richColors />
        </ThemeProvider>
    )
}