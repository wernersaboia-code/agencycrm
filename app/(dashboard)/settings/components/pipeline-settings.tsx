// app/(dashboard)/settings/components/pipeline-settings.tsx

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    GripVertical,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    Check,
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core"
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import {
    createPipelineStage,
    updatePipelineStage,
    deletePipelineStage,
    reorderPipelineStages,
} from "@/actions/settings"

type Stage = {
    id: string
    name: string
    color: string
    order: number
    isActive: boolean
    dealsCount: number
}

type PipelineSettingsProps = {
    stages: Stage[]
    onStagesChange: (stages: Stage[]) => void
}

const defaultColors = [
    "#6B7280", // Gray
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
]

// Componente de estágio arrastável
function SortableStage({
                           stage,
                           onEdit,
                           onDelete,
                       }: {
    stage: Stage
    onEdit: (stage: Stage) => void
    onDelete: (stage: Stage) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stage.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-card",
                isDragging && "opacity-50 shadow-lg"
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab hover:text-primary touch-none"
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.color }}
            />

            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{stage.name}</p>
            </div>

            <Badge variant="secondary" className="flex-shrink-0">
                {stage.dealsCount} deal{stage.dealsCount !== 1 ? "s" : ""}
            </Badge>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(stage)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(stage)}
                    disabled={stage.dealsCount > 0}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export function PipelineSettings({ stages, onStagesChange }: PipelineSettingsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [editingStage, setEditingStage] = useState<Stage | null>(null)
    const [deletingStage, setDeletingStage] = useState<Stage | null>(null)
    const [formData, setFormData] = useState({ name: "", color: defaultColors[0] })

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    function openCreateModal() {
        setEditingStage(null)
        setFormData({ name: "", color: defaultColors[stages.length % defaultColors.length] })
        setIsModalOpen(true)
    }

    function openEditModal(stage: Stage) {
        setEditingStage(stage)
        setFormData({ name: stage.name, color: stage.color })
        setIsModalOpen(true)
    }

    function openDeleteDialog(stage: Stage) {
        setDeletingStage(stage)
        setIsDeleteOpen(true)
    }

    function handleSubmit() {
        if (!formData.name.trim()) {
            toast.error("Nome é obrigatório")
            return
        }

        startTransition(async () => {
            if (editingStage) {
                // Editar
                const result = await updatePipelineStage(editingStage.id, formData)
                if (result.success) {
                    toast.success("Estágio atualizado!")
                    onStagesChange(
                        stages.map((s) =>
                            s.id === editingStage.id ? { ...s, ...formData } : s
                        )
                    )
                } else {
                    toast.error(result.error || "Erro ao atualizar")
                }
            } else {
                // Criar
                const result = await createPipelineStage(formData)
                if (result.success && result.data) {
                    toast.success("Estágio criado!")
                    const newStage: Stage = {
                        id: result.data.id,
                        name: result.data.name,
                        color: result.data.color,
                        order: result.data.order,
                        isActive: result.data.isActive,
                        dealsCount: 0,
                    }
                    onStagesChange([...stages, newStage])
                } else {
                    toast.error(result.error || "Erro ao criar")
                }
            }
            setIsModalOpen(false)
            router.refresh()
        })
    }

    function handleDelete() {
        if (!deletingStage) return

        startTransition(async () => {
            const result = await deletePipelineStage(deletingStage.id)
            if (result.success) {
                toast.success("Estágio excluído!")
                onStagesChange(stages.filter((s) => s.id !== deletingStage.id))
            } else {
                toast.error(result.error || "Erro ao excluir")
            }
            setIsDeleteOpen(false)
            setDeletingStage(null)
            router.refresh()
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = stages.findIndex((s) => s.id === active.id)
        const newIndex = stages.findIndex((s) => s.id === over.id)

        const newStages = arrayMove(stages, oldIndex, newIndex)
        onStagesChange(newStages)

        // Salvar nova ordem no servidor
        startTransition(async () => {
            const result = await reorderPipelineStages(newStages.map((s) => s.id))
            if (result.success) {
                toast.success("Ordem atualizada!")
            } else {
                toast.error("Erro ao reordenar")
                // Reverter em caso de erro
                onStagesChange(stages)
            }
            router.refresh()
        })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Estágios do Pipeline</CardTitle>
                        <CardDescription>
                            Gerencie os estágios do seu funil de vendas. Arraste para reordenar.
                        </CardDescription>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Estágio
                    </Button>
                </CardHeader>
                <CardContent>
                    {stages.length > 0 ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={stages.map((s) => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {stages.map((stage) => (
                                        <SortableStage
                                            key={stage.id}
                                            stage={stage}
                                            onEdit={openEditModal}
                                            onDelete={openDeleteDialog}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                            <p>Nenhum estágio configurado</p>
                            <Button variant="outline" className="mt-4" onClick={openCreateModal}>
                                <Plus className="mr-2 h-4 w-4" />
                                Criar primeiro estágio
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dica */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="p-2 rounded-full bg-primary/10 h-fit">
                            <AlertCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-medium">Dica</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Os estágios representam as fases do seu processo de vendas.
                                Você pode arrastar para reordenar. Estágios com deals vinculados
                                não podem ser excluídos - mova os deals primeiro.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Criar/Editar */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingStage ? "Editar Estágio" : "Novo Estágio"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingStage
                                ? "Atualize as informações do estágio"
                                : "Adicione um novo estágio ao seu pipeline"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Qualificação, Proposta..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <div className="flex flex-wrap gap-2">
                                {defaultColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 transition-all",
                                            formData.color === color
                                                ? "border-primary scale-110"
                                                : "border-transparent hover:scale-105"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {formData.color === color && (
                                            <Check className="h-4 w-4 text-white mx-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-lg border bg-muted/50">
                            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: formData.color }}
                                />
                                <span className="font-medium">
                                    {formData.name || "Nome do estágio"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingStage ? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Confirmar Exclusão */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir estágio?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o estágio{" "}
                            <strong>{deletingStage?.name}</strong>? Esta ação não pode ser
                            desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}