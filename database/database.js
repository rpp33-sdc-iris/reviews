const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'reviews';
let db;

const getReviews = async (productId, page, count, sort) => {
  // Aggregate data
  const reviews = await db.reviews.aggregate(
    [
      {
        // $match productId
        $match: { product_id: productId },
      }, {
        // $sort
        $sort: { },
      }, {
        // $limit, based on count
        $limit: { },
      },
    ],
  );
};

const getProductMetadata = async (productId) => {
  try {
    const productMetadata = await db.product_metadata.find({ product_id: productId });
    return productMetadata;
  } catch (error) {
    console.log('Error retrieving product metadata', error);
    return 0;
  }
};

const addReview = async () => {
  // Add review to reviews collection
    // Generate next review_id
    // Generate timestamp
    // Set response to null
  // Recalculate metadata
};

const markReviewHelpful = async (reviewId) => {
  try {
    await db.reviews('reviews').updateOne(
      { review_id: reviewId },
      { $inc: { helpfulness: 1 } },
    );
    return 1;
  } catch (error) {
    console.log('Error marking review helpful', error);
    return 0;
  }
};

const markReviewReported = async (reviewId) => {
  try {
    await db.reviews('reviews').updateOne(
      { review_id: reviewId },
      { $set: { reported: true } },
    );
    return 1;
  } catch (error) {
    console.log('Error marking review reported', error);
    return 0;
  }
};

const connect = async () => {
  try {
    await client.connect();
    console.log('Connected to database');
    db = client.db(dbName);
    module.exports = db;
  } catch (error) {
    console.log('Error connecting to database');
  }
};

connect();
