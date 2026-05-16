"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  Phone,
  BarChart3,
  Settings,
  Building2,
  PlusCircle,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Campanhas", href: "/campaigns", icon: Mail },
  { label: "Modelos de e-mail", href: "/templates", icon: FileText },
  { label: "Ligações", href: "/calls", icon: Phone },
  { label: "Relatórios", href: "/reports", icon: BarChart3 },
  { label: "Clientes", href: "/workspaces", icon: Building2 },
  { label: "Configurações", href: "/settings", icon: Settings },
]

const actionItems = [
  { label: "Novo Lead", href: "/leads?new=true", icon: PlusCircle },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener("open-command-palette", handler)
    return () => document.removeEventListener("open-command-palette", handler)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar comando..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Ações">
          {actionItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
