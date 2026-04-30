const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: "inkartproduct.colourstreak@gmail.com",
    pass: "itbrtpkqfzyujdut", // app password
  },
});

// ✅ Test function
const testEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: `"Your Store" <inkartproduct.colourstreak@gmail.com>`,
      to: "abhikushwaha0408@gmail.com",
      subject: "Test Email 🚀",
      html: "<h1>Email Working ✅</h1><p>This is a test email from Nodemailer</p>",
      text: "Email Working - This is a test email",
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
};

// call function
testEmail();