// Copy these commands into DevTools Console for testing
// Press Cmd+Option+I to open DevTools in Electron app

// ============================================
// TEST 1: Database Test
// ============================================
async function testDatabase() {
  const result = await window.electronAPI.invoke('db:test');
  console.log('✅ Database Test:', result);
  return result;
}

// ============================================
// TEST 2: Parse CSV File
// ============================================
async function testParseFile(filePath) {
  const result = await window.electronAPI.invoke('file:parse-numbers', filePath);
  console.log('✅ Parse Result:', result);
  return result;
}

// ============================================
// TEST 3: Create Task
// ============================================
async function testCreateTask() {
  const result = await window.electronAPI.invoke('task:create', {
    messageTemplate: 'Hello {name}! This is a test message from WhaSender.',
    numbers: [
      { phone: '919876543210', name: 'Alice' },
      { phone: '919876543211', name: 'Bob' },
      { phone: '919876543212', name: 'Charlie' }
    ],
    scheduledAt: null
  });
  console.log('✅ Task Created:', result);
  return result;
}

// ============================================
// TEST 4: Setup Event Listeners
// ============================================
function setupEventListeners() {
  window.electronAPI.on('task:progress', (data) => {
    console.log('📊 PROGRESS:', data);
  });

  window.electronAPI.on('task:status-change', (data) => {
    console.log('🔄 STATUS CHANGE:', data);
  });

  window.electronAPI.on('task:complete', (data) => {
    console.log('✅ TASK COMPLETE:', data);
  });

  window.electronAPI.on('task:ban-detected', (data) => {
    console.log('🚨 BAN DETECTED:', data);
  });

  console.log('✅ Event listeners set up');
}

// ============================================
// TEST 5: Start Task
// ============================================
async function testStartTask(taskId) {
  const result = await window.electronAPI.invoke('task:start', taskId);
  console.log('✅ Task Started:', result);
  return result;
}

// ============================================
// TEST 6: Pause Task
// ============================================
async function testPauseTask() {
  const result = await window.electronAPI.invoke('task:pause');
  console.log('⏸️ Task Paused:', result);
  return result;
}

// ============================================
// TEST 7: Resume Task
// ============================================
async function testResumeTask() {
  const result = await window.electronAPI.invoke('task:resume');
  console.log('▶️ Task Resumed:', result);
  return result;
}

// ============================================
// TEST 8: Stop Task
// ============================================
async function testStopTask(taskId) {
  const result = await window.electronAPI.invoke('task:stop', taskId);
  console.log('⏹️ Task Stopped:', result);
  return result;
}

// ============================================
// TEST 9: Configure SMTP
// ============================================
async function testConfigureSMTP() {
  const result = await window.electronAPI.invoke('smtp:configure', {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'your-email@gmail.com', // CHANGE THIS
    pass: 'your-app-password', // CHANGE THIS
    alertEmail: 'your-email@gmail.com' // CHANGE THIS
  });
  console.log('✅ SMTP Configured:', result);
  return result;
}

// ============================================
// TEST 10: Test SMTP Connection
// ============================================
async function testSMTP() {
  const result = await window.electronAPI.invoke('smtp:test');
  console.log('✅ SMTP Test:', result);
  return result;
}

// ============================================
// TEST 11: Get Active Task
// ============================================
async function testGetActiveTask() {
  const result = await window.electronAPI.invoke('task:get-active');
  console.log('✅ Active Task:', result);
  return result;
}

// ============================================
// TEST 12: Get Task Stats
// ============================================
async function testGetStats(taskId) {
  const result = await window.electronAPI.invoke('task:get-stats', taskId);
  console.log('✅ Task Stats:', result);
  return result;
}

// ============================================
// TEST 13: Schedule Task
// ============================================
async function testScheduleTask(taskId, minutesFromNow = 2) {
  const scheduledTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
  const result = await window.electronAPI.invoke('task:schedule', {
    taskId,
    scheduledAt: scheduledTime.toISOString()
  });
  console.log('✅ Task Scheduled for:', scheduledTime.toLocaleString());
  console.log('Result:', result);
  return result;
}

// ============================================
// FULL TEST SEQUENCE
// ============================================
async function runFullTest() {
  console.log('🚀 Starting Full Test Sequence...\n');

  try {
    // 1. Test database
    console.log('1️⃣ Testing database...');
    await testDatabase();
    await sleep(1000);

    // 2. Setup listeners
    console.log('\n2️⃣ Setting up event listeners...');
    setupEventListeners();
    await sleep(1000);

    // 3. Create task
    console.log('\n3️⃣ Creating task...');
    const taskResult = await testCreateTask();
    const taskId = taskResult.taskId;
    await sleep(1000);

    // 4. Get task stats
    console.log('\n4️⃣ Getting task stats...');
    await testGetStats(taskId);
    await sleep(1000);

    // 5. Start task
    console.log('\n5️⃣ Starting task...');
    console.log('⚠️ WARNING: This will send WhatsApp messages!');
    console.log('⏸️ You can pause with: testPauseTask()');
    console.log('⏹️ You can stop with: testStopTask(' + taskId + ')');

    // Uncomment to auto-start:
    // await testStartTask(taskId);

    console.log('\n✅ Full test sequence ready!');
    console.log('📝 To start task, run: testStartTask(' + taskId + ')');
    console.log('📊 To check stats: testGetStats(' + taskId + ')');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// INSTRUCTIONS
// ============================================
console.log('═══════════════════════════════════════════════════');
console.log('📋 WhaSender Test Commands Loaded');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('Quick Start:');
console.log('  runFullTest()           - Run complete test sequence');
console.log('');
console.log('Individual Tests:');
console.log('  testDatabase()          - Test database connection');
console.log('  testCreateTask()        - Create a test task');
console.log('  setupEventListeners()   - Setup progress listeners');
console.log('  testStartTask(taskId)   - Start a task');
console.log('  testPauseTask()         - Pause running task');
console.log('  testResumeTask()        - Resume paused task');
console.log('  testStopTask(taskId)    - Stop task completely');
console.log('');
console.log('SMTP Tests:');
console.log('  testConfigureSMTP()     - Configure email (edit first!)');
console.log('  testSMTP()              - Test SMTP connection');
console.log('');
console.log('Other:');
console.log('  testGetActiveTask()     - Get currently active task');
console.log('  testGetStats(taskId)    - Get task statistics');
console.log('  testScheduleTask(id, 2) - Schedule task 2 min from now');
console.log('');
console.log('═══════════════════════════════════════════════════');
