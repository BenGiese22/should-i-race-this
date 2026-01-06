import { pgTable, uuid, integer, varchar, timestamp, decimal, bigint, boolean, date, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  iracingCustomerId: integer('iracing_customer_id').unique().notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSyncAt: timestamp('last_sync_at'),
});

// iRacing account tokens
export const iracingAccounts = pgTable('iracing_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  accessToken: varchar('access_token').notNull(),
  refreshToken: varchar('refresh_token').notNull(),
  accessTokenExpiresAt: timestamp('access_token_expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// License information
export const licenseClasses = pgTable('license_classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 20 }).notNull(), // 'oval', 'road', 'dirt_oval', 'dirt_road'
  level: varchar('level', { length: 10 }).notNull(), // 'rookie', 'D', 'C', 'B', 'A', 'pro'
  safetyRating: decimal('safety_rating', { precision: 4, scale: 2 }).notNull(),
  irating: integer('irating').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Race results with computed position delta
export const raceResults = pgTable('race_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  subsessionId: bigint('subsession_id', { mode: 'number' }).notNull(),
  seriesId: integer('series_id').notNull(),
  seriesName: varchar('series_name', { length: 255 }).notNull(),
  trackId: integer('track_id').notNull(),
  trackName: varchar('track_name', { length: 255 }).notNull(),
  sessionType: varchar('session_type', { length: 20 }).notNull(), // 'practice', 'qualifying', 'time_trial', 'race'
  startingPosition: integer('starting_position'),
  finishingPosition: integer('finishing_position'),
  // Computed column for position delta (starting - finishing)
  positionDelta: integer('position_delta').generatedAlwaysAs(
    sql`starting_position - finishing_position`
  ),
  incidents: integer('incidents').notNull().default(0),
  strengthOfField: integer('strength_of_field'),
  raceDate: timestamp('race_date').notNull(),
  seasonYear: integer('season_year').notNull(), // iRacing season year (e.g., 2024)
  seasonQuarter: integer('season_quarter').notNull(), // iRacing season quarter (1, 2, 3, 4)
  raceWeekNum: integer('race_week_num'), // iRacing race week number (0-based)
  raceLength: integer('race_length'), // in minutes
  rawData: jsonb('raw_data'), // store full iRacing response
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Indexes for performance
  userSeriesIdx: index('idx_race_results_user_series').on(table.userId, table.seriesId),
  userTrackIdx: index('idx_race_results_user_track').on(table.userId, table.trackId),
  dateIdx: index('idx_race_results_date').on(table.raceDate),
  seasonIdx: index('idx_race_results_season').on(table.seasonYear, table.seasonQuarter),
  userSeasonIdx: index('idx_race_results_user_season').on(table.userId, table.seasonYear, table.seasonQuarter),
}));

// Current schedule cache
export const scheduleEntries = pgTable('schedule_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  seriesId: integer('series_id').notNull(),
  seriesName: varchar('series_name', { length: 255 }).notNull(),
  trackId: integer('track_id').notNull(),
  trackName: varchar('track_name', { length: 255 }).notNull(),
  licenseRequired: varchar('license_required', { length: 10 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(),
  raceLength: integer('race_length'),
  hasOpenSetup: boolean('has_open_setup').default(false),
  seasonYear: integer('season_year').notNull(), // iRacing season year
  seasonQuarter: integer('season_quarter').notNull(), // iRacing season quarter
  raceWeekNum: integer('race_week_num').notNull(), // iRacing race week number (0-based)
  weekStart: date('week_start').notNull(), // actual calendar start date
  weekEnd: date('week_end').notNull(), // actual calendar end date
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Indexes for performance
  seasonIdx: index('idx_schedule_entries_season').on(table.seasonYear, table.seasonQuarter, table.raceWeekNum),
  weekIdx: index('idx_schedule_entries_week').on(table.weekStart, table.weekEnd),
}));