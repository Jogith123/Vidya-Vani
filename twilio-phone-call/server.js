require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const util = require('util');
const CARTESIA_CONFIG = require('./cartesia-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Initialize Gemini AI
let genAI = null;
let model = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using Gemini 2.5 Flash - the free tier model
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini AI initialized (using gemini-2.5-flash - Free Tier)');
  } else {
    console.log('⚠️  GEMINI_API_KEY not found in .env');
  }
} catch (error) {
  console.log('⚠️  Gemini AI initialization failed:', error.message);
}

// Initialize Cartesia.ai TTS
if (process.env.CARTESIA_API_KEY) {
  console.log('✅ Cartesia.ai TTS initialized');
} else {
  console.log('⚠️  CARTESIA_API_KEY not found - using Twilio TTS fallback');
}

// Initialize Google Speech-to-Text (optional)
let sttClient = null;
try {
  if (fs.existsSync(process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json')) {
    sttClient = new speech.SpeechClient({
      keyFilename: process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json'
    });
    console.log('✅ Google Speech-to-Text initialized');
  } else {
    console.log('⚠️  Google STT credentials not found - using Twilio transcription fallback');
  }
} catch (error) {
  console.log('⚠️  Google STT initialization failed - using Twilio transcription fallback');
  sttClient = null;
}

// Store user sessions (in production, use Redis or database)
const userSessions = new Map();

// Welcome endpoint - Entry point for incoming calls
app.post('/ivr/welcome', (req, res) => {
  const callSid = req.body.CallSid;
  console.log(`📞 Incoming call: ${callSid}`);
  
  // Initialize session
  userSessions.set(callSid, {
    questions: [],
    currentQuestion: null,
    state: 'welcome'
  });

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  gather.say(
    'Welcome to Vidya Vani, your AI powered educational assistant. ' +
    'Press 1 to ask a question. ' +
    'Press 2 to stop recording. ' +
    'Press 3 to get the answer. ' +
    'Press 9 to end the call.',
    { voice: 'Polly.Joanna', language: 'en-US', loop: 2 }
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Main menu handler
app.post('/ivr/menu', async (req, res) => {
  const digit = req.body.Digits;
  const callSid = req.body.CallSid;
  console.log(`🔢 User pressed: ${digit} (Call: ${callSid})`);

  const optionActions = {
    '1': askQuestion,
    '2': stopRecording,
    '3': getAnswer,
    '9': endCall
  };

  if (optionActions[digit]) {
    try {
      const twiml = await optionActions[digit](callSid, req);
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      console.error(`❌ Error in menu option ${digit}:`, error);
      res.type('text/xml');
      res.send(redirectWelcome());
    }
  } else {
    console.log(`⚠️  Invalid option: ${digit}`);
    res.type('text/xml');
    res.send(redirectWelcome());
  }
});

// Ask question flow
async function askQuestion(callSid, req) {
  console.log(`🎤 Starting recording for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  session.state = 'recording_question';
  userSessions.set(callSid, session);

  const twiml = new VoiceResponse();
  
  twiml.say(
    'Please ask your educational question after the beep. Press 2 to stop recording.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  twiml.record({
    action: `${process.env.BASE_URL}/ivr/question-recorded`,
    method: 'POST',
    maxLength: 60,
    finishOnKey: '2',
    transcribe: false,  // Disable Twilio transcription, we'll use Google STT
    playBeep: true
  });

  return twiml.toString();
}

// Stop recording handler (when user presses 2)
function stopRecording(callSid, req) {
  const twiml = new VoiceResponse();
  
  twiml.say(
    'Recording stopped. Your question is being processed. Please press 3 to hear the answer.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  gather.say(
    'Press 3 for answer, or press 1 for new question.',
    { voice: 'Polly.Joanna', language: 'en-US', loop: 3 }
  );

  return twiml.toString();
}

// Handle recorded question
app.post('/ivr/question-recorded', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  console.log(`✅ Recording completed for call: ${callSid}`);
  console.log(`📼 Recording URL: ${recordingUrl}`);
  
  const session = userSessions.get(callSid) || {};
  session.lastRecordingUrl = recordingUrl;
  session.state = 'processing_transcription';
  userSessions.set(callSid, session);

  // Process transcription immediately using Google STT
  transcribeAudio(recordingUrl, callSid).catch(err => {
    console.error(`❌ Transcription error for ${callSid}:`, err);
  });

  const twiml = new VoiceResponse();
  twiml.say(
    'Thank you. Your question is being processed. ' +
    'Please press 3 to hear the answer, or press 1 to ask another question.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  gather.say(
    'Press 3 for answer, or press 1 for new question.',
    { voice: 'Polly.Joanna', language: 'en-US', loop: 3 }
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Transcribe audio using Google Speech-to-Text
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
      // Fallback: Use a simple approach or wait for Twilio transcription
      console.log(`⚠️ Google STT not available, transcription may be less accurate`);
      // In this case, we would need to enable Twilio transcription as fallback
      return;
    }

    // Save transcription to session
    const session = userSessions.get(callSid) || {};
    session.currentQuestion = transcriptionText;
    session.questions.push(transcriptionText);
    session.state = 'transcription_complete';
    userSessions.set(callSid, session);
    
    console.log(`✅ Question saved to session for ${callSid}`);

  } catch (error) {
    console.error(`❌ Transcription error for ${callSid}:`, error.message);
    // Set a fallback message
    const session = userSessions.get(callSid) || {};
    session.transcriptionError = true;
    userSessions.set(callSid, session);
  }
}

// Handle transcription callback (kept for backward compatibility with Twilio transcription)
app.post('/ivr/transcription', async (req, res) => {
  const callSid = req.body.CallSid;
  const transcriptionText = req.body.TranscriptionText;
  
  console.log(`📝 Twilio transcription received for ${callSid}: "${transcriptionText}"`);
  
  const session = userSessions.get(callSid) || {};
  // Only use Twilio transcription if Google STT hasn't already processed it
  if (!session.currentQuestion) {
    session.currentQuestion = transcriptionText;
    session.questions.push(transcriptionText);
    userSessions.set(callSid, session);
    console.log(`✅ Question saved to session for ${callSid}`);
  }

  res.sendStatus(200);
});

// Get answer from Gemini AI
async function getAnswer(callSid, req) {
  console.log(`🤖 Getting answer for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  const question = session.currentQuestion;
  console.log(`📝 Current question in session: ${question}`);

  const twiml = new VoiceResponse();

  // Check if transcription is still processing
  if (session.state === 'processing_transcription') {
    console.log(`⏳ Transcription still processing for call: ${callSid}`);
    twiml.say(
      'Your question is still being processed. Please wait a moment and press 3 again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  if (!question) {
    console.log(`⚠️  No question found for call: ${callSid}`);
    twiml.say(
      'No question found. Please press 1 to ask a question first.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  try {
    // Check if Gemini AI is available
    if (!model) {
      twiml.say(
        'Sorry, AI service is not configured. Please add your Gemini API key to the environment file.',
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Get answer from Gemini AI
    twiml.say(
      'Processing your question with AI. Please wait.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

    const prompt = `You are an educational assistant. Answer this question clearly and concisely in 2-3 sentences suitable for voice response: ${question}`;
    console.log(`🤖 Sending to Gemini: ${question}`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    console.log(`🤖 Question: ${question}`);
    console.log(`🤖 Answer: ${answer}`);

    // Store answer in session
    session.lastAnswer = answer;
    userSessions.set(callSid, session);

    // Convert answer to speech using Google TTS
    const audioFileName = await textToSpeechConvert(answer, callSid);

    if (audioFileName) {
      // Play the generated audio
      const audioUrl = `${process.env.BASE_URL}/audio/${audioFileName}`;
      twiml.play(audioUrl);
    } else {
      // Fallback to Twilio's TTS
      twiml.say(answer, { voice: 'Polly.Joanna', language: 'en-US' });
    }

    // Offer next options
    const gather = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      timeout: 10
    });

    gather.say(
      'Press 1 to ask another question, or press 9 to end the call.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

  } catch (error) {
    console.error('Error getting answer from Gemini:', error);
    twiml.say(
      'Sorry, I encountered an error processing your question. Please try again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  return twiml.toString();
}

// Convert text to speech using Cartesia.ai
async function textToSpeechConvert(text, callSid) {
  // Check if Cartesia API key is available
  if (!process.env.CARTESIA_API_KEY) {
    console.log('⚠️ Cartesia API key not found, using Twilio TTS fallback');
    return null;
  }

  try {
    // Ensure audio directory exists
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    console.log('🎙️ Generating speech with Cartesia.ai...');

    // Call Cartesia.ai API
    const response = await axios.post(
      'https://api.cartesia.ai/tts/bytes',
      {
        model_id: CARTESIA_CONFIG.api.model_id,
        transcript: text,
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

    const fileName = `answer_${callSid}_${Date.now()}.wav`;
    const filePath = path.join(audioDir, fileName);

    await util.promisify(fs.writeFile)(filePath, response.data, 'binary');
    console.log(`✅ Cartesia audio content written to file: ${fileName}`);

    // Clean up old audio files (older than 1 hour)
    cleanupOldAudioFiles(audioDir);

    return fileName;
  } catch (error) {
    console.error('❌ Error with Cartesia TTS:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Clean up old audio files
function cleanupOldAudioFiles(audioDir) {
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
}

// End call
function endCall(callSid, req) {
  const twiml = new VoiceResponse();
  twiml.say(
    'Thank you for using Vidya Vani. Goodbye!',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );
  twiml.hangup();

  // Clean up session
  userSessions.delete(callSid);

  return twiml.toString();
}

// Redirect to welcome
function redirectWelcome() {
  const twiml = new VoiceResponse();
  twiml.say(
    'Invalid option. Returning to the main menu.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );
  twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  return twiml.toString();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler for all routes
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  const twiml = new VoiceResponse();
  twiml.say('Sorry, there was a server error. Please try again.', { voice: 'Polly.Joanna', language: 'en-US' });
  res.type('text/xml');
  res.send(twiml.toString());
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📞 Twilio webhook URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}/ivr/welcome`);
});
