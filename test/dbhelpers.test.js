const { MongoClient } = require('mongodb');
const { getProductMetadata } = require('../database/dbhelpers');
const { getReviews } = require('../database/dbhelpers');
const { markReviewHelpful } = require('../database/dbhelpers');
const { markReviewReported } = require('../database/dbhelpers');
const { postReview } = require('../database/dbhelpers');

jest.setTimeout(30000);

describe.skip('Database helper functions', () => {
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
      const actual = await getProductMetadata(db, 'product_metadata_test', 2);
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
      const actual = await getReviews(db, 'reviews_test', 2, 'relevant');
      expect(actual.length).toBe(5);
    });

    it('does not return reviews for an invalid product_id', async () => {
      const actual = await getReviews(db, 'reviews_test', 0, 'relevant');
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
});
