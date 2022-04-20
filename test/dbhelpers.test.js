const { config } = require('dotenv');

config();

const { connectToDatabase } = require('../database/database');
const { getProductMetadata } = require('../database/dbhelpers');
const { getReviews } = require('../database/dbhelpers');
const { markReviewHelpful } = require('../database/dbhelpers');
const { markReviewReported } = require('../database/dbhelpers');
const { postReview } = require('../database/dbhelpers');

const dbURL = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const reviewsCollectionName = process.env.REVIEWS_COLLECTION_NAME;
const productMetadataCollectionName = process.env.PRODUCTMETADATA_COLLECTION_NAME;

jest.setTimeout(20000);

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
      const actual = await getReviews(0, 'relevant');
      await expect(actual.length).toBe(0);
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

  describe('postReview', () => {
    //
    it('adds a review to the reviews collection', async () => {
      const review = {
        product_id: 1,
        rating: 5,
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
      await postReview(review);

      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const reviewsCollection = db.collection(reviewsCollectionName);
      const productMetadataCollection = db.collection(productMetadataCollectionName);

      const actual = await reviewsCollection.countDocuments();
      expect(actual).toBe(5774953);
      await reviewsCollection.deleteOne({ review_id: 5774953 });
      const metadata = {
        ratings: {
          1: '0',
          2: '0',
          3: '0',
          4: '1',
          5: '1',
        },
        recommended: {
          true: '1',
          false: '1',
        },
        characteristics: {
          Fit: {
            id: 1,
            value: '4',
          },
          Length: {
            id: 2,
            value: '3.5',
          },
          Comfort: {
            id: 3,
            value: '5',
          },
          Quality: {
            id: 4,
            value: '4',
          },
        },
      };

      await productMetadataCollection.replaceOne({ product_id: review.product_id }, metadata);
      await mongoClient.close();
    });
  });
});
