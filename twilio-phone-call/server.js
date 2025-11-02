require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const path = require('path');

// Import modular services
const { connectToMongoDB, closeConnection, isConnected } = require('./database/connection');
const { initializeGemini, isInitialized: isGeminiInitialized, generateAnswer, generateSummary } = require('./services/geminiService');
const { initializeTTS, initializeSTT, textToSpeechConvert, transcribeAudio } = require('./services/speechService');
const { storeQuestionAndAnswer, getHistoryBySubject, getUserStats } = require('./services/historyService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Initialize all services
async function initializeServices() {
  console.log('🚀 Initializing Vidya Vani services...\n');
  
  // Initialize Gemini AI
  initializeGemini();
  
  // Initialize Google TTS
  initializeTTS();
  
  // Initialize Google STT
  initializeSTT();
  
  // Initialize MongoDB
  await connectToMongoDB();
  
  console.log('\n✅ All services initialized\n');
}

// Store user sessions (in production, use Redis or database)
const userSessions = new Map();

// Welcome endpoint - Entry point for incoming calls
app.post('/ivr/welcome', (req, res) => {
  const callSid = req.body.CallSid;
  const fromNumber = req.body.From;
  console.log(`📞 Incoming call: ${callSid} from ${fromNumber}`);
  
  // Initialize session
  userSessions.set(callSid, {
    questions: [],
    currentQuestion: null,
    state: 'welcome',
    fromNumber: fromNumber
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
    'Press 4 to get a summary of your last 5 questions on a subject. ' +
    'Press 5 to stop and return to main menu. ' +
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
    '4': getSummary,
    '5': returnToMenu,
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
  processTranscription(recordingUrl, callSid).catch(err => {
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

// Process transcription asynchronously
async function processTranscription(recordingUrl, callSid) {
  try {
    const transcriptionText = await transcribeAudio(recordingUrl, callSid);
    
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
    if (!isGeminiInitialized()) {
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

    console.log(`🤖 Sending to Gemini: ${question}`);
    const answer = await generateAnswer(question);

    console.log(`🤖 Question: ${question}`);
    console.log(`🤖 Answer: ${answer}`);

    // Store answer in session
    session.lastAnswer = answer;
    userSessions.set(callSid, session);

    // Classify subject and store in MongoDB
    if (isConnected()) {
      await storeQuestionAndAnswer(session.fromNumber, question, answer);
    }

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

// Get summary of last 5 questions for a subject
async function getSummary(callSid, req) {
  console.log(`📊 Getting summary for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  const fromNumber = session.fromNumber || req.body.From;

  const twiml = new VoiceResponse();

  try {
    // Check if MongoDB is available
    if (!isConnected()) {
      twiml.say(
        'Sorry, database service is not available. This feature requires database connection.',
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Check if Gemini AI is available
    if (!isGeminiInitialized()) {
      twiml.say(
        'Sorry, AI service is not configured. Please add your Gemini API key to the environment file.',
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Ask user for subject
    twiml.say(
      'Please tell me the subject you need to summarize.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

    // Record the subject name
    twiml.record({
      action: `${process.env.BASE_URL}/ivr/process-summary`,
      method: 'POST',
      maxLength: 10,
      finishOnKey: '#',
      transcribe: false,
      playBeep: true
    });

  } catch (error) {
    console.error('Error in getSummary:', error);
    twiml.say(
      'Sorry, I encountered an error. Please try again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  return twiml.toString();
}

// Process summary request
app.post('/ivr/process-summary', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  console.log(`📊 Processing summary request for call: ${callSid}`);

  const session = userSessions.get(callSid) || {};
  const fromNumber = session.fromNumber || req.body.From;

  const twiml = new VoiceResponse();

  try {
    // Transcribe the subject name
    let subjectName = 'Physics'; // Default fallback
    
    if (recordingUrl) {
      try {
        const transcribedText = await transcribeAudio(recordingUrl, callSid);
        console.log(`📝 Subject name transcribed: "${transcribedText}"`);
        
        // Extract just the subject name (remove phrases like "give me summary", "I want summary", etc.)
        subjectName = extractSubjectName(transcribedText);
        console.log(`📚 Extracted subject: "${subjectName}"`);
      } catch (error) {
        console.error('❌ Error transcribing subject:', error.message);
      }
    }

    // Fetch last 5 questions for this subject (exclude summary requests)
    console.log(`🔍 Fetching history for subject: "${subjectName}" from user: ${fromNumber}`);
    const history = await getHistoryBySubject(fromNumber, subjectName, 5);
    
    console.log(`📊 Found ${history.length} questions for "${subjectName}"`);
    if (history.length > 0) {
      console.log(`📋 First question: "${history[0].question.substring(0, 50)}..."`);
    }

    if (history.length === 0) {
      // Get all available subjects for this user
      const stats = await getUserStats(fromNumber);
      console.log(`📚 User's available subjects: ${stats.subjectStats.map(s => s._id).join(', ')}`);
      
      twiml.say(
        `You have not asked any questions about ${subjectName} yet. Please ask some questions first, then request a summary.`,
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }

    // Generate summary using Gemini
    console.log(`🤖 Generating summary for ${subjectName} with ${history.length} questions...`);
    const summary = await generateSummary(subjectName, history);
    console.log(`📊 Summary generated successfully`);

    // Convert summary to speech
    const audioFileName = await textToSpeechConvert(summary, callSid);

    twiml.say(
      `Here is your learning summary for ${subjectName}, based on your last ${history.length} questions.`,
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

    twiml.pause({ length: 1 });

    if (audioFileName) {
      const audioUrl = `${process.env.BASE_URL}/audio/${audioFileName}`;
      twiml.play(audioUrl);
    } else {
      twiml.say(summary, { voice: 'Polly.Joanna', language: 'en-US' });
    }

    // Offer next options
    const gather = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      timeout: 10
    });

    gather.say(
      'Press 1 to ask another question, press 4 for another summary, or press 9 to end the call.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

  } catch (error) {
    console.error('❌ Error processing summary:', error);
    twiml.say(
      'Sorry, I encountered an error generating your summary. Please try again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Helper function to extract subject name from transcribed text
function extractSubjectName(text) {
  // Remove common phrases that might be in the transcription
  let cleanText = text
    .toLowerCase()
    .replace(/give me (?:the )?summary/gi, '')
    .replace(/i want (?:a )?summary/gi, '')
    .replace(/summary (?:of|on|for|about)/gi, '')
    .replace(/(?:uh|um|ah|er)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,!?;:]+$/g, '');  // Remove trailing punctuation
  
  if (!cleanText) return 'Physics';
  
  // Subject name mapping for common variations
  const subjectMapping = {
    'math': 'Mathematics',
    'maths': 'Mathematics',
    'mathematics': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'organic chemistry': 'Organic Chemistry',
    'inorganic chemistry': 'Inorganic Chemistry',
    'biology': 'Biology',
    'botany': 'Botany',
    'zoology': 'Zoology',
    'human biology': 'Human Biology',
    'history': 'History',
    'world history': 'World History',
    'indian history': 'Indian History',
    'ancient history': 'Ancient History',
    'geography': 'Geography',
    'english': 'English',
    'grammar': 'Grammar',
    'literature': 'Literature',
    'composition': 'Composition',
    'computer science': 'Computer Science',
    'programming': 'Computer Science',
    'it': 'Computer Science',
    'economics': 'Economics',
    'political science': 'Political Science',
    'social studies': 'Social Studies',
    'environmental science': 'Environmental Science',
    'general science': 'General Science',
    'general knowledge': 'General Knowledge',
    'science': 'General Science'
  };
  
  // Normalize by checking mapping first
  const normalized = subjectMapping[cleanText];
  if (normalized) {
    console.log(`🔄 Normalized "${text}" to "${normalized}"`);
    return normalized;
  }
  
  // Capitalize first letter of each word if no mapping found
  const capitalized = cleanText
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  console.log(`📚 Using capitalized: "${capitalized}"`);
  return capitalized;
}

// Return to main menu
function returnToMenu(callSid, req) {
  console.log(`🔄 Returning to main menu for call: ${callSid}`);
  const twiml = new VoiceResponse();
  twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  return twiml.toString();
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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      gemini: isGeminiInitialized(),
      mongodb: isConnected()
    }
  });
});

// Error handler for all routes
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  const twiml = new VoiceResponse();
  twiml.say('Sorry, there was a server error. Please try again.', { voice: 'Polly.Joanna', language: 'en-US' });
  res.type('text/xml');
  res.send(twiml.toString());
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📞 Twilio webhook URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}/ivr/welcome`);
  });
}

startServer();
