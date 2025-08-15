/**
 * Calendar Availability JavaScript
 * Handles frontend functionality for the calendar component
 */

class CalendarAvailability {
  constructor(element) {
    this.element = element;
    this.componentId = element.id;
    this.maxDays = parseInt(element.dataset.maxDays) || 7;
    this.showFull = element.dataset.showFull === 'true';
    this.isLoading = false;
    this.currentData = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    this.init();
  }

  init() {
    console.log(`Initializing calendar component: ${this.componentId}`);
    this.bindEvents();
    this.loadAvailability();
  }

  bindEvents() {
    // Make functions available globally for onclick handlers
    window.retryCalendarLoad = (button) => this.retryLoad(button);
    window.toggleFullCalendar = (button) => this.toggleView(button);
    window.refreshCalendar = (button) => this.refresh(button);
    window.initiateBooking = (button) => this.initiateBooking(button);
    
    // Bind slot click events (will be added dynamically)
    this.element.addEventListener('click', (e) => {
      if (e.target.classList.contains('time-slot') && e.target.classList.contains('available')) {
        this.selectTimeSlot(e.target);
      }
    });
  }

  async loadAvailability(type = 'summary') {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading();

    try {
      const params = new URLSearchParams({
        type: type,
        days: this.maxDays.toString()
      });

      console.log(`Loading calendar data: type=${type}, days=${this.maxDays}`);
      
      const response = await fetch(`/api/calendar/availability?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load availability');
      }

      this.currentData = result.data;
      this.retryCount = 0; // Reset retry count on success
      
      if (type === 'summary') {
        this.renderSummary(result.data);
      } else if (type === 'slots') {
        this.renderFullCalendar(result.data);
      }
      
      console.log('Calendar data loaded successfully');
      
    } catch (error) {
      console.error('Calendar loading error:', error);
      this.showError(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  showLoading() {
    this.hideAllViews();
    this.getElement('loading').classList.remove('hidden');
  }

  showError(message) {
    this.hideAllViews();
    const errorElement = this.getElement('error');
    errorElement.classList.remove('hidden');
    
    const messageElement = errorElement.querySelector('.error-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  hideAllViews() {
    ['loading', 'error', 'summary', 'calendar'].forEach(view => {
      this.getElement(view).classList.add('hidden');
    });
  }

  getElement(suffix) {
    return document.getElementById(`${this.componentId}-${suffix}`);
  }

  renderSummary(data) {
    this.hideAllViews();
    
    // Update quick stats
    this.updateElement('today-count', data.availableToday);
    this.updateElement('tomorrow-count', data.availableTomorrow);
    this.updateElement('week-count', data.availableThisWeek);
    
    // Update next available slot
    const nextSlotContainer = this.getElement('next-slot');
    if (data.nextAvailable) {
      const dateElement = nextSlotContainer.querySelector('.slot-date');
      const timeElement = nextSlotContainer.querySelector('.slot-time');
      const bookButton = nextSlotContainer.querySelector('.book-button');
      
      if (dateElement && timeElement && bookButton) {
        dateElement.textContent = this.formatDate(data.nextAvailable.date);
        timeElement.textContent = this.formatTime(data.nextAvailable.time);
        bookButton.disabled = false;
        bookButton.dataset.slotDate = data.nextAvailable.date;
        bookButton.dataset.slotTime = data.nextAvailable.time;
      }
    } else {
      const dateElement = nextSlotContainer.querySelector('.slot-date');
      const timeElement = nextSlotContainer.querySelector('.slot-time');
      const bookButton = nextSlotContainer.querySelector('.book-button');
      
      if (dateElement && timeElement && bookButton) {
        dateElement.textContent = 'No availability';
        timeElement.textContent = 'in the next ' + this.maxDays + ' days';
        bookButton.disabled = true;
        bookButton.textContent = 'Call for Availability';
      }
    }
    
    this.getElement('summary').classList.remove('hidden');
  }

  async renderFullCalendar(data) {
    this.hideAllViews();
    
    const gridElement = this.getElement('grid');
    if (!gridElement) return;
    
    // Group slots by date
    const slotsByDate = {};
    if (data.slots) {
      data.slots.forEach(slot => {
        if (!slotsByDate[slot.date]) {
          slotsByDate[slot.date] = [];
        }
        slotsByDate[slot.date].push(slot);
      });
    }
    
    // Generate calendar grid
    gridElement.innerHTML = '';
    Object.keys(slotsByDate).sort().forEach(date => {
      const dayColumn = this.createDayColumn(date, slotsByDate[date]);
      gridElement.appendChild(dayColumn);
    });
    
    this.getElement('calendar').classList.remove('hidden');
  }

  createDayColumn(date, slots) {
    const column = document.createElement('div');
    column.className = 'day-column';
    
    // Day header
    const header = document.createElement('div');
    header.className = 'day-header';
    header.textContent = this.formatDate(date);
    column.appendChild(header);
    
    // Time slots
    slots.forEach(slot => {
      const slotElement = document.createElement('div');
      slotElement.className = `time-slot ${this.getSlotStatus(slot)}`;
      slotElement.dataset.date = slot.date;
      slotElement.dataset.time = slot.time;
      
      const timeText = document.createElement('span');
      timeText.textContent = this.formatTime(slot.time);
      slotElement.appendChild(timeText);
      
      const statusBadge = document.createElement('span');
      statusBadge.className = `slot-status ${this.getSlotStatus(slot)}`;
      statusBadge.textContent = this.getSlotStatusText(slot);
      slotElement.appendChild(statusBadge);
      
      column.appendChild(slotElement);
    });
    
    return column;
  }

  getSlotStatus(slot) {
    const now = new Date();
    const slotDateTime = new Date(`${slot.date}T${slot.time}`);
    
    if (slotDateTime < now) {
      return 'past';
    }
    
    return slot.available ? 'available' : 'booked';
  }

  getSlotStatusText(slot) {
    const status = this.getSlotStatus(slot);
    
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'past': return 'Past';
      default: return 'Unknown';
    }
  }

  updateElement(suffix, value) {
    const element = this.getElement(suffix);
    if (element) {
      element.textContent = value;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  }

  retryLoad(button) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying calendar load (attempt ${this.retryCount}/${this.maxRetries})`);
      this.loadAvailability();
    } else {
      console.error('Max retry attempts reached');
      alert('Unable to load calendar. Please refresh the page or contact support.');
    }
  }

