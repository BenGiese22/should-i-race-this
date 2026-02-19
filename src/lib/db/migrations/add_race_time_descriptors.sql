-- Add race_time_descriptors column to schedule_entries table
-- This stores the race timing information from iRacing API to enable proper filtering of past races

ALTER TABLE schedule_entries 
ADD COLUMN IF NOT EXISTS race_time_descriptors JSONB;

-- Add comment to document the column
COMMENT ON COLUMN schedule_entries.race_time_descriptors IS 'Stores race_time_descriptors from iRacing API containing session times, repeating schedules, and timing information';
