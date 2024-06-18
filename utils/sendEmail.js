const Email = require('./email');

const user = {
  email: 'comercial1.netline@gmail.com',
  name: 'User Teste'
};

const url = 'http://example.com/reset-password';

const sendTestEmail = async () => {
  const email = new Email(user, url);
  try {
    await email.sendWelcome();
    console.log('Email de boas-vindas enviado com sucesso!');
  } catch (err) {
    console.error('Erro ao enviar o email:', err.message);
  }
};

sendTestEmail();
