// contexts/cart-context.tsx
"use client"

import { createContext, useContext, useMemo, useRef, useState, useSyncExternalStore, ReactNode } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { resolveCartPrices, type RepricedCart } from "@/actions/cart-prices"
import { readCurrencyCookie } from "@/lib/currency/client"

export interface CartItem {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    totalLeads: number
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (id: string) => void
    clearCart: () => void
    total: number
    itemCount: number
    isOpen: boolean
    openCart: () => void
    closeCart: () => void
    currency: string
    repriceTo: (currency: string) => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "easyprospect-cart"
const EMPTY_CART = "[]"
const cartListeners = new Set<() => void>()

function getCartSnapshot() {
    if (typeof window === "undefined") {
        return EMPTY_CART
    }

    return window.localStorage.getItem(CART_STORAGE_KEY) ?? EMPTY_CART
}

function subscribeToCart(listener: () => void) {
    cartListeners.add(listener)

    return () => {
        cartListeners.delete(listener)
    }
}

function notifyCartListeners() {
    cartListeners.forEach((listener) => listener())
}

function parseCartItems(snapshot: string): CartItem[] {
    try {
        const parsed = JSON.parse(snapshot)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function writeCartItems(items: CartItem[]) {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    notifyCartListeners()
}

export function CartProvider({ children }: { children: ReactNode }) {
    const cartSnapshot = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => EMPTY_CART)
    const items = useMemo(() => parseCartItems(cartSnapshot), [cartSnapshot])
    const [isOpen, setIsOpen] = useState(false)
    const tCart = useTranslations("cart")

    // Aplica o resultado de resolveCartPrices ao que estiver no localStorage
    // NA HORA de escrever (não ao snapshot que disparou a consulta): entre o
    // await e a escrita, os itens podem ter mudado. queriedIds marca
    // quais itens fizeram parte desta consulta — um item fora dela não é
    // tocado, mesmo que também exista em `current`.
    const applyRepriced = (queriedIds: string[], result: RepricedCart) => {
        const latest = parseCartItems(getCartSnapshot())
        const kept = latest.filter((item) => !result.unpriced.includes(item.id))

        writeCartItems(
            kept.map((item) =>
                queriedIds.includes(item.id)
                    ? { ...item, price: result.prices[item.id], currency: result.currency }
                    : item
            )
        )

        if (result.fellBack) {
            toast.info(tCart("currencyFellBack"))
        }
        if (result.unpriced.length > 0) {
            toast.warning(tCart("itemUnavailable"))
        }
    }

    // Duas chamadas de reconciliação podem ficar em voo ao mesmo tempo (dois
    // "adicionar" em sequência rápida, ou uma adição durante uma troca manual
    // de moeda): cada uma consultou o servidor com um snapshot diferente de
    // ids, e nada garante que a resposta mais recente chegue por último. Se a
    // atrasada vencer a corrida, ela reescreve itens com um resultado velho —
    // reabrindo o próprio bug de moedas misturadas que a reconciliação existe
    // para eliminar.
    //
    // A correção é um contador de versão: cada chamada carimba a versão atual
    // antes do await e só aplica o resultado se nenhuma chamada mais nova foi
    // disparada nesse meio-tempo. Preferido a uma fila porque não atrasa a UI
    // esperando a chamada anterior terminar — a chamada obsoleta simplesmente
    // vira no-op quando responde.
    const repriceVersionRef = useRef(0)

    const runReprice = async (currency: string) => {
        const current = parseCartItems(getCartSnapshot())
        if (current.length === 0) return

        const ids = current.map((i) => i.id)
        const version = ++repriceVersionRef.current
        const result = await resolveCartPrices(ids, currency)

        if (version !== repriceVersionRef.current) return // resposta obsoleta: uma reconciliação mais nova já está em voo ou já aplicou

        applyRepriced(ids, result)
    }

    const repriceTo = (currency: string) => runReprice(currency)

    // Cada lista resolve o preço de forma independente (ver list-card,
    // add-to-cart-button, buy-now-button): com o cookie em BRL, uma lista com
    // preço em real entra como BRL e outra sem preço em BRL entra em EUR — o
    // carrinho ficaria com duas moedas sob um total só. Por isso, toda inserção
    // reconcilia o carrinho inteiro contra a moeda ativa (a mesma lida pelo
    // seletor), reusando o caminho de repreço do servidor.
    const reconcileToActiveCurrency = () => runReprice(readCurrencyCookie())

    const setCartItems = (updater: (current: CartItem[]) => CartItem[]) => {
        writeCartItems(updater(parseCartItems(getCartSnapshot())))
    }

    const addItem = (item: CartItem) => {
        let wasAdded = false

        setCartItems((current) => {
            const exists = current.find((i) => i.id === item.id)

            if (exists) {
                toast.info(`"${item.name}" já está no carrinho`)
                return current
            }

            // O drawer abre logo abaixo (setIsOpen), então o toast é só uma
            // confirmação leve — sem ação redundante "Ver carrinho".
            toast.success(`"${item.name}" adicionado ao carrinho!`)
            wasAdded = true

            return [...current, item]
        })

        // Abrir o drawer numa re-adição contradiz o toast "já está no carrinho":
        // a gaveta saltando na tela lê como sucesso. A reconciliação de moeda só
        // vale a pena quando algo de fato entrou — re-adicionar um item já
        // presente não muda a composição de moedas do carrinho.
        if (wasAdded) {
            setIsOpen(true)
            void reconcileToActiveCurrency()
        }
    }

    const removeItem = (id: string) => {
        setCartItems((current) => {
            const item = current.find((i) => i.id === id)
            if (item) {
                toast.success(`"${item.name}" removido do carrinho`)
            }
            return current.filter((i) => i.id !== id)
        })
    }

    const clearCart = () => {
        writeCartItems([])
        toast.success("Carrinho limpo")
    }

    const total = items.reduce((sum, item) => sum + item.price, 0)
    const itemCount = items.length

    const openCart = () => setIsOpen(true)
    const closeCart = () => setIsOpen(false)
    const currency = items[0]?.currency ?? "EUR"

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                clearCart,
                total,
                itemCount,
                isOpen,
                openCart,
                closeCart,
                currency,
                repriceTo,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart deve ser usado dentro de CartProvider")
    }
    return context
}
