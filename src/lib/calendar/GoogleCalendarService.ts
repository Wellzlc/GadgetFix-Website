/**
 * Google Calendar API Service
 * Secure integration with Google Calendar API for availability display
 */

import { google } from 'googleapis';
import NodeCache from 'node-cache';
import { CALENDAR_CONFIG, type CalendarConfig } from './config';
import { CalendarError, ErrorCode, logError } from './errors';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
}

export interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
  duration: number; // in minutes
  type: 'morning' | 'afternoon' | 'evening';
}

export interface CalendarConfig {
  calendarId: string;
  serviceAccountEmail: string;
  privateKey: string;
  timeZone: string;
  businessHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    days: number[]; // 0=Sunday, 1=Monday, etc.
  };
  slotDuration: number; // minutes
  bufferTime: number;   // minutes between appointments
}

export class GoogleCalendarService {
  private calendar: any;
  private cache: NodeCache;
  private config: CalendarConfig;
  private auth: any;
  private initialized: boolean = false;

  constructor(config: CalendarConfig) {
    this.config = this.validateConfig(config);
    this.cache = new NodeCache({ 
      stdTTL: CALENDAR_CONFIG.CACHE.DEFAULT_TTL,
      checkperiod: CALENDAR_CONFIG.CACHE.CHECK_PERIOD
    });
    
    this.initializeAuth();
  }

  /**
   * Validate and merge configuration with defaults
   */
  private validateConfig(config: CalendarConfig): CalendarConfig {
    return {
      ...config,
      timeZone: config.timeZone || CALENDAR_CONFIG.BUSINESS.TIME_ZONE,
      businessHours: config.businessHours || {
        start: CALENDAR_CONFIG.BUSINESS.START_HOUR,
        end: CALENDAR_CONFIG.BUSINESS.END_HOUR,
        days: CALENDAR_CONFIG.BUSINESS.WORKING_DAYS,
      },
      slotDuration: config.slotDuration || CALENDAR_CONFIG.BUSINESS.SLOT_DURATION,
      bufferTime: config.bufferTime || CALENDAR_CONFIG.BUSINESS.BUFFER_TIME,
    };
  }

  /**
   * Initialize Google Calendar API authentication
   */
  private initializeAuth(): void {
    try {
      this.validateCredentials();
      this.createAuthClient();
      this.initializeCalendarAPI();
      this.initialized = true;
      console.log(CALENDAR_CONFIG.MESSAGES.INITIALIZED);
    } catch (error) {
      logError('CALENDAR_INIT', error);
      throw new CalendarError(
        ErrorCode.INITIALIZATION_FAILED,
        CALENDAR_CONFIG.ERRORS.INITIALIZATION_FAILED,
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  private validateCredentials(): void {
    if (!this.config.serviceAccountEmail || !this.config.privateKey) {
      throw new CalendarError(
        ErrorCode.MISSING_CREDENTIALS,
        CALENDAR_CONFIG.ERRORS.MISSING_CREDENTIALS,
        500
      );
    }
  }

  private createAuthClient(): void {
    this.auth = new google.auth.JWT(
      this.config.serviceAccountEmail,
      undefined,
      this.config.privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar.readonly'],
      undefined
    );
  }

  private initializeCalendarAPI(): void {
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  /**
   * Get availability for the next N days
   */
  async getAvailability(daysAhead: number = CALENDAR_CONFIG.API.DEFAULT_DAYS_AHEAD): Promise<AvailabilitySlot[]> {
    this.ensureInitialized();
    
    // Validate and cap days ahead
    daysAhead = Math.min(daysAhead, CALENDAR_CONFIG.API.MAX_DAYS_AHEAD);
    
    const cacheKey = `availability_${daysAhead}`;
    const cached = this.cache.get<AvailabilitySlot[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { startDate, endDate } = this.getDateRange(daysAhead);
      const events = await this.fetchCalendarEvents(startDate, endDate);
      const slots = this.generateAvailabilitySlots(startDate, endDate, events);
      
      this.cache.set(cacheKey, slots, CALENDAR_CONFIG.CACHE.SLOTS_TTL);
      
      return slots;
    } catch (error) {
      logError('GET_AVAILABILITY', error);
      throw new CalendarError(
        ErrorCode.CALENDAR_ERROR,
        CALENDAR_CONFIG.ERRORS.FETCH_FAILED,
        500
      );
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new CalendarError(
        ErrorCode.INITIALIZATION_FAILED,
        CALENDAR_CONFIG.ERRORS.CALENDAR_UNAVAILABLE,
        503
      );
    }
  }

  private getDateRange(daysAhead: number): { startDate: Date; endDate: Date } {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + daysAhead);
    return { startDate, endDate };
  }

  /**
   * Fetch events from Google Calendar
   */
  private async fetchCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.config.calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: this.config.timeZone,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: CALENDAR_CONFIG.API.MAX_RESULTS
      });

      const events = response.data.items || [];
      return this.mapCalendarEvents(events);
    } catch (error) {
      logError('FETCH_EVENTS', error);
      throw new CalendarError(
        ErrorCode.CALENDAR_ERROR,
        CALENDAR_CONFIG.ERRORS.EVENTS_FETCH_FAILED,
        500
      );
    }
  }

  private mapCalendarEvents(events: any[]): CalendarEvent[] {
    return events.map((event: any) => ({
      id: event.id,
      summary: event.summary || 'Busy',
      start: event.start,
      end: event.end,
      status: event.status,
      attendees: event.attendees
    }));
  }

  /**
   * Generate availability slots based on business hours and existing events
   */
  private generateAvailabilitySlots(
    startDate: Date, 
    endDate: Date, 
    events: CalendarEvent[]
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const current = new Date(startDate);
    
    // Skip if current time is past business hours today
    if (this.isPastBusinessHours(current)) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    while (current < endDate) {
      // Skip non-business days
      if (!this.isBusinessDay(current)) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Generate slots for this business day
      const daySlots = this.generateDaySlots(current, events);
      slots.push(...daySlots);
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  /**
   * Generate availability slots for a specific day
   */
  private generateDaySlots(date: Date, events: CalendarEvent[]): AvailabilitySlot[] {
    const daySlots = this.getDayTimeRange(date);
    if (!daySlots) return [];

    const { dayStart, dayEnd } = daySlots;
    const dayEvents = this.filterDayEvents(events, date);
    
    return this.createTimeSlots(dayStart, dayEnd, dayEvents);
  }

  private getDayTimeRange(date: Date): { dayStart: Date; dayEnd: Date } | null {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    
    this.setBusinessHours(dayStart, dayEnd);
    
    // Skip if past business hours today
    if (this.isToday(date) && this.isPastBusinessHours(date)) {
      return null;
    }
    
    // Adjust start time if today
    if (this.isToday(date)) {
      this.adjustStartTimeForToday(dayStart);
    }
    
    return { dayStart, dayEnd };
  }

  private setBusinessHours(dayStart: Date, dayEnd: Date): void {
    const [startHour, startMinute] = this.config.businessHours!.start.split(':').map(Number);
    const [endHour, endMinute] = this.config.businessHours!.end.split(':').map(Number);
    
    dayStart.setHours(startHour, startMinute, 0, 0);
    dayEnd.setHours(endHour, endMinute, 0, 0);
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private adjustStartTimeForToday(dayStart: Date): void {
    const now = new Date();
    if (now > dayStart) {
      const minutesToNextSlot = this.config.slotDuration! - (now.getMinutes() % this.config.slotDuration!);
      dayStart.setTime(now.getTime() + (minutesToNextSlot * 60000));
    }
  }

  private filterDayEvents(events: CalendarEvent[], date: Date): CalendarEvent[] {
    return events.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date || '');
      return eventStart.toDateString() === date.toDateString();
    });
  }

  private createTimeSlots(dayStart: Date, dayEnd: Date, dayEvents: CalendarEvent[]): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const current = new Date(dayStart);
    
    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + (this.config.slotDuration! * 60000));
      const isAvailable = !this.hasConflict(current, slotEnd, dayEvents);
      
      slots.push({
        date: current.toISOString().split('T')[0],
        time: current.toTimeString().slice(0, 5),
        available: isAvailable,
        duration: this.config.slotDuration!,
        type: this.getTimeOfDayType(current.getHours())
      });
      
      // Move to next slot
      const totalMinutes = this.config.slotDuration! + this.config.bufferTime!;
      current.setTime(current.getTime() + (totalMinutes * 60000));
    }
    
    return slots;
  }

  private getTimeOfDayType(hour: number): 'morning' | 'afternoon' | 'evening' {
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }


  /**
   * Check if a time slot conflicts with existing events
   */
  private hasConflict(slotStart: Date, slotEnd: Date, events: CalendarEvent[]): boolean {
    return events.some(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date || '');
      const eventEnd = new Date(event.end.dateTime || event.end.date || '');
      
      // Check for overlap
      return slotStart < eventEnd && slotEnd > eventStart;
    });
  }

  /**
   * Check if date falls on a business day
   */
  private isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return this.config.businessHours.days.includes(dayOfWeek);
  }

  /**
   * Check if current time is past business hours for today
   */
  private isPastBusinessHours(date: Date): boolean {
    const now = new Date();
    if (date.toDateString() !== now.toDateString()) {
      return false;
    }

    const [endHour, endMinute] = this.config.businessHours.end.split(':').map(Number);
    const businessEnd = new Date(date);
    businessEnd.setHours(endHour, endMinute, 0, 0);
    
    return now >= businessEnd;
  }

  /**
   * Get next available appointment slot
   */
  async getNextAvailableSlot(): Promise<AvailabilitySlot | null> {
    const slots = await this.getAvailability(7); // Check next 7 days
    return slots.find(slot => slot.available) || null;
  }

  /**
   * Get availability summary for quick display
   */
  async getAvailabilitySummary(): Promise<{
    nextAvailable: AvailabilitySlot | null;
    availableToday: number;
    availableTomorrow: number;
    availableThisWeek: number;
  }> {
    this.ensureInitialized();
    
    const cacheKey = 'availability_summary';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached as any;
    }

    try {
      const slots = await this.getAvailability(7);
      const summary = this.calculateAvailabilitySummary(slots);
      
      this.cache.set(cacheKey, summary, CALENDAR_CONFIG.CACHE.SUMMARY_TTL);
      return summary;
    } catch (error) {
      logError('AVAILABILITY_SUMMARY', error);
      throw error; // Re-throw as it's already a CalendarError
    }
  }

  private calculateAvailabilitySummary(slots: AvailabilitySlot[]) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    return {
      nextAvailable: slots.find(slot => slot.available) || null,
      availableToday: slots.filter(slot => slot.date === today && slot.available).length,
      availableTomorrow: slots.filter(slot => slot.date === tomorrow && slot.available).length,
      availableThisWeek: slots.filter(slot => slot.available).length
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log(CALENDAR_CONFIG.MESSAGES.CACHE_CLEARED);
  }

  /**
   * Health check for the calendar service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        details: {
          error: 'Service not initialized',
          initialized: false,
          lastAttempt: new Date().toISOString()
        }
      };
    }

    try {
      await this.calendar.calendarList.list({ maxResults: 1 });
      
      return {
        status: 'healthy',
        details: {
          apiConnection: 'ok',
          cacheStats: this.cache.getStats(),
          initialized: true,
          lastUpdate: new Date().toISOString()
        }
      };
    } catch (error) {
      logError('HEALTH_CHECK', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          initialized: this.initialized,
          lastAttempt: new Date().toISOString()
        }
      };
    }
  }
}