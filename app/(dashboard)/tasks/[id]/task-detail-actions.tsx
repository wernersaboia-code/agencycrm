// app/(dashboard)/tasks/[id]/task-detail-actions.tsx

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, CheckCircle2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"

import { TaskModal } from "@/components/tasks/task-modal"
import {
    deleteTask,
    updateTaskStatus,
    type TaskWithRelations,
} from "@/actions/tasks"

type TaskDetailActionsProps = {
    task: TaskWithRelations
}

export function TaskDetailActions({ task }: TaskDetailActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const isCompleted = task.status === "COMPLETED"

    function handleToggleComplete() {
        startTransition(async () => {
            const newStatus = isCompleted ? "TODO" : "COMPLETED"
            const result = await updateTaskStatus(task.id, newStatus)

            if (result.success) {
                toast.success(
                    newStatus === "COMPLETED" ? "Tarefa concluída!" : "Tarefa reaberta!"
                )
                router.refresh()
            } else {
                toast.error("Erro ao atualizar tarefa")
            }
        })
    }

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteTask(task.id)

            if (result.success) {
                toast.success("Tarefa excluída!")
                router.push("/tasks")
            } else {
                toast.error("Erro ao excluir tarefa")
            }
        })
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={handleToggleComplete}
                    disabled={isPending}
                >
                    {isCompleted ? (
                        <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reabrir
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Concluir
                        </>
                    )}
                </Button>
                <Button variant="outline" onClick={() => setShowEditModal(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 hover:text-red-700"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <TaskModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                task={task}
                onSuccess={() => {
                    setShowEditModal(false)
                    router.refresh()
                }}
            />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir "{task.title}"? Esta ação não pode
                            ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}