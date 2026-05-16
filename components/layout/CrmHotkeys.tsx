"use client"

import { useRouter } from "next/navigation"
import { useHotkeys } from "@/hooks/useHotkeys"

export function CrmHotkeys() {
    const router = useRouter()

    useHotkeys({
        "ctrl+n": () => {
            router.push("/leads?new=true")
        },
        "n": () => {
            router.push("/leads?new=true")
        },
        "ctrl+k": () => {
            window.dispatchEvent(new CustomEvent("open-command-palette"))
        },
        "ctrl+enter": () => {
            window.dispatchEvent(new CustomEvent("submit-active-form"))
        },
    })

    useHotkeys({
        "g": (e) => {
            const nextKey = new Promise<string>((resolve) => {
                const listener = (ev: KeyboardEvent) => {
                    window.removeEventListener("keydown", listener)
                    resolve(ev.key.toLowerCase())
                }
                window.addEventListener("keydown", listener)
            })

            e.preventDefault()

            nextKey.then((key) => {
                switch (key) {
                    case "d":
                        router.push("/dashboard")
                        break
                    case "l":
                        router.push("/leads")
                        break
                    case "c":
                        router.push("/campaigns")
                        break
                }
            })
        },
    })

    return null
}
