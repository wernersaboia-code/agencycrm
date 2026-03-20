// components/checkout/checkout-form.tsx
"use client"

import { useEffect, useState } from "react"
import { User, Mail, Building } from "lucide-react"

interface CheckoutFormProps {
    userId: string
}

export function CheckoutForm({ userId }: CheckoutFormProps) {
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        company: ""
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // TODO: Buscar dados do usuário da sessão/Supabase
        // Por enquanto, dados mockados
        setUserData({
            name: "Usuário Teste",
            email: "usuario@exemplo.com",
            company: "Empresa Ltda"
        })
        setLoading(false)
    }, [userId])

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                    <div className="text-xs text-gray-500">Nome</div>
                    <div className="font-medium text-gray-800">{userData.name}</div>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="font-medium text-gray-800">{userData.email}</div>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                    <div className="text-xs text-gray-500">Empresa</div>
                    <div className="font-medium text-gray-800">{userData.company || "Não informado"}</div>
                </div>
            </div>

            <p className="text-xs text-gray-500 pt-2">
                Estes dados serão usados na nota fiscal e confirmação de compra.
            </p>
        </div>
    )
}