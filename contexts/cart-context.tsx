// contexts/cart-context.tsx
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { toast } from "sonner"

export interface CartItem {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    totalLeads: number
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, "quantity">) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    total: number
    itemCount: number
    isOpen: boolean
    openCart: () => void
    closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "leadstore-cart"

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    // Carregar do localStorage
    useEffect(() => {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
            try {
                setItems(JSON.parse(stored))
            } catch (e) {
                console.error("Erro ao carregar carrinho:", e)
            }
        }
        setIsHydrated(true)
    }, [])

    // Salvar no localStorage
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
        }
    }, [items, isHydrated])

    const addItem = (item: Omit<CartItem, "quantity">) => {
        setItems((current) => {
            const exists = current.find((i) => i.id === item.id)

            if (exists) {
                toast.info(`"${item.name}" já está no carrinho`)
                return current
            }

            toast.success(`"${item.name}" adicionado ao carrinho!`, {
                action: {
                    label: "Ver carrinho",
                    onClick: () => setIsOpen(true),
                },
            })

            return [...current, { ...item, quantity: 1 }]
        })
        setIsOpen(true)
    }

    const removeItem = (id: string) => {
        setItems((current) => {
            const item = current.find((i) => i.id === id)
            if (item) {
                toast.success(`"${item.name}" removido do carrinho`)
            }
            return current.filter((i) => i.id !== id)
        })
    }

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id)
            return
        }

        setItems((current) =>
            current.map((item) =>
                item.id === id ? { ...item, quantity } : item
            )
        )
    }

    const clearCart = () => {
        setItems([])
        toast.success("Carrinho limpo")
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    const openCart = () => setIsOpen(true)
    const closeCart = () => setIsOpen(false)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                total,
                itemCount,
                isOpen,
                openCart,
                closeCart,
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