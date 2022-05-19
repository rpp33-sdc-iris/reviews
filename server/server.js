// require('newrelic');
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

const productIdOffset = Number(process.env.PRODUCTID_OFFSET);
const loaderIOTesting = process.env.LOADERIO_TESTING;
const port = 8080;

let reviewCount;
let firstCountDone = false;

const api = express();
api.use(express.urlencoded());
api.use(express.json());

if (loaderIOTesting) {
  api.get('/loaderio-336a757fc1c9f09ea6e8ee062f03a993', (req, res) => {
    res.sendFile(path.join(__dirname, 'loaderio.txt'));
  });

  api.get('/loaderio-336a757fc1c9f09ea6e8ee062f03a993.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'loaderio.txt'));
  });

  api.get('/loaderio-336a757fc1c9f09ea6e8ee062f03a993.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'loaderio.txt'));
  });
}

api.get('/reviews', (req, res) => {
  // product_id, sort, page, and count values NOT trusted
  // page always equal to 1 & count always equal to 1000
  let err;
  const productId = Number(req.query.product_id) - productIdOffset;
  if (Number.isNaN(productId)) {
    res.status(400).send();
  } else {
    const { sort } = req.query;
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
  }
});

api.get('/reviews/meta/', (req, res) => {
  // product_id value NOT trusted
  let err;
  let productId = Number(req.query.product_id);
  if (Number.isNaN(productId)) {
    res.status(400).send();
  } else {
    productId -= productIdOffset;
    getProductMetadata(productId)
      .catch(() => {
        console.log('Error retrieving product metadata');
        err = 500;
      })
      .then((productMetadata) => {
        if (err === 500) {
          res.status(500).send();
        } else if (productMetadata === null) {
          res.status(404).send();
        } else {
          const modifiedProductMetadata = productMetadata;
          modifiedProductMetadata.product_id += productIdOffset;
          res.status(200).json(modifiedProductMetadata);
        }
      });
  }
  //
});

api.post('/reviews/', (req, res) => {
  // req.body values NOT trusted
  req.body.product_id -= productIdOffset;
  let err;

  if (!firstCountDone) {
    countReviews()
      .then((count) => {
        const nextReviewId = count + 1;
        postReview(req.body, nextReviewId)
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
  } else {
    reviewCount += 1;
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
  }
});

api.put('/reviews/:review_id/helpful', (req, res) => {
  // review_id value NOT trusted
  let err;
  const reviewId = Number(req.params.review_id);
  if (Number.isNaN(reviewId)) {
    res.status(400).send();
  } else {
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
  }
});

api.put('/reviews/:review_id/report', (req, res) => {
  let err;
  const reviewId = Number(req.params.review_id);
  if (Number.isNaN(reviewId)) {
    res.status(400).send();
  } else {
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
  }
});

const startServer = async () => {
  let countingError = false;
  //
  try {
    api.listen(port, () => {
      console.log(`Listening for requests on port ${port}`);
    });
    try {
      reviewCount = await countReviews();
    } catch (error) {
      countingError = true;
    } finally {
      if (!countingError) {
        firstCountDone = true;
      }
    }
    console.log(`There are ${reviewCount} reviews`);
  } catch (error) {
    console.log('Could not count reviews');
    process.exit();
  }
};

startServer();

module.exports.api = api;
