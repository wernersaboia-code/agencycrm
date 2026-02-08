// components/workspace-switcher.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useWorkspace } from "@/contexts/workspace-context"

export function WorkspaceSwitcher() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const { workspaces, activeWorkspace, setActiveWorkspace, isLoading } = useWorkspace()

    if (isLoading) {
        return (
            <Button variant="outline" className="w-[200px] justify-between" disabled>
                <span className="text-muted-foreground">Carregando...</span>
            </Button>
        )
    }

    if (workspaces.length === 0) {
        return (
            <Button
                variant="outline"
                className="w-[200px] justify-start gap-2"
                onClick={() => router.push("/workspaces")}
            >
                <Plus className="h-4 w-4" />
                <span>Criar primeiro cliente</span>
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    <div className="flex items-center gap-2 truncate">
                        <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: activeWorkspace?.color || "#3B82F6" }}
                        />
                        <span className="truncate">
              {activeWorkspace?.name || "Selecione..."}
            </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup heading="Clientes">
                            {workspaces.map((workspace) => (
                                <CommandItem
                                    key={workspace.id}
                                    value={workspace.name}
                                    onSelect={() => {
                                        setActiveWorkspace(workspace)
                                        setOpen(false)
                                    }}
                                >
                                    <div
                                        className="mr-2 h-3 w-3 rounded-full"
                                        style={{ backgroundColor: workspace.color }}
                                    />
                                    <span className="truncate">{workspace.name}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            activeWorkspace?.id === workspace.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false)
                                    router.push("/workspaces")
                                }}
                            >
                                <Building2 className="mr-2 h-4 w-4" />
                                Gerenciar clientes
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}