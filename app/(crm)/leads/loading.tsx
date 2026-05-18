import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-8 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 border-b last:border-0">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
