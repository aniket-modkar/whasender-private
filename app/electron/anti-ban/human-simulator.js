class HumanSimulator {
  constructor() {
    // Greeting pool with weights (higher weight = more likely)
    this.greetings = [
      { text: '', weight: 50 }, // Empty (no greeting) - most common
      { text: 'Hi', weight: 15 },
      { text: 'Hello', weight: 15 },
      { text: 'Hey', weight: 10 },
      { text: 'Hi there', weight: 5 },
      { text: 'Good day', weight: 3 },
      { text: 'Greetings', weight: 2 },
    ];

    // Calculate total weight
    this.totalGreetingWeight = this.greetings.reduce((sum, g) => sum + g.weight, 0);

    // Zero-width characters for invisible variation
    this.zeroWidthChars = [
      '\u200B', // Zero-width space
      '\u200C', // Zero-width non-joiner
      '\u200D', // Zero-width joiner
      '\uFEFF', // Zero-width no-break space
    ];
  }

  // Get random greeting based on weights
  getRandomGreeting() {
    let random = Math.random() * this.totalGreetingWeight;

    for (const greeting of this.greetings) {
      random -= greeting.weight;
      if (random <= 0) {
        return greeting.text;
      }
    }

    return ''; // Fallback
  }

  // Insert zero-width character at random position
  insertZeroWidthSpace(text) {
    if (text.length === 0) {
      return text;
    }

    // Random position (avoid first and last character)
    const position = Math.floor(Math.random() * (text.length - 1)) + 1;

    // Random zero-width character
    const zwChar = this.zeroWidthChars[
      Math.floor(Math.random() * this.zeroWidthChars.length)
    ];

    // Insert character
    return text.slice(0, position) + zwChar + text.slice(position);
  }

  // Add invisible unicode variation to make message hash unique
  addInvisibleVariation(text) {
    // Add 1-3 zero-width characters at random positions
    const count = Math.floor(Math.random() * 3) + 1;
    let result = text;

    for (let i = 0; i < count; i++) {
      result = this.insertZeroWidthSpace(result);
    }

    return result;
  }

  // Replace variable placeholders with actual values
  replaceVariables(template, contactName = '', contactPhone = '') {
    let result = template;

    // Replace name placeholders - support both {name} and {{name}}
    if (contactName && contactName.trim() !== '') {
      result = result.replace(/\{\{name\}\}/gi, contactName);
      result = result.replace(/\{name\}/gi, contactName);
    } else {
      // Remove name placeholders if no name provided
      result = result.replace(/\{\{name\}\}/gi, '');
      result = result.replace(/\{name\}/gi, '');
    }

    // Replace phone placeholders - support both {phone} and {{phone}}
    if (contactPhone && contactPhone.trim() !== '') {
      result = result.replace(/\{\{phone\}\}/gi, contactPhone);
      result = result.replace(/\{phone\}/gi, contactPhone);
    } else {
      // Remove phone placeholders if no phone provided
      result = result.replace(/\{\{phone\}\}/gi, '');
      result = result.replace(/\{phone\}/gi, '');
    }

    // Clean up extra whitespace and punctuation issues
    result = result.replace(/\s+/g, ' '); // Multiple spaces to single space
    result = result.replace(/\s+,/g, ','); // Remove space before comma
    result = result.replace(/\s+\./g, '.'); // Remove space before period
    result = result.replace(/,\s*,/g, ','); // Remove duplicate commas
    result = result.trim();

    return result;
  }

  // Legacy method for backwards compatibility
  replaceName(template, contactName) {
    return this.replaceVariables(template, contactName, '');
  }

  // Vary message to make it unique
  varyMessage(template, contactName = '', contactPhone = '') {
    // Step 1: Replace variable placeholders
    let message = this.replaceVariables(template, contactName, contactPhone);

    // Step 2: Optionally prepend greeting
    const greeting = this.getRandomGreeting();
    if (greeting) {
      message = `${greeting} ${message}`;
    }

    // Step 3: Add invisible variation
    message = this.addInvisibleVariation(message);

    return message;
  }

  // Fisher-Yates shuffle algorithm
  shuffleArray(array) {
    const shuffled = [...array]; // Create copy

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  // Generate random variation ID for tracking
  generateVariationId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Test message variation (for debugging)
  testVariation(template, contactName, iterations = 10) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const varied = this.varyMessage(template, contactName);
      const visuallyIdentical = varied.replace(/[\u200B-\u200D\uFEFF]/g, '');

      results.push({
        iteration: i + 1,
        varied,
        length: varied.length,
        visuallyIdentical,
        hasInvisibleChars: varied.length !== visuallyIdentical.length,
      });
    }

    return results;
  }
}

module.exports = HumanSimulator;
