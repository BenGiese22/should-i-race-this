/**
 * Mock Analytics Data for Testing
 *
 * Provides fake analytics data for each mock profile to enable
 * testing and iteration of the analytics dashboard.
 */

import type { MockProfileId } from './context';

export interface MockPerformanceMetric {
  seriesId?: number;
  seriesName?: string;
  trackId?: number;
  trackName?: string;
  avgStartingPosition: number;
  avgFinishingPosition: number;
  positionDelta: number;
  avgIncidents: number;
  raceCount: number;
}

export interface MockIndividualRace {
  id: string;
  subsessionId: number;
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  raceDate: string;
  startingPosition: number;
  finishingPosition: number;
  positionDelta: number;
  incidents: number;
  strengthOfField: number;
}

export interface MockAnalyticsData {
  metricsBySeries: MockPerformanceMetric[];
  metricsByTrack: MockPerformanceMetric[];
  metricsBySeriesTrack: MockPerformanceMetric[];
  raceDetails: Record<string, MockIndividualRace[]>;
}

// Helper to generate race dates
function generateRaceDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// Helper to generate individual races for a series/track combo
function generateRaces(
  seriesId: number,
  seriesName: string,
  trackId: number,
  trackName: string,
  count: number,
  avgStart: number,
  avgFinish: number,
  avgIncidents: number,
  sof: number
): MockIndividualRace[] {
  const races: MockIndividualRace[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.max(1, Math.round(avgStart + (Math.random() - 0.5) * 6));
    const finish = Math.max(1, Math.round(avgFinish + (Math.random() - 0.5) * 6));
    const incidents = Math.max(0, Math.round(avgIncidents + (Math.random() - 0.5) * 3));
    
    races.push({
      id: `race-${seriesId}-${trackId}-${i}`,
      subsessionId: 50000000 + Math.floor(Math.random() * 10000000),
      seriesId,
      seriesName,
      trackId,
      trackName,
      raceDate: generateRaceDate(i * 3 + Math.floor(Math.random() * 3)),
      startingPosition: start,
      finishingPosition: finish,
      positionDelta: start - finish,
      incidents,
      strengthOfField: Math.round(sof + (Math.random() - 0.5) * 400),
    });
  }
  return races;
}

/**
 * New Driver Analytics
 */
const newDriverAnalytics: MockAnalyticsData = {
  metricsBySeries: [
    {
      seriesId: 234,
      seriesName: 'Global Mazda MX-5 Fanatec Cup',
      avgStartingPosition: 18.2,
      avgFinishingPosition: 16.5,
      positionDelta: 1.7,
      avgIncidents: 4.2,
      raceCount: 8,
    },
    {
      seriesId: 235,
      seriesName: 'Rookie Mazda MX-5 Cup',
      avgStartingPosition: 14.5,
      avgFinishingPosition: 15.8,
      positionDelta: -1.3,
      avgIncidents: 5.1,
      raceCount: 4,
    },
  ],
  metricsByTrack: [
    {
      trackId: 238,
      trackName: 'Laguna Seca',
      avgStartingPosition: 18.2,
      avgFinishingPosition: 16.5,
      positionDelta: 1.7,
      avgIncidents: 4.2,
      raceCount: 8,
    },
    {
      trackId: 116,
      trackName: 'Lime Rock Park',
      avgStartingPosition: 14.5,
      avgFinishingPosition: 15.8,
      positionDelta: -1.3,
      avgIncidents: 5.1,
      raceCount: 4,
    },
  ],
  metricsBySeriesTrack: [
    {
      seriesId: 234,
      seriesName: 'Global Mazda MX-5 Fanatec Cup',
      trackId: 238,
      trackName: 'Laguna Seca',
      avgStartingPosition: 18.2,
      avgFinishingPosition: 16.5,
      positionDelta: 1.7,
      avgIncidents: 4.2,
      raceCount: 8,
    },
    {
      seriesId: 235,
      seriesName: 'Rookie Mazda MX-5 Cup',
      trackId: 116,
      trackName: 'Lime Rock Park',
      avgStartingPosition: 14.5,
      avgFinishingPosition: 15.8,
      positionDelta: -1.3,
      avgIncidents: 5.1,
      raceCount: 4,
    },
  ],
  raceDetails: {},
};

