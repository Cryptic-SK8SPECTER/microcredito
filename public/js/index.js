/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { addUser } from './addUser';
import { createLaon, approveLoan, rejectLoan } from './getLoansByUser';
import { payLoan } from './stripe';
import {
  updateSettings,
  recoverPassword,
  resetPasswordByUSer
} from './updateSettings';

// DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const resetPasswordForm = document.querySelector('.recover-password-form');
const logOutBtnV1 = document.querySelector('.nav__el--logout-v1');
const userDataForm = document.querySelector('.form-user-data');
const loanDataForm = document.querySelector('.form-loan-data');
const userAddDataForm = document.querySelector('.form-user-data-v1');
const userPasswordForm = document.querySelector('.form-user-password');
const userResetPasswordForm = document.querySelector('.reset-password-form');
const approveLoanForms = document.querySelector('.approve-loan-form');
const rejectLoanForms = document.querySelector('.reject-loan-form');
const btnPays = document.querySelectorAll('.pay-loan');

if (approveLoanForms)
  approveLoanForms.addEventListener('click', async e => {
    e.preventDefault();

    const loanId = approveLoanForms.getAttribute('data-id');
    approveLoan(loanId); // Chama a função passando o ID do empréstimo
  });

if (rejectLoanForms)
  rejectLoanForms.addEventListener('click', async e => {
    e.preventDefault();

    const loanId = rejectLoanForms.getAttribute('data-id');
    rejectLoan(loanId); // Chama a função passando o ID do empréstimo
  });

if (loginForm)
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    recoverPassword(email);
  });
}

if (userResetPasswordForm) {
  userResetPasswordForm.addEventListener('submit', e => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const token = document.getElementById('token').value;

    resetPasswordByUSer(password, passwordConfirm, token);
  });
}

if (logOutBtn)
  logOutBtn.addEventListener('click', e => {
    logout();
  });
if (logOutBtnV1)
  logOutBtnV1.addEventListener('click', e => {
    logout();
  });

if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('photo', document.getElementById('photo').files[0]);
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('contact', document.getElementById('contact').value);
    form.append('country', document.getElementById('country').value);
    form.append('nuit', document.getElementById('nuit').value);

    updateSettings(form, 'data');
  });

if (userAddDataForm)
  userAddDataForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const country = document.getElementById('country').value;
    const nuit = document.getElementById('nuit').value;
    const role = document.getElementById('role').value;
    const contact = document.getElementById('contact').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    addUser(
      name,
      email,
      address,
      country,
      nuit,
      role,
      contact,
      password,
      passwordConfirm
    );
  });
if (loanDataForm)
  loanDataForm.addEventListener('submit', e => {
    e.preventDefault();

    const price = document.getElementById('price').value;
    const paymentDeadline = document.getElementById('paymentDeadline').value;
    const GuaranteesOffered = document.getElementById('GuaranteesOffered')
      .value;

    createLaon(price, paymentDeadline, GuaranteesOffered);
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent =
      'Atualizando...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Salvar senha';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (btnPays)
  btnPays.forEach(btnPay => {
    btnPay.addEventListener('click', e => {
      e.target.textContent = 'Processando...';
      const { loanId } = e.target.dataset;

      payLoan(loanId);
    });
  });
