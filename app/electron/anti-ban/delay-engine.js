class DelayEngine {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      // Message delay range (in milliseconds)
      minMessageDelay: config.minMessageDelay || 45000, // 45 seconds
      maxMessageDelay: config.maxMessageDelay || 120000, // 120 seconds

      // Typing delay range (per character in ms)
      minTypingSpeed: config.minTypingSpeed || 30,
      maxTypingSpeed: config.maxTypingSpeed || 80,

      // Typing delay bounds (in milliseconds)
      minTypingDelay: config.minTypingDelay || 2000, // 2 seconds
      maxTypingDelay: config.maxTypingDelay || 8000, // 8 seconds

      // Batch pause range (in milliseconds)
      minBatchPause: config.minBatchPause || 300000, // 5 minutes
      maxBatchPause: config.maxBatchPause || 900000, // 15 minutes

      // Batch size range (number of messages before pause)
      minBatchSize: config.minBatchSize || 5,
      maxBatchSize: config.maxBatchSize || 12,
    };

    // Current batch size threshold
    this.currentBatchSize = this.getBatchSize();

    // Sleep abort controller
    this.abortController = null;
  }

  // Weighted random number generator (normal distribution approximation)
  // Skew: -1 (favor min), 0 (uniform), 1 (favor max)
  weightedRandom(min, max, skew = 0) {
    // Generate two random numbers and average them for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();

    // Box-Muller transform for normal distribution
    let randn = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Normalize to 0-1 range
    randn = randn / 10.0 + 0.5;

    // Apply skew
    if (skew < 0) {
      randn = Math.pow(randn, 1 - skew);
    } else if (skew > 0) {
      randn = 1 - Math.pow(1 - randn, 1 + skew);
    }

    // Clamp to 0-1
    randn = Math.max(0, Math.min(1, randn));

    // Scale to range
    return min + randn * (max - min);
  }

  // Get message delay (weighted toward 60-90s range)
  getMessageDelay() {
    const { minMessageDelay, maxMessageDelay } = this.config;

    // Use weighted random to bias toward middle-upper range
    const delay = this.weightedRandom(minMessageDelay, maxMessageDelay, 0.3);

    return Math.round(delay);
  }

  // Get typing delay based on message length
  getTypingDelay(messageLength) {
    const { minTypingSpeed, maxTypingSpeed, minTypingDelay, maxTypingDelay } = this.config;

    // Random speed per character
    const speed = minTypingSpeed + Math.random() * (maxTypingSpeed - minTypingSpeed);

    // Calculate delay
    const delay = messageLength * speed;

    // Clamp to bounds
    return Math.round(Math.max(minTypingDelay, Math.min(delay, maxTypingDelay)));
  }

  // Get batch pause delay
  getBatchPauseDelay() {
    const { minBatchPause, maxBatchPause } = this.config;

    // Use weighted random
    const delay = this.weightedRandom(minBatchPause, maxBatchPause, 0);

    return Math.round(delay);
  }

  // Get batch size (messages before pause)
  getBatchSize() {
    const { minBatchSize, maxBatchSize } = this.config;

    // Random integer in range
    return Math.floor(minBatchSize + Math.random() * (maxBatchSize - minBatchSize + 1));
  }

  // Check if batch pause is needed
  shouldTakeBatchPause(messagesSinceLastPause) {
    if (messagesSinceLastPause >= this.currentBatchSize) {
      // Reset batch size for next cycle
      this.currentBatchSize = this.getBatchSize();
      return true;
    }
    return false;
  }

  // Cancellable sleep
  async sleep(ms) {
    return new Promise((resolve, reject) => {
      this.abortController = new AbortController();

      const timeout = setTimeout(() => {
        this.abortController = null;
        resolve();
      }, ms);

      // Listen for abort signal
      this.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        this.abortController = null;
        reject(new Error('Sleep cancelled'));
      });
    });
  }

  // Cancel current sleep
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
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

  // Format delay for display (convert ms to human readable)
  formatDelay(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${Math.round(ms / 1000)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.round((ms % 60000) / 1000);
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
  }
}

module.exports = DelayEngine;
