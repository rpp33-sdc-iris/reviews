const { MongoClient } = require('mongodb');
const { getProductMetadata } = require('../database/helpers');
const { getReviews } = require('../database/helpers');
const { markReviewHelpful } = require('../database/helpers');
const { markReviewReported } = require('../database/helpers');
const { postReview } = require('../database/helpers');

jest.setTimeout(30000);

describe('Database helper functions', () => {
  //
  let connection;
  let db;
  let reviewsTestCol;
  let productMetadataTestCol;

  beforeAll(async () => {
    try {
      connection = await MongoClient.connect('mongodb://localhost:27017/reviews_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      db = await connection.db();
      console.log('Connected to reviews_test database');
      reviewsTestCol = db.collection('reviews_test');
      productMetadataTestCol = db.collection('product_metadata_test');
    } catch (error) {
      console.log('Error connecting to db', error);
    }
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('getProductMetadata', () => {
    //
    it('returns product metadata for a valid product_id', async () => {
      const expected = {
        _id: 1,
        product_id: 1,
        ratings: {
          1: 0, 2: 0, 3: 0, 4: 1, 5: 1,
        },
        recommended: { true: 1, false: 1 },
        characteristics: {
          fit: { id: 1, value: '4' },
          length: { id: 2, value: '3.5' },
          comfort: { id: 3, value: '5' },
          qualilty: { id: 4, value: '4' },
        },
      };
      const actual = await getProductMetadata(db, 'product_metadata_test', 1);
      expect(actual).toStrictEqual(expected);
    });

    it('returns null for an invalid product_id', async () => {
      const actual = await getProductMetadata(db, 'product_metadata_test', 0);
      expect(actual).toBe(null);
    });
  });

  describe('getReviews', () => {
    //
    it('returns reviews for a valid product_id', async () => {
      const cursor = await getReviews(db, 'reviews_test', 1, 'relevant');
      const actual = await cursor.toArray();
      expect(actual.length).toBe(2);
    });

    it('does not return reviews for an invalid product_id', async () => {
      const cursor = await getReviews(db, 'reviews_test', 0, 'relevant');
      const actual = await cursor.toArray();
      expect(actual.length).toBe(0);
    });
  });

  describe('markReviewHelpful', () => {
    //
    it('increases a review\'s helpfulness count', async () => {
      await markReviewHelpful(db, 'reviews_test', 1);
      const actual = await reviewsTestCol.findOne({ review_id: 1 });
      expect(actual.helpfulness).toBe(9);
      await reviewsTestCol.updateOne(
        { review_id: 1 },
        { $inc: { helpfulness: -1 } },
      );
    });
  });

  describe('markReviewReported', () => {
    //
    it('sets a review\'s reported property to true', async () => {
      await markReviewReported(db, 'reviews_test', 1);
      const actual = await reviewsTestCol.findOne({ review_id: 1 });
      expect(actual.reported).toBe(true);
      await reviewsTestCol.updateOne(
        { review_id: 1 },
        { $set: { reported: false } },
      );
    });
  });

  describe.only('postReview', () => {
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
});
