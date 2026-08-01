"use client"

import { useSyncExternalStore } from "react"
import { Coins } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/i18n/navigation"
import { useCart } from "@/contexts/cart-context"
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, type Currency } from "@/lib/currency"
import { readCurrencyCookie, writeCurrencyCookie } from "@/lib/currency/client"
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

// Sem listeners reais: nada além deste componente muda o cookie de moeda no
// cliente, e a troca já dispara router.refresh() para os Server Components
// relerem o cookie. subscribe é só o contrato que useSyncExternalStore exige.
function subscribeToCurrency() {
    return () => {}
}

export function CurrencySwitcher() {
    const router = useRouter()
    const t = useTranslations("nav")
    const { repriceTo } = useCart()
    // O primeiro render é o do servidor, que não vê document.cookie. Ler via
    // useSyncExternalStore evita a divergência de hidratação sem precisar de
    // um setState dentro de useEffect: getServerSnapshot devolve o default
    // (EUR) no servidor, e o cliente já monta com o valor real do cookie.
    const current = useSyncExternalStore(subscribeToCurrency, readCurrencyCookie, () => DEFAULT_CURRENCY)

    // Trocar de moeda NÃO troca de idioma: são cookies independentes e a rota
    // continua a mesma. router.refresh() basta para os Server Components
    // relerem o cookie e recalcularem os preços.
    //
    // O cookie é gravado no cliente, não por Server Action: aba aberta durante
    // um deploy mandava um ID de ação que já não existia e o clique morria em
    // silêncio (UnrecognizedActionError). Cookie de preferência não precisa do
    // servidor para ser gravado.
    const switchTo = async (target: Currency) => {
        if (target === current) return
        writeCurrencyCookie(target)
        await repriceTo(target)
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
