export default function Loading() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="h-8 w-48 skeleton-shimmer rounded" />

            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 skeleton-shimmer rounded-lg" />
                ))}
            </div>

            <div className="h-12 w-full skeleton-shimmer rounded-lg" />

            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="h-10 w-10 skeleton-shimmer rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-4 w-44 skeleton-shimmer rounded" />
                            <div className="h-3 w-64 skeleton-shimmer rounded" />
                        </div>
                        <div className="h-6 w-20 skeleton-shimmer rounded-full" />
                        <div className="h-4 w-16 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
