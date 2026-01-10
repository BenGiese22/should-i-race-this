/**
 * iRacing Data API Client
 * 
 * Provides authenticated HTTP client for iRacing Data API with:
 * - Rate limiting and error handling
 * - Support for fetching race results and current schedule
 * - Automatic token refresh
 */

import { getValidAccessToken } from '../auth/server';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  requests: new Map<string, number[]>(),
};

// iRacing Data API base URL
const IRACING_DATA_API_BASE = 'https://members-ng.iracing.com/data';

export interface RaceResultsResponse {
  link: string;
  results?: {
    subsession_id: number;
    series_id: number;
    series_name: string;
    track: {
      track_id: number;
      track_name: string;
    };
    session_results: Array<{
      simsession_number: number;
      simsession_type: number;
      simsession_type_name: string;
      results: Array<{
        cust_id: number;
        display_name: string;
        starting_position: number;
        finishing_position: number;
        incidents: number;
      }>;
    }>;
    event_strength_of_field: number;
    start_time: string;
    season_year: number;
    season_quarter: number;
    race_week_num: number;
    race_summary?: {
      subsession_id: number;
      event_type: number;
      event_type_name: string;
      track: {
        track_id: number;
        track_name: string;
      };
      weather: {
        version: number;
        type: number;
        temp_units: number;
        temp_value: number;
        rel_humidity: number;
        fog: number;
        wind_dir: number;
        wind_units: number;
        wind_value: number;
        skies: number;
        weather_var_initial: number;
        weather_var_ongoing: number;
        time_of_day: number;
        simulated_start_time: string;
        simulated_time_multiplier: number;
        simulated_time_offsets: number[];
      };
      track_state: {
        leave_marbles: boolean;
        practice_rubber: number;
        qualify_rubber: number;
        warmup_rubber: number;
        race_rubber: number;
        practice_grip_compound: number;
        qualify_grip_compound: number;
        warmup_grip_compound: number;
        race_grip_compound: number;
      };
      session_results: Array<{
        simsession_number: number;
        simsession_type: number;
        simsession_type_name: string;
        results: Array<{
          cust_id: number;
          display_name: string;
          starting_position: number;
          finishing_position: number;
          incidents: number;
          laps_complete: number;
          laps_lead: number;
          opt_laps_complete: number;
          interval: number;
          class_interval: number;
          average_lap: number;
          best_lap_num: number;
          best_lap_time: number;
          best_nlaps_num: number;
          best_nlaps_time: number;
          best_qual_lap_at: string;
          best_qual_lap_num: number;
          best_qual_lap_time: number;
          reason_out_id: number;
          reason_out: string;
          champ_points: number;
          drop_race: boolean;
          club_points: number;
          position: number;
          qual_lap_time: number;
          starting_position_in_class: number;
          car_class_id: number;
          car_class_name: string;
          car_class_short_name: string;
          division: number;
          old_license_level: number;
          old_sub_level: number;
          old_cpi: number;
          oldi_rating: number;
          old_ttrating: number;
          new_license_level: number;
          new_sub_level: number;
          new_cpi: number;
          newi_rating: number;
          new_ttrating: number;
          multiplier: number;
          license_change_oval: number;
          license_change_road: number;
          max_pct_fuel_fill: number;
          weight_penalty_kg: number;
          league_points: number;
          league_agg_points: number;
          car_id: number;
          aggregate_champ_points: number;
          livery: {
            car_id: number;
            pattern: number;
            color1: string;
            color2: string;
            color3: string;
            number_font: number;
            number_color1: string;
            number_color2: string;
            number_color3: string;
            number_slant: number;
            sponsor1: number;
            sponsor2: number;
            car_number: string;
            wheel_color: string;
            rim_type: number;
          };
        }>;
      }>;
      event_laps_complete: number;
      event_average_lap: number;
      event_best_lap_time: number;
      num_cautions: number;
      num_caution_laps: number;
      num_lead_changes: number;
      official_session: boolean;
      heat_info_id: number;
      special_event_type: number;
      damage_model: number;
      can_protest: boolean;
      cooldown_minutes: number;
      limit_minutes: number;
      driver_changes: boolean;
      min_team_drivers: number;
      max_team_drivers: number;
      driver_change_rule: number;
      driver_change_param1: number;
      driver_change_param2: number;
      max_weeks: number;
      points_type: string;
      corners_per_lap: number;
      caution_type: number;
      race_summary: {
        subsession_id: number;
        average_lap: number;
        laps_complete: number;
        num_cautions: number;
        num_caution_laps: number;
        num_lead_changes: number;
        field_strength: number;
        num_opt_laps: number;
      };
    };
  }[];
}

