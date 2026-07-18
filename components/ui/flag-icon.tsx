// components/ui/flag-icon.tsx
"use client"

import Image from "next/image"

interface FlagIconProps {
    code: string
    className?: string
    size?: "sm" | "md" | "lg"
    /** Quando o nome do país já aparece ao lado, a bandeira é redundante para
     *  o leitor de tela — `decorative` a remove da árvore de acessibilidade. */
    decorative?: boolean
}

export function FlagIcon({ code, className = "", size = "md", decorative = false }: FlagIconProps) {
    const sizes = {
        sm: "w-4 h-3",
        md: "w-6 h-4",
        lg: "w-8 h-6"
    }

    const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`

    return (
        <Image
            src={flagUrl}
            alt={decorative ? "" : code}
            aria-hidden={decorative || undefined}
            width={40}
            height={30}
            className={`${sizes[size]} rounded-sm object-cover shadow-sm ${className}`}
            style={{ imageRendering: "crisp-edges" }}
        />
    )
}
