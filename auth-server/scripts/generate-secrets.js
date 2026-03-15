#!/usr/bin/env node

/**
 * Generate secure secrets for auth server deployment
 */

const crypto = require('crypto');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         Auth Server - Secure Secrets Generator                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Generate JWT secret (64 characters)
const jwtSecret = crypto.randomBytes(48).toString('base64');

// Generate session secret (64 characters)
const sessionSecret = crypto.randomBytes(48).toString('base64');

console.log('📋 Copy these values to your deployment platform:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

console.log('SESSION_SECRET:');
console.log(sessionSecret);
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 Example .env configuration:\n');
console.log('# MongoDB Atlas Connection');
console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whasender?retryWrites=true&w=majority');
console.log('');
console.log('# JWT Configuration');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('JWT_EXPIRY=5d');
console.log('');
console.log('# Session Configuration');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('');
console.log('# Server Configuration');
console.log('PORT=3001');
console.log('NODE_ENV=production');
console.log('');
console.log('# CORS Configuration');
console.log('ALLOWED_ORIGINS=*');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  Security Tips:');
console.log('   • Never commit these secrets to git');
console.log('   • Use different secrets for dev/production');
console.log('   • Rotate secrets every 6 months');
console.log('   • Store backups securely\n');

console.log('✅ Copy the JWT_SECRET and SESSION_SECRET values above');
console.log('✅ Add them to your Railway/Render environment variables\n');
