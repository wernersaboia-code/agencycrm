import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="container py-6 space-y-6">
            <div>
                <div className="h-8 w-48 skeleton-shimmer rounded" />
                <div className="h-4 w-64 skeleton-shimmer rounded mt-2" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="h-4 w-24 skeleton-shimmer rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-20 skeleton-shimmer rounded" />
                            <div className="h-3 w-32 skeleton-shimmer rounded mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="h-5 w-40 skeleton-shimmer rounded" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] skeleton-shimmer rounded-lg" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="h-5 w-40 skeleton-shimmer rounded" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] skeleton-shimmer rounded-lg" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="h-5 w-40 skeleton-shimmer rounded" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 skeleton-shimmer rounded-lg" />
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="h-5 w-40 skeleton-shimmer rounded" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 skeleton-shimmer rounded-lg" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
