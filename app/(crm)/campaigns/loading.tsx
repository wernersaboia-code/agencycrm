import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 skeleton-shimmer rounded" />
                <div className="h-10 w-40 skeleton-shimmer rounded" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 skeleton-shimmer rounded-lg" />
                ))}
            </div>

            <div className="flex gap-4">
                <div className="h-10 w-64 skeleton-shimmer rounded" />
                <div className="h-10 w-40 skeleton-shimmer rounded" />
            </div>

            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="h-5 w-48 skeleton-shimmer rounded" />
                                <div className="h-5 w-24 skeleton-shimmer rounded" />
                            </div>
                            <div className="flex gap-4">
                                <div className="h-4 w-20 skeleton-shimmer rounded" />
                                <div className="h-4 w-20 skeleton-shimmer rounded" />
                                <div className="h-4 w-16 skeleton-shimmer rounded" />
                            </div>
                            <div className="h-2 w-full skeleton-shimmer rounded-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
