import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: ' smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'carpool802@gmail.com',
        pass: 'erkw uarn rser pytp'
    },
});
transporter.sendMail({
    to: 'who_to_send_to@your_domain.com',
    subject: 'Your application',
    html: '<h1>Testing</h1>'

}).then (()=>{
    console.log('Email sent');

}).catch(err =>{
    console.error(err);
});

