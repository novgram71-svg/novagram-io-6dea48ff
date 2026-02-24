import { Skeleton } from '@/components/ui/skeleton';

export const SkeletonPostCard = () => (
  <div className="nova-card p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const SkeletonFeed = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <SkeletonPostCard key={i} />
    ))}
  </div>
);

export const SkeletonPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);
