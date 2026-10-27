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
            <Image src="/logo-mark.png" alt="Easy Prospect" width={38} height={36} className="h-9 w-auto" priority />
            <span className="text-xl font-bold">Easy Prospect</span>
        </Link>
    )
}
