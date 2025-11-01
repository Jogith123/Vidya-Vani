require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const CARTESIA_CONFIG = require('./cartesia-config');

async function testCartesia() {
  console.log('🧪 Testing Cartesia.ai TTS integration...\n');

  if (!process.env.CARTESIA_API_KEY) {
    console.error('❌ CARTESIA_API_KEY not found in .env file');
    process.exit(1);
  }

  const testText = 'Hello! This is a test of Cartesia AI text to speech. The voice should sound natural and human-like, unlike robotic text to speech systems.';

  try {
    console.log('📝 Text to convert:', testText);
    console.log('🎙️ Calling Cartesia.ai API...\n');

    const response = await axios.post(
      'https://api.cartesia.ai/tts/bytes',
      {
        model_id: CARTESIA_CONFIG.api.model_id,
        transcript: testText,
        voice: CARTESIA_CONFIG.voice,
        output_format: CARTESIA_CONFIG.outputFormat,
        speed: CARTESIA_CONFIG.api.speed,
        generation_config: CARTESIA_CONFIG.api.generation_config
      },
      {
        headers: {
          'Cartesia-Version': '2024-06-10',
          'X-API-Key': process.env.CARTESIA_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save the audio file
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const fileName = `test_cartesia_${Date.now()}.wav`;
    const filePath = path.join(audioDir, fileName);

    fs.writeFileSync(filePath, response.data, 'binary');

    console.log('✅ Success! Audio file generated:');
    console.log(`   File: ${fileName}`);
    console.log(`   Path: ${filePath}`);
    console.log(`   Size: ${(response.data.length / 1024).toFixed(2)} KB`);
    console.log('\n🎵 You can play this file to hear the natural voice!');

  } catch (error) {
    console.error('❌ Error testing Cartesia:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data?.toString() || 'No data');
    }
    process.exit(1);
  }
}

testCartesia();
