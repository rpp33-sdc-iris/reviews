const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'reviews';
let db;

async function connect() {
  try {
    await client.connect();
    console.log('Connected to database');
    db = client.db(dbName);
    module.exports = db;
  } catch (error) {
    console.log('Error connecting to database');
  }
}

connect();
