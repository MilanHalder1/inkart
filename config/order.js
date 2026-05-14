'use strict';

const nodemailer = require('nodemailer');

require('dotenv').config();


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',

  port: 587,

  secure: false,

  auth: {
    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS,
  },
});


exports.sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
}) => {

  await transporter.sendMail({
    from: `"Inkart" <${process.env.EMAIL_USER}>`,

    to,

    subject,

    html,

    attachments,
  });
};