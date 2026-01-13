import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton fallback for Hero component when it fails to load or is loading
 */
export const HeroSkeleton = () => {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background skeleton */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />

      <div className="container relative z-10 px-2 sm:px-3 md:px-4 pt-4 md:pt-8 pb-4 md:pb-8 lg:pb-16">
        <div className="grid md:grid-cols-5 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-12 items-start lg:items-center min-h-[calc(100svh-8rem)] md:min-h-[calc(100svh-6rem)]">
          {/* Left Side - Form skeleton */}
          <div className="order-1 md:col-span-3 lg:col-span-1 space-y-4">
            {/* Header skeleton */}
            <div className="space-y-2 mb-6">
              <Skeleton className="h-8 w-3/4 max-w-[300px]" />
              <Skeleton className="h-5 w-full max-w-[400px]" />
            </div>

            {/* AI Assistant skeleton */}
            <Skeleton className="h-12 w-full rounded-xl" />

            {/* Form card skeleton */}
            <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
              {/* Tabs */}
              <div className="flex bg-muted/50">
                <Skeleton className="flex-1 h-12" />
                <Skeleton className="flex-1 h-12" />
              </div>

              {/* Form content */}
              <div className="p-4 sm:p-4 md:p-5 lg:p-5 space-y-4">
                {/* Location inputs */}
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />

                {/* Date and time row */}
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-14 rounded-xl" />
                  <Skeleton className="h-14 rounded-xl" />
                </div>

                {/* Passengers */}
                <Skeleton className="h-14 w-full rounded-xl" />

                {/* Vehicle selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>

                {/* Submit button */}
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex justify-center gap-4 pt-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Right Side - Visual skeleton (hidden on mobile) */}
          <div className="hidden md:flex order-2 md:col-span-2 lg:col-span-1 items-center justify-center">
            <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSkeleton;