// Generate race details for new driver
newDriverAnalytics.raceDetails['series-234'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 238, 'Laguna Seca', 8, 18.2, 16.5, 4.2, 1200
);
newDriverAnalytics.raceDetails['track-238'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 238, 'Laguna Seca', 8, 18.2, 16.5, 4.2, 1200
);
newDriverAnalytics.raceDetails['series-234-track-238'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 238, 'Laguna Seca', 8, 18.2, 16.5, 4.2, 1200
);

newDriverAnalytics.raceDetails['series-235'] = generateRaces(
  235, 'Rookie Mazda MX-5 Cup', 116, 'Lime Rock Park', 4, 14.5, 15.8, 5.1, 1100
);
newDriverAnalytics.raceDetails['track-116'] = generateRaces(
  235, 'Rookie Mazda MX-5 Cup', 116, 'Lime Rock Park', 4, 14.5, 15.8, 5.1, 1100
);
newDriverAnalytics.raceDetails['series-235-track-116'] = generateRaces(
  235, 'Rookie Mazda MX-5 Cup', 116, 'Lime Rock Park', 4, 14.5, 15.8, 5.1, 1100
);

/**
 * Road Veteran Analytics
 */
const roadVeteranAnalytics: MockAnalyticsData = {
  metricsBySeries: [
    {
      seriesId: 399,
      seriesName: 'IMSA iRacing Series',
      avgStartingPosition: 8.3,
      avgFinishingPosition: 6.8,
      positionDelta: 1.5,
      avgIncidents: 2.1,
      raceCount: 156,
    },
    {
      seriesId: 400,
      seriesName: 'VRS GT Sprint Series',
      avgStartingPosition: 10.2,
      avgFinishingPosition: 8.9,
      positionDelta: 1.3,
      avgIncidents: 1.8,
      raceCount: 98,
    },
    {
      seriesId: 401,
      seriesName: 'GT3 Fanatec Challenge',
      avgStartingPosition: 12.1,
      avgFinishingPosition: 11.5,
      positionDelta: 0.6,
      avgIncidents: 2.5,
      raceCount: 87,
    },
    {
      seriesId: 402,
      seriesName: 'Porsche Cup',
      avgStartingPosition: 9.8,
      avgFinishingPosition: 9.2,
      positionDelta: 0.6,
      avgIncidents: 1.9,
      raceCount: 65,
    },
  ],
  metricsByTrack: [
    {
      trackId: 119,
      trackName: 'Watkins Glen International',
      avgStartingPosition: 8.3,
      avgFinishingPosition: 6.8,
      positionDelta: 1.5,
      avgIncidents: 2.1,
      raceCount: 45,
    },
    {
      trackId: 116,
      trackName: 'Spa-Francorchamps',
      avgStartingPosition: 10.2,
      avgFinishingPosition: 8.9,
      positionDelta: 1.3,
      avgIncidents: 1.8,
      raceCount: 42,
    },
    {
      trackId: 230,
      trackName: 'Silverstone Circuit',
      avgStartingPosition: 9.8,
      avgFinishingPosition: 9.2,
      positionDelta: 0.6,
      avgIncidents: 1.9,
      raceCount: 38,
    },
    {
      trackId: 246,
      trackName: 'Mount Panorama Circuit',
      avgStartingPosition: 12.1,
      avgFinishingPosition: 11.5,
      positionDelta: 0.6,
      avgIncidents: 2.5,
      raceCount: 35,
    },
  ],
  metricsBySeriesTrack: [
    {
      seriesId: 399,
      seriesName: 'IMSA iRacing Series',
      trackId: 119,
      trackName: 'Watkins Glen International',
      avgStartingPosition: 8.3,
      avgFinishingPosition: 6.8,
      positionDelta: 1.5,
      avgIncidents: 2.1,
      raceCount: 45,
    },
    {
      seriesId: 400,
      seriesName: 'VRS GT Sprint Series',
      trackId: 116,
      trackName: 'Spa-Francorchamps',
      avgStartingPosition: 10.2,
      avgFinishingPosition: 8.9,
      positionDelta: 1.3,
      avgIncidents: 1.8,
      raceCount: 42,
    },
    {
      seriesId: 401,
      seriesName: 'GT3 Fanatec Challenge',
      trackId: 246,
      trackName: 'Mount Panorama Circuit',
      avgStartingPosition: 12.1,
      avgFinishingPosition: 11.5,
      positionDelta: 0.6,
      avgIncidents: 2.5,
      raceCount: 35,
    },
    {
      seriesId: 402,
      seriesName: 'Porsche Cup',
      trackId: 230,
      trackName: 'Silverstone Circuit',
      avgStartingPosition: 9.8,
      avgFinishingPosition: 9.2,
      positionDelta: 0.6,
      avgIncidents: 1.9,
      raceCount: 38,
    },
  ],
  raceDetails: {},
};

