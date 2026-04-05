### 1. Twilio SMS Setup
Step 1: Create a Twilio Account
Go to Twilio Console and sign up.
Verify your email and personal phone number.
Once logged in, you will be on a "Trial" account (requires upgrading and adding funds for production use).
Step 2: Get a Twilio Phone Number
Navigate to Phone Numbers > Manage > Buy a number.
Search for a number in your desired country that supports SMS.
Purchase the number.
Step 3: Gather API Credentials
From the main Twilio Console dashboard, locate and copy:

Account SID
Auth Token
Your Twilio Phone Number
Step 4: Environment Variables (
.env
)
Add the following to your backend 
.env
 file:

env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

### 2. Twilio WhatsApp Setup
Step 1: Activate the WhatsApp Sandbox (For Testing)
Go to Messaging > Try it out > Send a WhatsApp message.
You will see a Twilio Sandbox number (e.g., +14155238886) and a join code (e.g., join something-random).
Send the join code from your personal WhatsApp to the Sandbox number to opt-in. (Critical for testing).
Step 2: WhatsApp Production Approval (Go-Live)
Navigate to Messaging > Senders > WhatsApp Senders.
Submit your Facebook Business Manager ID and phone number to be approved by WhatsApp.
Wait for approval from Meta (takes 2-7 days).
Step 3: Create WhatsApp Message Templates
WhatsApp requires pre-approved templates to initiate conversations (if the user hasn't messaged you in the last 24 hours).

Go to Messaging > Senders > WhatsApp Templates.
Create a new template and submit it to Meta for approval.
Recommended Template Content: Name: invoice_reminder Body: Dear {{1}}, your invoice #{{2}} for amount Rs. {{3}} is due on {{4}}. Please arrange the payment. Thank you.

### 3. EmailJS Setup (Frontend Emails)
EmailJS allows you to send emails directly from the React/Vite frontend without a backend mail server, simplifying server infrastructure.

Step 1: Create an EmailJS Account
Sign up at EmailJS.
Navigate to Email Services and add a new service (e.g., Gmail, Outlook, SMTP).
Connect your email account and note down the Service ID (e.g., service_abc123).
Step 2: Create an Email Template
Navigate to Email Templates and click Create New Template.
Note down the Template ID (e.g., template_xyz987).
Configure the template layout using variables wrapped in double curly braces {{variable_name}}.
Template Example Configuration:

To Email: {{to_email}}
From Name: Your Company Name
Subject: Invoice #{{invoice_number}} is due on {{due_date}}
Message Body:

.env
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id


for template create a ***invoice_pdf*** in template section of emailjs