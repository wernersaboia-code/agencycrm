import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { resolveAuthLocale } from "@/lib/i18n/auth-locale"
import { loadMessages } from "@/lib/i18n/load-messages"
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"

export default async function SignUpPage({
    searchParams,
}: {
    searchParams: Promise<{ lang?: string }>
}) {
    const { lang } = await searchParams
    const locale = resolveAuthLocale(lang)
    const [messages, amostra] = await Promise.all([loadMessages(locale), getAmostraAtiva()])

    return (
        <AuthShell locale={locale} messages={messages}>
            <Suspense
                fallback={
                    <div className="flex min-h-[50vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }
            >
                <SignUpForm estudoGratuito={amostra !== null} />
            </Suspense>
        </AuthShell>
    )
}
