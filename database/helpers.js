const { connectToDatabase } = require('./connect');

const dbURL = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const reviewsCollectionName = process.env.REVIEWS_COLLECTION_NAME;
const productMetadataCollectionName = process.env.PRODUCTMETADATA_COLLECTION_NAME;

const countReviews = async () => {
  let mongoClient;
  try {
    mongoClient = await connectToDatabase(dbURL);
    const db = mongoClient.db(dbName);
    const reviewsCollection = db.collection(reviewsCollectionName);
    const count = await reviewsCollection.countDocuments();
    return count;
  } finally {
    await mongoClient.close();
  }
};

const getProductMetadata = async (productId) => {
  let mongoClient;

  try {
    mongoClient = await connectToDatabase(dbURL);
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
  //
  let sortBy;
  if (sort === 'relevant') {
    sortBy = { helpfulness: -1, dateType: -1 };
  } else if (sort === 'newest') {
    sortBy = { dateType: -1 };
  } else {
    sortBy = { helpfulness: -1 };
  }
  //
  try {
    mongoClient = await connectToDatabase(dbURL);
    const db = mongoClient.db(dbName);
    const reviewsCollection = db.collection(reviewsCollectionName);
    const findCursor = await reviewsCollection.find({ product_id: productId, reported: false });
    const projCursor = await findCursor.project({ reported: 0, reviewer_email: 0, dateType: 0 });
    const sortCursor = await projCursor.sort(sortBy);
    const limitCursor = await sortCursor.limit(1000);
    const reviews = await limitCursor.toArray();
    return reviews;
  } finally {
    await mongoClient.close();
  }
};

const markReviewHelpful = async (reviewId) => {
  let mongoClient;

  try {
    mongoClient = await connectToDatabase(dbURL);
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
    mongoClient = await connectToDatabase(dbURL);
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

const postReview = async (review, nextReviewId) => {
  const newReview = review;
  let mongoClient;

  try {
    mongoClient = await connectToDatabase(dbURL);
    const db = mongoClient.db(dbName);
    const reviewsCollection = db.collection(reviewsCollectionName);
    const productMetadataCollection = db.collection(productMetadataCollectionName);
    //
    const metadata = await getProductMetadata(review.product_id);
    const metadataCharacteristics = Object.keys(metadata.characteristics);
    const metadataCharacteristicRatings = Object.values(metadata.characteristics);
    const reviewCharacteristics = Object.keys(newReview.characteristics);
    const reviewCharRatings = Object.values(newReview.characteristics);
    // Replace characteristic id's with characteristics
    for (let i = 0; i < metadataCharacteristics.length; i += 1) {
      for (let j = 0; j < reviewCharacteristics.length; j += 1) {
        if (Number(reviewCharacteristics[j]) === metadataCharacteristicRatings[i].id) {
          newReview.characteristics[metadataCharacteristics[i]] = {
            id: metadataCharacteristicRatings[i].id,
            value: reviewCharRatings[j],
          };
          delete newReview.characteristics[reviewCharacteristics[j]];
        }
      }
    }
    //
    await reviewsCollection.insertOne({
      product_id: newReview.product_id,
      rating: newReview.rating,
      date: new Date().toISOString(),
      dateType: new Date(Date.now()),
      summary: newReview.summary,
      body: newReview.body,
      recommend: newReview.recommend,
      reported: false,
      reviewer_name: newReview.name,
      reviewer_email: newReview.email,
      response: null,
      helpfulness: 0,
      photos: newReview.photos.map((uri) => ({ url: uri })),
      review_id: nextReviewId,
      characteristics: newReview.characteristics,
    });
    // Update metadata rating count and recommended count
    const ratingString = review.rating.toString();
    metadata.ratings[ratingString] = (Number(metadata.ratings[ratingString]) + 1).toString();
    const rec = review.recommend;
    metadata.recommended[rec] = (Number(metadata.recommended[rec]) + 1).toString();
    // Update average characteristic ratings
    const rChars = review.characteristics; // rChars == reviewCharacteristics
    const mChars = metadata.characteristics; // mChars == metadataCharacteristics
    const mCA = Object.keys(mChars); // mCA = metadataCharacteristicsArray
    const mCRats = Object.values(mChars); // mCRats = metadataCharacteristicRatings
    for (let i = 0; i < mCA.length; i += 1) {
      mChars[mCA[i]].value = ((Number(mCRats[i].value) * (nId - 1)) + rChars[mCA[i]].value) / nId;
      mChars[mCA[i]].value = mChars[mCA[i]].value.toString();
    }
    await productMetadataCollection.replaceOne({ product_id: review.product_id }, metadata);
  } finally {
    mongoClient.close();
  }
};

module.exports.countReviews = countReviews;
module.exports.getProductMetadata = getProductMetadata;
module.exports.getReviews = getReviews;
module.exports.markReviewHelpful = markReviewHelpful;
module.exports.markReviewReported = markReviewReported;
module.exports.postReview = postReview;
