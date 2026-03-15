#!/usr/bin/env node

/**
 * Create initial admin user for WhaSender
 * Run this after deploying auth server and MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Check if MONGODB_URI is set
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  console.error('❌ Error: MONGODB_URI or MONGO_URI environment variable not set');
  console.log('\nUsage:');
  console.log('  MONGODB_URI="your-connection-string" node scripts/create-admin.js');
  console.log('\nOr create .env file with:');
  console.log('  MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  role: { type: String, default: 'user' },
  smtpConfig: {
    host: String,
    port: Number,
    secure: Boolean,
    user: String,
    pass: String,
    from: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              Create Admin User for WhaSender                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin details from command line arguments or use defaults
    const email = process.argv[2] || 'admin@yourcompany.com';
    const password = process.argv[3] || 'Admin@123';
    const name = process.argv[4] || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`⚠️  User with email ${email} already exists!`);
      console.log('\nExisting user details:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Active: ${existingAdmin.isActive}`);
      console.log(`   Role: ${existingAdmin.role || 'user'}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);

      console.log('\n❓ To create a different admin, run:');
      console.log(`   node scripts/create-admin.js "email@example.com" "password" "Name"`);

      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      email,
      password: hashedPassword,
      name,
      isActive: true,
      role: 'admin',
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name:     ${name}`);
    console.log(`   Role:     admin`);
    console.log(`   Active:   Yes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  IMPORTANT: Save these credentials securely!\n');
    console.log('📱 You can now:');
    console.log('   1. Login to admin portal with these credentials');
    console.log('   2. Create additional users for clients');
    console.log('   3. Configure SMTP settings\n');

    console.log('🔐 Security Tip: Change the password after first login!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);

    if (error.code === 11000) {
      console.log('\n💡 This email is already registered.');
      console.log('   Try a different email or check existing users.');
    }

    await mongoose.disconnect();
    process.exit(1);
  }
}

// Show usage if --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\nUsage:');
  console.log('  node scripts/create-admin.js [email] [password] [name]');
  console.log('\nExamples:');
  console.log('  node scripts/create-admin.js');
  console.log('  node scripts/create-admin.js "admin@company.com" "SecurePass123" "Admin Name"');
  console.log('\nDefault values:');
  console.log('  Email: admin@yourcompany.com');
  console.log('  Password: Admin@123');
  console.log('  Name: Admin User');
  console.log('\nEnvironment:');
  console.log('  MONGODB_URI - MongoDB connection string (required)');
  process.exit(0);
}

createAdmin();
