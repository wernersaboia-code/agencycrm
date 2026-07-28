export default function Loading() {
    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 skeleton-shimmer rounded" />
                <div className="h-10 w-36 skeleton-shimmer rounded" />
            </div>

            <div className="flex gap-4">
                <div className="h-10 w-64 skeleton-shimmer rounded" />
                <div className="h-10 w-40 skeleton-shimmer rounded" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-36 skeleton-shimmer rounded" />
                            <div className="h-6 w-16 skeleton-shimmer rounded-full" />
                        </div>
                        <div className="h-3 w-full skeleton-shimmer rounded" />
                        <div className="h-3 w-3/4 skeleton-shimmer rounded" />
                        <div className="flex gap-2 pt-2">
                            <div className="h-8 w-20 skeleton-shimmer rounded" />
                            <div className="h-8 w-20 skeleton-shimmer rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
