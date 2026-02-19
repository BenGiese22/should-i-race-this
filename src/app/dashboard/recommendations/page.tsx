import { Suspense } from 'react';
import { RecommendationsClient } from './RecommendationsClient';
import { RecommendationsSkeleton } from './loading';

/**
 * Recommendations Page - Server Component
 * 
 * This page displays personalized race recommendations based on the user's
 * racing history and selected mode (balanced, push, recovery).
 * 
 * Requirements: 6.1, 6.3
 */
export default function RecommendationsPage() {
  return (
    <Suspense fallback={<RecommendationsSkeleton />}>
      <RecommendationsClient />
    </Suspense>
  );
}
