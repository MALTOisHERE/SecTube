import dotenv from 'dotenv';
import connectDB from './config/database.js';
import app from './app.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🔒 Security features enabled`);
  console.log(`📹 Video platform ready for cyber security content`);
});
