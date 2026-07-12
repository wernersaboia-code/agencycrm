"use client"

import { useEffect } from "react"

/**
 * Ajusta document.documentElement.lang para a rota atual.
 *
 * O root layout fixa lang="pt-BR" (a home PT é ISR e não pode ler headers()
 * sem virar dynamic). Nas rotas /de este componente corrige o atributo tanto
 * no carregamento completo quanto na navegação client-side (troca de idioma),
 * e restaura o valor anterior ao sair da rota.
 */
export function HtmlLang({ lang }: { lang: string }) {
    useEffect(() => {
        const previous = document.documentElement.lang
        document.documentElement.lang = lang

        return () => {
            document.documentElement.lang = previous
        }
    }, [lang])

    return null
}
