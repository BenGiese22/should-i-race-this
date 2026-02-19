/**
 * Utility functions for calculating next race times from iRacing race_time_descriptors
 */

export interface RaceTimeDescriptor {
  repeating?: boolean;
  session_times?: string[]; // ISO timestamps for non-repeating races
  first_session_time?: string; // Time of day like "00:15:00"
  repeat_minutes?: number; // How often races repeat
  day_offset?: number[]; // Days of week (0=Sunday, 6=Saturday)
  start_date?: string; // Start date for the schedule
  session_minutes?: number; // Race length
  super_session?: boolean;
}

export interface NextRaceTime {
  nextRaceTime: Date;
  isRepeating: boolean;
  repeatMinutes?: number;
}

/**
 * Calculate the next race time for a series based on race_time_descriptors
 * @param raceTimeDescriptors - Array of race time descriptors from iRacing API
 * @param currentTime - Current time (defaults to now)
 * @returns Next race time or null if no upcoming races
 */
export function calculateNextRaceTime(
  raceTimeDescriptors: RaceTimeDescriptor[] | null | undefined,
  currentTime: Date = new Date()
): NextRaceTime | null {
  if (!raceTimeDescriptors || raceTimeDescriptors.length === 0) {
    return null;
  }

  let earliestRace: NextRaceTime | null = null;

  for (const descriptor of raceTimeDescriptors) {
    if (descriptor.repeating) {
      // Handle repeating races (e.g., every 30 minutes)
      const nextTime = calculateNextRepeatingRace(descriptor, currentTime);
      if (nextTime && (!earliestRace || nextTime.nextRaceTime < earliestRace.nextRaceTime)) {
        earliestRace = nextTime;
      }
    } else if (descriptor.session_times && descriptor.session_times.length > 0) {
      // Handle fixed session times
      const nextTime = calculateNextFixedRace(descriptor.session_times, currentTime);
      if (nextTime && (!earliestRace || nextTime.nextRaceTime < earliestRace.nextRaceTime)) {
        earliestRace = nextTime;
      }
    }
  }

  return earliestRace;
}

/**
 * Calculate next race time for repeating races
 */
function calculateNextRepeatingRace(
  descriptor: RaceTimeDescriptor,
  currentTime: Date
): NextRaceTime | null {
  if (!descriptor.first_session_time || !descriptor.repeat_minutes) {
    return null;
  }

  // Parse the first session time (format: "HH:MM:SS")
  const [hours, minutes, seconds] = descriptor.first_session_time.split(':').map(Number);
  
  // Get the day offsets (which days of the week races occur)
  const dayOffsets = descriptor.day_offset || [0, 1, 2, 3, 4, 5, 6]; // Default to all days

  // Find the next race time
  const currentDay = currentTime.getUTCDay();
  const currentHour = currentTime.getUTCHours();
  const currentMinute = currentTime.getUTCMinutes();
  const currentSecond = currentTime.getUTCSeconds();

  // Check if there's a race later today
  if (dayOffsets.includes(currentDay)) {
    const nextRaceToday = findNextRaceTimeToday(
      currentTime,
      hours,
      minutes,
      seconds || 0,
      descriptor.repeat_minutes
    );
    
    if (nextRaceToday) {
      return {
        nextRaceTime: nextRaceToday,
        isRepeating: true,
        repeatMinutes: descriptor.repeat_minutes
      };
    }
  }

  // Find the next day with a race
  for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
    const checkDate = new Date(currentTime);
    checkDate.setUTCDate(checkDate.getUTCDate() + daysAhead);
    const checkDay = checkDate.getUTCDay();

    if (dayOffsets.includes(checkDay)) {
      // Set to first race time of that day
      checkDate.setUTCHours(hours, minutes, seconds || 0, 0);
      return {
        nextRaceTime: checkDate,
        isRepeating: true,
        repeatMinutes: descriptor.repeat_minutes
      };
    }
  }

  return null;
}

/**
 * Find the next race time today for repeating races
 */
