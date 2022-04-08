const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'reviews_test';

let db;
let sortBy;
let nextReviewId;


const connect = async () => {
  try {
    await client.connect();
    console.log('Connected to database');
    db = client.db(dbName);
    module.exports = db;
  } catch (error) {
    console.log('Error connecting to database');
  }
};
//
const getReviews = async (productId, sort) => {
  //
  if (sort === 'relevant') {
    sortBy = { helpfulness: -1, date: -1 };
  } else if (sort === 'newest') {
    sortBy = { date: -1 };
  } else {
    sortBy = { helpfulness: -1 };
  }
  //
  try {
    const reviews = await db.reviews.aggregate([
      {
        $match: { product_id: productId },
      }, {
        $sort: sortBy,
      }, {
        $limit: 1000,
      },
    ], {
      allowDiskUse: true,
    });
    return reviews;
  } catch (error) {
    console.log('Error retrieving reviews', error);
    return 0;
  }
};

const getProductMetadata = async (productId) => {
  try {
    const productMetadata = await db.product_metadata.find({ product_id: productId });
    return productMetadata;
  } catch (error) {
    console.log('Error retrieving product metadata', error);
    return 0;
  }
};

const addReview = async (review) => {
  try {
    await db.collection('reviews').insertOne({
      product_id: review.product_id,
      rating: review.rating,
      date: { '$date': new Date().toISOString() },
      summary: review.summary,
      body: review.body,
      recommend: review.recommend,
      reported: false,
      reviewer_name: review.name,
      reviewer_email: review.email,
      response: null,
      helpfulness: 0,
      photos: review.photos,
      review_id: nextReviewId,
      characteristics: review.characteristics
    });
    nextReviewId += 1;
  } catch (error) {
    console.log('Erroring adding new review', error);
    return 0;
  }
  // Recalculate metadata
  let recommend = review.recommend ? true : false;
  //
  try {
    let reviewCount = await db.reviews.aggregate(
      [
        { $match: { product_id: review.product_id } },
        { $count: 'count' }
      ], {
        allowDiskUse: true
      }
    );
    await db.collection('product_metadata').updateOne(
      {
        product_id: review.product_id
      }, [
        { $set: { `ratings.${review.rating}`: { $add: [1, `$ratings.${review.rating}`] } } },
        { $set: { `${recommend}`: { $add: [1, `$recommend.${recommend}`] } } },
        { $set: {
          characteristics: {
            $expr: {
              $arrayToObject: {
                $map: {
                  input: {
                    $objectToArray: '$characteristics'
                  },
                  in: {
                    $zip: [
                      [ '$$this.0' ],
                      [ {
                        id: "$$this.1.id",
                        value: {
                          $toString: {
                            $divide: [
                              { $sum: [
                                { $multiply: [
                                  reviewCount,
                                  { $toInt: {
                                    $toDecimal: '$$this.value'
                                  } }
                                ] },
                                review.characteristics['$$this.1.id']
                              ] },
                              { $sum: [
                                reviewCount,
                                1
                              ] }
                            ]
                          }
                        }
                      } ]
                    ]
                  }
                }
              }
            }
          }
        } }
     ]
    );
    return 1;
  } catch (error) {
    console.log('Error updating product metadata', error);
    return 0;
  }
};

const markReviewHelpful = async (reviewId) => {
  try {
    await db.reviews('reviews').updateOne(
      { review_id: reviewId },
      { $inc: { helpfulness: 1 } },
    );
    return 1;
  } catch (error) {
    console.log('Error marking review helpful', error);
    return 0;
  }
};

const markReviewReported = async (reviewId) => {
  try {
    await db.reviews('reviews').updateOne(
      { review_id: reviewId },
      { $set: { reported: true } },
    );
    return 1;
  } catch (error) {
    console.log('Error marking review reported', error);
    return 0;
  }
};
