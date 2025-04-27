/**
 * Database Configuration
 * 
 * This file handles the MongoDB connection settings.
 * It exports a function to connect to the database.
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * @param {string} uri - MongoDB connection URI
 * @returns {Promise} - Mongoose connection promise
 */
const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri, {
      // These options are no longer needed in newer versions of Mongoose
      // but kept for compatibility with older versions
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
