const getProductMetadata = async (db, collection, productId) => {
  try {
    const productMetadata = await db.collection(collection).findOne({ product_id: productId });
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
  const newReview = review;
  let nextReviewId;
  let metadata;
  //
  try {
    const result = await db.collection(reviewsCol).countDocuments();
    nextReviewId = result + 1;
  } catch (error) {
    console.log('Error counting number of reviews', error);
    return 0;
  }

  try {
    metadata = await db.collection(productMetadataCol).findOne({ product_id: review.product_id });

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
  } catch (error) {
    console.log('Error building characteristics property', error);
    return 0;
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
      characteristics: review.characteristics,
    });
  } catch (error) {
    console.log('Erroring adding new review', error);
    return 0;
  }

  try {
    const numRs = await db.collection(reviewsCol).countDocuments({ product_id: review.product_id });
    metadata = await getProductMetadata(db, productMetadataCol, review.product_id);
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
    await db.collection(productMetadataCol).replaceOne({ product_id: review.product_id }, metadata);
    return 1;
  } catch (error) {
    console.log('Error updating product metadata', error);
    return 0;
  }
};

module.exports.getProductMetadata = getProductMetadata;
module.exports.getReviews = getReviews;
module.exports.markReviewHelpful = markReviewHelpful;
module.exports.markReviewReported = markReviewReported;
module.exports.postReview = postReview;
