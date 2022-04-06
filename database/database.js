const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'reviews';
let db;

const getReviews = (productId, page, count, sort) => {
  return {};
};

const getProductMetadata = (productId) => {
  return {};
};

const addReview = () => {

};

const markReviewHelpful = () => {

};

const markReviewReported = () => {

};

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
