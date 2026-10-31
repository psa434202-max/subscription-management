const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`Attempting connection to specified MONGODB_URI...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log(`Connected to MongoDB at ${uri.split('@').pop()}`);
      return;
    } catch (err) {
      console.warn(`Could not connect to external MONGODB_URI: ${err.message}. Falling back to in-memory MongoDB...`);
    }
  }

  // Fallback to local default or MongoMemoryServer
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/brightloop', { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to local MongoDB at mongodb://127.0.0.1:27017/brightloop');
  } catch (err) {
    console.log('No local MongoDB daemon running. Starting embedded MongoMemoryServer...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to embedded MongoMemoryServer at ${memoryUri}`);
    } catch (memoryErr) {
      console.error('Failed to start MongoMemoryServer:', memoryErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };

