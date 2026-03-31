import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const defaultFromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Sends an SMS using the Twilio API.
 * abstraction layer to switch providers easily in the future.
 * 
 * @param {string} to Phone number in E.164 format (e.g., '+919876543210')
 * @param {string} message Actual text message to send
 * @param {string} fromNumber (Optional) override default from number
 * @returns {Object} result { success: boolean, message/error string }
 */
export const sendSMS = async (to, message, fromNumber = defaultFromNumber) => {
  if (!client || !fromNumber) {
    console.warn("Twilio credentials missing. Check your .env file.");
    return { success: false, error: "Twilio credentials missing in environment variables" };
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    return { success: true, reqId: response.sid };
  } catch (error) {
    console.error("Twilio SMS Provider Error:", error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
};
