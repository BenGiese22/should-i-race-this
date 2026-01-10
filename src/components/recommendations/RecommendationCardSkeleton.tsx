'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RecommendationCardSkeleton() {
  return (
    <Card className="racing-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* Series name skeleton */}
            <Skeleton className="h-6 w-3/4 mb-2" />
            {/* Track name skeleton */}
            <Skeleton className="h-5 w-2/3" />
          </div>
          <div className="text-right flex flex-col items-end gap-1.5 ml-3">
            {/* Badge skeleton */}
            <Skeleton className="h-6 w-16" />
            {/* Confidence badge skeleton */}
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        
        {/* Category badges skeleton */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Performance factors header skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Performance factor rows skeleton */}
          <div className="grid grid-cols-1 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 flex-1" />
              </div>
            ))}
          </div>
          
          {/* Risk analysis section skeleton */}
          <div className="mt-4">
            <div className="flex items-center gap-1 mb-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>

        {/* Risk indicators skeleton */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>

        {/* Key insights skeleton */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-1">
                <Skeleton className="h-3 w-1 mt-0.5" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}