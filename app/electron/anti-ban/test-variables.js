// Test script to verify variable replacement works correctly
const HumanSimulator = require('./human-simulator');

const simulator = new HumanSimulator();

console.log('='.repeat(60));
console.log('MESSAGE VARIABLE REPLACEMENT TEST');
console.log('='.repeat(60));
console.log();

// Test data
const testCases = [
  {
    template: 'Hi {{name}}, hope you are doing well!',
    name: 'John Doe',
    phone: '+1234567890',
    description: 'Double curly braces for name',
  },
  {
    template: 'Hello {name}, your number is {phone}',
    name: 'Jane Smith',
    phone: '+9876543210',
    description: 'Single curly braces for both variables',
  },
  {
    template: 'Dear {{name}}, registered at {{phone}}. Please confirm.',
    name: 'Mike Johnson',
    phone: '+1112223333',
    description: 'Double curly braces for both variables',
  },
  {
    template: 'Hi {{NAME}}, we have a special offer!',
    name: 'Sarah Williams',
    phone: '+5556667777',
    description: 'Uppercase variable name',
  },
  {
    template: 'Hello {{name}}, great to connect!',
    name: '',
    phone: '+9998887777',
    description: 'Empty name (should be removed)',
  },
  {
    template: 'Your number {{phone}} is registered.',
    name: 'Tom Brown',
    phone: '',
    description: 'Empty phone (should be removed)',
  },
  {
    template: 'Mix: {{name}} and {phone} test',
    name: 'Alice Cooper',
    phone: '+3334445555',
    description: 'Mixed double and single curly braces',
  },
];

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.description}`);
  console.log('-'.repeat(60));
  console.log(`Template:  "${testCase.template}"`);
  console.log(`Name:      "${testCase.name}"`);
  console.log(`Phone:     "${testCase.phone}"`);

  // Call replaceVariables directly (without greeting and invisible chars)
  const result = simulator.replaceVariables(
    testCase.template,
    testCase.name,
    testCase.phone
  );

  console.log(`Result:    "${result}"`);

  // Check if variables were replaced correctly
  const hasDoubleBrace = result.includes('{{') || result.includes('}}');
  const hasSingleBrace = result.includes('{') || result.includes('}');

  if (hasDoubleBrace || hasSingleBrace) {
    console.log('⚠️  WARNING: Variables not fully replaced!');
  } else {
    console.log('✅ SUCCESS: All variables replaced');
  }
});

console.log();
console.log('='.repeat(60));
console.log('FULL MESSAGE VARIATION TEST (with greetings)');
console.log('='.repeat(60));
console.log();

// Test varyMessage (includes greeting and invisible chars)
const template = 'Hi {{name}}, we have a special offer for you at {{phone}}!';
const name = 'Test User';
const phone = '+1234567890';

console.log(`Template: "${template}"`);
console.log(`Name:     "${name}"`);
console.log(`Phone:    "${phone}"`);
console.log();
console.log('Generating 5 varied messages:');
console.log('-'.repeat(60));

for (let i = 1; i <= 5; i++) {
  const varied = simulator.varyMessage(template, name, phone);
  // Remove invisible characters for display
  const visible = varied.replace(/[\u200B-\u200D\uFEFF]/g, '');

  console.log(`${i}. "${visible}"`);
  console.log(`   Length: ${varied.length} chars (${varied.length - visible.length} invisible)`);
}

console.log();
console.log('='.repeat(60));
console.log('✅ All tests completed!');
console.log('='.repeat(60));
