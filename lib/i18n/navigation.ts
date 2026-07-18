import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

// Wrappers cientes de locale: Link e redirect preservam o idioma atual sem
// que cada chamada precise montar o prefixo à mão.
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing)
