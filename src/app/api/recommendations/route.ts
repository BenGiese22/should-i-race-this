import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib/recommendations';
import { RecommendationMode } from '@/lib/recommendations/types';
import { getSession } from '@/lib/auth/server';
import { withPerformanceMonitoring } from '@/lib/performance/middleware';
import { globalProfiler } from '@/lib/performance/profiler';

// Helper function to create standardized error responses
function createErrorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { 
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Export wrapped handlers with performance monitoring
export const GET = withPerformanceMonitoring(async (request: NextRequest) => {
  try {
    // Get user session with detailed error handling
    let session;
    try {
      session = await getSession();
    } catch (sessionError) {
      console.error('Session validation error:', sessionError);
      return createErrorResponse(
        'Authentication failed. Please log in again.',
        401,
        { type: 'session_error' }
      );
    }

    if (!session?.userId) {
      return createErrorResponse(
        'Authentication required. Please log in to view recommendations.',
        401,
        { type: 'no_session' }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') as RecommendationMode) || 'balanced';
    const category = searchParams.get('category') || undefined;
    
    let minScore = 0;
    let maxResults = 20;
    
    try {
      const minScoreParam = searchParams.get('minScore');
      if (minScoreParam) {
        minScore = parseInt(minScoreParam, 10);
        if (isNaN(minScore) || minScore < 0 || minScore > 100) {
          return createErrorResponse(
            'Invalid minScore parameter. Must be a number between 0 and 100.',
            400,
            { type: 'invalid_parameter', parameter: 'minScore', value: minScoreParam }
          );
        }
      }
      
      const maxResultsParam = searchParams.get('maxResults');
      if (maxResultsParam) {
        maxResults = parseInt(maxResultsParam, 10);
        if (isNaN(maxResults) || maxResults < 1 || maxResults > 100) {
          return createErrorResponse(
            'Invalid maxResults parameter. Must be a number between 1 and 100.',
            400,
            { type: 'invalid_parameter', parameter: 'maxResults', value: maxResultsParam }
          );
        }
      }
    } catch (_parseError) {
      return createErrorResponse(
        'Invalid query parameters provided.',
        400,
        { type: 'parameter_parse_error' }
      );
    }
    
    const includeAlmostEligible = searchParams.get('includeAlmostEligible') === 'true';

    // Validate mode
    const validModes: RecommendationMode[] = ['balanced', 'irating_push', 'safety_recovery'];
    if (!validModes.includes(mode)) {
      return createErrorResponse(
        `Invalid recommendation mode: ${mode}. Valid modes are: ${validModes.join(', ')}.`,
        400,
        { type: 'invalid_mode', validModes }
      );
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'];
      if (!validCategories.includes(category)) {
        return createErrorResponse(
          `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}.`,
          400,
          { type: 'invalid_category', validCategories }
        );
      }
    }

    // Get recommendations with enhanced error handling and profiling
    let result;
    try {
      result = await globalProfiler.profile(
        'get_filtered_recommendations',
        () => recommendationEngine.getFilteredRecommendations(
          session.userId,
          {
            mode,
            category,
            minScore,
            maxResults,
            includeAlmostEligible
          }
        ),
        {
          userId: session.userId,
          mode,
          category,
          minScore,
          maxResults,
          includeAlmostEligible
        }
      );
      result = result.result; // Extract result from profiler response
    } catch (engineError) {
      console.error('Recommendation engine error:', engineError);
      
      // Check for specific error types
      if (engineError instanceof Error) {
        if (engineError.message.includes('User not found')) {
          return createErrorResponse(
            'User profile not found. Please ensure your account is properly set up.',
            404,
            { type: 'user_not_found' }
          );
        }
        
        if (engineError.message.includes('No license data')) {
          return createErrorResponse(
            'No license data available. Please sync your iRacing data first.',
            404,
            { type: 'no_license_data' }
          );
        }
        
        if (engineError.message.includes('Database')) {
          return createErrorResponse(
            'Database connection error. Please try again in a moment.',
            503,
            { type: 'database_error' }
          );
        }
      }
      
      // Generic engine error
      return createErrorResponse(
        'Failed to generate recommendations. Please try again.',
        500,
        { type: 'engine_error' }
      );
    }

    // Validate result structure
    if (!result || typeof result !== 'object') {
      return createErrorResponse(
        'Invalid response from recommendation engine.',
        500,
        { type: 'invalid_response' }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error in recommendations API:', error);
    return createErrorResponse(
      'An unexpected error occurred. Please try again or contact support if the problem persists.',
      500,
      { type: 'unexpected_error' }
    );
  }
}, {
  enableProfiling: true,
  enableMetrics: true,
  slowRequestThreshold: 2000, // 2 seconds for recommendations
  enableRequestLogging: true
});

export const POST = withPerformanceMonitoring(async (request: NextRequest) => {
  try {
    // Get user session with detailed error handling
    let session;
    try {
      session = await getSession();
    } catch (sessionError) {
      console.error('Session validation error:', sessionError);
      return createErrorResponse(
        'Authentication failed. Please log in again.',
        401,
        { type: 'session_error' }
      );
    }

    if (!session?.userId) {
      return createErrorResponse(
        'Authentication required. Please log in to analyze opportunities.',
        401,
        { type: 'no_session' }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (_parseError) {
      return createErrorResponse(
        'Invalid JSON in request body.',
        400,
        { type: 'invalid_json' }
      );
    }

    const { seriesId, trackId, mode = 'balanced' } = body;

    // Validate required parameters
    if (!seriesId || !trackId) {
      return createErrorResponse(
        'Missing required parameters: seriesId and trackId are required.',
        400,
        { 
          type: 'missing_parameters',
          required: ['seriesId', 'trackId'],
          provided: Object.keys(body)
        }
      );
    }

    // Validate parameter types
    if (typeof seriesId !== 'number' && typeof seriesId !== 'string') {
      return createErrorResponse(
        'Invalid seriesId parameter. Must be a number or string.',
        400,
        { type: 'invalid_parameter_type', parameter: 'seriesId' }
      );
    }

    if (typeof trackId !== 'number' && typeof trackId !== 'string') {
      return createErrorResponse(
        'Invalid trackId parameter. Must be a number or string.',
        400,
        { type: 'invalid_parameter_type', parameter: 'trackId' }
      );
    }

    // Validate mode
    const validModes: RecommendationMode[] = ['balanced', 'irating_push', 'safety_recovery'];
    if (!validModes.includes(mode as RecommendationMode)) {
      return createErrorResponse(
        `Invalid recommendation mode: ${mode}. Valid modes are: ${validModes.join(', ')}.`,
        400,
        { type: 'invalid_mode', validModes }
      );
    }

    // Analyze specific opportunity with enhanced error handling and profiling
    let analysis;
    try {
      analysis = await globalProfiler.profile(
        'analyze_opportunity',
        () => recommendationEngine.analyzeOpportunity(
          session.userId,
          Number(seriesId),
          Number(trackId),
          mode as RecommendationMode
        ),
        {
          userId: session.userId,
          seriesId: Number(seriesId),
          trackId: Number(trackId),
          mode
        }
      );
      analysis = analysis.result; // Extract result from profiler response
    } catch (engineError) {
      console.error('Opportunity analysis error:', engineError);
      
      if (engineError instanceof Error) {
        if (engineError.message.includes('Series not found')) {
          return createErrorResponse(
            `Series with ID ${seriesId} not found.`,
            404,
            { type: 'series_not_found', seriesId }
          );
        }
        
        if (engineError.message.includes('Track not found')) {
          return createErrorResponse(
            `Track with ID ${trackId} not found.`,
            404,
            { type: 'track_not_found', trackId }
          );
        }
        
        if (engineError.message.includes('No data available')) {
          return createErrorResponse(
            'Insufficient data available for this series/track combination.',
            404,
            { type: 'insufficient_data', seriesId, trackId }
          );
        }
      }
      
      return createErrorResponse(
        'Failed to analyze opportunity. Please try again.',
        500,
        { type: 'analysis_error' }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Unexpected error in opportunity analysis API:', error);
    return createErrorResponse(
      'An unexpected error occurred. Please try again or contact support if the problem persists.',
      500,
      { type: 'unexpected_error' }
    );
  }
}, {
  enableProfiling: true,
  enableMetrics: true,
  slowRequestThreshold: 1000, // 1 second for opportunity analysis
  enableRequestLogging: true
});