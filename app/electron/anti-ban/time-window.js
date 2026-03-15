class TimeWindowManager {
  constructor(config = {}) {
    this.config = {
      startHour: config.startHour || 9, // 9:00 AM IST
      endHour: config.endHour || 20, // 8:00 PM IST
      timezone: config.timezone || 'Asia/Kolkata',
    };
  }

  // Get current time in IST
  getCurrentIST() {
    return new Date(
      new Date().toLocaleString('en-US', { timeZone: this.config.timezone })
    );
  }

  // Get IST hour (0-23)
  getISTHour() {
    const now = this.getCurrentIST();
    return now.getHours();
  }

  // Check if current time is within operating hours
  isWithinOperatingHours() {
    const hour = this.getISTHour();
    return hour >= this.config.startHour && hour < this.config.endHour;
  }

  // Get next window start time (9:00 AM IST)
  getNextWindowStart() {
    if (this.isWithinOperatingHours()) {
      return null; // Already within window
    }

    const now = this.getCurrentIST();
    const hour = now.getHours();

    // Create a date for next window start
    let nextStart = new Date(now);
    nextStart.setHours(this.config.startHour, 0, 0, 0);

    // If we're past the end hour today, move to tomorrow
    if (hour >= this.config.endHour) {
      nextStart.setDate(nextStart.getDate() + 1);
    }

    return nextStart;
  }

  // Get milliseconds until window closes (8:00 PM IST today)
  getMillisUntilWindowClose() {
    if (!this.isWithinOperatingHours()) {
      return 0;
    }

    const now = this.getCurrentIST();
    const closeTime = new Date(now);
    closeTime.setHours(this.config.endHour, 0, 0, 0);

    return closeTime.getTime() - now.getTime();
  }

  // Get milliseconds until window opens (9:00 AM IST)
  getMillisUntilWindowOpen() {
    if (this.isWithinOperatingHours()) {
      return 0;
    }

    const nextStart = this.getNextWindowStart();
    const now = this.getCurrentIST();

    return nextStart.getTime() - now.getTime();
  }

  // Format a date to IST string (HH:MM AM/PM IST)
  formatIST(date) {
    // Convert to IST
    const istDate = new Date(
      date.toLocaleString('en-US', { timeZone: this.config.timezone })
    );

    // Format time
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm} IST`;

    return formattedTime;
  }

  // Format milliseconds to human readable time
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Get window status summary
  getWindowStatus() {
    const isWithin = this.isWithinOperatingHours();
    const now = this.getCurrentIST();

    if (isWithin) {
      const msUntilClose = this.getMillisUntilWindowClose();
      return {
        status: 'open',
        message: `Operating hours active until ${this.formatIST(new Date(now.getTime() + msUntilClose))}`,
        closesIn: this.formatDuration(msUntilClose),
        millisUntilClose: msUntilClose,
      };
    } else {
      const nextStart = this.getNextWindowStart();
      const msUntilOpen = this.getMillisUntilWindowOpen();
      return {
        status: 'closed',
        message: `Outside operating hours. Next window: ${this.formatIST(nextStart)}`,
        opensIn: this.formatDuration(msUntilOpen),
        millisUntilOpen: msUntilOpen,
        nextStart,
      };
    }
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  // Get current configuration
  getConfig() {
    return { ...this.config };
  }

  // Get operating hours string
  getOperatingHoursString() {
    const start = `${this.config.startHour % 12 || 12}:00 ${this.config.startHour >= 12 ? 'PM' : 'AM'}`;
    const end = `${this.config.endHour % 12 || 12}:00 ${this.config.endHour >= 12 ? 'PM' : 'AM'}`;
    return `${start} - ${end} IST`;
  }
}

module.exports = TimeWindowManager;
