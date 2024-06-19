const nodemailer = require('nodemailer');
const mgTransport = require('nodemailer-mailgun-transport');
const pug = require('pug');
const { convert } = require('html-to-text');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({
  path: path.resolve(__dirname, './../config.env')
});

module.exports = class paymentEmail {
  constructor(user, url, transactionNumber, amountPaid, transactionDate) {
    this.to = user.email;
    this.firstName = user.name;
    this.url = url;
    this.transactionNumber = transactionNumber;
    this.amountPaid = amountPaid;
    this.transactionDate = transactionDate;
    this.from = `Alberto Dgedge <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Configuração para produção usando Mailgun
      return nodemailer.createTransport(
        mgTransport({
          auth: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN
          }
        })
      );
    }

    // Configuração para desenvolvimento local (outra alternativa)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
      transactionNumber: this.transactionNumber,
      amountPaid: this.amountPaid,
      transactionDate: this.transactionDate
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html)
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async makePayment() {
    await this.send('payment', 'Pagamento efectuado com sucesso');
  }
};
