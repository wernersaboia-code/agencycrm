import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar filters */}
          <div className="w-full lg:w-64 space-y-6">
            <Skeleton className="h-6 w-24 rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-20 rounded-md" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1 rounded-md" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-24 rounded-md" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-8 rounded-md" />
                    <Skeleton className="h-8 rounded-md" />
                  </div>
                  <div className="flex items-end justify-between border-t pt-4">
                    <Skeleton className="h-7 w-24 rounded-md" />
                    <Skeleton className="h-5 w-5 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
