const express = require('express');
const { MongoClient } = require('mongodb');

const { getProductMetadata } = require('../database/helpers');
const { getReviews } = require('../database/helpers');
const { markReviewHelpful } = require('../database/helpers');
const { markReviewReported } = require('../database/helpers');
const { postReview } = require('../database/helpers');

const api = express();
api.use(express.urlencoded());
const port = 8080;

let connection;
let db;

const connectToDB = async () => {
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
};

connectToDB();

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
