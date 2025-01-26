require('dotenv').config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendEmailVerification = async (user) => {
    await transporter.sendMail({
        from: `"Habit Tracker" <${process.env.MY_EMAIL}>`, // sender address
        to: user.email, // list of receivers
        subject: "Email Verification", // Subject line
        text: "Click the link to verify your email", // plain text body
        html: `<h1>Click the following link to verify your email address</h1>
        http://localhost:8000/api/auth/email-verification/${user._id}`, // html body
      });
}

const resetPassword = async (user, redirectLink) => {
    await transporter.sendMail({
        from: `"Habit Tracker" <${process.env.MY_EMAIL}>`, // sender address
        to: user.email, // list of receivers
        subject: "Reset Password", // Subject line
        text: "Click the link to reset your password", // plain text body
        html: `<h1>Click the following link to verify your email address</h1>
                <a href="${redirectLink}">Click to reset the password</a>`, // html body
      });
}

module.exports = {sendEmailVerification, resetPassword};