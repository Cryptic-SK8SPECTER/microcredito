/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const addUser = async (
  name,
  email,
  address,
  country,
  nuit,
  role,
  contact,
  password,
  passwordConfirm
) => {
  try {
    // console.log({
    //   name,
    //   email,
    //   address,
    //   country,
    //   nuit,
    //   role,
    //   contact,
    //   password,
    //   passwordConfirm
    // });

    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/signup',
      data: {
        name,
        email,
        address,
        country,
        nuit,
        role,
        contact,
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Usuário criado com sucesso!');
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
