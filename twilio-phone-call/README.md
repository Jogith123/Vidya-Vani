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
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   GOOGLE     │ │   GOOGLE     │ │   GOOGLE     │
│ SPEECH-TO-   │ │  GEMINI AI   │ │  TEXT-TO-    │
│    TEXT      │ │              │ │   SPEECH     │
└──────────────┘ └──────────────┘ └──────────────┘
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
```

### **Step 3: Add Google Credentials**
- Download `google-credentials.json` from Google Cloud Console
- Place it in the `twilio-phone-call` folder
- Enable Speech-to-Text and Text-to-Speech APIs

### **Step 4: Start ngrok (Terminal 1)**
```bash
ngrok http 3000
# Copy the URL (e.g., https://xxxx.ngrok.io)
# Update BASE_URL in .env
```

### **Step 5: Configure Twilio Webhook**
- Go to Twilio Console → Phone Numbers
- Set webhook: `https://your-ngrok-url.ngrok.io/ivr/welcome`

### **Step 6: Start Server (Terminal 2)**
```bash
npm run server
```

✅ **Done!** Call your Twilio number to test.


## 🎓 Educational Impact

Vidya Vani aims to democratize education by:
- Reaching students without internet access
- Providing 24/7 learning support
- Eliminating the need for expensive devices
- Making AI-powered education accessible to all

**Knowledge at Your Call** - Because every student deserves access to quality education, regardless of their resources.

---

**Built with ❤️ for accessible education**
