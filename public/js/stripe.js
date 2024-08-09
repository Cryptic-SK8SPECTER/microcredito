/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const payLoan = async (loanId) => {
  
  try {
    // 1) Get checkout session from API
    const session = await axios(`http://127.0.0.1:8000/api/v1/payments/checkout-session/${loanId}`);
    console.log(session);

    // 2) Create checkout form + charge credit card
    const stripe = Stripe('pk_live_51Pl9sxKTkV3tiowHgpAN5YgWblxRrN1SVimFyxz9crVlg25X7FQBK0LJyXQMKUhasDgfSm8NGrgJSPfWdP1kP9cg00USVFTZfT');
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
