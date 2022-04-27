const { config } = require('dotenv');
const express = require('express');
const path = require('path');

config();

const { countReviews } = require('../database/helpers');
const { getProductMetadata } = require('../database/helpers');
const { getReviews } = require('../database/helpers');
const { markReviewHelpful } = require('../database/helpers');
const { markReviewReported } = require('../database/helpers');
const { postReview } = require('../database/helpers');

const productIdOffset = process.env.PRODUCTID_OFFSET;
const loaderIOTesting = process.env.LOADERIO_TESTING;
const port = 8080;
let reviewCount;

const api = express();
api.use(express.urlencoded());
api.use(express.json());

if (loaderIOTesting) {
  api.use(express.static('/loaderio'));

  api.get('/loaderio-0cfe93f953c4641ac7b1ac282291d46e', (req, res) => {
    res.sendFile(path.join(__dirname, 'loaderio-0cfe93f953c4641ac7b1ac282291d46e.txt'));
  });

  api.get('/loaderio-0cfe93f953c4641ac7b1ac282291d46e.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'loaderio-0cfe93f953c4641ac7b1ac282291d46e.txt'));
  });

  api.get('/loaderio-0cfe93f953c4641ac7b1ac282291d46e.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'loaderio-0cfe93f953c4641ac7b1ac282291d46e.txt'));
  });
}

api.get('/reviews', (req, res) => {
  // product_id, sort, page, and count values NOT trusted
  let err;
  const productId = Number(req.query.product_id) - productIdOffset;
  const { sort } = req.query;
  // page always equal to 1 & count always equal to 1000
  getReviews(productId, sort)
    .catch(() => {
      console.log('Error retrieving reviews');
      err = 500;
    })
    .then((reviews) => {
      if (err === 500) {
        res.status(500).send();
      } else {
        res.status(200).json({
          product_id: productId + productIdOffset,
          page: 1,
          count: 1000,
          results: reviews,
        });
      }
    });
});

api.get('/reviews/meta/', (req, res) => {
  // product_id value NOT trusted
  let err;
  const productId = Number(req.query.product_id) - productIdOffset;
  getProductMetadata(productId)
    .catch(() => {
      console.log('Error retrieving product metadata');
      err = 500;
    })
    .then((productMetadata) => {
      if (err === 500) {
        res.status(500).send();
      } else {
        const modifiedProductMetadata = productMetadata;
        modifiedProductMetadata.product_id += productIdOffset;
        res.status(200).json(modifiedProductMetadata);
      }
    });
  //
});

api.post('/reviews/', (req, res) => {
  // req.body values NOT trusted
  let err;
  reviewCount += 1;
  req.body.product_id -= productIdOffset;
  postReview(req.body, reviewCount)
    .catch((error) => {
      console.log('Error posting new review: ', error);
      err = 500;
    })
    .then(() => {
      if (err === 500) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

api.put('/reviews/:review_id/helpful', (req, res) => {
  // review_id value NOT trusted
  let err;
  const reviewId = Number(req.params.review_id);
  markReviewHelpful(reviewId)
    .catch(() => {
      console.log('Error marking review helpful');
      err = 500;
    })
    .then(() => {
      if (err === 500) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

api.put('/reviews/:review_id/report', (req, res) => {
  let err;
  const reviewId = Number(req.params.review_id);
  markReviewReported(reviewId)
    .catch(() => {
      console.log('Error marking review reported');
      err = 500;
    })
    .then(() => {
      if (err === 500) {
        res.status(500).send();
      } else {
        res.status(201).send();
      }
    });
});

const startServer = async () => {
  try {
    reviewCount = await countReviews();
    api.listen(port, () => {
      console.log(`There are ${reviewCount} reviews. Listening for requests on port ${port}`);
    });
  } catch (error) {
    console.log('Could not count reviews');
    process.exit();
  }
};

startServer();

module.exports.api = api;
