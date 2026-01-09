import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const StatCardSkeleton = () => (
  <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

export const BalanceCardSkeleton = () => (
  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-28" />
      </div>
    </CardContent>
  </Card>
);

export const ReservationCardSkeleton = () => (
  <Card>
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 ml-2" />
          <Skeleton className="h-4 w-12" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const SectionSkeleton = ({ count = 2 }: { count?: number }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-4" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ReservationCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const AgencyHomeSkeleton = () => (
  <div className="min-h-screen bg-background pb-20">
    {/* Header */}
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="max-w-2xl mx-auto p-4 pt-safe">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded bg-primary-foreground/20" />
            <Skeleton className="h-6 w-32 bg-primary-foreground/20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded bg-primary-foreground/20" />
            <Skeleton className="h-8 w-8 rounded bg-primary-foreground/20" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-primary-foreground/10 rounded-lg p-2 sm:p-3">
              <Skeleton className="h-3 w-12 mb-1 bg-primary-foreground/20" />
              <Skeleton className="h-5 w-8 bg-primary-foreground/20" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Balance Card */}
      <BalanceCardSkeleton />

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Sections */}
      <SectionSkeleton count={2} />
      <SectionSkeleton count={1} />
    </div>
  </div>
);

export default AgencyHomeSkeleton;
