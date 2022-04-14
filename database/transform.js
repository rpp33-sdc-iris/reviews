const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'reviews';

async function transform() {
  //
  await client.connect();
  //
  const db = client.db(dbName);
  const characteristicsCol = db.collection('characteristics');
  const characteristicsReviewsCol = db.collection('characteristics_reviews');
  const reviewsCol = db.collection('reviews');
  const reviewsPhotosCol = db.collection('reviews_photos');
  //
  try {
    await reviewsCol.aggregate(
      [
        {
          $addFields: {
            date: {
              $toDate: '$date',
            },
            response: {
              $cond: {
                if: {
                  $eq: [
                    'null', '$response',
                  ],
                },
                then: null,
                else: '$response',
              },
            },
            photos: [],
            review_id: '$id',
          },
        }, {
          $project: {
            id: 0,
          },
        }, {
          $out: 'reviews',
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error performing 1st reviews transformation', error);
  }
  //
  try {
    await reviewsPhotosCol.aggregate(
      [
        {
          $group: {
            _id: '$review_id',
            review_id: {
              $last: '$review_id',
            },
            photos: {
              $push: {
                url: '$url',
              },
            },
          },
        }, {
          $sort: {
            _id: 1,
          },
        }, {
          $out: 'reviews_photos',
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error performing 1st reviews_photos transformation', error);
  }
  //
  try {
    await reviewsCol.createIndex({ review_id: 1 }, { unique: true });
    await reviewsPhotosCol.createIndex({ review_id: 1 }, { unique: true });
  } catch (error) {
    console.log('Error creating review_id indexes on reviews and/or reviews_photos', error);
  }
  //
  try {
    await reviewsPhotosCol.aggregate(
      [
        {
          $project: {
            _id: 0,
          },
        }, {
          $merge: {
            into: 'reviews',
            on: 'review_id',
            whenMatched: 'merge',
          },
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error merging review_photos into reviews', error);
  }
  //
  try {
    await characteristicsCol.aggregate(
      [
        {
          $project: {
            product_id: 0,
          },
        }, {
          $project: {
            characteristic_id: '$id',
            name: '$name',
          },
        }, {
          $out: 'characteristics',
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error performing 1st characteristics transformation', error);
  }
  //
  try {
    await characteristicsReviewsCol.aggregate(
      [
        {
          $group: {
            _id: '$characteristic_id',
            reviews: {
              $push: {
                id: '$id',
                characteristic_id: '$characteristic_id',
                review_id: '$review_id',
                value: '$value',
              },
            },
          },
        }, {
          $out: 'characteristics_reviews',
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error performing 1st characteristics_reviews transformation', error);
  }
  //
  try {
    await characteristicsCol.createIndex({ characteristic_id: 1 }, { unique: true });
  } catch (error) {
    console.log('Error creating characteristic_id index on characteristics collection', error);
  }
  //
  try {
    await characteristicsCol.aggregate(
      [
        {
          $project: {
            _id: '$characteristic_id',
            name: '$name',
          },
        }, {
          $merge: {
            into: 'characteristics_reviews',
            on: '_id',
            whenMatched: 'merge',
          },
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error merging characteristics into characteristics_reviews', error);
  }
  //
  try {
    await characteristicsReviewsCol.aggregate(
      [
        {
          $project: {
            characteristic_id: 0,
          },
        }, {
          $unwind: {
            path: '$reviews',
            preserveNullAndEmptyArrays: true,
          },
        }, {
          $project: {
            characteristic_id: '$reviews.id',
            review_id: '$reviews.review_id',
            name: '$name',
            value: '$reviews.value',
          },
        }, {
          $project: {
            _id: 0,
          },
        }, {
          $group: {
            _id: '$review_id',
            characteristics: {
              $push: {
                name: '$name',
                value: '$value',
                id: '$characteristic_id',
              },
            },
          },
        }, {
          $project: {
            review_id: '$_id',
            characteristics: '$characteristics',
          },
        }, {
          $out: 'characteristics_reviews',
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error performing 2nd transformation of characteristics_reviews', error);
  }
  //
  try {
    await characteristicsReviewsCol.createIndex({ review_id: 1 }, { unique: true });
  } catch (error) {
    console.log('Error creating review_id index on characteristics_reviews', error);
  }
  //
  try {
    await characteristicsReviewsCol.aggregate(
      [
        {
          $project: {
            _id: 0,
          },
        }, {
          $merge: {
            into: 'reviews',
            on: 'review_id',
            whenMatched: 'merge',
          },
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error merging characteristics_reviews into reviews', error);
  }
  //
  try {
    await reviewsCol.aggregate(
      [
        {
          $addFields: {
            characteristics: {
              $arrayToObject: {
                $map: {
                  input: '$characteristics',
                  in: [
                    '$$this.name', {
                      $setField: {
                        field: 'name',
                        input: '$$this',
                        value: '$$REMOVE',
                      },
                    },
                  ],
                },
              },
            },
          },
        }, {
          $out: 'reviews',
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error performing 2nd transformation of reviews', error);
  }
  //
  try {
    await reviewsCol.aggregate(
      [
        {
          $group: {
            _id: '$product_id',
            rating_1: {
              $sum: {
                $cond: {
                  if: {
                    $eq: [
                      1, '$rating',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            rating_2: {
              $sum: {
                $cond: {
                  if: {
                    $eq: [
                      2, '$rating',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            rating_3: {
              $sum: {
                $cond: {
                  if: {
                    $eq: [
                      3, '$rating',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            rating_4: {
              $sum: {
                $cond: {
                  if: {
                    $eq: [
                      4, '$rating',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            rating_5: {
              $sum: {
                $cond: {
                  if: {
                    $eq: [
                      5, '$rating',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            recommend_true: {
              $sum: {
                $cond: {
                  if: {
                    $eq: [
                      true, '$recommend',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            recommend_false: {
              $sum: {
                $cond: {
                  if: {
                    $eq: [
                      false, '$recommend',
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
            fit_id: {
              $first: '$characteristics.Fit.id',
            },
            fit: {
              $avg: '$characteristics.Fit.value',
            },
            comfort_id: {
              $first: '$characteristics.Comfort.id',
            },
            comfort: {
              $avg: '$characteristics.Comfort.value',
            },
            length_id: {
              $first: '$characteristics.Length.id',
            },
            length: {
              $avg: '$characteristics.Length.value',
            },
            quality_id: {
              $first: '$characteristics.Quality.id',
            },
            quality: {
              $avg: '$characteristics.Quality.value',
            },
            size_id: {
              $first: '$characteristics.Size.id',
            },
            size: {
              $avg: '$characteristics.Size.value',
            },
            width_id: {
              $first: '$characteristics.Width.id',
            },
            width: {
              $avg: '$characteristics.Width.value',
            },
          },
        }, {
          $addFields: {
            product_id: '$_id',
            ratings: {
              1: '$rating_1',
              2: '$rating_2',
              3: '$rating_3',
              4: '$rating_4',
              5: '$rating_5',
            },
            recommended: {
              true: '$recommend_true',
              false: '$recommend_false',
            },
            characteristics: {
              fit: {
                $cond: {
                  if: {
                    $eq: [
                      null, '$fit',
                    ],
                  },
                  then: '$$REMOVE',
                  else: {
                    id: '$fit_id',
                    value: {
                      $toString: '$fit',
                    },
                  },
                },
              },
              length: {
                $cond: {
                  if: {
                    $eq: [
                      null, '$length',
                    ],
                  },
                  then: '$$REMOVE',
                  else: {
                    id: '$length_id',
                    value: {
                      $toString: '$length',
                    },
                  },
                },
              },
              comfort: {
                $cond: {
                  if: {
                    $eq: [
                      null, '$comfort',
                    ],
                  },
                  then: '$$REMOVE',
                  else: {
                    id: '$comfort_id',
                    value: {
                      $toString: '$comfort',
                    },
                  },
                },
              },
              qualilty: {
                $cond: {
                  if: {
                    $eq: [
                      null, '$quality',
                    ],
                  },
                  then: '$$REMOVE',
                  else: {
                    id: '$quality_id',
                    value: {
                      $toString: '$quality',
                    },
                  },
                },
              },
              size: {
                $cond: {
                  if: {
                    $eq: [
                      null, '$size',
                    ],
                  },
                  then: '$$REMOVE',
                  else: {
                    id: '$size_id',
                    value: {
                      $toString: '$size',
                    },
                  },
                },
              },
              width: {
                $cond: {
                  if: {
                    $eq: [
                      null, '$width',
                    ],
                  },
                  then: '$$REMOVE',
                  else: {
                    id: '$width_id',
                    value: {
                      $toString: '$width',
                    },
                  },
                },
              },
            },
          },
        }, {
          $project: {
            _id: 1,
            product_id: 1,
            ratings: 1,
            recommended: 1,
            characteristics: 1,
          },
        }, {
          $out: 'product_metadata',
        },
      ],
      {
        allowDiskUse: true,
      },
    );
  } catch (error) {
    console.log('Error transforming reviews into product_metadata', error);
  }
  //
  const productMetadataCol = db.collection('product_metadata');
  try {
    await reviewsCol.createIndex({ product_id: 1 }, { unique: true });
    await productMetadataCol.createIndex({ product_id: 1 }, { unique: true });
  } catch (error) {
    console.log('Error creating product_id indexes on reviews and/or product_metadata', error);
  }
}

transform()
  .then(() => {
    console.log('Transformation complete unless error indicated below');
  })
  .catch((error) => {
    console.log('Error performing data transformation', error);
  })
  .finally(() => {
    client.close();
  });

var pipeline = {
  $addFields: {
    characteristics: {
      $map: {
        input: '$chars'
        // return [ field ("Fit"), value (object) ]
        in: {
          $zip: [
            [ '$$this.name' ],
            [ {
              id: '$$this.id',
              value: `$characteristics[${'$$this.name'}].value`
            } ]
          ]
        }
      }
    }
  },
  $addFields: {
    characteristics: {
      $arrayToObject: {
        '$characteristics' // [ [ field ("Fit"), value ( { id: #, value: string } )], etc.... ]
      }
    }
  }
}