import emailjs from '@emailjs/browser';

const testEmail = async () => {
  const serviceId = 'service_pz0xzv8';
  const templateId = 'template_p9ttwae';
  const publicKey = 'x1_RUwD-1cdvAc52E';

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
