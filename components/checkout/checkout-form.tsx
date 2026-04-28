// components/checkout/checkout-form.tsx
"use client"

import { User, Mail, Building } from "lucide-react"

interface CheckoutFormProps {
    userId: string
}

const MOCK_USER_DATA = {
    name: "Usuario Teste",
    email: "usuario@exemplo.com",
    company: "Empresa Ltda",
}

export function CheckoutForm({ userId }: CheckoutFormProps) {
    // TODO: Buscar dados reais do usuario da sessao/Supabase.
    const userData = MOCK_USER_DATA
    void userId

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
                    <div className="font-medium text-gray-800">{userData.company || "Nao informado"}</div>
                </div>
            </div>

            <p className="text-xs text-gray-500 pt-2">
                Estes dados serao usados na nota fiscal e confirmacao de compra.
            </p>
        </div>
    )
}
