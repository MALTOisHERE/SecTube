import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../backend/src/models/User.js';

// Load env from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const makeAdmin = async () => {
  const username = process.argv[2];

  if (!username) {
    console.error('Please provide a username: node scripts/make-admin.js <username>');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username });

    if (!user) {
      console.error(`User "${username}" not found`);
      process.exit(1);
    }

    user.role = 'admin';
    user.isVerified = true; // Admins should be verified
    await user.save();

    console.log(`Successfully promoted "${username}" to ADMIN!`);
    console.log('You now have full privileges to manage users and content.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();
