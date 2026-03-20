import { sendSMS } from "../lib/twilio.js";

export const sendInvoiceSMS = async (req, res) => {
  const { to, invoiceNumber, amount, dueDate, customerName } = req.body;

  if (!to) {
    return res.status(400).json({ success: false, message: "Phone number is required" });
  }

  // Ensure 'to' has a '+' prefix and correct country code for Twilio compatibility
  // If it's a 10-digit number, assume it's Indian (+91)
  let formattedTo = to.trim();
  if (formattedTo.length === 10 && !formattedTo.startsWith('+')) {
    formattedTo = '+91' + formattedTo;
  } else if (!formattedTo.startsWith('+')) {
    formattedTo = '+' + formattedTo;
  }

  const message = `Hello ${customerName || 'Customer'}, your invoice #${invoiceNumber} for Rs. ${amount} is due on ${dueDate}. Please make the payment. Thank you!`;

  const result = await sendSMS(formattedTo, message);

  if (result.success) {
    res.status(200).json({ success: true, message: "SMS sent successfully", sid: result.sid });
  } else {
    console.error("SMS Send Error:", result);
    let errorMsg = result.error || "Failed to send SMS";
    
    // Handle specific Twilio Trial Account error
    if (result.code === 21608) {
      errorMsg = "Twilio Trial Account: The destination number is not verified. Please verify it in your Twilio Console.";
    } else if (result.status === 401) {
      errorMsg = "Twilio Authentication Failed: Please check your Auth Token in the .env file.";
    }

    res.status(500).json({ success: false, message: errorMsg, code: result.code });
  }
};