  toggleView(button) {
    const summaryVisible = !this.getElement('summary').classList.contains('hidden');
    
    if (summaryVisible) {
      // Switch to full calendar
      this.loadAvailability('slots');
    } else {
      // Switch to summary
      this.loadAvailability('summary');
    }
  }

  refresh(button) {
    console.log('Refreshing calendar data');
    
    // Clear any cached data
    this.currentData = null;
    
    // Determine current view
    const summaryVisible = !this.getElement('summary').classList.contains('hidden');
    const calendarVisible = !this.getElement('calendar').classList.contains('hidden');
    
    if (calendarVisible) {
      this.loadAvailability('slots');
    } else {
      this.loadAvailability('summary');
    }
  }

  selectTimeSlot(slotElement) {
    const date = slotElement.dataset.date;
    const time = slotElement.dataset.time;
    
    console.log(`Selected time slot: ${date} ${time}`);
    
    // Remove previous selections
    this.element.querySelectorAll('.time-slot.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Mark this slot as selected
    slotElement.classList.add('selected');
    
    // Trigger booking process
    this.initiateBooking(slotElement, date, time);
  }

  initiateBooking(element, date = null, time = null) {
    // Get slot info from element if not provided
    if (!date || !time) {
      date = element.dataset.slotDate || element.dataset.date;
      time = element.dataset.slotTime || element.dataset.time;
    }
    
    if (!date || !time) {
      console.error('Missing date/time for booking');
      return;
    }
    
    console.log(`Initiating booking for: ${date} ${time}`);
    
    // Format the selected time for display
    const formattedDate = this.formatDate(date);
    const formattedTime = this.formatTime(time);
    
    // Create booking confirmation dialog
    const confirmed = confirm(
      `Would you like to request an appointment for ${formattedDate} at ${formattedTime}?\n\n` +
      `This will open our contact form with your selected time pre-filled.`
    );
    
    if (confirmed) {
      // Redirect to contact form with pre-filled time
      const contactUrl = `/contact?preferred_date=${encodeURIComponent(date)}&preferred_time=${encodeURIComponent(time)}`;
      window.location.href = contactUrl;
    }
  }
}

// Make the class available globally
window.CalendarAvailability = CalendarAvailability;

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  const calendarComponents = document.querySelectorAll('.calendar-availability');
  calendarComponents.forEach(component => {
    new CalendarAvailability(component);
  });
});

// Additional utility functions
window.calendarUtils = {
  formatDate: function(dateString) {
    const instance = new CalendarAvailability(document.createElement('div'));
    return instance.formatDate(dateString);
  },
  
  formatTime: function(timeString) {
    const instance = new CalendarAvailability(document.createElement('div'));
    return instance.formatTime(timeString);
  }
};