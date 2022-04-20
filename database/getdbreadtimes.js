const { config } = require('dotenv');
const { connectToDatabase } = require('./database');

config();

const dbURL = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const reviewsCollectionName = process.env.REVIEWS_COLLECTION_NAME;
const productMetadataCollectionName = process.env.PRODUCTMETADATA_COLLECTION_NAME;

const productId = 900004;

const getDBReadTimes = async () => {
  //
  const mongoClient = await connectToDatabase(dbURL);
  const db = mongoClient.db(dbName);
  const productMetadataCollection = db.collection(productMetadataCollectionName);
  const reviewsCollection = db.collection(reviewsCollectionName);

  console.log('DB URL:', dbURL);
  console.log('DB Name: ', dbName);
  //
  const productMetadata = await productMetadataCollection.findOne({ product_id: productId });
  const productMetadataReadStats = await productMetadataCollection.findOne({ product_id: productId }, { explain: 'executionStats' });
  const timeToReadProductMetadata = productMetadataReadStats.executionStats.executionTimeMillis;
  console.log(`Time to read product metadata for product_id ${productId}: ${timeToReadProductMetadata} ms`);

  let timeToReadReviews = 0;

  const findCursor = await reviewsCollection.find({ product_id: productId, reported: false });
  const findStats = await findCursor.explain('executionStats');
  timeToReadReviews += findStats.executionStats.executionTimeMillis;

  const projectCursor = await findCursor.project({ reported: 0, reviewer_email: 0, dateType: 0 });
  const projectStats = await projectCursor.explain('executionStats');
  timeToReadReviews += projectStats.executionStats.executionTimeMillis;

  const sortCursor = await projectCursor.sort({ helpfulness: -1, date: -1 });
  const sortStats = await sortCursor.explain('executionStats');
  timeToReadReviews += sortStats.executionStats.executionTimeMillis;

  const limitCursor = await sortCursor.limit(1000);
  const limitStats = await limitCursor.explain('executionStats');
  timeToReadReviews += limitStats.executionStats.executionTimeMillis;

  console.log(`Time to read product reviews for product_id ${productId}, sorted by relevance: ${timeToReadReviews} ms`);

  const reviews = await limitCursor.toArray();
  console.log('Metadata: ', productMetadata);
  console.log('Reviews: ', reviews.length);

  await mongoClient.close();
};

getDBReadTimes();
