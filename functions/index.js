const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'carpool802@gmail.com',
    pass: 'michael.123456Jhon',
  },
});

exports.sendEmailNotification = functions.firestore
  .document('users/{userId}')
  .onUpdate((change, context) => {
    const beforeData = change.before.data(); // data before the update
    const afterData = change.after.data(); // data after the update

    if (beforeData.firsttimestatus !== afterData.firsttimestatus) {
      const { email, display_name, firsttimestatus } = afterData;

      let mailOptions = {
        from: 'carpool802@gmail.com',
        to: email,
        subject: '',
        text: '',
      };

      if (firsttimestatus === 'approve') {
        mailOptions.subject = 'Account Verified';
        mailOptions.text = `Hello ${display_name},\n\nYour account has been verified. You can now apply for tasks or jobs.\n\nBest regards,\nYour Company`;
      } else if (firsttimestatus === 'disapprove') {
        mailOptions.subject = 'Account Disapproved';
        mailOptions.text = `Hello ${display_name},\n\nYour account has been disapproved and your data has been deleted from our application. You can sign in again using the same email, but make sure the documents needed are correct.\n\nBest regards,\nYour Company`;
      }

      return transporter.sendMail(mailOptions)
        .then(() => {
          console.log('Email sent successfully');
          return null;
        })
        .catch(error => {
          console.error('Error sending email:', error);
          return null;
        });
    }
    return null;
  });
