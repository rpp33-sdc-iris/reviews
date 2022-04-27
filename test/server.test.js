const request = require('supertest');
const { connectToDatabase } = require('../database/connect');
const { api, server } = require('../server/server');

const dbURL = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const reviewsCollectionName = process.env.REVIEWS_COLLECTION_NAME;

afterAll(async () => {
  await server.close();
  console.log('Express server closed');
});

describe.skip('Reviews API Server', () => {
  //
  describe('/reviews/meta route', () => {
    //
    it('handles valid GET requests for valid products', async () => {
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
      const response = await request(api)
        .get('/reviews/meta?product_id=2');
      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(expected);
    });

    it('handles valid GET requests for invalid products', async () => {
      const response = await request(api)
        .get('/reviews/meta?product_id=0');
      expect(response.status).toBe(404);
    });

    it('handles invalid GET requests', async () => {
      const response = await request(api)
        .get('/reviews/meta?product=a');
      expect(response.status).toBe(400);
    });
  });

  describe('/reviews route', () => {
    //
    it('handles valid GET requests for valid products', async () => {
      const response = await request(api)
        .get('/reviews/?product_id=2&sort=relevant&page=1&count=1000');
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBe(5);
    });

    it('handles valid GET requests for invalid products', async () => {
      const response = await request(api)
        .get('/reviews/?product_id=0&sort=relevant&page=1&count=1000');
      expect(response.status).toBe(404);
    });
    //
    // *** This test will pass after metadata is generated for products without reviews ***
    //
    // it('handles valid GET requests for products with no reviews', async () => {
    //   const response = await request(api)
    //     .get('/reviews/?product_id=3&sort=relevant&page=1&count=1000');
    //   expect(response.status).toBe(200);
    //   expect(response.body.results.length).toBe(0);
    // });

    it('handles invalid GET requests', async () => {
      const response = await request(api)
        .get('/reviews/?product_id=a&sort=relevant&page=1&count=1000');
      expect(response.status).toBe(400);
    });

    // it('handles valid POST requests for valid products', async () => {

    // });

    // it('handles valid POST requests for invalid products', async () => {

    // });

    // it('handles invalid POST requests', async () => {

    // });
  });

  describe('/reviews/:review_id/helpful route', () => {
    //
    it('handles valid PUT requests', async () => {
      const response = await request(api)
        .put('/reviews/3/helpful');
      expect(response.status).toBe(201);
      //
      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const collection = db.collection(reviewsCollectionName);
      await collection.updateOne(
        { review_id: 3 },
        { $inc: { helpfulness: -1 } },
      );
      await mongoClient.close();
    });

    it('handles valid PUT request for invalid review_id', async () => {
      const response = await request(api)
        .put('/reviews/0/helpful');
      expect(response.status).toBe(404);
    });

    it('handles invalid PUT requests', async () => {
      const response = await request(api)
        .put('/reviews/a/helpful');
      expect(response.status).toBe(400);
    });
  });

  describe('reviews/:review_id/report route', () => {
    //
    it('handles valid PUT requests', async () => {
      const response = await request(api)
        .put('/reviews/3/report');
      expect(response.status).toBe(201);
      //
      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const collection = db.collection(reviewsCollectionName);
      await collection.updateOne(
        { review_id: 3 },
        { $set: { reported: false } },
      );
      await mongoClient.close();
    });

    it('handles valid PUT request for invalid review_id', async () => {
      const response = await request(api)
        .put('/reviews/0/report');
      expect(response.status).toBe(404);
    });

    it('handles invalid PUT requests', async () => {
      const response = await request(api)
        .put('/reviews/a/report');
      expect(response.status).toBe(400);
    });
  });
});
