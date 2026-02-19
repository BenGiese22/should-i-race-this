import { 
  PrimaryRecommendationSkeleton, 
  SecondaryRecommendationSkeleton, 
  OtherOptionSkeleton 
} from '@/components/racing';

/**
 * Loading state for recommendations page
 * 
 * Requirements: 6.3, 11.2, 11.3, 11.4
 */
export function RecommendationsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-surface rounded w-64 mb-2" />
        <div className="h-4 bg-surface rounded w-96" />
      </div>

      {/* Mode selector skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-surface rounded-lg w-32" />
        <div className="h-10 bg-surface rounded-lg w-32" />
        <div className="h-10 bg-surface rounded-lg w-40" />
      </div>

      {/* Experience summary skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-4 bg-surface rounded w-32" />
        <div className="h-4 bg-surface rounded w-24" />
        <div className="h-4 bg-surface rounded w-28" />
      </div>

      {/* Primary card skeleton */}
      <section>
        <div className="h-4 bg-surface rounded w-32 mb-4" />
        <PrimaryRecommendationSkeleton />
      </section>

      {/* Secondary cards skeleton */}
      <section>
        <div className="h-4 bg-surface rounded w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SecondaryRecommendationSkeleton />
          <SecondaryRecommendationSkeleton />
        </div>
      </section>

      {/* Other options skeleton */}
      <section>
        <div className="h-4 bg-surface rounded w-32 mb-4" />
        <div className="space-y-2">
          <OtherOptionSkeleton />
          <OtherOptionSkeleton />
          <OtherOptionSkeleton />
        </div>
      </section>
    </div>
  );
}

export default RecommendationsSkeleton;
