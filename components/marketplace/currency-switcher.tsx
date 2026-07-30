"use client"

import { useEffect, useState } from "react"
import { Coins } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/i18n/navigation"
import { setCurrencyCookie } from "@/actions/currency"
import {
    CURRENCY_COOKIE,
    DEFAULT_CURRENCY,
    SUPPORTED_CURRENCIES,
    parseCurrency,
    type Currency,
} from "@/lib/currency"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SYMBOLS: Record<Currency, string> = {
    EUR: "€",
    BRL: "R$",
    USD: "US$",
}

function readCurrencyCookie(): Currency {
    if (typeof document === "undefined") return DEFAULT_CURRENCY
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CURRENCY_COOKIE}=([^;]+)`))
    return parseCurrency(match?.[1]) ?? DEFAULT_CURRENCY
}

export function CurrencySwitcher() {
    const router = useRouter()
    const t = useTranslations("nav")
    // O primeiro render é o do servidor, que não vê document.cookie. Ler no
    // efeito evita divergência de hidratação; o custo é o rótulo aparecer como
    // EUR por um instante, num badge de 3 letras.
    const [current, setCurrent] = useState<Currency>(DEFAULT_CURRENCY)

    useEffect(() => {
        setCurrent(readCurrencyCookie())
    }, [])

    // Trocar de moeda NÃO troca de idioma: são cookies independentes e a rota
    // continua a mesma. router.refresh() basta para os Server Components
    // relerem o cookie e recalcularem os preços.
    const switchTo = async (target: Currency) => {
        if (target === current) return
        await setCurrencyCookie(target)
        setCurrent(target)
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={t("currency")}>
                    <Coins className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase">{current}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {SUPPORTED_CURRENCIES.map((c) => (
                    <DropdownMenuItem
                        key={c}
                        onClick={() => switchTo(c)}
                        className={c === current ? "font-semibold" : undefined}
                    >
                        {SYMBOLS[c]} {c}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
