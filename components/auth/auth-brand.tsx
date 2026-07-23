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
