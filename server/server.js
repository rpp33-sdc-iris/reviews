const express = require('express');

const api = express();
api.use(express.urlencoded());
const port = 3000;

api.get('/reviews/', (req, res) => {
  // product_id value NOT trusted
  const productId = req.query.product_id;
  const page = req.body.page;
  const count = req.body.count;
  const sort = req.body.sort;
  //
});

api.get('/reviews/meta/', (req, res) => {
  // product_id value NOT trusted
  const productId = req.query.product_id;
  //
});

api.post('/reviews/', (req, res) => {
  // req.body values NOT trusted
  //
});

api.put('reviews/:review_id/helpful', (req, res) => {
  //
  const reviewId = req.params.review_id;
});

api.put('reviews/:review_id/report', (req, res) => {
  //
  const reviewId = req.params.review_id;
});


api.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
