const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'reviews';
let db;

const getReviews = (productId, page, count, sort) => {
  // Aggregate data
    // $match productId
    // $sort
    // $limit, based on count
};

const async getProductMetadata = (productId) => {

  try {
    await db.product_metadata.find({ product_id: productId });
  } catch (error) {

  } finally {

  }
};

const async addReview = () => {
  // Add review to reviews collection
    // Generate next review_id
    // Generate timestamp
    // Set response to null
  // Recalculate metadata
};

const async markReviewHelpful = (reviewId) => {

  try {
    await db.reviews('reviews').updateOne(
      { review_id: reviewId },
      {
        $inc: { helpfulness: 1 }
      }
    );
  } catch (error) {
    console.log('Error marking review helpful', error);
  } finally {

  }

};

const async markReviewReported = () => {

  try {
    await db.reviews('reviews').updateOne(
      { review_id: reviewId },
      {
        $set: { reported: true }
      }
    );
  } catch (error) {
    console.log('Error marking review reported', error);
  } finally {

  }

};

const async connect= () => {
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
