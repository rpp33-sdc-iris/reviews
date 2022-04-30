const request = require('supertest');
const { connectToDatabase } = require('../database/connect');
const { getReviews } = require('../database/helpers');
const { api } = require('../server/server');

const dbURL = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const reviewsCollectionName = process.env.REVIEWS_COLLECTION_NAME;

jest.setTimeout(15000);

describe('Reviews API Server', () => {
  //
  describe('/reviews/meta route', () => {
    //
    it('handles a GET request for a valid product_id', async () => {
      const response = await request(api)
        .get('/reviews/meta?product_id=1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ratings');
    });

    it('handles a GET request for non-existent product_id', async () => {
      const response = await request(api)
        .get('/reviews/meta?product_id=0');
      expect(response.status).toBe(404);
    });

    it('handles a GET request for an invalid product_id', async () => {
      const response = await request(api)
        .get('/reviews/meta?product=a');
      expect(response.status).toBe(400);
    });
  });

  describe('/reviews route', () => {
    //
    it('handles a GET request for a valid product_id', async () => {
      const response = await request(api)
        .get('/reviews/?product_id=1&sort=relevant&page=1&count=1000');
      expect(response.status).toBe(200);
      expect(response.body.results[0].product_id).toBe(1);
    });

    it('handles a GET request for a non-existent product_id', async () => {
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

    it('handles a GET request for an invalid product_id', async () => {
      const response = await request(api)
        .get('/reviews/?product_id=a&sort=relevant&page=1&count=1000');
      expect(response.status).toBe(400);
    });

    it('handles a POST request for a valid product_id', async () => {
      const reviews = await getReviews(1, 'relevant');
      //
      const newReview = {
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
      const response = await request(api)
        .post('/reviews/?product_id=1')
        .send(newReview);
      expect(response.status).toBe(201);
      const reviewsAfter = await getReviews(1, 'relevant');
      expect(reviewsAfter.length).toBe(reviews.length + 1);
      //
      const reviewId = reviewsAfter[reviewsAfter.length - 1].review_id;
      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const collection = db.collection(reviewsCollectionName);
      await collection.deleteOne({ review_id: reviewId });
      await mongoClient.close();
    });
  });

  describe('/reviews/:review_id/helpful route', () => {
    //
    it('handles a PUT request for a valid review_id', async () => {
      const response = await request(api)
        .put('/reviews/1/helpful');
      expect(response.status).toBe(201);
      //
      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const collection = db.collection(reviewsCollectionName);
      await collection.updateOne(
        { review_id: 1 },
        { $inc: { helpfulness: -1 } },
      );
      await mongoClient.close();
    });

    it('handles a PUT request for an invalid review_id', async () => {
      const response = await request(api)
        .put('/reviews/a/helpful');
      expect(response.status).toBe(400);
    });
  });

  describe('reviews/:review_id/report route', () => {
    //
    it('handles a PUT request for a valid review_id', async () => {
      const response = await request(api)
        .put('/reviews/1/report');
      expect(response.status).toBe(201);
      //
      const mongoClient = await connectToDatabase(dbURL);
      const db = mongoClient.db(dbName);
      const collection = db.collection(reviewsCollectionName);
      await collection.updateOne(
        { review_id: 1 },
        { $set: { reported: false } },
      );
      await mongoClient.close();
    });

    it('handles a PUT request for an invalid review_id', async () => {
      const response = await request(api)
        .put('/reviews/a/report');
      expect(response.status).toBe(400);
    });
  });
});
