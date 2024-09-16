const express = require("express");
const cors = require("cors");
const nodejsmailer = require("nodemailer");
require("dotenv").config(); // to handle sensitive information securely

const app = express();
app.use(cors());
app.use(express.json());

// Nodemailer setup
const transporter = nodejsmailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

app.post("/send-email", (req, res) => {
  const { to, subject, message } = req.body;
  sendMail(to, subject, message);
  res.send("Email notification sent");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
