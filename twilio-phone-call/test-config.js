// Test configuration script
require('dotenv').config();

console.log('\n🔍 Configuration Check\n');
console.log('='.repeat(50));

// Check Twilio
console.log('\n📞 Twilio Configuration:');
console.log('  TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
console.log('  TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');

// Check Gemini
console.log('\n🤖 Gemini AI Configuration:');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
if (process.env.GEMINI_API_KEY) {
  console.log('  Key starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
}

// Check Google TTS
console.log('\n🔊 Google TTS Configuration:');
console.log('  GOOGLE_TTS_KEY_FILE:', process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json');
const fs = require('fs');
const ttsFile = process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json';
console.log('  File exists:', fs.existsSync(ttsFile) ? '✅ Yes' : '❌ No (will use Twilio TTS)');

// Check Server
console.log('\n🌐 Server Configuration:');
console.log('  PORT:', process.env.PORT || 3000);
console.log('  BASE_URL:', process.env.BASE_URL || '❌ Not set');

// Check BASE_URL format
if (process.env.BASE_URL) {
  const url = process.env.BASE_URL;
  console.log('\n🔗 BASE_URL Validation:');
  console.log('  Starts with https://', url.startsWith('https://') ? '✅ Yes' : '❌ No - must be https://');
  console.log('  Contains .loca.lt:', url.includes('.loca.lt') ? '✅ Yes' : '⚠️  No - are you using localtunnel?');
  console.log('  Ends with /ivr/welcome:', url.endsWith('/ivr/welcome') ? '❌ Remove /ivr/welcome from BASE_URL' : '✅ Correct');
}

console.log('\n' + '='.repeat(50));
console.log('\n✅ Configuration check complete!\n');

// Test Gemini AI
if (process.env.GEMINI_API_KEY) {
  console.log('🧪 Testing Gemini AI connection...\n');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  (async () => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent('Say hello in one word');
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Gemini AI is working!');
      console.log('   Test response:', text);
      console.log('\n🎉 All systems ready!\n');
    } catch (error) {
      console.log('❌ Gemini AI test failed:', error.message);
      console.log('\n⚠️  Check your GEMINI_API_KEY\n');
    }
  })();
} else {
  console.log('⚠️  Skipping Gemini AI test - no API key found\n');
}
