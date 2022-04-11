const { MongoClient } = require('mongodb');
const { getProductMetadata } = require('../database/database');
const { getReviews } = require('../database/database');
const { markReviewHelpful } = require('../database/database');
const { markReviewReported } = require('../database/database');
const { postReview } = require('../database/database');

describe('Database helper functions', () => {
  //
  let connection;
  let db;
  let reviewsTestCol;
  let productMetadataTestCol;
  //
  beforeAll(async () => {
    try {
      connection = await MongoClient.connect('mongodb://localhost:27017/reviews_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      db = await connection.db();
      console.log('Connected to reviews_test database');
    } catch (error) {
      console.log('Error connecting to db', error);
    }
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('getProductMetadata', () => {
    //
    it('returns product metadata for product_id 1', async () => {
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
    //
    it('returns null for product_id 0', async () => {
      const actual = await getProductMetadata(db, 'product_metadata_test', 0);
      expect(actual).toBe(null);
    });
  });
});
