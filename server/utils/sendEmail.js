const nodemailer = require('nodemailer');

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
};

// Sends one email. Uses Brevo's web API when BREVO_API_KEY is set (production),
// and Gmail SMTP otherwise (local development).
const sendEmail = async ({ to, subject, html }) => {
  if (process.env.BREVO_API_KEY) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Campus Connect', email: process.env.EMAIL_USER },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
    }
    return;
  }

  await getTransporter().sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};

module.exports = { sendEmail };