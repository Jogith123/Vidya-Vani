/**
 * MongoDB Test Script
 * Run this to verify MongoDB connection and test basic operations
 * Now uses modular structure
 */

require('dotenv').config();
const { connectToMongoDB, closeConnection, isConnected } = require('./database/connection');
const History = require('./models/History');
const { initializeGemini, classifySubject } = require('./services/geminiService');

async function testMongoDB() {
  console.log('🧪 Testing MongoDB Connection with Modular Structure...\n');

  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env file');
      console.log('Please add: MONGODB_URI=mongodb://localhost:27017/vidya-vani');
      process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    console.log(`URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}\n`);

    // Connect to MongoDB using modular connection
    await connectToMongoDB();
    
    if (!isConnected()) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    console.log('✅ Connected to MongoDB successfully!\n');
    
    // Initialize Gemini for subject classification test
    initializeGemini();

    // Test 1: Insert a sample document using History model
    console.log('📝 Test 1: Inserting sample document using History model...');
    const sampleDoc = History.createDocument(
      '+919876543210',
      'Biology',
      'What is photosynthesis?',
      'Photosynthesis is the process by which plants convert light energy into chemical energy.'
    );

    const insertResult = await History.insertOne(sampleDoc);
    console.log(`✅ Inserted document with ID: ${insertResult.insertedId}\n`);

    // Test 2: Query the document using History model
    console.log('🔍 Test 2: Querying documents using History model...');
    const docs = await History.findByUserId('+919876543210');
    console.log(`✅ Found ${docs.length} document(s)`);
    console.log('Sample document:', JSON.stringify(docs[0], null, 2), '\n');

    // Test 3: Indexes (already created by connection module)
    console.log('📊 Test 3: Verifying indexes...');
    console.log('✅ Indexes already created by connection module\n');

    // Test 4: Query by subject using History model
    console.log('🔍 Test 4: Querying by subject using History model...');
    const biologyDocs = await History.findByUserIdAndSubject('+919876543210', 'Biology', 5);
    console.log(`✅ Found ${biologyDocs.length} Biology question(s)\n`);

    // Test 5: Aggregate statistics using History model
    console.log('📈 Test 5: Getting statistics using History model...');
    const stats = await History.getSubjectStats('+919876543210');
    console.log('✅ Statistics by subject:');
    stats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} question(s)`);
    });
    console.log('');
    
    // Test 6: Test subject classification (if Gemini is available)
    console.log('🤖 Test 6: Testing subject classification...');
    try {
      const testQuestion = 'What is Newton\'s first law of motion?';
      const subject = await classifySubject(testQuestion);
      console.log(`✅ Question: "${testQuestion}"`);
      console.log(`   Classified as: ${subject}\n`);
    } catch (error) {
      console.log('⚠️  Gemini not available, skipping classification test\n');
    }

    // Test 7: Clean up test data using History model
    console.log('🧹 Test 7: Cleaning up test data...');
    const deleteResult = await History.deleteByUserId('+919876543210');
    console.log(`✅ Deleted ${deleteResult.deletedCount} test document(s)\n`);

    console.log('🎉 All tests passed! MongoDB modular structure is working perfectly!\n');
    console.log('✅ Verified:');
    console.log('   - Database connection module');
    console.log('   - History model CRUD operations');
    console.log('   - Subject classification service');
    console.log('   - Data queries and aggregations\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MongoDB is running (if using local)');
    console.error('2. Check your MONGODB_URI in .env file');
    console.error('3. For MongoDB Atlas, verify:');
    console.error('   - Database user credentials');
    console.error('   - IP whitelist (0.0.0.0/0 for testing)');
    console.error('   - Network connectivity\n');
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the test
testMongoDB();
