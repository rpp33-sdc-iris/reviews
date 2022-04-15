const request = require('supertest');
const { api } = require('../server/server');

describe('Reviews API Server', () => {
  //
  describe.only('/reviews/meta route', () => {
    //
    it('handles valid GET requests', async () => {
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

    it('handles invalid GET requests', async () => {

    });
  });

  describe('/reviews route', () => {
    //
    it('handles valid GET requests', async () => {

    });

    it('handles invalid GET requests', async () => {

    });

    it('handles valid POST requests', async () => {

    });

    it('handles invalid POST requests', async () => {

    });
  });

  describe('/reviews/:review_id/helpful route', () => {
    //
    it('handles valid PUT requests', async () => {

    });

    it('handles invalid PUT requests', async () => {

    });
  });

  describe('reviews/:review_id/report route', () => {
    //
    it('handles valid PUT requests', async () => {

    });

    it('handles invalid PUT requests', async () => {

    });
  });
});
