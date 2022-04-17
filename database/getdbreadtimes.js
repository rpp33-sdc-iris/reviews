const { config } = require('dotenv');
const { connectToDatabase } = require('./database');

config();

let dbURL;
let dbName;
let reviewsCollectionName;
let productMetadataCollectionName;

if (process.env.ENVIRONMENT === 'local-dev') {
  dbURL = process.env.LOCAL_DEV_DB_URL;
  dbName = process.env.LOCAL_DEV_DB_NAME;
  reviewsCollectionName = process.env.LOCAL_DEV_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.LOCAL_DEV_PRODUCTMETADATA_COLLECTION_NAME;
} else if (process.env.ENVIRONMENT === 'local-prod') {
  dbURL = process.env.LOCAL_PROD_DB_URL;
  dbName = process.env.LOCAL_PROD_DB_NAME;
  reviewsCollectionName = process.env.LOCAL_PROD_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.LOCAL_PROD_PRODUCTMETADATA_COLLECTION_NAME;
} else if (process.env.ENVIRONMENT === 'deployed-dev') {
  dbURL = process.env.DEPLOYED_DEV_DB_URL;
  dbName = process.env.DEPLOYED_DEV_DB_NAME;
  reviewsCollectionName = process.env.DEPLOYED_DEV_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.DEPLOYED_DEV_PRODUCTMETADATA_COLLECTION_NAME;
} else if (process.env.ENVIRONMENT === 'deployed-prod') {
  dbURL = process.env.DEPLOYED_PROD_DB_URL;
  dbName = process.env.DEPLOYED_PROD_DB_NAME;
  reviewsCollectionName = process.env.DEPLOYED_PROD_REVIEWS_COLLECTION_NAME;
  productMetadataCollectionName = process.env.DEPLOYED_PROD_PRODUCTMETADATA_COLLECTION_NAME;
}

// local reviews_test product_Ids tested:

const productId = 900000;

const getDBReadTimes = async () => {
  //
  const mongoClient = await connectToDatabase(dbURL);
  const db = mongoClient.db(dbName);
  const productMetadataCollection = db.collection(productMetadataCollectionName);
  const reviewsCollection = db.collection(reviewsCollectionName);

  console.log('DB url:', dbURL);
  console.log('DB Name: ', dbName);
  //
  const productMetadataReadStats = await productMetadataCollection.findOne({ product_id: productId }, { explain: 'executionStats' });
  const timeToReadProductMetadata = productMetadataReadStats.executionStats.executionTimeMillis;
  console.log(`Time to read product metadata for product_id ${productId}: ${timeToReadProductMetadata} ms`);

  let timeToReadReviews = 0;

  const findCursor = await reviewsCollection.find({ product_id: productId, reported: false });
  const findStats = await findCursor.explain('executionStats');
  timeToReadReviews += findStats.executionStats.executionTimeMillis;

  const projectCursor = await findCursor.project({ reported: 0, reviewer_email: 0 });
  const projectStats = await projectCursor.explain('executionStats');
  timeToReadReviews += projectStats.executionStats.executionTimeMillis;

  const sortCursor = await projectCursor.sort({ helpfulness: -1, date: -1 });
  const sortStats = await sortCursor.explain('executionStats');
  timeToReadReviews += sortStats.executionStats.executionTimeMillis;

  const limitCursor = await sortCursor.limit(1000);
  const limitStats = await limitCursor.explain('executionStats');
  timeToReadReviews += limitStats.executionStats.executionTimeMillis;

  console.log(`Time to read product reviews for product_id ${productId}: ${timeToReadReviews} ms`);

  const reviews = await limitCursor.toArray();
  console.log('Query results: ', reviews);

  await mongoClient.close();
};

getDBReadTimes();
