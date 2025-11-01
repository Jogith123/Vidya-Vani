# **VIDYA VANI**

### *Knowledge at Your Call*

---

## 🎓 About Vidya Vani

**Vidya Vani** is an AI-powered educational voice assistant that makes learning accessible to everyone through simple phone calls. No internet, no smartphone, no app required—just dial a number, ask your question, and get instant AI-generated answers spoken back to you.

The system bridges the digital divide by providing 24/7 educational support to students in rural and underserved areas who may not have access to computers or smartphones but have basic phone connectivity.

**Key Features:**
- 📞 Works on any phone (landline or mobile)
- 🎤 Voice-based interaction—just speak naturally
- 🤖 AI-powered answers using Google Gemini
- 🔊 High-quality speech recognition (90-95% accuracy)
- 🌍 Accessible anywhere, anytime
- ⚡ Real-time responses in seconds
- 💾 **NEW:** Question history stored in MongoDB
- 📚 **NEW:** Automatic subject classification (Physics, Chemistry, Biology, Math)
- 📊 **NEW:** Learning summaries based on your question history

---

## 🏗️ Technology Stack & Architecture

### **Why We Chose Each Technology**

```
┌─────────────────────────────────────────────────────────┐
│                    USER (Phone Call)                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   TWILIO VOICE API                       │
│  Why: Industry-leading telephony platform                │
│  - Reliable call routing and management                  │
│  - Built-in audio recording                              │
│  - Global phone number support                           │
│  - Easy webhook integration                              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              NODE.JS + EXPRESS.JS SERVER                 │
│  Why: Perfect for real-time, event-driven applications   │
│  - Non-blocking I/O for concurrent calls                 │
│  - Lightweight and fast                                  │
│  - Rich ecosystem of packages                            │
│  - Easy API integration                                  │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   GOOGLE     │ │   GOOGLE     │ │   GOOGLE     │ │   MONGODB    │
│ SPEECH-TO-   │ │  GEMINI AI   │ │  TEXT-TO-    │ │   DATABASE   │
│    TEXT      │ │              │ │   SPEECH     │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
│ Transcribes  │ │ Generates    │ │ Converts     │ │ Stores Q&A   │
│ voice to     │ │ answers &    │ │ text to      │ │ history with │
│ text         │ │ classifies   │ │ natural      │ │ subject      │
│              │ │ subjects     │ │ speech       │ │ classification│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---



## 📦 Quick Installation Guide

### **Step 1: Install Dependencies**
```bash
cd Vidya-Vani/twilio-phone-call
npm install
```

### **Step 2: Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your credentials:
# - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
# - GEMINI_API_KEY
# - GOOGLE_TTS_KEY_FILE=./google-credentials.json
# - MONGODB_URI=mongodb://localhost:27017/vidya-vani (or MongoDB Atlas URL)
```

### **Step 3: Setup MongoDB**
```bash
# Option A: Local MongoDB
# Install MongoDB and start service

# Option B: MongoDB Atlas (Cloud - Recommended)
# 1. Create free account at mongodb.com/cloud/atlas
# 2. Create cluster and get connection string
# 3. Add to .env: MONGODB_URI=mongodb+srv://...

# Test MongoDB connection
npm run test-mongodb
```

### **Step 4: Add Google Credentials**
- Download `google-credentials.json` from Google Cloud Console
- Place it in the `twilio-phone-call` folder
- Enable Speech-to-Text and Text-to-Speech APIs

### **Step 5: Start ngrok (Terminal 1)**
```bash
ngrok http 3000
# Copy the URL (e.g., https://xxxx.ngrok.io)
# Update BASE_URL in .env
```

### **Step 6: Configure Twilio Webhook**
- Go to Twilio Console → Phone Numbers
- Set webhook: `https://your-ngrok-url.ngrok.io/ivr/welcome`

### **Step 7: Start Server (Terminal 2)**
```bash
npm run server
```

✅ **Done!** Call your Twilio number to test.

---

## 📱 How to Use

### **Phone Menu Options:**
1. **Press 1** - Ask a question
2. **Press 2** - Stop recording
3. **Press 3** - Get AI answer
4. **Press 4** - Get learning summary (NEW!)
5. **Press 9** - End call

### **Example Call Flow:**
```
1. Call Vidya Vani number
2. Press 1 to ask question
3. Ask: "What is photosynthesis?"
4. Press 2 to stop recording
5. Press 3 to hear answer
6. (Answer is automatically saved to MongoDB with subject: Biology)
7. Press 4 to get summary
8. Say: "Biology"
9. Hear summary of last 5 Biology questions
10. Press 9 to end call
```

---

## 📚 New MongoDB Features

### **Automatic Subject Classification**
Every question is automatically classified into:
- Physics
- Chemistry
- Biology
- Math
- Other

### **Question History**
All questions and answers are stored with:
- User phone number
- Question text
- AI response
- Subject category
- Timestamp

### **Learning Summaries**
Get AI-generated summaries of your learning progress:
- Last 5 questions on any subject
- Concise overview of what you've learned
- Delivered via voice

### **Documentation**
- 📖 [MongoDB Setup Guide](MONGODB_SETUP.md)
- 📖 [API Documentation](API_DOCUMENTATION.md)
- 🧪 Test MongoDB: `npm run test-mongodb`


## 🎓 Educational Impact

Vidya Vani aims to democratize education by:
- Reaching students without internet access
- Providing 24/7 learning support
- Eliminating the need for expensive devices
- Making AI-powered education accessible to all

**Knowledge at Your Call** - Because every student deserves access to quality education, regardless of their resources.

---

**Built with ❤️ for accessible education**
