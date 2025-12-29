require('dotenv').config();
console.log("SID exists:", !!process.env.TWILIO_ACCOUNT_SID);
console.log("Token exists:", !!process.env.TWILIO_AUTH_TOKEN);
console.log("SID length:", process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.length : 0);
