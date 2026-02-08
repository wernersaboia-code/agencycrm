// app/(dashboard)/tasks/[id]/subtasks-list.tsx

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { addSubtask, toggleSubtask, deleteSubtask } from "@/actions/tasks"

type Subtask = {
    id: string
    title: string
    completed: boolean
    order: number
}

type SubtasksListProps = {
    taskId: string
    subtasks: Subtask[]
}

export function SubtasksList({ taskId, subtasks }: SubtasksListProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [newSubtask, setNewSubtask] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    function handleAdd() {
        if (!newSubtask.trim()) return

        startTransition(async () => {
            const result = await addSubtask(taskId, { title: newSubtask.trim() })

            if (result.success) {
                setNewSubtask("")
                setIsAdding(false)
                router.refresh()
                toast.success("Subtarefa adicionada!")
            } else {
                toast.error("Erro ao adicionar subtarefa")
            }
        })
    }

    function handleToggle(subtaskId: string) {
        startTransition(async () => {
            const result = await toggleSubtask(subtaskId)

            if (result.success) {
                router.refresh()
            } else {
                toast.error("Erro ao atualizar subtarefa")
            }
        })
    }

    function handleDelete(subtaskId: string) {
        startTransition(async () => {
            const result = await deleteSubtask(subtaskId)

            if (result.success) {
                router.refresh()
                toast.success("Subtarefa removida!")
            } else {
                toast.error("Erro ao remover subtarefa")
            }
        })
    }

    return (
        <div className="space-y-2">
            {subtasks.map((subtask) => (
                <div
                    key={subtask.id}
                    className="flex items-center gap-2 group p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggle(subtask.id)}
                        disabled={isPending}
                    />
                    <span
                        className={cn(
                            "flex-1 text-sm",
                            subtask.completed && "line-through text-muted-foreground"
                        )}
                    >
            {subtask.title}
          </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(subtask.id)}
                        disabled={isPending}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ))}

            {isAdding ? (
                <div className="flex items-center gap-2 pt-2">
                    <Input
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Nova subtarefa..."
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd()
                            if (e.key === "Escape") {
                                setIsAdding(false)
                                setNewSubtask("")
                            }
                        }}
                        autoFocus
                    />
                    <Button size="sm" onClick={handleAdd} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Adicionar"
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setIsAdding(false)
                            setNewSubtask("")
                        }}
                    >
                        Cancelar
                    </Button>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar subtarefa
                </Button>
            )}
        </div>
    )
}