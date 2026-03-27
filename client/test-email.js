import emailjs from '@emailjs/browser';

const testEmail = async () => {
  const serviceId = '';
  const templateId = '';
  const publicKey = '';

  const templateParams = {
    to_email: 'test@example.com',
    to_name: 'Test User',
    invoice_number: 'INV-TEST-001',
    amount: 1000,
    due_date: '12/12/2026'
  };

  try {
    console.log("Attempting to send email...");
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log("SUCCESS!", response.status, response.text);
  } catch (error) {
    console.error("FAILED...", error);
  }
};

testEmail();