roadVeteranAnalytics.raceDetails['series-399'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 20, 8.3, 6.8, 2.1, 2850
);
roadVeteranAnalytics.raceDetails['track-119'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 20, 8.3, 6.8, 2.1, 2850
);
roadVeteranAnalytics.raceDetails['series-399-track-119'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 20, 8.3, 6.8, 2.1, 2850
);

roadVeteranAnalytics.raceDetails['series-400'] = generateRaces(
  400, 'VRS GT Sprint Series', 116, 'Spa-Francorchamps', 15, 10.2, 8.9, 1.8, 2700
);
roadVeteranAnalytics.raceDetails['track-116'] = generateRaces(
  400, 'VRS GT Sprint Series', 116, 'Spa-Francorchamps', 15, 10.2, 8.9, 1.8, 2700
);
roadVeteranAnalytics.raceDetails['series-400-track-116'] = generateRaces(
  400, 'VRS GT Sprint Series', 116, 'Spa-Francorchamps', 15, 10.2, 8.9, 1.8, 2700
);

roadVeteranAnalytics.raceDetails['series-401'] = generateRaces(
  401, 'GT3 Fanatec Challenge', 246, 'Mount Panorama Circuit', 12, 12.1, 11.5, 2.5, 2600
);
roadVeteranAnalytics.raceDetails['track-246'] = generateRaces(
  401, 'GT3 Fanatec Challenge', 246, 'Mount Panorama Circuit', 12, 12.1, 11.5, 2.5, 2600
);
roadVeteranAnalytics.raceDetails['series-401-track-246'] = generateRaces(
  401, 'GT3 Fanatec Challenge', 246, 'Mount Panorama Circuit', 12, 12.1, 11.5, 2.5, 2600
);

roadVeteranAnalytics.raceDetails['series-402'] = generateRaces(
  402, 'Porsche Cup', 230, 'Silverstone Circuit', 10, 9.8, 9.2, 1.9, 2500
);
roadVeteranAnalytics.raceDetails['track-230'] = generateRaces(
  402, 'Porsche Cup', 230, 'Silverstone Circuit', 10, 9.8, 9.2, 1.9, 2500
);
roadVeteranAnalytics.raceDetails['series-402-track-230'] = generateRaces(
  402, 'Porsche Cup', 230, 'Silverstone Circuit', 10, 9.8, 9.2, 1.9, 2500
);

/**
 * Oval Specialist Analytics
 */
