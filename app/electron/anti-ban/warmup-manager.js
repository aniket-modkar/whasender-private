const { getSetting, setSetting } = require('../database/queries');

class WarmupManager {
  constructor() {
    // Warmup schedule (days: daily limit)
    // Research-backed moderate schedule: 700/day over 91 days (Low risk)
    // Based on WhatsApp Business API limits and community testing
    this.warmupSchedule = [
      { minDays: 1, maxDays: 3, limit: 20 },    // Week 1: Conservative start
      { minDays: 4, maxDays: 7, limit: 50 },    // Week 1: Building trust
      { minDays: 8, maxDays: 14, limit: 100 },  // Week 2: Gradual increase
      { minDays: 15, maxDays: 30, limit: 200 }, // Weeks 3-4: Moderate
      { minDays: 31, maxDays: 60, limit: 350 }, // Months 2: Established
      { minDays: 61, maxDays: 90, limit: 500 }, // Month 3: Proven
      { minDays: 91, maxDays: Infinity, limit: 700 }, // 3+ months: Full capacity
    ];
  }

  // Initialize WhatsApp connection tracking
  async initializeConnection() {
    const firstConnected = getSetting('wa_first_connected_date');

    if (!firstConnected) {
      // First time connecting
      const now = new Date().toISOString();
      setSetting('wa_first_connected_date', now);
      setSetting('wa_total_messages_sent', '0');
      setSetting('wa_messages_sent_today', '0');
      setSetting('wa_last_send_date', now.split('T')[0]); // Date only

      console.log('WhatsApp warmup initialized');
      return {
        firstConnection: true,
        accountAge: 0,
        dailyLimit: 10,
      };
    }

    return {
      firstConnection: false,
      accountAge: this.getAccountAge(),
      dailyLimit: this.getDailyLimit(),
    };
  }

  // Get account age in days
  getAccountAge() {
    const firstConnected = getSetting('wa_first_connected_date');

    if (!firstConnected) {
      return 0;
    }

    const firstDate = new Date(firstConnected);
    const now = new Date();
    const diffMs = now - firstDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays + 1; // Day 1 starts immediately
  }

  // Get daily limit based on account age
  getDailyLimit(userPlanLimit = null) {
    const accountAge = this.getAccountAge();

    // Find the appropriate limit from warmup schedule
    let warmupLimit = 10; // Default for new accounts

    for (const schedule of this.warmupSchedule) {
      if (accountAge >= schedule.minDays && accountAge <= schedule.maxDays) {
        warmupLimit = schedule.limit;
        break;
      }
    }

    // If user has a plan limit, use the lower of the two
    if (userPlanLimit !== null) {
      return Math.min(warmupLimit, userPlanLimit);
    }

    return warmupLimit;
  }

  // Get today's date string (YYYY-MM-DD)
  getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }

  // Reset daily counter if date changed
  resetDailyCounterIfNeeded() {
    const lastSendDate = getSetting('wa_last_send_date');
    const today = this.getTodayDateString();

    if (lastSendDate !== today) {
      console.log('New day detected, resetting daily counter');
      setSetting('wa_messages_sent_today', '0');
      setSetting('wa_last_send_date', today);
    }
  }

  // Check if can send more messages today
  canSendMore(userPlanLimit = null) {
    this.resetDailyCounterIfNeeded();

    const sentToday = parseInt(getSetting('wa_messages_sent_today') || '0', 10);
    const dailyLimit = this.getDailyLimit(userPlanLimit);

    return sentToday < dailyLimit;
  }

  // Record a sent message
  recordSend() {
    this.resetDailyCounterIfNeeded();

    // Increment today's counter
    const sentToday = parseInt(getSetting('wa_messages_sent_today') || '0', 10);
    setSetting('wa_messages_sent_today', String(sentToday + 1));

    // Increment total counter
    const totalSent = parseInt(getSetting('wa_total_messages_sent') || '0', 10);
    setSetting('wa_total_messages_sent', String(totalSent + 1));

    // Update last send date
    setSetting('wa_last_send_date', this.getTodayDateString());
  }

  // Get remaining messages for today
  getRemainingToday(userPlanLimit = null) {
    this.resetDailyCounterIfNeeded();

    const sentToday = parseInt(getSetting('wa_messages_sent_today') || '0', 10);
    const dailyLimit = this.getDailyLimit(userPlanLimit);

    return Math.max(0, dailyLimit - sentToday);
  }

  // Get warmup statistics
  getWarmupStats(userPlanLimit = null) {
    this.resetDailyCounterIfNeeded();

    const accountAge = this.getAccountAge();
    const dailyLimit = this.getDailyLimit(userPlanLimit);
    const sentToday = parseInt(getSetting('wa_messages_sent_today') || '0', 10);
    const totalSent = parseInt(getSetting('wa_total_messages_sent') || '0', 10);
    const firstConnected = getSetting('wa_first_connected_date');

    return {
      accountAge,
      dailyLimit,
      sentToday,
      remainingToday: this.getRemainingToday(userPlanLimit),
      totalSent,
      firstConnected: firstConnected ? new Date(firstConnected) : null,
      warmupPhase: this.getWarmupPhase(accountAge),
    };
  }

  // Get current warmup phase description
  getWarmupPhase(accountAge) {
    for (const schedule of this.warmupSchedule) {
      if (accountAge >= schedule.minDays && accountAge <= schedule.maxDays) {
        if (schedule.maxDays === Infinity) {
          return `Fully warmed up (${schedule.limit} msgs/day)`;
        } else {
          return `Day ${schedule.minDays}-${schedule.maxDays} (${schedule.limit} msgs/day)`;
        }
      }
    }
    return 'Unknown phase';
  }

  // Reset daily counter manually (for testing)
  resetDailyCounter() {
    setSetting('wa_messages_sent_today', '0');
    setSetting('wa_last_send_date', this.getTodayDateString());
  }

  // Reset all warmup data (for testing or account reset)
  resetWarmup() {
    setSetting('wa_first_connected_date', new Date().toISOString());
    setSetting('wa_total_messages_sent', '0');
    setSetting('wa_messages_sent_today', '0');
    setSetting('wa_last_send_date', this.getTodayDateString());

    console.log('Warmup data reset');
  }

  // Simulate account age (for testing)
  simulateAccountAge(days) {
    const now = new Date();
    const simulatedDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    setSetting('wa_first_connected_date', simulatedDate.toISOString());

    console.log(`Simulated account age: ${days} days`);
    console.log(`New daily limit: ${this.getDailyLimit()}`);
  }
}

module.exports = WarmupManager;
