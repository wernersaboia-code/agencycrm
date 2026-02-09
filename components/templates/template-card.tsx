// components/templates/template-card.tsx

"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    MoreHorizontal,
    Pencil,
    Copy,
    Trash2,
    Power,
    PowerOff,
    Mail,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getCategoryConfig } from "@/lib/constants/template.constants"
import type { TemplateWithStats } from "@/actions/templates"

// ============================================================
// TIPOS
// ============================================================

interface TemplateCardProps {
    template: TemplateWithStats
    viewMode: "grid" | "list"
    isDeleting: boolean
    onEdit: () => void
    onDuplicate: () => void
    onToggleActive: () => void
    onDelete: () => void
}

// ============================================================
// COMPONENTE
// ============================================================

export function TemplateCard({
                                 template,
                                 viewMode,
                                 isDeleting,
                                 onEdit,
                                 onDuplicate,
                                 onToggleActive,
                                 onDelete,
                             }: TemplateCardProps) {
    const categoryConfig = getCategoryConfig(template.category)
    const CategoryIcon = categoryConfig.icon

    // Extrair preview do body (remover HTML e limitar caracteres)
    const bodyPreview = template.body
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 150)

    const formattedDate = format(
        new Date(template.updatedAt),
        "dd MMM yyyy",
        { locale: ptBR }
    )

    // ============================================================
    // GRID VIEW
    // ============================================================

    if (viewMode === "grid") {
        return (
            <Card
                className={cn(
                    "group relative transition-all hover:shadow-md",
                    !template.isActive && "opacity-60",
                    isDeleting && "pointer-events-none opacity-50"
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("p-2 rounded-md", categoryConfig.bgColor)}>
                                <CategoryIcon className={cn("h-4 w-4", categoryConfig.color)} />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-base line-clamp-1">
                                    {template.name}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs font-normal">
                                    {categoryConfig.label}
                                </Badge>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDuplicate}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onToggleActive}>
                                    {template.isActive ? (
                                        <>
                                            <PowerOff className="h-4 w-4 mr-2" />
                                            Desativar
                                        </>
                                    ) : (
                                        <>
                                            <Power className="h-4 w-4 mr-2" />
                                            Ativar
                                        </>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Assunto */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Assunto:</p>
                        <p className="text-sm line-clamp-2">{template.subject}</p>
                    </div>

                    {/* Preview do corpo */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Preview:</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {bodyPreview}...
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Atualizado em {formattedDate}
            </span>
                        {template._count.campaigns > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                {template._count.campaigns}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ============================================================
    // LIST VIEW
    // ============================================================

    return (
        <Card
            className={cn(
                "group transition-all hover:shadow-sm",
                !template.isActive && "opacity-60",
                isDeleting && "pointer-events-none opacity-50"
            )}
        >
            <div className="flex items-center gap-4 p-4">
                {/* Ícone da categoria */}
                <div className={cn("p-2 rounded-md shrink-0", categoryConfig.bgColor)}>
                    <CategoryIcon className={cn("h-5 w-5", categoryConfig.color)} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{template.name}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                            {categoryConfig.label}
                        </Badge>
                        {!template.isActive && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                                Inativo
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                        {template.subject}
                    </p>
                </div>

                {/* Meta */}
                <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    {template._count.campaigns > 0 && (
                        <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {template._count.campaigns}
                        </div>
                    )}
                    <span>{formattedDate}</span>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDuplicate}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onToggleActive}>
                            {template.isActive ? (
                                <>
                                    <PowerOff className="h-4 w-4 mr-2" />
                                    Desativar
                                </>
                            ) : (
                                <>
                                    <Power className="h-4 w-4 mr-2" />
                                    Ativar
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    )
}