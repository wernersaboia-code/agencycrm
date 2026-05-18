import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
            <div className="max-w-3xl space-y-5">
              <Skeleton className="h-6 w-64 rounded-md" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-6 w-1/2 rounded-md" />
              <div className="flex gap-3 pt-3">
                <Skeleton className="h-11 flex-1 rounded-lg" />
                <Skeleton className="h-11 w-32 rounded-lg" />
              </div>
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-40 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto grid gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured lists */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-8 w-96 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-md" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Skeleton className="h-8 rounded-md" />
                  <Skeleton className="h-8 rounded-md" />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <div className="flex items-end justify-between border-t pt-4">
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-5 w-5 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