const ovalSpecialistAnalytics: MockAnalyticsData = {
  metricsBySeries: [
    {
      seriesId: 141,
      seriesName: 'NASCAR Cup Series',
      avgStartingPosition: 10.5,
      avgFinishingPosition: 8.2,
      positionDelta: 2.3,
      avgIncidents: 3.8,
      raceCount: 245,
    },
    {
      seriesId: 142,
      seriesName: 'NASCAR Xfinity Series',
      avgStartingPosition: 9.2,
      avgFinishingPosition: 7.8,
      positionDelta: 1.4,
      avgIncidents: 3.2,
      raceCount: 178,
    },
    {
      seriesId: 143,
      seriesName: 'NASCAR Truck Series',
      avgStartingPosition: 11.8,
      avgFinishingPosition: 10.5,
      positionDelta: 1.3,
      avgIncidents: 4.1,
      raceCount: 112,
    },
    {
      seriesId: 144,
      seriesName: 'ARCA Menards Series',
      avgStartingPosition: 8.5,
      avgFinishingPosition: 9.2,
      positionDelta: -0.7,
      avgIncidents: 5.5,
      raceCount: 88,
    },
  ],
  metricsByTrack: [
    {
      trackId: 191,
      trackName: 'Daytona International Speedway',
      avgStartingPosition: 10.5,
      avgFinishingPosition: 8.2,
      positionDelta: 2.3,
      avgIncidents: 3.8,
      raceCount: 89,
    },
    {
      trackId: 33,
      trackName: 'Charlotte Motor Speedway',
      avgStartingPosition: 9.2,
      avgFinishingPosition: 7.8,
      positionDelta: 1.4,
      avgIncidents: 3.2,
      raceCount: 76,
    },
    {
      trackId: 169,
      trackName: 'Talladega Superspeedway',
      avgStartingPosition: 8.5,
      avgFinishingPosition: 9.2,
      positionDelta: -0.7,
      avgIncidents: 5.5,
      raceCount: 65,
    },
    {
      trackId: 134,
      trackName: 'Atlanta Motor Speedway',
      avgStartingPosition: 11.8,
      avgFinishingPosition: 10.5,
      positionDelta: 1.3,
      avgIncidents: 4.1,
      raceCount: 58,
    },
  ],
  metricsBySeriesTrack: [
    {
      seriesId: 141,
      seriesName: 'NASCAR Cup Series',
      trackId: 191,
      trackName: 'Daytona International Speedway',
      avgStartingPosition: 10.5,
      avgFinishingPosition: 8.2,
      positionDelta: 2.3,
      avgIncidents: 3.8,
      raceCount: 89,
    },
    {
      seriesId: 142,
      seriesName: 'NASCAR Xfinity Series',
      trackId: 33,
      trackName: 'Charlotte Motor Speedway',
      avgStartingPosition: 9.2,
      avgFinishingPosition: 7.8,
      positionDelta: 1.4,
      avgIncidents: 3.2,
      raceCount: 76,
    },
    {
      seriesId: 143,
      seriesName: 'NASCAR Truck Series',
      trackId: 134,
      trackName: 'Atlanta Motor Speedway',
      avgStartingPosition: 11.8,
      avgFinishingPosition: 10.5,
      positionDelta: 1.3,
      avgIncidents: 4.1,
      raceCount: 58,
    },
    {
      seriesId: 144,
      seriesName: 'ARCA Menards Series',
      trackId: 169,
      trackName: 'Talladega Superspeedway',
      avgStartingPosition: 8.5,
      avgFinishingPosition: 9.2,
      positionDelta: -0.7,
      avgIncidents: 5.5,
      raceCount: 65,
    },
  ],
  raceDetails: {},
};

ovalSpecialistAnalytics.raceDetails['series-141'] = generateRaces(
  141, 'NASCAR Cup Series', 191, 'Daytona International Speedway', 25, 10.5, 8.2, 3.8, 3200
);
ovalSpecialistAnalytics.raceDetails['track-191'] = generateRaces(
  141, 'NASCAR Cup Series', 191, 'Daytona International Speedway', 25, 10.5, 8.2, 3.8, 3200
);
ovalSpecialistAnalytics.raceDetails['series-141-track-191'] = generateRaces(
  141, 'NASCAR Cup Series', 191, 'Daytona International Speedway', 25, 10.5, 8.2, 3.8, 3200
);

