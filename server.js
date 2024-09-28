// const express = require("express");
// const cors = require("cors");
// const nodejsmailer = require("nodemailer");
// require("dotenv").config(); // to handle sensitive information securely

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Nodemailer setup
// const transporter = nodejsmailer.createTransport({
//   secure: true,
//   host: "smtp.gmail.com",
//   port: 465,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// function sendMail(to, sub, msg) {
//   transporter.sendMail(
//     {
//       to: to,
//       subject: sub,
//       html: msg,
//     },
//     (err, info) => {
//       if (err) {
//         console.error("Error sending email:", err);
//       } else {
//         console.log("Email sent:", info.response);
//       }
//     }
//   );
// }

// app.post("/send-email", (req, res) => {
//   const { to, subject, message } = req.body;
//   sendMail(to, subject, message);
//   res.send("Email notification sent");
// });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
const express = require("express");
const cors = require("cors");
const nodejsmailer = require("nodemailer");
require("dotenv").config(); // To handle sensitive information securely
const twilio = require("twilio");

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Nodemailer setup for email
const transporter = nodejsmailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send email
function sendMail(to, sub, msg) {
  transporter.sendMail(
    {
      to: to,
      subject: sub,
      html: msg,
    },
    (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent:", info.response);
      }
    }
  );
}

// Twilio setup for SMS
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Function to send SMS
const sendSMS = async (to, body) => {
  const msgOptions = {
    from: process.env.TWILIO_FROM_NUMBER,
    to: to,
    body: body,
  };

  try {
    const message = await client.messages.create(msgOptions);
    console.log("SMS sent:", message.sid);
  } catch (err) {
    console.error("Error sending SMS:", err);
  }
};

// API route to send email
app.post("/send-email", (req, res) => {
  const { to, subject, message } = req.body;
  sendMail(to, subject, message);
  res.send("Email notification sent");
});

// API route to send SMS
app.post("/send-sms", (req, res) => {
  const { to, message } = req.body;
  sendSMS(to, message);
  res.send("SMS notification sent");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
