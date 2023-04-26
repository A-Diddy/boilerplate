// Send reset page link with embedded token via email
const nodemailer = require("nodemailer");

/***************************************************************
 * Send an Email
 *
 *  If the 'from' string is not included, the system default will
 *  be used ('process.env.EMAIL_ADDRESS').
 *
 * @param {object} mailOptions: {*from, to, subject, text}
 * @returns {Promise<string>}
 ***************************************************************/
const sendEmail = (mailOptions) => {
  mailOptions = mailOptions || {};
  mailOptions.from = mailOptions.from || process.env.EMAIL_ADDRESS;

  return new Promise(async (resolve, reject) => {
    try {
      const transporter = await nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_ADDRESS,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          return reject(error);
        }

        console.log('Email sent: ' + info.response);
        return resolve(info);
      });
      // return resolve(emailResult);
    } catch (e) {
      console.log(e);
      return reject(e);
    }
  })
}

module.exports = {sendEmail};