require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');

// Connect to MongoDB
async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Create a new user
async function createUser(email, password, name, plan, days) {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`Error: User with email ${email} already exists`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(days));

    // Set max daily messages based on plan
    let maxDailyMessages = 50;
    if (plan === 'basic') maxDailyMessages = 100;
    if (plan === 'pro') maxDailyMessages = 200;

    // Create user
    const user = new User({
      email,
      passwordHash,
      name,
      plan,
      expiresAt,
      maxDailyMessages,
    });

    await user.save();

    console.log('User created successfully:');
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${name}`);
    console.log(`  Plan: ${plan}`);
    console.log(`  Max Daily Messages: ${maxDailyMessages}`);
    console.log(`  Expires: ${expiresAt.toISOString()}`);
  } catch (error) {
    console.error('Error creating user:', error.message);
  }
}

// Deactivate a user
async function deactivateUser(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`Error: User with email ${email} not found`);
      return;
    }

    user.isActive = false;
    await user.save();

    // Revoke all sessions
    await Session.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true }
    );

    console.log(`User ${email} deactivated successfully`);
    console.log('All sessions have been revoked');
  } catch (error) {
    console.error('Error deactivating user:', error.message);
  }
}

// Activate a user
async function activateUser(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`Error: User with email ${email} not found`);
      return;
    }

    user.isActive = true;
    await user.save();

    console.log(`User ${email} activated successfully`);
  } catch (error) {
    console.error('Error activating user:', error.message);
  }
}

// Reset device binding
async function resetDevice(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`Error: User with email ${email} not found`);
      return;
    }

    user.deviceId = null;
    await user.save();

    console.log(`Device binding reset for ${email}`);
    console.log('User can now login from a new device');
  } catch (error) {
    console.error('Error resetting device:', error.message);
  }
}

// List all users
async function listUsers() {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('No users found');
      return;
    }

    console.log(`\nTotal users: ${users.length}\n`);
    console.log('Email'.padEnd(30), 'Name'.padEnd(20), 'Plan'.padEnd(10), 'Active', 'Expires'.padEnd(25), 'Device');
    console.log('-'.repeat(120));

    for (const user of users) {
      console.log(
        user.email.padEnd(30),
        user.name.padEnd(20),
        user.plan.padEnd(10),
        (user.isActive ? 'Yes' : 'No').padEnd(6),
        user.expiresAt.toISOString().padEnd(25),
        user.deviceId ? user.deviceId.substring(0, 8) + '...' : 'Not bound'
      );
    }
  } catch (error) {
    console.error('Error listing users:', error.message);
  }
}

// Main function
async function main() {
  await connect();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      const createArgs = {};
      for (let i = 1; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        createArgs[key] = value;
      }

      if (!createArgs.email || !createArgs.password || !createArgs.name) {
        console.error('Usage: node manage-user.js create --email <email> --password <password> --name <name> [--plan trial|basic|pro] [--days 30]');
        break;
      }

      await createUser(
        createArgs.email,
        createArgs.password,
        createArgs.name,
        createArgs.plan || 'trial',
        createArgs.days || 30
      );
      break;

    case 'deactivate':
      const deactivateEmail = args.find((arg, i) => args[i - 1] === '--email');
      if (!deactivateEmail) {
        console.error('Usage: node manage-user.js deactivate --email <email>');
        break;
      }
      await deactivateUser(deactivateEmail);
      break;

    case 'activate':
      const activateEmail = args.find((arg, i) => args[i - 1] === '--email');
      if (!activateEmail) {
        console.error('Usage: node manage-user.js activate --email <email>');
        break;
      }
      await activateUser(activateEmail);
      break;

    case 'reset-device':
      const resetEmail = args.find((arg, i) => args[i - 1] === '--email');
      if (!resetEmail) {
        console.error('Usage: node manage-user.js reset-device --email <email>');
        break;
      }
      await resetDevice(resetEmail);
      break;

    case 'list':
      await listUsers();
      break;

    default:
      console.log('WhaSender User Management');
      console.log('\nUsage:');
      console.log('  node manage-user.js create --email <email> --password <password> --name <name> [--plan trial|basic|pro] [--days 30]');
      console.log('  node manage-user.js deactivate --email <email>');
      console.log('  node manage-user.js activate --email <email>');
      console.log('  node manage-user.js reset-device --email <email>');
      console.log('  node manage-user.js list');
  }

  await mongoose.connection.close();
  process.exit(0);
}

main();
