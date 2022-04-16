const { config } = require('dotenv');
const express = require('express');

config();

const { getProductMetadata } = require('../database/dbhelpers');
const { getReviews } = require('../database/dbhelpers');
const { markReviewHelpful } = require('../database/dbhelpers');
const { markReviewReported } = require('../database/dbhelpers');
const { postReview } = require('../database/dbhelpers');

const api = express();
api.use(express.urlencoded());
const port = 8080;

api.get('/reviews', (req, res) => {
  // product_id, sort, page, and count values NOT trusted
  let err;
  const productId = Number(req.query.product_id); // - 64619
  const { sort } = req.query; // page always equal to 1 & count always equal to 1000
  const page = Number(req.query.page);
  const count = Number(req.query.count);

  const sortOptions = ['relevant', 'newest', 'helpfulness'];
  // Check query parameters
  if (productId === undefined || Number.isNaN(productId)) {
    res.status(400).send();
    return;
  }
  if (!sortOptions.includes(sort)) {
    res.status(400).send();
    return;
  }
  if (page === undefined || Number.isNaN(page)) {
    res.status(400).send();
    return;
  }
  if (count === undefined || Number.isNaN(count)) {
    res.status(400).send();
    return;
  }

  getReviews(productId, sort)
    .catch((error) => {
      console.log('Error retrieving reviews:', error);
      if (error.message === 'Invalid product_id') {
        err = 404;
      } else {
        err = 500;
      }
    })
    .then((reviews) => {
      if (err === 404) {
        res.status(404).send();
      } else if (err === 500) {
        res.status(500).send();
      } else {
        res.status(200).json({
          product_id: productId, // + 64619
          page,
          count,
          results: reviews,
        });
      }
    });
});

api.get('/reviews/meta/', (req, res) => {
  // product_id value NOT trusted
  let err;
  const productId = Number(req.query.product_id);

  if (productId === undefined || Number.isNaN(productId)) {
    res.status(400).send();
    return;
  }
  //
  getProductMetadata(productId)
    .catch((error) => {
      console.log('Error retrieving product metadata:', error);
      if (error.message === 'Invalid product_id') {
        err = 404;
      } else {
        err = 500;
      }
    })
    .then((productMetadata) => {
      if (err === 404) {
        res.status(404).send();
      } else if (err === 500) {
        res.status(500).send();
      } else {
        const modifiedProductMetadata = productMetadata;
        // modifiedProductMetadata.product_id += 64619;
        res.status(200).json(modifiedProductMetadata);
      }
    });
  //
});

api.post('/reviews/', (req, res) => {
  let err;
  // req.body values NOT trusted
  postReview(req.body)
    .catch((error) => {
      if (error.message === 'Invalid product_id') {
        err = 404;
      } else {
        err = 500;
      }
    })
    .then(() => {
      if (err === 404) {
        res.status(404).send();
      } else if (err === 500) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

api.put('/reviews/:review_id/helpful', (req, res) => {
  let err;
  const reviewId = Number(req.params.review_id);
  if (Number.isNaN(reviewId)) {
    res.status(400).send();
    return;
  }
  markReviewHelpful(reviewId)
    .catch((error) => {
      console.log('Error marking review helpful:', error);
      if (error.message === 'Review does not exist') {
        err = 404;
      } else {
        err = 500;
      }
    })
    .then(() => {
      if (err === 404) {
        res.status(404).send();
      } else if (err === 500) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

api.put('/reviews/:review_id/report', (req, res) => {
  let err;
  const reviewId = Number(req.params.review_id);
  if (Number.isNaN(reviewId)) {
    res.status(400).send();
    return;
  }
  markReviewReported(reviewId)
    .catch((error) => {
      console.log('Error marking review reported:', error);
      if (error.message === 'Review does not exist') {
        err = 404;
      } else {
        err = 500;
      }
    })
    .then(() => {
      if (err === 404) {
        res.status(404).send();
      } else if (err === 500) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

const server = api.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports.api = api;
module.exports.server = server;
