import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 skeleton-shimmer rounded" />
                <div>
                    <div className="h-8 w-56 skeleton-shimmer rounded" />
                    <div className="h-4 w-32 skeleton-shimmer rounded mt-1" />
                </div>
            </div>

            <div className="flex gap-2">
                <div className="h-6 w-24 skeleton-shimmer rounded-full" />
                <div className="h-6 w-20 skeleton-shimmer rounded-full" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="h-5 w-32 skeleton-shimmer rounded" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-3.5 w-20 skeleton-shimmer rounded" />
                            <div className="h-5 w-40 skeleton-shimmer rounded" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="h-5 w-40 skeleton-shimmer rounded" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 skeleton-shimmer rounded-lg" />
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="h-5 w-32 skeleton-shimmer rounded" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-8 w-8 skeleton-shimmer rounded-full shrink-0" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-4 w-48 skeleton-shimmer rounded" />
                                <div className="h-3 w-64 skeleton-shimmer rounded" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
