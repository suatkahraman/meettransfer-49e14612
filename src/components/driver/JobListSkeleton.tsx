import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const JobCardSkeleton = () => (
  <Card className="border-l-4 border-muted overflow-hidden">
    <CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 flex-1 max-w-[120px]" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-14 rounded" />
      </div>
    </CardContent>
  </Card>
);

interface JobListSkeletonProps {
  count?: number;
}

export const JobListSkeleton = ({ count = 3 }: JobListSkeletonProps) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <JobCardSkeleton key={i} />
    ))}
  </div>
);

export default JobListSkeleton;
