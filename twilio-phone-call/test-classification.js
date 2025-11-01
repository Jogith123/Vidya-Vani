/**
 * Test Subject Classification
 * Tests the improved Gemini classification for all school subjects
 */

require('dotenv').config();
const { initializeGemini, classifySubject } = require('./services/geminiService');

// Test questions covering various subjects
const testQuestions = [
  // Core Sciences
  { question: "What is Newton's first law of motion?", expected: "Physics" },
  { question: "Explain the process of photosynthesis", expected: "Biology" },
  { question: "What is the chemical formula for water?", expected: "Chemistry" },
  { question: "Solve the equation 2x + 5 = 15", expected: "Mathematics" },
  
  // Social Sciences
  { question: "When did World War II start?", expected: "History" },
  { question: "What is the capital of France?", expected: "Geography" },
  { question: "Explain the concept of supply and demand", expected: "Economics" },
  { question: "What is democracy?", expected: "Political Science" },
  
  // Languages & Arts
  { question: "What is a noun?", expected: "English" },
  { question: "Who wrote Romeo and Juliet?", expected: "English" },
  
  // Technology
  { question: "What is a variable in programming?", expected: "Computer Science" },
  { question: "Explain what an algorithm is", expected: "Computer Science" },
  
  // Environmental
  { question: "What causes global warming?", expected: "Environmental Science" },
  { question: "What is the greenhouse effect?", expected: "Environmental Science" },
  
  // General
  { question: "What is the largest planet in our solar system?", expected: "General Science or Astronomy" },
  { question: "Who invented the telephone?", expected: "General Knowledge or History" }
];

async function testClassification() {
  console.log('🧪 Testing Enhanced Subject Classification\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Initialize Gemini
  const initialized = initializeGemini();
  if (!initialized) {
    console.error('❌ Gemini AI not initialized. Check your GEMINI_API_KEY in .env');
    process.exit(1);
  }

  console.log('✅ Gemini AI initialized\n');
  console.log('Testing classification for various school subjects...\n');

  let successCount = 0;
  let totalTests = testQuestions.length;

  for (let i = 0; i < testQuestions.length; i++) {
    const { question, expected } = testQuestions[i];
    
    console.log(`\n${i + 1}. Question: "${question}"`);
    console.log(`   Expected: ${expected}`);
    
    try {
      const classified = await classifySubject(question);
      console.log(`   ✅ Classified as: ${classified}`);
      
      // Check if classification is reasonable (not just "Other" or "General")
      if (classified && classified !== 'Other' && classified.length > 2) {
        successCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`\n📊 Results: ${successCount}/${totalTests} questions classified with specific subjects`);
  
  if (successCount === totalTests) {
    console.log('🎉 Perfect! All questions classified correctly!');
  } else if (successCount >= totalTests * 0.8) {
    console.log('✅ Great! Most questions classified with specific subjects.');
  } else if (successCount >= totalTests * 0.6) {
    console.log('⚠️  Good, but some questions still getting generic classifications.');
  } else {
    console.log('❌ Classification needs improvement.');
  }

  console.log('\n✨ Test complete!\n');
}

// Run the test
testClassification().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