function findNextRaceTimeToday(
  currentTime: Date,
  startHour: number,
  startMinute: number,
  startSecond: number,
  repeatMinutes: number
): Date | null {
  const currentMinuteOfDay = currentTime.getUTCHours() * 60 + currentTime.getUTCMinutes();
  const startMinuteOfDay = startHour * 60 + startMinute;

  // Calculate how many intervals have passed since start time
  let nextRaceMinute: number;
  
  if (currentMinuteOfDay < startMinuteOfDay) {
    // Before first race of the day
    nextRaceMinute = startMinuteOfDay;
  } else {
    // Calculate next interval
    const minutesSinceStart = currentMinuteOfDay - startMinuteOfDay;
    const intervalsPassed = Math.floor(minutesSinceStart / repeatMinutes);
    nextRaceMinute = startMinuteOfDay + (intervalsPassed + 1) * repeatMinutes;
  }

  // Check if next race is still today (before midnight)
  if (nextRaceMinute >= 24 * 60) {
    return null;
  }

  const nextRaceTime = new Date(currentTime);
  nextRaceTime.setUTCHours(Math.floor(nextRaceMinute / 60), nextRaceMinute % 60, startSecond, 0);

  // Make sure it's actually in the future
  if (nextRaceTime <= currentTime) {
    return null;
  }

  return nextRaceTime;
}

/**
 * Calculate next race time for fixed session times
 */
function calculateNextFixedRace(
  sessionTimes: string[],
  currentTime: Date
): NextRaceTime | null {
  const futureTimes = sessionTimes
    .map(timeStr => new Date(timeStr))
    .filter(time => time > currentTime)
    .sort((a, b) => a.getTime() - b.getTime());

  if (futureTimes.length === 0) {
    return null;
  }

  return {
    nextRaceTime: futureTimes[0],
    isRepeating: false
  };
}

/**
 * Generate time slots for the next week based on race_time_descriptors
 * This replaces the mock time slot generation
 */
export function generateTimeSlots(
  raceTimeDescriptors: RaceTimeDescriptor[] | null | undefined,
  currentTime: Date = new Date()
): Array<{ time: Date; dayOfWeek: number; hour: number }> {
  if (!raceTimeDescriptors || raceTimeDescriptors.length === 0) {
    return [];
  }

  const timeSlots: Array<{ time: Date; dayOfWeek: number; hour: number }> = [];
  const oneWeekFromNow = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const descriptor of raceTimeDescriptors) {
    if (descriptor.repeating && descriptor.first_session_time && descriptor.repeat_minutes) {
      // Generate repeating time slots
      const slots = generateRepeatingSlots(descriptor, currentTime, oneWeekFromNow);
      timeSlots.push(...slots);
    } else if (descriptor.session_times) {
      // Add fixed session times
      const slots = descriptor.session_times
        .map(timeStr => new Date(timeStr))
        .filter(time => time > currentTime && time <= oneWeekFromNow)
        .map(time => ({
          time,
          dayOfWeek: time.getUTCDay(),
          hour: time.getUTCHours()
        }));
      timeSlots.push(...slots);
    }
  }

  // Sort by time
  return timeSlots.sort((a, b) => a.time.getTime() - b.time.getTime());
}

/**
 * Generate repeating time slots for the next week
 */
function generateRepeatingSlots(
  descriptor: RaceTimeDescriptor,
  startTime: Date,
  endTime: Date
): Array<{ time: Date; dayOfWeek: number; hour: number }> {
  const slots: Array<{ time: Date; dayOfWeek: number; hour: number }> = [];
  
  if (!descriptor.first_session_time || !descriptor.repeat_minutes) {
    return slots;
  }

  const [hours, minutes, seconds] = descriptor.first_session_time.split(':').map(Number);
  const dayOffsets = descriptor.day_offset || [0, 1, 2, 3, 4, 5, 6];

  let currentDate = new Date(startTime);
  currentDate.setUTCHours(0, 0, 0, 0); // Start at beginning of current day

  while (currentDate <= endTime) {
    const dayOfWeek = currentDate.getUTCDay();
    
    if (dayOffsets.includes(dayOfWeek)) {
      // Generate all race times for this day
      let raceMinute = hours * 60 + minutes;
      
      while (raceMinute < 24 * 60) {
        const raceTime = new Date(currentDate);
        raceTime.setUTCHours(Math.floor(raceMinute / 60), raceMinute % 60, seconds || 0, 0);
        
        if (raceTime > startTime && raceTime <= endTime) {
          slots.push({
            time: raceTime,
            dayOfWeek: raceTime.getUTCDay(),
            hour: raceTime.getUTCHours()
          });
        }
        
        raceMinute += descriptor.repeat_minutes;
      }
    }
    
    // Move to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return slots;
}
