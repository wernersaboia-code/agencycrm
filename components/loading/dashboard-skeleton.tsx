"use client"

import { cn } from "@/lib/utils"

interface DashboardSkeletonProps {
  className?: string
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("container py-6 space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted skeleton-shimmer rounded-lg" />
        <div className="h-4 w-64 bg-muted skeleton-shimmer rounded-md" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted skeleton-shimmer rounded-md" />
              <div className="h-8 w-8 bg-muted skeleton-shimmer rounded-full" />
            </div>
            <div className="h-8 w-20 bg-muted skeleton-shimmer rounded-lg" />
            <div className="h-3 w-32 bg-muted skeleton-shimmer rounded-md" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="h-5 w-40 bg-muted skeleton-shimmer rounded-md" />
          <div className="h-[200px] bg-muted skeleton-shimmer rounded-xl" />
        </div>
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="h-5 w-40 bg-muted skeleton-shimmer rounded-md" />
          <div className="h-[200px] bg-muted skeleton-shimmer rounded-xl" />
        </div>
      </div>

      {/* Lists */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="h-5 w-40 bg-muted skeleton-shimmer rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-10 w-10 bg-muted skeleton-shimmer rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted skeleton-shimmer rounded-md" />
                <div className="h-3 w-20 bg-muted skeleton-shimmer rounded-md" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="h-5 w-40 bg-muted skeleton-shimmer rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-10 w-10 bg-muted skeleton-shimmer rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted skeleton-shimmer rounded-md" />
                <div className="h-3 w-20 bg-muted skeleton-shimmer rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-3 pb-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 flex-1 bg-muted skeleton-shimmer rounded-md" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-4 flex-1 bg-muted skeleton-shimmer rounded-md"
              style={{ opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CardSkeletonProps {
  className?: string
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-5 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-muted skeleton-shimmer rounded-md" />
        <div className="h-8 w-8 bg-muted skeleton-shimmer rounded-full" />
      </div>
      <div className="h-[120px] bg-muted skeleton-shimmer rounded-xl" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-muted skeleton-shimmer rounded-md" />
        <div className="h-8 w-20 bg-muted skeleton-shimmer rounded-md" />
      </div>
    </div>
  )
}

interface PageSkeletonProps {
  className?: string
}

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("container py-6 space-y-6", className)}>
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted skeleton-shimmer rounded-lg" />
        <div className="h-4 w-64 bg-muted skeleton-shimmer rounded-md" />
      </div>
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="h-5 w-40 bg-muted skeleton-shimmer rounded-md" />
        <div className="h-[300px] bg-muted skeleton-shimmer rounded-xl" />
      </div>
    </div>
  )
}
