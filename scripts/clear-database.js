import connectDB from '../src/config/db.js';
import Business from '../src/models/Business.js';
import logger from '../src/utils/logger.js';

const clearDatabase = async () => {
  await connectDB();

  console.log('⚠️  WARNING: This will delete ALL business records from the database!\n');
  
  const count = await Business.countDocuments();
  console.log(`Found ${count} business records.\n`);

  if (count === 0) {
    console.log('Database is already empty.');
    process.exit(0);
  }

  console.log('Deleting all records...');
  const result = await Business.deleteMany({});
  
  console.log(`✓ Deleted ${result.deletedCount} records.\n`);
  console.log('Database cleared successfully!');
  
  process.exit(0);
};

clearDatabase().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
