import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div>
                <div className="h-9 w-32 skeleton-shimmer rounded" />
                <div className="h-4 w-64 skeleton-shimmer rounded mt-2" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="h-4 w-24 skeleton-shimmer rounded mb-2" />
                            <div className="h-8 w-16 skeleton-shimmer rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-4">
                <div className="h-10 w-64 skeleton-shimmer rounded" />
                <div className="h-10 w-32 skeleton-shimmer rounded" />
                <div className="h-10 w-32 skeleton-shimmer rounded" />
            </div>

            <Card>
                <CardContent className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 skeleton-shimmer rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-48 skeleton-shimmer rounded" />
                                <div className="h-3 w-32 skeleton-shimmer rounded" />
                            </div>
                            <div className="h-6 w-20 skeleton-shimmer rounded" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
