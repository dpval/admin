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
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config(); // To handle sensitive information securely
const twilio = require("twilio");

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Nodemailer setup for email
const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "tradeareus5@gmail.com", // your email
    pass: "vzbvotpijcjpmhez", // Consider using an App Password for security
  },
});

// Function to send email
function sendMail(to, subject, message) {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        to: to,
        subject: subject,
        html: message,
      },
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          reject(err);
        } else {
          console.log("Email sent:", info.response);
          resolve(info);
        }
      }
    );
  });
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
app.post("/send-email", async (req, res) => {
  const { to, subject, message } = req.body;
  try {
    await sendMail(to, subject, message);
    res.status(200).send("Email notification sent");
  } catch (error) {
    res.status(500).send("Failed to send email notification");
  }
});

// API route to send SMS
app.post("/send-sms", (req, res) => {
  const { to, message } = req.body;
  sendSMS(to, message);
  res.send("SMS notification sent");
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
