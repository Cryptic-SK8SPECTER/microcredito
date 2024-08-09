const nodemailer = require('nodemailer');
const mgTransport = require('nodemailer-mailgun-transport');
const pug = require('pug');
const { convert } = require('html-to-text'); // Atualize a importação conforme a versão atual
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({
  path: path.resolve(__dirname, './../config.env')
});

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
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

  // Enviar o e-mail
  async send(template, subject) {
    // 1) Renderizar HTML com base no template Pug
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Definir opções do e-mail
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html) // Atualize a função de conversão
    };

    // 3) Criar o transportador e enviar o e-mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Bem-vindo à família do microcrédito!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Seu token de redefinição de senha (válido por apenas 10 minutos)'
    );
  }
};
