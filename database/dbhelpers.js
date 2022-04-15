const { connectToDatabase } = require('./database');

const url = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const reviewsCollectionName = process.env.REVIEWS_COLLECTION_NAME;
const productMetadataCollectionName = process.env.PRODUCTMETADATA_COLLECTION_NAME;

const getProductMetadata = async (productId) => {
  let mongoClient;

  try {
    mongoClient = await connectToDatabase(url);
    const db = mongoClient.db(dbName);
    const collection = db.collection(productMetadataCollectionName);
    const productMetadata = await collection.findOne({ product_id: productId });
    return productMetadata;
  } finally {
    await mongoClient.close();
  }
};

const getReviews = async (productId, sort) => {
  let mongoClient;
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
    mongoClient = await connectToDatabase(url);
    const db = mongoClient.db(dbName);
    const collection = db.collection(reviewsCollectionName);
    const reviews = await collection.aggregate([
      {
        $match: {
          product_id: productId,
          reported: false,
        },
      }, {
        $project: {
          reported: 0,
          reviewer_email: 0,
        },
      }, {
        $sort: sortBy,
      }, {
        $limit: 1000,
      },
    ], {
      allowDiskUse: true,
    });
    return reviews.toArray();
  } finally {
    await mongoClient.close();
  }
};

const markReviewHelpful = async (reviewId) => {
  let mongoClient;

  try {
    mongoClient = await connectToDatabase(url);
    const db = mongoClient.db(dbName);
    const collection = db.collection(reviewsCollectionName);
    await collection.updateOne(
      { review_id: reviewId },
      { $inc: { helpfulness: 1 } },
    );
  } finally {
    await mongoClient.close();
  }
};

const markReviewReported = async (reviewId) => {
  let mongoClient;

  try {
    mongoClient = await connectToDatabase(url);
    const db = mongoClient.db(dbName);
    const collection = db.collection(reviewsCollectionName);
    await collection.updateOne(
      { review_id: reviewId },
      { $set: { reported: true } },
    );
  } finally {
    await mongoClient.close();
  }
};

const postReview = async (review) => {
  let mongoClient;

  const newReview = review;

  try {
    mongoClient = await connectToDatabase(url);
    const db = mongoClient.db(dbName);
    const reviewsCollection = db.collection(reviewsCollectionName);
    const productMetadataCollection = db.collection(productMetadataCollectionName);

    const result = await reviewsCollection.countDocuments();
    const nextReviewId = result + 1;

    let metadata = await getProductMetadata(review.product_id);

    const metaCharacteristicKeys = Object.keys(metadata.characteristics);
    const metaCharacteristicValues = Object.values(metadata.characteristics);
    const reviewCharacteristicKeys = Object.keys(newReview.characteristics);
    const reviewCharValues = Object.values(newReview.characteristics);

    for (let i = 0; i < metaCharacteristicKeys.length; i += 1) {
      for (let j = 0; j < reviewCharacteristicKeys.length; j += 1) {
        if (Number(reviewCharacteristicKeys[j]) === metaCharacteristicValues[i].id) {
          newReview.characteristics[metaCharacteristicKeys[i]] = { value: reviewCharValues[j] };
          delete newReview.characteristics[reviewCharacteristicKeys[j]];
        }
      }
    }

    await reviewsCollection.insertOne({
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
      characteristics: review.characteristics,
    });

    const numRs = await reviewsCollection.countDocuments({ product_id: review.product_id });
    delete metadata._id;

    if (review.rating === 1) {
      metadata.ratings['1'] = (Number(metadata.ratings['1']) + 1).toString();
    } else if (review.rating === 2) {
      metadata.ratings['2'] = (Number(metadata.ratings['2']) + 1).toString();
    } else if (review.rating === 3) {
      metadata.ratings['3'] = (Number(metadata.ratings['3']) + 1).toString();
    } else if (review.rating === 4) {
      metadata.ratings['4'] = (Number(metadata.ratings['4']) + 1).toString();
    } else {
      metadata.ratings['5'] = (Number(metadata.ratings['5']) + 1).toString();
    }

    if (review.recommend) {
      metadata.recommended.true = (Number(metadata.recommended.true) + 1).toString();
    } else {
      metadata.recommended.false = (Number(metadata.recommended.false) + 1).toString();
    }

    const rC = review.characteristics;
    const mO = metadata.characteristics;
    const mK = Object.keys(mO);
    const metaChars = Object.values(mO);
    for (let i = 0; i < mK.length; i += 1) {
      mO[mK[i]].value = ((Number(metaChars[i].value) * (numRs - 1)) + rC[mK[i]].value) / numRs;
      mO[mK[i]].value = mO[mK[i]].value.toString();
    }
    await productMetadataCollection.replaceOne({ product_id: review.product_id }, metadata);
  } finally {
    mongoClient.close();
  }
};

module.exports.getProductMetadata = getProductMetadata;
module.exports.getReviews = getReviews;
module.exports.markReviewHelpful = markReviewHelpful;
module.exports.markReviewReported = markReviewReported;
module.exports.postReview = postReview;
