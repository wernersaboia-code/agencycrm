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

interface VariableDropdownProps {
    onSelect: (variable: string) => void
    disabled?: boolean
}

const TEMPLATE_VARIABLES = [
    {
        category: "Lead",
        variables: [
            { key: "firstName", label: "Primeiro Nome", example: "João" },
            { key: "lastName", label: "Sobrenome", example: "Silva" },
            { key: "fullName", label: "Nome Completo", example: "João Silva" },
            { key: "email", label: "Email", example: "joao@empresa.com" },
            { key: "phone", label: "Telefone", example: "(11) 99999-9999" },
            { key: "position", label: "Cargo", example: "Diretor de Marketing" },
        ],
    },
    {
        category: "Empresa",
        variables: [
            { key: "company", label: "Nome da Empresa", example: "Empresa ABC" },
            { key: "segment", label: "Segmento", example: "Tecnologia" },
            { key: "country", label: "País", example: "Brasil" },
        ],
    },
]

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
                    Variável
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                {TEMPLATE_VARIABLES.map((category, index) => (
                    <div key={category.category}>
                        {index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel>{category.category}</DropdownMenuLabel>
                        {category.variables.map((variable) => (
                            <DropdownMenuItem
                                key={variable.key}
                                onClick={() => onSelect(variable.key)}
                                className="flex justify-between"
                            >
                                <span>{variable.label}</span>
                                <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                                    {`{{${variable.key}}}`}
                                </code>
                            </DropdownMenuItem>
                        ))}
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}