require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const ADMINS = [
  {
    email: 'ankit.technomize@gmail.com',
    name: 'Ankit',
    isActive: true,
  },
  {
    email: 'aniket.technomize@gmail.com',
    name: 'Aniket',
    isActive: true,
  },
];

async function seedAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing admins (optional - comment out if you want to keep existing)
    // await Admin.deleteMany({});
    // console.log('Cleared existing admins');

    // Insert admins
    for (const admin of ADMINS) {
      const existing = await Admin.findOne({ email: admin.email });

      if (existing) {
        console.log(`Admin ${admin.email} already exists, skipping...`);
      } else {
        await Admin.create(admin);
        console.log(`✅ Created admin: ${admin.email}`);
      }
    }

    console.log('\n✅ Admin seeding complete!');
    console.log('\nAdmin emails:');
    ADMINS.forEach((admin) => console.log(`  - ${admin.email}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    process.exit(1);
  }
}

seedAdmins();
