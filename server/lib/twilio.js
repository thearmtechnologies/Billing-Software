import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
let fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

if (fromPhoneNumber && !fromPhoneNumber.startsWith('+')) {
  fromPhoneNumber = '+' + fromPhoneNumber.trim();
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendSMS = async (to, message) => {
  if (!client) {
    console.warn("Twilio client not initialized. Check your .env file.");
    return { success: false, error: "Twilio credentials missing" };
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: to,
    });
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    // Return specific Twilio error info if available
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo 
    };
  }
};
