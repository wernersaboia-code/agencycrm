import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 skeleton-shimmer rounded" />
                <div>
                    <div className="h-8 w-64 skeleton-shimmer rounded" />
                    <div className="h-4 w-44 skeleton-shimmer rounded mt-1" />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="h-6 w-24 skeleton-shimmer rounded-full" />
                    <div className="h-6 w-20 skeleton-shimmer rounded-full" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 skeleton-shimmer rounded" />
                    <div className="h-9 w-24 skeleton-shimmer rounded" />
                    <div className="h-9 w-28 skeleton-shimmer rounded" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 space-y-2">
                            <div className="h-3 w-24 skeleton-shimmer rounded" />
                            <div className="h-6 w-16 skeleton-shimmer rounded" />
                            <div className="h-2 w-full skeleton-shimmer rounded-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="h-5 w-40 skeleton-shimmer rounded" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] skeleton-shimmer rounded-lg" />
                </CardContent>
            </Card>

            <div className="h-10 w-72 skeleton-shimmer rounded" />

            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-8 w-8 skeleton-shimmer rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-4 w-40 skeleton-shimmer rounded" />
                            <div className="h-3 w-56 skeleton-shimmer rounded" />
                        </div>
                        <div className="h-6 w-16 skeleton-shimmer rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
