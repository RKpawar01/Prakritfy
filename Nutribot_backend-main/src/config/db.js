const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔗 Attempting to connect to MongoDB...");
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000, // 30 seconds for server selection
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      connectTimeoutMS: 30000, // 30 seconds for initial connection
      bufferTimeoutMS: 60000, // 60 seconds for command buffering - FIXED from 10s default
      family: 4, // Use IPv4 only
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error(`   Error code: ${error.code}`);
    console.error(`   Make sure:`);
    console.error(`   1. Your IP address is whitelisted in MongoDB Atlas`);
    console.error(`   2. Your MONGO_URI is correct in .env`);
    console.error(`   3. Your MongoDB cluster is active and not paused`);
    console.error(`   4. You have internet connectivity`);
    
    // Retry after 5 seconds
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(() => {
      connectDB().catch(() => process.exit(1));
    }, 5000);
  }
};

module.exports = connectDB;
