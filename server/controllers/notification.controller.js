import { sendSMS } from "../lib/smsProvider.js";
import { canSendNotification } from "../utils/notification.helper.js";
import InvoiceModel from "../models/invoice.model.js";

export const sendInvoiceSMS = async (req, res) => {
  const { invoiceId, to, invoiceNumber, amount, dueDate, customerName } = req.body;

  if (!to || !invoiceId) {
    return res.status(400).json({ success: false, message: "Phone number and invoice ID are required" });
  }

  try {
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const check = canSendNotification(invoice.lastSmsSentAt, 48);
    if (!check.canSend) {
      return res.status(400).json({ success: false, message: `SMS already sent recently. Try again after ${check.remainingHours} hours.` });
    }

    // Twilio requires E.164 format (e.g., '+919876543210')
    let formattedTo = String(to).replace(/[^\d+]/g, ''); // keep digits and plus sign
    if (!formattedTo.startsWith('+')) {
      // If it's a 10-digit number, assume it's Indian (+91 prefix)
      formattedTo = formattedTo.length === 10 ? '+91' + formattedTo : '+' + formattedTo;
    }

    // Construct SMS message body
    const name = customerName || 'Customer';
    const messageBody = `Dear ${name}, your invoice #${invoiceNumber} for amount Rs. ${amount} is due on ${dueDate}. Please arrange the payment. Thank you.`;

    const result = await sendSMS(formattedTo, messageBody);

    if (result.success) {
      invoice.lastSmsSentAt = new Date();
      await invoice.save();
      res.status(200).json({ success: true, message: "SMS sent successfully", reqId: result.reqId });
    } else {
      console.error("SMS Send Error:", result);
      const errorMsg = result.error || "Failed to send SMS";
      res.status(500).json({ success: false, message: errorMsg });
    }
  } catch (error) {
    console.error("sendInvoiceSMS server error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const checkEmailCooldown = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ success: false, message: "Invoice ID required" });

    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const check = canSendNotification(invoice.lastEmailSentAt, 48);
    if (!check.canSend) {
      return res.status(400).json({ success: false, message: `Email already sent recently. Try again after ${check.remainingHours} hours.` });
    }

    return res.status(200).json({ success: true, message: "Can send email" });
  } catch (error) {
    console.error("checkEmailCooldown error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logEmailSuccess = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ success: false, message: "Invoice ID required" });

    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    invoice.lastEmailSentAt = new Date();
    await invoice.save();

    return res.status(200).json({ success: true, message: "Email send logged successfully" });
  } catch (error) {
    console.error("logEmailSuccess error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
