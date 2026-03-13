// app/providers.tsx

"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { ActiveCallProvider } from "@/contexts/active-call-context"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ActiveCallProvider>
                {children}
            </ActiveCallProvider>
            <Toaster position="top-right" richColors />
        </ThemeProvider>
    )
}