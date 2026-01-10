'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationCardSkeleton } from './RecommendationCardSkeleton';
import { RecommendationTable } from './RecommendationTable';
import { VirtualRecommendationsList } from './VirtualRecommendationsList';
import { ModeSelector } from './ModeSelector';
import { RecommendationDetail } from './RecommendationDetail';
import { ErrorDisplay } from '@/components/ui/error-boundary';
import { useRecommendations } from '@/lib/hooks';
import { usePerformanceMonitor } from '@/lib/performance/monitoring';
import { ScoredRecommendation, ScoredOpportunity, RecommendationMode } from '@/lib/recommendations/types';

interface RecommendationsDashboardProps {
  initialMode?: RecommendationMode;
}

export function RecommendationsDashboard({ initialMode = 'balanced' }: RecommendationsDashboardProps) {
  const [mode, setMode] = useState<RecommendationMode>(initialMode);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ScoredRecommendation | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [enableVirtualization, setEnableVirtualization] = useState(true);

  // Performance monitoring
  const { recordRenderTime } = usePerformanceMonitor();

  // Use the recommendations hook with real-time mode switching
  const { data, loading, error, retryCount, isRetrying, refetch } = useRecommendations({
    mode,
    category: categoryFilter || undefined,
    maxResults: enableVirtualization ? 100 : 20, // Load more items when virtualization is enabled
    includeAlmostEligible: true
  });

  const handleModeChange = (newMode: RecommendationMode) => {
    setMode(newMode);
    // The hook will automatically refetch when mode changes
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category === categoryFilter ? '' : category);
    // The hook will automatically refetch when category changes
  };

  const handleRecommendationSelect = (recommendation: ScoredRecommendation | ScoredOpportunity) => {
    const startTime = performance.now();
    setSelectedRecommendation(recommendation as ScoredRecommendation);
    const duration = performance.now() - startTime;
    recordRenderTime('RecommendationsDashboard', 'select_recommendation', duration);
  };

  const handleCloseDetail = () => {
    const startTime = performance.now();
    setSelectedRecommendation(null);
    const duration = performance.now() - startTime;
    recordRenderTime('RecommendationsDashboard', 'close_detail', duration);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>

        {/* Mode selector skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          ))}
        </div>

        {/* User profile skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="space-y-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>

        {/* Results summary skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        {/* Recommendation cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={refetch}
        retryCount={retryCount}
        maxRetries={3}
        isRetrying={isRetrying}
        showNetworkStatus={true}
      />
    );
  }

  const recommendations = data?.recommendations || [];
  const userProfile = data?.userProfile;
  const metadata = data?.metadata;

  return (
    <div className="space-y-6">
      {/* Header with consistent typography */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Racing Recommendations
        </h1>
        <p className="text-sm text-gray-600">
          Personalized recommendations based on your racing history and goals
        </p>
      </div>

      {/* Mode Selector */}
      <ModeSelector 
        currentMode={mode} 
        onModeChange={handleModeChange}
        disabled={loading || isRetrying}
      />

      {/* User Profile */}
      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Racing Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Category */}
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Primary Category</h3>
                <Badge variant="default" className="text-sm">
                  {userProfile.primaryCategory.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  Based on your racing history
                </p>
              </div>

              {/* Experience Summary */}
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Experience</h3>
                <div className="text-sm space-y-1">
                  <div>{userProfile.experienceSummary.totalRaces} total races</div>
                  <div>{userProfile.experienceSummary.seriesWithExperience} series with experience</div>
                  <div>{userProfile.experienceSummary.tracksWithExperience} tracks with experience</div>
                </div>
              </div>
            </div>

            {/* Current Licenses */}
            {userProfile.licenseClasses.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Current Licenses</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userProfile.licenseClasses.map((license) => (
                    <div key={license.category} className="text-center">
                      <Badge 
                        variant={license.category === userProfile.primaryCategory ? "default" : "outline"} 
                        className="mb-2"
                      >
                        {license.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-semibold">{license.level.toUpperCase()}</div>
                        <div className="text-gray-600">
                          iR: {license.iRating} | SR: {license.safetyRating.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters and View Controls with improved mobile layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Category:</span>
          {!categoryFilter && userProfile?.primaryCategory && (
            <span className="text-xs text-gray-500">
              (showing {userProfile.primaryCategory.replace('_', ' ')} - your primary category)
            </span>
          )}
          
          {/* Single dropdown for all categories with consistent styling */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              disabled={loading || isRetrying}
              className={`
                w-full sm:w-auto px-3 py-2 text-sm font-medium rounded-md border transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${categoryFilter 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'
                }
                ${loading || isRetrying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <option value="">ALL CATEGORIES</option>
              <option value="oval">OVAL</option>
              <option value="sports_car">SPORTS CAR</option>
              <option value="formula_car">FORMULA CAR</option>
              <option value="dirt_oval">DIRT OVAL</option>
              <option value="dirt_road">DIRT ROAD</option>
            </select>
          </div>
          
          {categoryFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryFilter('')}
              disabled={loading || isRetrying}
              className="w-full sm:w-auto"
            >
              Clear Filter
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'cards' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="flex-1 sm:flex-none"
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex-1 sm:flex-none"
          >
            Table
          </Button>
          <Button
            variant={enableVirtualization ? "default" : "outline"}
            size="sm"
            onClick={() => setEnableVirtualization(!enableVirtualization)}
            className="flex-1 sm:flex-none"
            title={enableVirtualization ? "Disable virtualization" : "Enable virtualization"}
          >
            {enableVirtualization ? "Virtual" : "Standard"}
          </Button>
        </div>
      </div>

      {/* Results Summary with improved mobile layout */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span>
          {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} found
        </span>
        {categoryFilter ? (
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {categoryFilter.replace('_', ' ').toUpperCase()}
          </Badge>
        ) : userProfile?.primaryCategory && (
          <Badge variant="outline" className="text-xs px-2 py-1">
            Default: {userProfile.primaryCategory.replace('_', ' ').toUpperCase()}
          </Badge>
        )}
        <Badge variant="outline" className="capitalize text-xs px-2 py-1">
          {mode.replace('_', ' ')} Mode
        </Badge>
        {metadata && (
          <>
            {metadata.highConfidenceCount > 0 && (
              <Badge variant="default" className="text-xs px-2 py-1">
                {metadata.highConfidenceCount} High Confidence
              </Badge>
            )}
            {metadata.estimatedCount > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {metadata.estimatedCount} Estimated
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Recommendations Display with Performance Optimization */}
      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 text-lg mb-2">
              No recommendations available
            </div>
            <div className="text-gray-400 text-sm mb-4">
              {categoryFilter 
                ? `No recommendations found for ${categoryFilter.replace('_', ' ')} category. Try removing the filter or check back after more race data is available.`
                : 'Try adjusting your filters or check back after more race data is available.'
              }
            </div>
            {categoryFilter && (
              <Button 
                variant="outline" 
                onClick={() => setCategoryFilter('')}
              >
                Clear Filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Performance info for large lists */}
          {recommendations.length > 50 && (
            <div className="text-xs text-gray-500 mb-2">
              {enableVirtualization 
                ? `Showing ${recommendations.length} recommendations with virtual scrolling for optimal performance`
                : `Showing ${recommendations.length} recommendations (consider enabling virtualization for better performance)`
              }
            </div>
          )}
          
          {enableVirtualization && recommendations.length > 20 ? (
            <VirtualRecommendationsList
              recommendations={recommendations}
              viewMode={viewMode}
              onSelect={handleRecommendationSelect}
              containerHeight={600}
              enableVirtualization={true}
              virtualizationThreshold={20}
            />
          ) : (
            <>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((recommendation) => (
                    <RecommendationCard
                      key={`${recommendation.seriesId}-${recommendation.trackId}-${recommendation.raceWeekNum}`}
                      recommendation={recommendation}
                      onSelect={handleRecommendationSelect}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <RecommendationTable
                      recommendations={recommendations}
                      onSelect={handleRecommendationSelect}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Almost Eligible Section - Note: This would need to be implemented in the API */}
      {/* Future enhancement: Add almost eligible opportunities to RecommendationResponse */}

      {/* Detail Modal */}
      {selectedRecommendation && (
        <RecommendationDetail
          recommendation={selectedRecommendation}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}