ovalSpecialistAnalytics.raceDetails['series-142'] = generateRaces(
  142, 'NASCAR Xfinity Series', 33, 'Charlotte Motor Speedway', 20, 9.2, 7.8, 3.2, 3000
);
ovalSpecialistAnalytics.raceDetails['track-33'] = generateRaces(
  142, 'NASCAR Xfinity Series', 33, 'Charlotte Motor Speedway', 20, 9.2, 7.8, 3.2, 3000
);
ovalSpecialistAnalytics.raceDetails['series-142-track-33'] = generateRaces(
  142, 'NASCAR Xfinity Series', 33, 'Charlotte Motor Speedway', 20, 9.2, 7.8, 3.2, 3000
);

ovalSpecialistAnalytics.raceDetails['series-143'] = generateRaces(
  143, 'NASCAR Truck Series', 134, 'Atlanta Motor Speedway', 15, 11.8, 10.5, 4.1, 2800
);
ovalSpecialistAnalytics.raceDetails['track-134'] = generateRaces(
  143, 'NASCAR Truck Series', 134, 'Atlanta Motor Speedway', 15, 11.8, 10.5, 4.1, 2800
);
ovalSpecialistAnalytics.raceDetails['series-143-track-134'] = generateRaces(
  143, 'NASCAR Truck Series', 134, 'Atlanta Motor Speedway', 15, 11.8, 10.5, 4.1, 2800
);

ovalSpecialistAnalytics.raceDetails['series-144'] = generateRaces(
  144, 'ARCA Menards Series', 169, 'Talladega Superspeedway', 12, 8.5, 9.2, 5.5, 2200
);
ovalSpecialistAnalytics.raceDetails['track-169'] = generateRaces(
  144, 'ARCA Menards Series', 169, 'Talladega Superspeedway', 12, 8.5, 9.2, 5.5, 2200
);
ovalSpecialistAnalytics.raceDetails['series-144-track-169'] = generateRaces(
  144, 'ARCA Menards Series', 169, 'Talladega Superspeedway', 12, 8.5, 9.2, 5.5, 2200
);

/**
 * Multi-Discipline Analytics
 */
