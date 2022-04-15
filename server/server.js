const express = require('express');

const { getProductMetadata } = require('../database/dbhelpers');
const { getReviews } = require('../database/dbhelpers');
const { markReviewHelpful } = require('../database/dbhelpers');
const { markReviewReported } = require('../database/dbhelpers');
const { postReview } = require('../database/dbhelpers');

const api = express();
api.use(express.urlencoded());
const port = 8080;

api.get('/reviews/', (req, res) => {
  // product_id value NOT trusted
  const productId = Number(req.query.product_id);
  const { sort } = req.body;
  // const page = req.body.page;    // always equal to 1
  // const count = req.body.count;  // always equal to 1000
  getReviews(db, 'reviews_test', productId, sort)
    .then((result) => {
      if (result === 0) {
        res.status(404).send();
      } else {
        res.status(200).json({
          product_id: productId + 64619,
          page: 1,
          count: 1000,
          results: result,
        });
      }
    });
  //
});

api.get('/reviews/meta/', (req, res) => {
  // product_id value NOT trusted
  const productId = Number(req.query.product_id);
  getProductMetadata(db, 'product_metadata_test', productId)
    .then((result) => {
      if (result === 0) {
        res.status(404).send();
      } else {
        const metadata = result;
        metadata.product_id += 64619;
        res.status(200).json(metadata);
      }
    });
  //
});

api.post('/reviews/', (req, res) => {
  // req.body values NOT trusted
  postReview(db, 'reviews_test', 'product_metadata_test', req.body)
    .then((result) => {
      if (result === 0) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

api.put('reviews/:review_id/helpful', (req, res) => {
  const reviewId = req.params.review_id;
  markReviewHelpful(db, 'reviews_test', reviewId)
    .then((result) => {
      if (result === 0) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

api.put('reviews/:review_id/report', (req, res) => {
  const reviewId = req.params.review_id;
  markReviewReported(db, 'reviews_test', reviewId)
    .then((result) => {
      if (result === 0) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

api.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports.api = api;
