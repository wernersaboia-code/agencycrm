// app/(dashboard)/tasks/page.tsx

import { Suspense } from "react"
import { getTasks, getTaskStats } from "@/actions/tasks"
import { TasksClient } from "./tasks-client"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function TasksLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
                </div>
                <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        </div>
    )
}

async function TasksData() {
    const [tasksResult, statsResult] = await Promise.all([
        getTasks(),
        getTaskStats(),
    ])

    const tasks = tasksResult.success ? tasksResult.data || [] : []
    const stats = statsResult.success
        ? statsResult.data!
        : { total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 }

    return <TasksClient initialTasks={tasks} initialStats={stats} />
}

export default function TasksPage() {
    return (
        <Suspense fallback={<TasksLoading />}>
            <TasksData />
        </Suspense>
    )
}