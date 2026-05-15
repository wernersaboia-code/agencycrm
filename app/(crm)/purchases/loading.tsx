export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 skeleton-shimmer rounded" />
                            <div>
                                <div className="h-8 w-48 skeleton-shimmer rounded" />
                                <div className="h-4 w-56 skeleton-shimmer rounded mt-1" />
                            </div>
                        </div>
                        <div className="h-10 w-44 skeleton-shimmer rounded" />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 skeleton-shimmer rounded-lg" />
                                <div className="space-y-1.5">
                                    <div className="h-7 w-12 skeleton-shimmer rounded" />
                                    <div className="h-3.5 w-28 skeleton-shimmer rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
