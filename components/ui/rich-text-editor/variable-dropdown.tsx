// components/ui/rich-text-editor/variable-dropdown.tsx
"use client"

import { Variable } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TEMPLATE_VARIABLE_GROUPS } from "@/lib/constants/template.constants"

interface VariableDropdownProps {
    onSelect: (variable: string) => void
    disabled?: boolean
}

export function VariableDropdown({ onSelect, disabled }: VariableDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="gap-2"
                >
                    <Variable className="h-4 w-4" />
                    Campo personalizado
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                {TEMPLATE_VARIABLE_GROUPS.map((category, index) => (
                    <div key={category.label}>
                        {index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel>{category.label}</DropdownMenuLabel>
                        {category.variables.map((variable) => (
                            <DropdownMenuItem
                                key={variable.key}
                                onClick={() => onSelect(variable.key)}
                                className="flex flex-col items-start gap-0.5"
                            >
                                <span>{variable.label}</span>
                                <span className="text-xs text-muted-foreground">
                                    Exemplo: {variable.example}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
