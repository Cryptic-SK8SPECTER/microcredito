/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const getloans = async id => {
  try {
    const res = await axios({
      method: 'GET',
      url: `http://127.0.0.1:8000/api/v1/loans?user=${id}`,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `Histórico carregado com sucesso!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const createLaon = async (price, paymentTerm, GuaranteesOffered) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `http://127.0.0.1:8000/api/v1/loans`,
      data: {
        price,
        paymentTerm,
        GuaranteesOffered
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', `Empréstimo submetido com sucesso!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const approveLoan = async id => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/loans/loans/${id}/approve`
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Empréstimo aprovado com sucesso');
      location.reload(); // Atualiza a página para refletir mudanças
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const rejectLoan = async id => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/loans/loans/${id}/reject`
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Empréstimo rejeitado com sucesso');
      location.reload(); // Atualiza a página para refletir mudanças
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
