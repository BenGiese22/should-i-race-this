import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceMetrics, getUserSeasons, getSessionTypeComparison, getPerformanceTrends } from '@/lib/db/analytics';
import { getSession } from '@/lib/auth/server';
import type { GroupingType, SessionType } from '@/types';
import { AnalyticsMode, AnalyticsModeHelper } from '@/lib/types/analytics';

/**
 * GET /api/data/analytics
 * 
 * Flexible analytics endpoint with grouping options and filtering
 * Supports season-based filtering using year/quarter parameters
 * Includes pagination for large result sets
 * 
 * Query Parameters:
 * - groupBy: 'series' | 'track' | 'series_track' (required)
 * - sessionTypes: comma-separated list of session types (optional)
 * - seasonYear: iRacing season year (optional)
 * - seasonQuarter: iRacing season quarter 1-4 (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - seriesIds: comma-separated list of series IDs (optional)
 * - trackIds: comma-separated list of track IDs (optional)
 * - page: page number for pagination (default: 1)
 * - limit: results per page (default: 50, max: 200)
 * - mode: AnalyticsMode enum value (default: 'metrics')
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const modeParam = searchParams.get('mode') || 'metrics';
    const mode = AnalyticsModeHelper.normalize(modeParam);
    const groupBy = searchParams.get('groupBy') as GroupingType;
    const sessionTypesParam = searchParams.get('sessionTypes') || searchParams.get('sessionType');
    const seasonYear = searchParams.get('seasonYear');
    const seasonQuarter = searchParams.get('seasonQuarter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const seriesIdsParam = searchParams.get('seriesIds');
    const trackIdsParam = searchParams.get('trackIds');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    // Handle different modes
    switch (mode) {
      case AnalyticsMode.SEASONS:
        // Return available seasons for the user
        const seasons = await getUserSeasons(session.userId);
        return NextResponse.json({
          data: seasons,
          success: true,
        });

      case AnalyticsMode.COMPARISON:
        // Return session type comparison
        const comparisonFilters = {
          seasonYear: seasonYear ? parseInt(seasonYear) : undefined,
          seasonQuarter: seasonQuarter ? parseInt(seasonQuarter) : undefined,
          seriesId: seriesIdsParam ? parseInt(seriesIdsParam.split(',')[0]) : undefined,
          trackId: trackIdsParam ? parseInt(trackIdsParam.split(',')[0]) : undefined,
        };
        
        const comparison = await getSessionTypeComparison(session.userId, comparisonFilters);
        return NextResponse.json({
          data: comparison,
          success: true,
        });

      case AnalyticsMode.TRENDS:
        // Return performance trends over time
        const trendsOptions = {
          seriesId: seriesIdsParam ? parseInt(seriesIdsParam.split(',')[0]) : undefined,
          trackId: trackIdsParam ? parseInt(trackIdsParam.split(',')[0]) : undefined,
          sessionType: sessionTypesParam?.split(',')[0] as SessionType,
          periodMonths: 12, // Default to 12 months
        };
        
        const trends = await getPerformanceTrends(session.userId, trendsOptions);
        return NextResponse.json({
          data: trends,
          success: true,
        });

      case AnalyticsMode.METRICS:
      default:
        // Validate required parameters for metrics mode
        if (!groupBy || !['series', 'track', 'series_track'].includes(groupBy)) {
          return NextResponse.json(
            { error: 'Invalid or missing groupBy parameter. Must be: series, track, or series_track' },
            { status: 400 }
          );
        }

        // Parse optional filters
        const sessionTypes = sessionTypesParam && sessionTypesParam.trim()
          ? sessionTypesParam.split(',').filter(type => 
              ['practice', 'qualifying', 'time_trial', 'race'].includes(type.trim())
            ) as SessionType[]
          : undefined;

        const seriesIds = seriesIdsParam 
          ? seriesIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
          : undefined;

        const trackIds = trackIdsParam 
          ? trackIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
          : undefined;

        const filters = {
          sessionTypes,
          seasonYear: seasonYear ? parseInt(seasonYear) : undefined,
          seasonQuarter: seasonQuarter ? parseInt(seasonQuarter) : undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          seriesIds,
          trackIds,
        };

        // Validate date range
        if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
          return NextResponse.json(
            { error: 'startDate must be before endDate' },
            { status: 400 }
          );
        }

        // Validate season parameters
        if (filters.seasonQuarter && (!filters.seasonYear || filters.seasonQuarter < 1 || filters.seasonQuarter > 4)) {
          return NextResponse.json(
            { error: 'seasonQuarter must be 1-4 and requires seasonYear' },
            { status: 400 }
          );
        }

        // Get performance metrics
        const metrics = await getPerformanceMetrics(session.userId, groupBy, filters);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMetrics = metrics.slice(startIndex, endIndex);

        // Calculate pagination metadata
        const totalItems = metrics.length;
        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return NextResponse.json({
          analytics: paginatedMetrics,
          pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
          filters: {
            groupBy,
            sessionTypes,
            seasonYear: filters.seasonYear,
            seasonQuarter: filters.seasonQuarter,
            startDate: filters.startDate?.toISOString(),
            endDate: filters.endDate?.toISOString(),
            seriesIds,
            trackIds,
          },
          success: true,
        });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data/analytics
 * 
 * Advanced analytics queries with complex filtering
 * Accepts JSON body for more complex filter combinations
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      groupBy, 
      filters = {}, 
      pagination = { page: 1, limit: 50 },
      mode: modeParam = 'metrics'
    } = body;

    const mode = AnalyticsModeHelper.normalize(modeParam);

    // Validate groupBy for metrics mode
    if (mode === AnalyticsMode.METRICS && (!groupBy || !['series', 'track', 'series_track'].includes(groupBy))) {
      return NextResponse.json(
        { error: 'Invalid or missing groupBy parameter for metrics mode' },
        { status: 400 }
      );
    }

    // Validate pagination
    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(pagination.limit) || 50), 200);

    // Process filters
    const processedFilters = {
      sessionTypes: filters.sessionTypes?.filter((type: string) => 
        ['practice', 'qualifying', 'time_trial', 'race'].includes(type)
      ),
      seasonYear: filters.seasonYear ? parseInt(filters.seasonYear) : undefined,
      seasonQuarter: filters.seasonQuarter ? parseInt(filters.seasonQuarter) : undefined,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      seriesIds: filters.seriesIds?.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id)),
      trackIds: filters.trackIds?.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id)),
    };

    let result;
    switch (mode) {
      case AnalyticsMode.SEASONS:
        result = await getUserSeasons(session.userId);
        break;
      
      case AnalyticsMode.COMPARISON:
        result = await getSessionTypeComparison(session.userId, {
          seasonYear: processedFilters.seasonYear,
          seasonQuarter: processedFilters.seasonQuarter,
          seriesId: processedFilters.seriesIds?.[0],
          trackId: processedFilters.trackIds?.[0],
        });
        break;
      
      case AnalyticsMode.TRENDS:
        result = await getPerformanceTrends(session.userId, {
          seriesId: processedFilters.seriesIds?.[0],
          trackId: processedFilters.trackIds?.[0],
          sessionType: processedFilters.sessionTypes?.[0],
          periodMonths: filters.periodMonths || 12,
        });
        break;
      
      case AnalyticsMode.METRICS:
      default:
        const metrics = await getPerformanceMetrics(session.userId, groupBy, processedFilters);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        result = {
          data: metrics.slice(startIndex, endIndex),
          pagination: {
            page,
            limit,
            totalItems: metrics.length,
            totalPages: Math.ceil(metrics.length / limit),
            hasNextPage: page < Math.ceil(metrics.length / limit),
            hasPrevPage: page > 1,
          },
        };
        break;
    }

    return NextResponse.json({
      ...result,
      filters: processedFilters,
      success: true,
    });

  } catch (error) {
    console.error('Analytics POST API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}