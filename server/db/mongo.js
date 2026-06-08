const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri);
  console.log('[Mongo] connected:', uri);
}

async function disconnectMongo() {
  await mongoose.disconnect();
}

module.exports = { connectMongo, disconnectMongo };
