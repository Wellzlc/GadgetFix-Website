/**
 * Calendar Availability JavaScript - Optimized Version
 * Refactored for better performance and maintainability
 */

class CalendarAvailability {
  constructor(element) {
    if (!element) throw new Error('Calendar element is required');
    
    this.element = element;
    this.componentId = element.id;
    this.config = this.parseConfig(element);
    this.state = {
      isLoading: false,
      currentData: null,
      retryCount: 0,
      currentView: 'summary'
    };
    
    this.init();
  }

  /**
   * Parse configuration from element data attributes
   */
  parseConfig(element) {
    return {
      maxDays: parseInt(element.dataset.maxDays) || 7,
      showFull: element.dataset.showFull === 'true',
      maxRetries: 3,
      retryDelay: 1000,
      apiEndpoint: '/api/calendar/availability',
      dateFormat: 'en-US',
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }
    };
  }

  /**
   * Initialize component
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadInitialData();
  }

  /**
   * Cache DOM element references
   */
  cacheElements() {
    this.elements = {
      loading: this.getElement('loading'),
      error: this.getElement('error'),
      summary: this.getElement('summary'),
      calendar: this.getElement('calendar'),
      grid: this.getElement('grid'),
      todayCount: this.getElement('today-count'),
      tomorrowCount: this.getElement('tomorrow-count'),
      weekCount: this.getElement('week-count'),
      nextSlot: this.getElement('next-slot')
    };
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Use event delegation for better performance
    this.element.addEventListener('click', this.handleClick.bind(this));
    
    // Make methods available for inline handlers (legacy support)
    this.exposeGlobalMethods();
  }

  /**
   * Handle click events with delegation
   */
  handleClick(event) {
    const target = event.target;
    
    if (target.classList.contains('retry-button')) {
      this.retryLoad();
    } else if (target.classList.contains('view-full-button')) {
      this.switchToFullView();
    } else if (target.classList.contains('view-summary-button')) {
      this.switchToSummaryView();
    } else if (target.classList.contains('refresh-button')) {
      this.refresh();
    } else if (target.classList.contains('book-button')) {
      this.initiateBooking(target);
    } else if (target.classList.contains('time-slot') && target.classList.contains('available')) {
      this.selectTimeSlot(target);
    }
  }

  /**
   * Expose methods globally for backward compatibility
   */
  exposeGlobalMethods() {
    const instance = this;
    window.retryCalendarLoad = () => instance.retryLoad();
    window.toggleFullCalendar = () => instance.toggleView();
    window.refreshCalendar = () => instance.refresh();
    window.initiateBooking = (button) => instance.initiateBooking(button);
  }

  /**
   * Load initial data based on configuration
   */
  loadInitialData() {
    const viewType = this.config.showFull ? 'slots' : 'summary';
    this.loadAvailability(viewType);
  }

  /**
   * Load availability data from API
   */
  async loadAvailability(type = 'summary') {
    if (this.state.isLoading) return;
    
    this.state.isLoading = true;
    this.showLoading();

    try {
      const data = await this.fetchAvailabilityData(type);
      this.state.currentData = data;
      this.state.retryCount = 0;
      this.state.currentView = type;
      
      this.renderData(type, data);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Fetch data from API with proper error handling
   */
  async fetchAvailabilityData(type) {
    const params = new URLSearchParams({
      type,
      days: this.config.maxDays.toString()
    });

    const response = await fetch(`${this.config.apiEndpoint}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load availability');
    }

    return result.data;
  }

  /**
   * Render data based on type
   */
  renderData(type, data) {
    this.hideAllViews();
    
    if (type === 'summary') {
      this.renderSummary(data);
    } else if (type === 'slots') {
      this.renderFullCalendar(data);
    }
  }

  /**
   * Render summary view
   */
  renderSummary(data) {
    // Update stats
    this.updateElement(this.elements.todayCount, data.availableToday);
    this.updateElement(this.elements.tomorrowCount, data.availableTomorrow);
    this.updateElement(this.elements.weekCount, data.availableThisWeek);
    
    // Update next available slot
    this.updateNextSlot(data.nextAvailable);
    
    // Show summary view
    this.elements.summary?.classList.remove('hidden');
  }

  /**
   * Update next available slot display
   */
  updateNextSlot(slot) {
    const container = this.elements.nextSlot;
    if (!container) return;
    
    const dateElement = container.querySelector('.slot-date');
    const timeElement = container.querySelector('.slot-time');
    const bookButton = container.querySelector('.book-button');
    
    if (!dateElement || !timeElement || !bookButton) return;
    
    if (slot) {
      dateElement.textContent = this.formatDate(slot.date);
      timeElement.textContent = this.formatTime(slot.time);
      bookButton.disabled = false;
      bookButton.dataset.slotDate = slot.date;
      bookButton.dataset.slotTime = slot.time;
    } else {
      dateElement.textContent = 'No availability';
      timeElement.textContent = `in the next ${this.config.maxDays} days`;
      bookButton.disabled = true;
      bookButton.textContent = 'Call for Availability';
    }
  }

  /**
   * Render full calendar view
   */
  renderFullCalendar(data) {
    const grid = this.elements.grid;
    if (!grid) return;
    
    // Group slots by date
    const slotsByDate = this.groupSlotsByDate(data.slots || []);
    
    // Clear and rebuild grid
    grid.innerHTML = '';
    
    Object.keys(slotsByDate)
      .sort()
      .forEach(date => {
        const dayColumn = this.createDayColumn(date, slotsByDate[date]);
        grid.appendChild(dayColumn);
      });
    
    this.elements.calendar?.classList.remove('hidden');
  }

  /**
   * Group slots by date for easier rendering
   */
  groupSlotsByDate(slots) {
    return slots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {});
  }

  /**
   * Create a day column for the calendar grid
   */
  createDayColumn(date, slots) {
    const column = document.createElement('div');
    column.className = 'day-column';
    
    // Create header
    const header = this.createElement('div', 'day-header', this.formatDate(date));
    column.appendChild(header);
    
    // Create slots
    slots.forEach(slot => {
      column.appendChild(this.createSlotElement(slot));
    });
    
    return column;
  }

  /**
   * Create a single slot element
   */
  createSlotElement(slot) {
    const status = this.getSlotStatus(slot);
    const slotElement = document.createElement('div');
    slotElement.className = `time-slot ${status}`;
    slotElement.dataset.date = slot.date;
    slotElement.dataset.time = slot.time;
    
    // Time text
    const timeText = this.createElement('span', '', this.formatTime(slot.time));
    slotElement.appendChild(timeText);
    
    // Status badge
    const statusBadge = this.createElement(
      'span',
      `slot-status ${status}`,
      this.getSlotStatusText(status)
    );
    slotElement.appendChild(statusBadge);
    
    return slotElement;
  }

  /**
   * Utility: Create element with class and text
   */
  createElement(tag, className, textContent) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  /**
   * Get slot status based on availability and time
   */
  getSlotStatus(slot) {
    const now = new Date();
    const slotDateTime = new Date(`${slot.date}T${slot.time}`);
    
    if (slotDateTime < now) return 'past';
    return slot.available ? 'available' : 'booked';
  }

  /**
   * Get human-readable status text
   */
  getSlotStatusText(status) {
    const statusMap = {
      available: 'Available',
      booked: 'Booked',
      past: 'Past'
    };
    return statusMap[status] || 'Unknown';
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check for today/tomorrow
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Format other dates
    return date.toLocaleDateString(this.config.dateFormat, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format time for display
   */
  formatTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    
    return date.toLocaleTimeString(this.config.dateFormat, this.config.timeFormat);
  }

  /**
   * Handle errors with retry logic
   */
  handleError(error) {
    console.error('Calendar loading error:', error);
    
    if (this.state.retryCount < this.config.maxRetries) {
      // Auto-retry with exponential backoff
      setTimeout(() => {
        this.state.retryCount++;
        this.loadAvailability(this.state.currentView);
      }, this.config.retryDelay * Math.pow(2, this.state.retryCount));
    } else {
      this.showError(error.message);
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.hideAllViews();
    this.elements.loading?.classList.remove('hidden');
  }

  /**
   * Show error state
   */
  showError(message) {
    this.hideAllViews();
    const errorElement = this.elements.error;
    if (!errorElement) return;
    
    errorElement.classList.remove('hidden');
    
    const messageElement = errorElement.querySelector('.error-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  /**
   * Hide all views
   */
  hideAllViews() {
    Object.values(this.elements).forEach(element => {
      if (element && element.classList) {
        element.classList.add('hidden');
      }
    });
  }

  /**
   * Get element by suffix
   */
  getElement(suffix) {
    return document.getElementById(`${this.componentId}-${suffix}`);
  }

  /**
   * Update element text content
   */
  updateElement(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Switch to full calendar view
   */
  switchToFullView() {
    this.loadAvailability('slots');
  }

  /**
   * Switch to summary view
   */
  switchToSummaryView() {
    this.loadAvailability('summary');
  }

  /**
   * Toggle between views
   */
  toggleView() {
    const newView = this.state.currentView === 'summary' ? 'slots' : 'summary';
    this.loadAvailability(newView);
  }

  /**
   * Refresh current view
   */
  refresh() {
    this.state.currentData = null;
    this.loadAvailability(this.state.currentView);
  }

  /**
   * Retry loading after error
   */
  retryLoad() {
    this.state.retryCount = 0;
    this.loadAvailability(this.state.currentView);
  }

  /**
   * Select a time slot
   */
  selectTimeSlot(slotElement) {
    // Remove previous selections
    this.element.querySelectorAll('.time-slot.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Mark as selected
    slotElement.classList.add('selected');
    
    // Initiate booking
    this.initiateBooking(slotElement);
  }

  /**
   * Initiate booking process
   */
  initiateBooking(element) {
    const date = element.dataset.slotDate || element.dataset.date;
    const time = element.dataset.slotTime || element.dataset.time;
    
    if (!date || !time) {
      console.error('Missing date/time for booking');
      return;
    }
    
    const formattedDate = this.formatDate(date);
    const formattedTime = this.formatTime(time);
    
    // Confirm booking
    const confirmed = confirm(
      `Would you like to request an appointment for ${formattedDate} at ${formattedTime}?\n\n` +
      `This will open our contact form with your selected time pre-filled.`
    );
    
    if (confirmed) {
      // Redirect to contact form
      const contactUrl = `/contact?preferred_date=${encodeURIComponent(date)}&preferred_time=${encodeURIComponent(time)}`;
      window.location.href = contactUrl;
    }
  }

  /**
   * Cleanup method for component destruction
   */
  destroy() {
    // Remove event listeners
    this.element.removeEventListener('click', this.handleClick);
    
    // Clear state
    this.state = null;
    this.elements = null;
    this.config = null;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalendarAvailability;
}

// Make available globally
window.CalendarAvailability = CalendarAvailability;

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCalendars);
} else {
  initializeCalendars();
}

function initializeCalendars() {
  const calendarElements = document.querySelectorAll('.calendar-availability');
  calendarElements.forEach(element => {
    if (!element.dataset.initialized) {
      new CalendarAvailability(element);
      element.dataset.initialized = 'true';
    }
  });
}

// Utility functions for external use
window.calendarUtils = {
  formatDate: (dateString) => {
    const temp = new CalendarAvailability(document.createElement('div'));
    return temp.formatDate(dateString);
  },
  
  formatTime: (timeString) => {
    const temp = new CalendarAvailability(document.createElement('div'));
    return temp.formatTime(timeString);
  }
};