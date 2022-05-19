const { MongoClient } = require('mongodb');

const connectToDatabase = async (url) => {
  let mongoClient;

  try {
    mongoClient = new MongoClient(url);
    await mongoClient.connect();
    return mongoClient;
  } catch (error) {
    console.log('Connection to MongoDB failed!', error);
    process.exit();
  }
};

module.exports.connectToDatabase = connectToDatabase;
