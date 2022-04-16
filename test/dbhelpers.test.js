const { config } = require('dotenv');

config();

const { connectToDatabase } = require('../database/database');
const { getProductMetadata } = require('../database/dbhelpers');
const { getReviews } = require('../database/dbhelpers');
const { markReviewHelpful } = require('../database/dbhelpers');
const { markReviewReported } = require('../database/dbhelpers');
const { postReview } = require('../database/dbhelpers');

let dbURL;
let dbName;
let reviewsCollectionName;
let productMetadataCollectionName;

if (process.env.ENVIRONMENT === 'local-dev') {
  dbURL = process.env.LOCAL_DEV_DB_URL;
  dbName = process.env.LOCAL_DEV_DB_NAME;
  reviewsCollectionName = process.env.LOCAL_DEV_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.LOCAL_DEV_PRODUCTMETADATA_COLLECTION_NAME;
} else if (process.env.ENVIRONMENT === 'local-prod') {
  dbURL = process.env.LOCAL_PROD_DB_URL;
  dbName = process.env.LOCAL_PROD_DB_NAME;
  reviewsCollectionName = process.env.LOCAL_PROD_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.LOCAL_PROD_PRODUCTMETADATA_COLLECTION_NAME;
} else if (process.env.ENVIRONMENT === 'deployed-dev') {
  dbURL = process.env.DEPLOYED_DEV_DB_URL;
  dbName = process.env.DEPLOYED_DEV_DB_NAME;
  reviewsCollectionName = process.env.DEPLOYED_DEV_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.DEPLOYED_DEV_PRODUCTMETADATA_COLLECTION_NAME;
} else if (process.env.ENVIRONMENT === 'deployed-prod') {
  dbURL = process.env.DEPLOYED_PROD_DB_URL;
  dbName = process.env.DEPLOYED_PROD_DB_NAME;
  reviewsCollectionName = process.env.DEPLOYED_PROD_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.DEPLOYED_PROD_PRODUCTMETADATA_COLLECTION_NAME;
}

describe('Database helper functions', () => {
  //
  describe('getProductMetadata()', () => {
    //
    it('returns product metadata for a valid product_id', async () => {
      const expected = {
        _id: 2,
        product_id: 2,
        ratings: {
          1: '0', 2: '1', 3: '1', 4: '2', 5: '1',
        },
        recommended: { true: '3', false: '2' },
        characteristics: {
          Quality: { id: 5, value: '4.2' },
        },
      };
      const actual = await getProductMetadata(2);
      expect(actual).toStrictEqual(expected);
    });

    it('returns null for an invalid product_id', async () => {
      await expect(getProductMetadata(0)).rejects.toThrow('Invalid product_id');
    });
  });

  describe('getReviews()', () => {
    //
    it('returns reviews for a valid product_id', async () => {
      const actual = await getReviews(2, 'relevant');
      expect(actual.length).toBe(5);
    });

    it('does not return reviews for an invalid product_id', async () => {
      await expect(getReviews(0)).rejects.toThrow('Invalid product_id');
      // const actual = await getReviews(0, 'relevant');
      // expect(actual.length).toBe(0);
    });
  });

  describe('markReviewHelpful()', () => {
    //
    it('increases a review\'s helpfulness count', async () => {
      await markReviewHelpful(3);
      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const collection = db.collection(reviewsCollectionName);
      const actual = await collection.findOne({ review_id: 3 });
      expect(actual.helpfulness).toBe(6);
      await collection.updateOne(
        { review_id: 3 },
        { $inc: { helpfulness: -1 } },
      );
      await mongoClient.close();
    });
  });

  describe('markReviewReported()', () => {
    //
    it('sets a review\'s reported property to true', async () => {
      await markReviewReported(3);
      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const collection = db.collection(reviewsCollectionName);
      const actual = await collection.findOne({ review_id: 3 });
      expect(actual.reported).toBe(true);
      await collection.updateOne(
        { review_id: 3 },
        { $set: { reported: false } },
      );
      await mongoClient.close();
    });
  });
  /*
  describe('postReview', () => {
    //
    it('adds a review to the reviews collection', async () => {
      const review = {
        product_id: 1,
        rating: 5,
        date: new Date().toISOString(),
        summary: 'test summary',
        body: 'test body',
        recommend: true,
        name: 'tester',
        email: 'tester@gmail.com',
        photos: [
          'url1',
          'url2',
        ],
        characteristics: {
          1: 5, 2: 5, 3: 5, 4: 5,
        },
      };
      await postReview(db, 'reviews_test', 'product_metadata_test', review);
      const actual = await reviewsTestCol.countDocuments();
      expect(actual).toBe(5774953);
      await reviewsTestCol.deleteOne({ review_id: 5774953 });
    });
  });
  */
});
