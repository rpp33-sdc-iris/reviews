// const { MongoClient } = require('mongodb');

// const url = 'mongodb://localhost:27017';
// const client = new MongoClient(url);
// const dbName = 'reviews_test';

// let db;

// const connect = async () => {
//   try {
//     await client.connect();
//     console.log('Connected to database');
//     db = client.db(dbName);
//     module.exports = db;
//   } catch (error) {
//     console.log('Error connecting to database');
//   }
// };

// connect();

const getProductMetadata = async (dbase, collection, productId) => {
  try {
    const productMetadata = await dbase.collection(collection).findOne({ product_id: productId });
    return productMetadata;
  } catch (error) {
    console.log('Error retrieving product metadata', error);
    return 0;
  }
};

const getReviews = async (db, collection, productId, sort) => {
  let sortBy;
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
    const reviewsCol = db.collection(collection);
    const reviews = await reviewsCol.aggregate([
      {
        $match: {
          product_id: productId,
          reported: false,
        },
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

const markReviewHelpful = async (db, collection, reviewId) => {
  try {
    await db.collection(collection).updateOne(
      { review_id: reviewId },
      { $inc: { helpfulness: 1 } },
    );
    return 1;
  } catch (error) {
    console.log('Error marking review helpful', error);
    return 0;
  }
};

const markReviewReported = async (db, collection, reviewId) => {
  try {
    await db.collection(collection).updateOne(
      { review_id: reviewId },
      { $set: { reported: true } },
    );
    return 1;
  } catch (error) {
    console.log('Error marking review reported', error);
    return 0;
  }
};

const postReview = async (db, reviewsCol, productMetadataCol, review) => {
  //
  let nextReviewId; // also equal to number of reviews
  let metadata;
  //
  try {
    const result = await db.collection(reviewsCol).countDocuments();
    nextReviewId = result + 1;
  } catch (error) {
    console.log('Error counting number of reviews', error);
    return 0;
  }
  // Build a new object in the form of characteristics: { characteristic: { value: # } }
  try {
    metadata = await db.collection(productMetadataCol).findOne({ product_id: review.product_id });

    for (let metaCharacteristic in metadata.characteristics) {
      for (let characteristicId in review.characteristics) {
        if (characteristicId === metadata.characteristics[metaCharacteristic].id) {
          metadata.characteristics[metaCharacteristic].value = review.characteristics[characteristicId];
          delete metadata.characteristics[metaCharacteristic].id;
        }
      }
    }
  } catch (error) {
    console.log('Error building characteristics property', error);
  }

  try {
    await db.collection(reviewsCol).insertOne({
      product_id: review.product_id,
      rating: review.rating,
      date: { $date: new Date().toISOString() },
      summary: review.summary,
      body: review.body,
      recommend: review.recommend,
      reported: false,
      reviewer_name: review.name,
      reviewer_email: review.email,
      response: null,
      helpfulness: 0,
      photos: review.photos.map((uri) => ({ url: uri })),
      review_id: nextReviewId,
      characteristics: metadata.characteristics,
    });
    return 1;
  } catch (error) {
    console.log('Erroring adding new review', error);
    return 0;
  }
  /*
  try {
    await db.collection('product_metadata').updateOne({
      product_id: review.product_id,
    }, [
      { $set: { [`ratings.${review.rating}`]: { $add: [1, `$ratings.${review.rating}`] } } },
      { $set: { [`${review.recommend}`]: { $add: [1, `$recommend.${review.recommend}`] } } },
      {
        $set: {
          characteristics: {
            $expr: {
              $arrayToObject: {
                $map: {
                  input: {
                    $objectToArray: '$characteristics',
                  },
                  in: {
                    $zip: [
                      ['$$this.0'],
                      [{
                        id: '$$this.1.id',
                        value: {
                          $toString: {
                            $divide: [
                              {
                                $sum: [
                                  {
                                    $multiply: [
                                      nextReviewId - 1,
                                      {
                                        $toInt: {
                                          $toDecimal: '$$this.value',
                                        },
                                      },
                                    ],
                                  },
                                  review.characteristics['$$this.1.id'],
                                ],
                              },
                              {
                                $sum: [
                                  nextReviewId,
                                  1,
                                ],
                              },
                            ],
                          },
                        },
                      }],
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ]);
    return 1;
  } catch (error) {
    console.log('Error updating product metadata', error);
    return 0;
  }
  */
};

// module.exports.client = client;
// module.exports.db = db;
module.exports.getProductMetadata = getProductMetadata;
module.exports.getReviews = getReviews;
module.exports.markReviewHelpful = markReviewHelpful;
module.exports.markReviewReported = markReviewReported;
module.exports.postReview = postReview;
