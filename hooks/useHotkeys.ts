"use client"

import { useEffect, useRef } from "react"

type HotkeyHandler = (e: KeyboardEvent) => void
type HotkeyMap = Record<string, HotkeyHandler>

export function useHotkeys(handlers: HotkeyMap, enabled = true) {
    const handlersRef = useRef(handlers)

    useEffect(() => {
        handlersRef.current = handlers
    }, [handlers])

    useEffect(() => {
        if (!enabled) return

        function handler(e: KeyboardEvent) {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement
            ) {
                return
            }

            for (const [key, fn] of Object.entries(handlersRef.current)) {
                const parts = key.toLowerCase().split("+")
                const ctrl = parts.includes("ctrl") || parts.includes("cmd")
                const shift = parts.includes("shift")
                const alt = parts.includes("alt")
                const keyName = parts[parts.length - 1]

                const isCtrlOrMeta = e.ctrlKey || e.metaKey

                if (
                    isCtrlOrMeta === ctrl &&
                    e.shiftKey === shift &&
                    e.altKey === alt &&
                    e.key.toLowerCase() === keyName
                ) {
                    e.preventDefault()
                    fn(e)
                    return
                }
            }
        }

        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [enabled])
}