export interface ScheduleResponse {
  link: string;
  seasons?: Array<{
    season_id: number;
    series_id: number;
    series_name: string;
    series_short_name: string;
    category_id: number;
    category: string;
    license_group: number;
    license_group_types: Array<{
      license_group_type: number;
    }>;
    min_license_level: number;
    max_license_level: number;
    season_year: number;
    season_quarter: number;
    schedules: Array<{
      season_id: number;
      race_week_num: number;
      race_week_name: string;
      track: {
        track_id: number;
        track_name: string;
        config_name: string;
        category_id: number;
        category: string;
      };
      race_times: Array<{
        start_date: string;
        start_time: string;
        repeat_minutes: number;
        super_session: boolean;
        special_event_type: number;
      }>;
      time_descriptors: Array<{
        session_minutes: number;
        session_name: string;
        session_type: string;
      }>;
      weather: {
        version: number;
        type: number;
        temp_units: number;
        temp_value: number;
        rel_humidity: number;
        fog: number;
        wind_dir: number;
        wind_units: number;
        wind_value: number;
        skies: number;
        weather_var_initial: number;
        weather_var_ongoing: number;
        time_of_day: number;
        simulated_start_time: string;
        simulated_time_multiplier: number;
        simulated_time_offsets: number[];
      };
      track_state: {
        leave_marbles: boolean;
        practice_rubber: number;
        qualify_rubber: number;
        warmup_rubber: number;
        race_rubber: number;
        practice_grip_compound: number;
        qualify_grip_compound: number;
        warmup_grip_compound: number;
        race_grip_compound: number;
      };
      package_id: number;
      race_lap_limit: number;
      race_time_limit: number;
      start_zone: boolean;
      enable_pitlane_collisions: boolean;
      short_parade_lap: boolean;
      num_opt_laps: number;
      start_on_qual_tire: boolean;
      qual_attached: boolean;
      qual_laps: number;
      qual_length: number;
      qual_score_type: number;
      qual_score_type_name: string;
      qual_open_reg_minutes: number;
      qual_min_session_time: number;
      practice_length: number;
      open_practice: boolean;
      private_practice: boolean;
      practice_mul_dry_tire_types: boolean;
      practice_mul_tire_types: boolean;
      qualify_mul_dry_tire_types: boolean;
      qualify_mul_tire_types: boolean;
      race_mul_dry_tire_types: boolean;
      race_mul_tire_types: boolean;
      heat_racing: boolean;
      lucky_dog: boolean;
      num_fixed_setups: number;
      fixed: boolean;
      unofficial: boolean;
      driver_changes: boolean;
      min_team_drivers: number;
      max_team_drivers: number;
      driver_change_rule: number;
      driver_change_param1: number;
      driver_change_param2: number;
      max_weeks: number;
      points_type: string;
      event_type: number;
      event_type_name: string;
      corners_per_lap: number;
      caution_type: number;
      dynamic_rubbering: boolean;
      dynamic_weather: boolean;
      lone_qualify: boolean;
      must_use_diff_tire_types_in_race: boolean;
      op_duration: number;
      qual_setup_count: number;
      race_setup_count: number;
      qual_attached_to_session: boolean;
      restrict_results: boolean;
      start_date: string;
      end_date: string;
    }>;
  }>;
}

export interface SearchSeriesResponse {
  link?: string;
  data?: {
    chunk_info?: {
      base_download_url?: string;
      chunk_file_names?: string[];
      chunk_file_names_sorted?: string[];
    };
  };
  // Direct results (if not chunked)
  results?: Array<{
    subsession_id: number;
    series_id: number;
    series_name: string;
    track_id: number;
    track_name: string;
    session_start_time: string;
    event_type: number;
    event_type_name: string;
    start_position: number;
    finish_position: number;
    incidents: number;
    event_strength_of_field: number;
    season_year: number;
    season_quarter: number;
    race_week_num: number;
    official_session: boolean;
  }>;
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = RATE_LIMIT.requests.get(userId) || [];
  
  // Remove requests outside the window
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT.windowMs);
  
  if (validRequests.length >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  RATE_LIMIT.requests.set(userId, validRequests);
  
  return true;
}

/**
 * Generic API request with authentication and error handling
 * Handles iRacing's link-based response pattern
 */