const multiDisciplineAnalytics: MockAnalyticsData = {
  metricsBySeries: [
    {
      seriesId: 234,
      seriesName: 'Global Mazda MX-5 Fanatec Cup',
      avgStartingPosition: 12.5,
      avgFinishingPosition: 11.2,
      positionDelta: 1.3,
      avgIncidents: 2.8,
      raceCount: 65,
    },
    {
      seriesId: 399,
      seriesName: 'IMSA iRacing Series',
      avgStartingPosition: 14.2,
      avgFinishingPosition: 13.8,
      positionDelta: 0.4,
      avgIncidents: 3.2,
      raceCount: 48,
    },
    {
      seriesId: 142,
      seriesName: 'NASCAR Xfinity Series',
      avgStartingPosition: 15.8,
      avgFinishingPosition: 14.5,
      positionDelta: 1.3,
      avgIncidents: 4.5,
      raceCount: 42,
    },
    {
      seriesId: 305,
      seriesName: 'Grand Prix Series',
      avgStartingPosition: 16.2,
      avgFinishingPosition: 15.8,
      positionDelta: 0.4,
      avgIncidents: 3.8,
      raceCount: 38,
    },
    {
      seriesId: 260,
      seriesName: 'World of Outlaws Sprint Cars',
      avgStartingPosition: 13.5,
      avgFinishingPosition: 14.2,
      positionDelta: -0.7,
      avgIncidents: 5.2,
      raceCount: 32,
    },
  ],
  metricsByTrack: [
    {
      trackId: 238,
      trackName: 'Laguna Seca',
      avgStartingPosition: 12.5,
      avgFinishingPosition: 11.2,
      positionDelta: 1.3,
      avgIncidents: 2.8,
      raceCount: 28,
    },
    {
      trackId: 119,
      trackName: 'Watkins Glen International',
      avgStartingPosition: 14.2,
      avgFinishingPosition: 13.8,
      positionDelta: 0.4,
      avgIncidents: 3.2,
      raceCount: 25,
    },
    {
      trackId: 33,
      trackName: 'Charlotte Motor Speedway',
      avgStartingPosition: 15.8,
      avgFinishingPosition: 14.5,
      positionDelta: 1.3,
      avgIncidents: 4.5,
      raceCount: 22,
    },
    {
      trackId: 73,
      trackName: 'Nurburgring Grand-Prix-Strecke',
      avgStartingPosition: 16.2,
      avgFinishingPosition: 15.8,
      positionDelta: 0.4,
      avgIncidents: 3.8,
      raceCount: 18,
    },
    {
      trackId: 353,
      trackName: 'Eldora Speedway',
      avgStartingPosition: 13.5,
      avgFinishingPosition: 14.2,
      positionDelta: -0.7,
      avgIncidents: 5.2,
      raceCount: 15,
    },
  ],
  metricsBySeriesTrack: [
    {
      seriesId: 234,
      seriesName: 'Global Mazda MX-5 Fanatec Cup',
      trackId: 238,
      trackName: 'Laguna Seca',
      avgStartingPosition: 12.5,
      avgFinishingPosition: 11.2,
      positionDelta: 1.3,
      avgIncidents: 2.8,
      raceCount: 28,
    },
    {
      seriesId: 399,
      seriesName: 'IMSA iRacing Series',
      trackId: 119,
      trackName: 'Watkins Glen International',
      avgStartingPosition: 14.2,
      avgFinishingPosition: 13.8,
      positionDelta: 0.4,
      avgIncidents: 3.2,
      raceCount: 25,
    },
    {
      seriesId: 142,
      seriesName: 'NASCAR Xfinity Series',
      trackId: 33,
      trackName: 'Charlotte Motor Speedway',
      avgStartingPosition: 15.8,
      avgFinishingPosition: 14.5,
      positionDelta: 1.3,
      avgIncidents: 4.5,
      raceCount: 22,
    },
    {
      seriesId: 305,
      seriesName: 'Grand Prix Series',
      trackId: 73,
      trackName: 'Nurburgring Grand-Prix-Strecke',
      avgStartingPosition: 16.2,
      avgFinishingPosition: 15.8,
      positionDelta: 0.4,
      avgIncidents: 3.8,
      raceCount: 18,
    },
    {
      seriesId: 260,
      seriesName: 'World of Outlaws Sprint Cars',
      trackId: 353,
      trackName: 'Eldora Speedway',
      avgStartingPosition: 13.5,
      avgFinishingPosition: 14.2,
      positionDelta: -0.7,
      avgIncidents: 5.2,
      raceCount: 15,
    },
  ],
  raceDetails: {},
};

multiDisciplineAnalytics.raceDetails['series-234'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 238, 'Laguna Seca', 15, 12.5, 11.2, 2.8, 2100
);
multiDisciplineAnalytics.raceDetails['track-238'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 238, 'Laguna Seca', 15, 12.5, 11.2, 2.8, 2100
);
multiDisciplineAnalytics.raceDetails['series-234-track-238'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 238, 'Laguna Seca', 15, 12.5, 11.2, 2.8, 2100
);

multiDisciplineAnalytics.raceDetails['series-399'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 12, 14.2, 13.8, 3.2, 2000
);
multiDisciplineAnalytics.raceDetails['track-119'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 12, 14.2, 13.8, 3.2, 2000
);
multiDisciplineAnalytics.raceDetails['series-399-track-119'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 12, 14.2, 13.8, 3.2, 2000
);

multiDisciplineAnalytics.raceDetails['series-142'] = generateRaces(
  142, 'NASCAR Xfinity Series', 33, 'Charlotte Motor Speedway', 10, 15.8, 14.5, 4.5, 1950
);
multiDisciplineAnalytics.raceDetails['track-33'] = generateRaces(
  142, 'NASCAR Xfinity Series', 33, 'Charlotte Motor Speedway', 10, 15.8, 14.5, 4.5, 1950
);
multiDisciplineAnalytics.raceDetails['series-142-track-33'] = generateRaces(
  142, 'NASCAR Xfinity Series', 33, 'Charlotte Motor Speedway', 10, 15.8, 14.5, 4.5, 1950
);

