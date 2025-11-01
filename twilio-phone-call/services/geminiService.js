/**
 * Gemini AI Service
 * Handles all interactions with Google Gemini AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 */
function initializeGemini() {
  try {
    if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Using Gemini 2.5 Flash - the free tier model
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('✅ Gemini AI initialized (using gemini-2.5-flash - Free Tier)');
      return true;
    } else {
      console.log('⚠️  GEMINI_API_KEY not found in .env');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Gemini AI initialization failed:', error.message);
    return false;
  }
}

/**
 * Check if Gemini is initialized
 * @returns {boolean}
 */
function isInitialized() {
  return model !== null;
}

/**
 * Get model instance
 * @returns {GenerativeModel|null}
 */
function getModel() {
  return model;
}

/**
 * Generate answer for educational question
 * @param {string} question - User's question
 * @returns {Promise<string>} AI-generated answer
 */
async function generateAnswer(question) {
  if (!model) {
    throw new Error('Gemini AI not initialized');
  }

  const prompt = `You are an educational assistant. Answer this question clearly and concisely in 2-3 sentences suitable for voice response: ${question}`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Classify question into subject category
 * @param {string} question - User's question
 * @returns {Promise<string>} Subject category (specific school-level subject)
 */
const SUBJECT_LABELS = ['Physics', 'Chemistry', 'Biology', 'Math', 'Other'];

function normalizeSubjectCategory(value) {
  if (!value) {
    return 'Other';
  }

  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return 'Other';
  }

  const directMatch = SUBJECT_LABELS.find(subject => subject.toLowerCase() === trimmed);
  if (directMatch) {
    return directMatch;
  }

  if (trimmed.includes('phys')) {
    return 'Physics';
  }

  if (trimmed.includes('chem')) {
    return 'Chemistry';
  }

  if (trimmed.includes('bio')) {
    return 'Biology';
  }

  if (trimmed.includes('math') || trimmed.includes('algebra') || trimmed.includes('geometry') || trimmed.includes('calculus')) {
    return 'Math';
  }

  return 'Other';
}

async function classifySubject(question) {
  if (!model) {
    return 'Other';
  }

  try {
    const classifyPrompt = `
Classify this question into one school subject category (Physics, Chemistry, Biology, Math, or Other):
"${question}"
Return only the category name.
`;

    const result = await model.generateContent(classifyPrompt);
    const response = await result.response;
    const rawSubject = response.text().trim();
    const subject = normalizeSubjectCategory(rawSubject);

    console.log(`📚 Classified subject (raw: ${rawSubject}) => ${subject}`);
    return subject;
  } catch (error) {
    console.error('❌ Error classifying subject:', error.message);
    return 'Other';
  }
}

/**
 * Generate learning summary from question history
 * @param {string} subjectName - Subject name
 * @param {Array} history - Array of history documents
 * @returns {Promise<string>} AI-generated summary
 */
async function generateSummary(subjectName, history) {
  if (!model) {
    throw new Error('Gemini AI not initialized');
  }

  const summaryPrompt = `
Here are the user's previous ${subjectName} questions and answers:
${history.map((x, i) => `${i + 1}. Q: ${x.question}\nA: ${x.response}`).join('\n\n')}

Give a short and simple summary of what the user has learned so far in ${subjectName}. Keep it under 100 words and suitable for voice response.
`;

  const result = await model.generateContent(summaryPrompt);
  const response = await result.response;
  return response.text();
}

module.exports = {
  initializeGemini,
  isInitialized,
  getModel,
  generateAnswer,
  classifySubject,
  generateSummary
};