export async function makeAuthenticatedRequest<T>(
  userId: string,
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  // Check rate limit
  if (!checkRateLimit(userId)) {
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
  }
  
  // Get valid access token
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    throw new Error('Unable to get valid access token');
  }
  
  // Build URL with parameters
  const url = new URL(`${IRACING_DATA_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  console.log(`Making iRacing API request to: ${url.toString()}`);
  
  // Make request with retry logic
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited by iRacing - wait and retry
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please re-authenticate.');
        }
        
        const errorText = await response.text();
        throw new Error(`iRacing API error: ${response.status} ${errorText}`);
      }
      
      const payload = await response.json();
      
      // Handle iRacing's link-based response pattern
      if (payload && typeof payload === 'object' && 'link' in payload && typeof payload.link === 'string') {
        // Fetch the actual data from the link
        const linkResponse = await fetch(payload.link);
        if (!linkResponse.ok) {
          const linkErrorText = await linkResponse.text();
          throw new Error(`iRacing link fetch failed: ${linkResponse.status} ${linkErrorText}`);
        }
        const linkData = await linkResponse.json();
        return linkData;
      }
      
      // Check if this is an error response
      if (payload && typeof payload === 'object') {
        const keys = Object.keys(payload);
        if (keys.includes('all') && keys.includes('service') && keys.includes('method')) {
          // This might be an error response or wrong endpoint
          throw new Error(`Unexpected API response format. Keys: ${keys.join(', ')}`);
        }
      }
      
      return payload;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError || new Error('Request failed after 3 attempts');
}

/**
 * Fetch member's race results using the search_series endpoint
 * This is the correct endpoint for getting comprehensive race results with season filtering
 */
export async function fetchMemberRecentRaces(
  userId: string,
  customerId: number,
  seasonYear?: number,
  seasonQuarter?: number
): Promise<SearchSeriesResponse> {
  const params: Record<string, string | number> = {
    cust_id: customerId,
  };
  
  if (seasonYear) params.season_year = seasonYear;
  if (seasonQuarter) params.season_quarter = seasonQuarter;
  
  try {
    // Use the correct results/search_series endpoint for comprehensive race results
    const response = await makeAuthenticatedRequest<SearchSeriesResponse>(
      userId,
      '/results/search_series',
      params
    );
    
    // Handle chunked responses like the old project
    if (response.data?.chunk_info) {
      const chunkInfo = response.data.chunk_info;
      const baseUrl = chunkInfo.base_download_url;
      const files = chunkInfo.chunk_file_names_sorted || chunkInfo.chunk_file_names || [];
      
      if (baseUrl && files.length > 0) {
        const allResults: any[] = [];
        
        // Fetch each chunk file
        for (const file of files) {
          const chunkUrl = file.startsWith('http') ? file : `${baseUrl}${file}`;
          try {
            const chunkResponse = await fetch(chunkUrl);
            if (chunkResponse.ok) {
              const chunkData = await chunkResponse.json();
              if (Array.isArray(chunkData)) {
                allResults.push(...chunkData);
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch chunk ${file}:`, error);
          }
        }
        
        return {
          ...response,
          results: allResults
        };
      }
    }
    
    // Handle direct results or link-based responses
    if (response.results && Array.isArray(response.results)) {
      return response;
    }
    
    // If no direct results, try to extract from nested structure
    const extractedResults = extractItemsFromResponse(response);
    if (extractedResults.length > 0) {
      return {
        ...response,
        results: extractedResults
      };
    }
    
    return response;
  } catch (error) {
    // If the search_series endpoint fails, try alternative approaches
    console.warn(`search_series endpoint failed for season ${seasonYear}Q${seasonQuarter}:`, error);
    
    // Try without season parameters as fallback
    if (seasonYear || seasonQuarter) {
      console.log('Retrying without season parameters...');
      return fetchMemberRecentRaces(userId, customerId);
    }
    
    // If all else fails, return empty response
    return { results: [] };
  }
}

/**
 * Extract race results from various response formats
 * Based on the reference implementation's extraction logic
 */
function extractItemsFromResponse(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  
  // Try common result array names
  const arrays = [payload.results, payload.data, payload.races, payload.sessions, payload.events];
  for (const candidate of arrays) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      const nested = candidate;
      const nestedCandidates = [
        nested.results,
        nested.races,
        nested.sessions,
        nested.events,
        nested.items,
        nested.data,
      ];
      for (const nestedItem of nestedCandidates) {
        if (Array.isArray(nestedItem)) return nestedItem;
      }
      // Find first array in nested object
      const firstArray = Object.values(nested).find((value) =>
        Array.isArray(value)
      );
      if (firstArray && Array.isArray(firstArray)) {
        return firstArray;
      }
    }
  }
  return [];
}

/**
 * Fetch detailed race results for a specific subsession
 */
export async function fetchSubsessionResults(
  userId: string,
  subsessionId: number
): Promise<RaceResultsResponse> {
  return makeAuthenticatedRequest<RaceResultsResponse>(
    userId,
    '/data/results/get',
    { subsession_id: subsessionId }
  );
}

/**
 * Fetch current season schedule
 */
export async function fetchSeasonSchedule(
  userId: string,
  seasonYear?: number,
  seasonQuarter?: number
): Promise<ScheduleResponse> {
  const params: Record<string, string | number> = {};
  
  if (seasonYear) params.season_year = seasonYear;
  if (seasonQuarter) params.season_quarter = seasonQuarter;
  
  return makeAuthenticatedRequest<ScheduleResponse>(
    userId,
    '/season/race_guide',
    params
  );
}

/**
 * Get current iRacing season info
 */
export function getCurrentSeason(): { year: number; quarter: number } {
  const now = new Date();
  const year = now.getFullYear();
  
  // iRacing seasons roughly align with calendar quarters
  // Q1: Dec-Feb, Q2: Mar-May, Q3: Jun-Aug, Q4: Sep-Nov
  const month = now.getMonth() + 1; // 1-based month
  let quarter: number;
  
  if (month >= 12 || month <= 2) {
    quarter = 1;
  } else if (month >= 3 && month <= 5) {
    quarter = 2;
  } else if (month >= 6 && month <= 8) {
    quarter = 3;
  } else {
    quarter = 4;
  }
  
  return { year, quarter };
}

/**
 * Clear rate limit for a user (useful for testing)
 */
export function clearRateLimit(userId: string): void {
  RATE_LIMIT.requests.delete(userId);
}