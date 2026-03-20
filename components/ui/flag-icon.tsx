// components/ui/flag-icon.tsx
"use client"

interface FlagIconProps {
    code: string
    className?: string
    size?: "sm" | "md" | "lg"
}

export function FlagIcon({ code, className = "", size = "md" }: FlagIconProps) {
    const sizes = {
        sm: "w-4 h-3",
        md: "w-6 h-4",
        lg: "w-8 h-6"
    }

    const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`

    return (
        <img
            src={flagUrl}
            alt={code}
            className={`${sizes[size]} rounded-sm object-cover shadow-sm ${className}`}
            loading="lazy"
            style={{ imageRendering: "crisp-edges" }}
        />
    )
}