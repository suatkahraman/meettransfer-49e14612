import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const CustomerHomeSkeleton = () => {
  return (
    <div className="space-y-6 pb-20">
      {/* Hero Skeleton */}
      <div className="relative h-[200px] w-full rounded-b-3xl overflow-hidden bg-muted animate-pulse">
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <Skeleton className="h-8 w-2/3 bg-white/20" />
          <Skeleton className="h-4 w-1/2 bg-white/20" />
        </div>
      </div>

      <div className="px-4 space-y-6 -mt-8 relative z-10">
        {/* Quick Actions Skeleton */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4 grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Bookings Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