multiDisciplineAnalytics.raceDetails['series-305'] = generateRaces(
  305, 'Grand Prix Series', 73, 'Nurburgring Grand-Prix-Strecke', 10, 16.2, 15.8, 3.8, 1850
);
multiDisciplineAnalytics.raceDetails['track-73'] = generateRaces(
  305, 'Grand Prix Series', 73, 'Nurburgring Grand-Prix-Strecke', 10, 16.2, 15.8, 3.8, 1850
);
multiDisciplineAnalytics.raceDetails['series-305-track-73'] = generateRaces(
  305, 'Grand Prix Series', 73, 'Nurburgring Grand-Prix-Strecke', 10, 16.2, 15.8, 3.8, 1850
);

multiDisciplineAnalytics.raceDetails['series-260'] = generateRaces(
  260, 'World of Outlaws Sprint Cars', 353, 'Eldora Speedway', 8, 13.5, 14.2, 5.2, 1600
);
multiDisciplineAnalytics.raceDetails['track-353'] = generateRaces(
  260, 'World of Outlaws Sprint Cars', 353, 'Eldora Speedway', 8, 13.5, 14.2, 5.2, 1600
);
multiDisciplineAnalytics.raceDetails['series-260-track-353'] = generateRaces(
  260, 'World of Outlaws Sprint Cars', 353, 'Eldora Speedway', 8, 13.5, 14.2, 5.2, 1600
);

/**
 * Safety Recovery Analytics
 */
const safetyRecoveryAnalytics: MockAnalyticsData = {
  metricsBySeries: [
    {
      seriesId: 399,
      seriesName: 'IMSA iRacing Series',
      avgStartingPosition: 9.5,
      avgFinishingPosition: 12.8,
      positionDelta: -3.3,
      avgIncidents: 6.8,
      raceCount: 78,
    },
    {
      seriesId: 401,
      seriesName: 'GT3 Fanatec Challenge',
      avgStartingPosition: 11.2,
      avgFinishingPosition: 13.5,
      positionDelta: -2.3,
      avgIncidents: 7.2,
      raceCount: 65,
    },
    {
      seriesId: 234,
      seriesName: 'Global Mazda MX-5 Fanatec Cup',
      avgStartingPosition: 14.5,
      avgFinishingPosition: 13.2,
      positionDelta: 1.3,
      avgIncidents: 4.5,
      raceCount: 45,
    },
    {
      seriesId: 402,
      seriesName: 'Porsche Cup',
      avgStartingPosition: 12.8,
      avgFinishingPosition: 14.2,
      positionDelta: -1.4,
      avgIncidents: 5.8,
      raceCount: 32,
    },
  ],
  metricsByTrack: [
    {
      trackId: 119,
      trackName: 'Watkins Glen International',
      avgStartingPosition: 9.5,
      avgFinishingPosition: 12.8,
      positionDelta: -3.3,
      avgIncidents: 6.8,
      raceCount: 32,
    },
    {
      trackId: 226,
      trackName: 'Road America',
      avgStartingPosition: 11.2,
      avgFinishingPosition: 13.5,
      positionDelta: -2.3,
      avgIncidents: 7.2,
      raceCount: 28,
    },
    {
      trackId: 116,
      trackName: 'Lime Rock Park',
      avgStartingPosition: 14.5,
      avgFinishingPosition: 13.2,
      positionDelta: 1.3,
      avgIncidents: 4.5,
      raceCount: 24,
    },
    {
      trackId: 62,
      trackName: 'Brands Hatch Circuit',
      avgStartingPosition: 12.8,
      avgFinishingPosition: 14.2,
      positionDelta: -1.4,
      avgIncidents: 5.8,
      raceCount: 18,
    },
  ],
  metricsBySeriesTrack: [
    {
      seriesId: 399,
      seriesName: 'IMSA iRacing Series',
      trackId: 119,
      trackName: 'Watkins Glen International',
      avgStartingPosition: 9.5,
      avgFinishingPosition: 12.8,
      positionDelta: -3.3,
      avgIncidents: 6.8,
      raceCount: 32,
    },
    {
      seriesId: 401,
      seriesName: 'GT3 Fanatec Challenge',
      trackId: 226,
      trackName: 'Road America',
      avgStartingPosition: 11.2,
      avgFinishingPosition: 13.5,
      positionDelta: -2.3,
      avgIncidents: 7.2,
      raceCount: 28,
    },
    {
      seriesId: 234,
      seriesName: 'Global Mazda MX-5 Fanatec Cup',
      trackId: 116,
      trackName: 'Lime Rock Park',
      avgStartingPosition: 14.5,
      avgFinishingPosition: 13.2,
      positionDelta: 1.3,
      avgIncidents: 4.5,
      raceCount: 24,
    },
    {
      seriesId: 402,
      seriesName: 'Porsche Cup',
      trackId: 62,
      trackName: 'Brands Hatch Circuit',
      avgStartingPosition: 12.8,
      avgFinishingPosition: 14.2,
      positionDelta: -1.4,
      avgIncidents: 5.8,
      raceCount: 18,
    },
  ],
  raceDetails: {},
};

