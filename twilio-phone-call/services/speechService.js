/**
 * Speech Service
 * Handles Google Cloud Speech-to-Text and Text-to-Speech
 */

const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const util = require('util');

let ttsClient = null;
let sttClient = null;

/**
 * Initialize Google Text-to-Speech client
 */
function initializeTTS() {
  try {
    if (fs.existsSync(process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json')) {
      ttsClient = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json'
      });
      console.log('✅ Google TTS initialized');
      return true;
    } else {
      console.log('⚠️  Google TTS credentials not found - using Twilio TTS fallback');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Google TTS initialization failed - using Twilio TTS fallback');
    ttsClient = null;
    return false;
  }
}

/**
 * Initialize Google Speech-to-Text client
 */
function initializeSTT() {
  try {
    if (fs.existsSync(process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json')) {
      sttClient = new speech.SpeechClient({
        keyFilename: process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json'
      });
      console.log('✅ Google Speech-to-Text initialized');
      return true;
    } else {
      console.log('⚠️  Google STT credentials not found - using Twilio transcription fallback');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Google STT initialization failed - using Twilio transcription fallback');
    sttClient = null;
    return false;
  }
}

/**
 * Check if TTS is available
 * @returns {boolean}
 */
function isTTSAvailable() {
  return ttsClient !== null;
}

/**
 * Check if STT is available
 * @returns {boolean}
 */
function isSTTAvailable() {
  return sttClient !== null;
}

/**
 * Convert text to speech using Google TTS
 * @param {string} text - Text to convert
 * @param {string} callSid - Call SID for file naming
 * @returns {Promise<string|null>} Audio file name or null if failed
 */
async function textToSpeechConvert(text, callSid) {
  // If TTS client is not available, return null to use Twilio TTS
  if (!ttsClient) {
    console.log('Using Twilio TTS fallback');
    return null;
  }

  try {
    // Ensure audio directory exists
    const audioDir = path.join(__dirname, '..', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const request = {
      input: { text: text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F',
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95,
        pitch: 0.0
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const fileName = `answer_${callSid}_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    await util.promisify(fs.writeFile)(filePath, response.audioContent, 'binary');
    console.log(`Audio content written to file: ${fileName}`);

    // Clean up old audio files (older than 1 hour)
    cleanupOldAudioFiles(audioDir);

    return fileName;
  } catch (error) {
    console.error('Error with Google TTS:', error.message);
    return null;
  }
}

/**
 * Transcribe audio using Google Speech-to-Text
 * @param {string} recordingUrl - URL of the recording
 * @param {string} callSid - Call SID for logging
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(recordingUrl, callSid) {
  try {
    console.log(`🎙️ Starting transcription for ${callSid}...`);
    
    // Download the audio file from Twilio
    const audioResponse = await axios({
      method: 'get',
      url: recordingUrl,
      responseType: 'arraybuffer',
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      }
    });

    const audioBuffer = Buffer.from(audioResponse.data);
    console.log(`📥 Downloaded audio: ${audioBuffer.length} bytes`);

    let transcriptionText = '';

    // Use Google Speech-to-Text if available
    if (sttClient) {
      console.log(`🔊 Using Google Speech-to-Text for ${callSid}`);
      
      const request = {
        audio: {
          content: audioBuffer.toString('base64')
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 8000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'phone_call',
          useEnhanced: true
        }
      };

      const [response] = await sttClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      
      transcriptionText = transcription;
      console.log(`📝 Google STT transcription: "${transcriptionText}"`);
    } else {
      console.log(`⚠️ Google STT not available, transcription may be less accurate`);
      throw new Error('STT not available');
    }

    return transcriptionText;
  } catch (error) {
    console.error(`❌ Transcription error for ${callSid}:`, error.message);
    throw error;
  }
}

/**
 * Clean up old audio files
 * @param {string} audioDir - Audio directory path
 */
function cleanupOldAudioFiles(audioDir) {
  try {
    const files = fs.readdirSync(audioDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    files.forEach(file => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old audio file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up audio files:', error.message);
  }
}

module.exports = {
  initializeTTS,
  initializeSTT,
  isTTSAvailable,
  isSTTAvailable,
  textToSpeechConvert,
  transcribeAudio
};
