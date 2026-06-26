"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  campaigns: "Campanhas",
  templates: "Modelos de Email",
  calls: "Ligações",
  reports: "Relatórios",
  settings: "Configurações",
  workspaces: "Clientes",
  purchases: "Compras",
  pricing: "Planos",
  import: "Importar Leads",
}

const routeIcons: Record<string, string> = {
  dashboard: "📊",
  leads: "👥",
  campaigns: "📧",
  templates: "📝",
  calls: "📞",
  reports: "📈",
  settings: "⚙️",
  workspaces: "🏢",
  purchases: "🛒",
  pricing: "💎",
}

interface Crumb {
  label: string
  href: string
  icon?: string
}

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
  ]

  if (pathname === "/dashboard") return crumbs

  const segments = pathname.split("/").filter(Boolean)

  let accumulatedPath = ""
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    accumulatedPath += `/${seg}`

    // Skip CRM prefix
    if (seg === "crm") continue
    if (seg === "dashboard") continue

    // Dynamic segments (IDs) — check next segment for context
    const isDynamic = /^[a-zA-Z0-9_-]{20,}$/.test(seg)
    const prevSeg = segments[i - 1]

    let label = routeLabels[seg] || seg

    // Dynamic ID with context
    if (isDynamic && prevSeg) {
      const contextLabel = routeLabels[prevSeg]
      if (contextLabel) {
        label = `${contextLabel.slice(0, -1)} #${seg.slice(0, 8)}...`
      } else {
        label = `#${seg.slice(0, 8)}...`
      }
    }

    // "import" within "leads"
    if (seg === "import" && prevSeg === "leads") {
      accumulatedPath = `/${segments.slice(0, i + 1).join("/")}`
    }

    const icon = routeIcons[seg]
    if (icon) {
      crumbs.push({ label, href: accumulatedPath, icon })
    } else if (isDynamic && prevSeg) {
      const prevIcon = routeIcons[prevSeg]
      crumbs.push({ label, href: accumulatedPath, icon: prevIcon })
    } else {
      crumbs.push({ label, href: accumulatedPath })
    }
  }

  return crumbs
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname)

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">
                {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "flex items-center gap-1 text-muted-foreground transition-colors",
                  "hover:text-foreground hover:underline underline-offset-4"
                )}
              >
                {crumb.icon && <span className="mr-0.5 text-xs">{crumb.icon}</span>}
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