safetyRecoveryAnalytics.raceDetails['series-399'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 15, 9.5, 12.8, 6.8, 2450
);
safetyRecoveryAnalytics.raceDetails['track-119'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 15, 9.5, 12.8, 6.8, 2450
);
safetyRecoveryAnalytics.raceDetails['series-399-track-119'] = generateRaces(
  399, 'IMSA iRacing Series', 119, 'Watkins Glen International', 15, 9.5, 12.8, 6.8, 2450
);

safetyRecoveryAnalytics.raceDetails['series-401'] = generateRaces(
  401, 'GT3 Fanatec Challenge', 226, 'Road America', 12, 11.2, 13.5, 7.2, 2300
);
safetyRecoveryAnalytics.raceDetails['track-226'] = generateRaces(
  401, 'GT3 Fanatec Challenge', 226, 'Road America', 12, 11.2, 13.5, 7.2, 2300
);
safetyRecoveryAnalytics.raceDetails['series-401-track-226'] = generateRaces(
  401, 'GT3 Fanatec Challenge', 226, 'Road America', 12, 11.2, 13.5, 7.2, 2300
);

safetyRecoveryAnalytics.raceDetails['series-234'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 116, 'Lime Rock Park', 10, 14.5, 13.2, 4.5, 1800
);
safetyRecoveryAnalytics.raceDetails['track-116'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 116, 'Lime Rock Park', 10, 14.5, 13.2, 4.5, 1800
);
safetyRecoveryAnalytics.raceDetails['series-234-track-116'] = generateRaces(
  234, 'Global Mazda MX-5 Fanatec Cup', 116, 'Lime Rock Park', 10, 14.5, 13.2, 4.5, 1800
);

safetyRecoveryAnalytics.raceDetails['series-402'] = generateRaces(
  402, 'Porsche Cup', 62, 'Brands Hatch Circuit', 8, 12.8, 14.2, 5.8, 2000
);
safetyRecoveryAnalytics.raceDetails['track-62'] = generateRaces(
  402, 'Porsche Cup', 62, 'Brands Hatch Circuit', 8, 12.8, 14.2, 5.8, 2000
);
safetyRecoveryAnalytics.raceDetails['series-402-track-62'] = generateRaces(
  402, 'Porsche Cup', 62, 'Brands Hatch Circuit', 8, 12.8, 14.2, 5.8, 2000
);

/**
 * Get mock analytics data by profile ID
 */
export function getMockAnalytics(profileId: MockProfileId): MockAnalyticsData | null {
  switch (profileId) {
    case 'new_driver':
      return newDriverAnalytics;
    case 'road_veteran':
      return roadVeteranAnalytics;
    case 'oval_specialist':
      return ovalSpecialistAnalytics;
    case 'multi_discipline':
      return multiDisciplineAnalytics;
    case 'safety_recovery':
      return safetyRecoveryAnalytics;
    default:
      return null;
  }
}
