const express = require('express');
const { db } = require('../database/database');
const { getProductMetadata } = require('../database/database');
const { getReviews } = require('../database/database');
const { markReviewHelpful } = require('../database/database');
const { markReviewReported } = require('../database/database');
const { postReview } = require('../database/database');

const api = express();
api.use(express.urlencoded());
const port = 3000;

api.get('/reviews/', (req, res) => {
  // product_id value NOT trusted
  const productId = req.query.product_id;
  const { sort } = req.body;
  // const page = req.body.page;    // always equal to 1
  // const count = req.body.count;  // always equal to 1000
  getReviews(productId, sort)
    .then((result) => {
      if (result === 0) {
        res.status(404).send();
      } else {
        res.status(200).json({
          product_id: productId,
          page: 1,
          count: 1000,
          results: [result],
        });
      }
    });
  //
});

api.get('/reviews/meta/', (req, res) => {
  // product_id value NOT trusted
  const productId = req.query.product_id;
  getProductMetadata(productId)
    .then((result) => {
      if (result === 0) {
        res.status(404).send();
      } else {
        res.status(200).json(result);
      }
    });
  //
});

api.post('/reviews/', (req, res) => {
  // req.body values NOT trusted
  postReview(req.body)
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
  markReviewHelpful(reviewId)
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
  markReviewReported(reviewId)
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

module.exports.db = db;
