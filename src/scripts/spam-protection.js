/**
 * Spam Protection Tracking
 * Collects behavioral data for anti-spam analysis
 */

class SpamProtection {
  constructor(form) {
    this.form = form;
    this.startTime = Date.now();
    this.keystrokes = 0;
    this.mouseMovements = 0;
    this.fieldFocusOrder = [];
    this.copyPasteEvents = 0;
    this.sessionId = this.generateSessionId();
    this.init();
  }
  
  init() {
    // Track keystrokes
    this.form.addEventListener('keypress', () => this.keystrokes++);
    
    // Track mouse movements
    this.form.addEventListener('mousemove', () => this.mouseMovements++);
    
    // Track field focus order
    this.form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('focus', () => {
        if (!this.fieldFocusOrder.includes(field.name)) {
          this.fieldFocusOrder.push(field.name);
        }
      });
    });
    
    // Track copy/paste
    this.form.addEventListener('paste', () => this.copyPasteEvents++);
    
    // Add honeypot field
    this.addHoneypot();
  }
  
  addHoneypot() {
    const honeypot = document.createElement('div');
    honeypot.style.position = 'absolute';
    honeypot.style.left = '-9999px';
    honeypot.innerHTML = '<input type="text" name="website" tabindex="-1" autocomplete="off" />';
    this.form.appendChild(honeypot);
  }
  
  getMetadata() {
    return {
      submissionTime: Date.now() - this.startTime,
      keystrokes: this.keystrokes,
      mouseMovements: this.mouseMovements,
      fieldFocusOrder: this.fieldFocusOrder,
      copyPasteEvents: this.copyPasteEvents,
      sessionId: this.sessionId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      platform: navigator.platform,
      plugins: this.getPlugins()
    };
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getPlugins() {
    try {
      return Array.from(navigator.plugins).map(p => p.name).slice(0, 10);
    } catch {
      return [];
    }
  }
}

// Export for use
window.SpamProtection = SpamProtection;