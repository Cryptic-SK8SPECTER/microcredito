const express = require('express');
const paymentController = require('./../controllers/paymentController');
const authController = require('./../controllers/authController');

const router = express.Router();

// router.param('id', tourController.checkID);

router.use(authController.protect);

router.get('/checkout-session/:loanId', paymentController.getCheckoutSession);

router.route('/').get(paymentController.getAllPayments);

router
  .route('/:id')
  //   .get(paymentController.getTour)
  .post(
    authController.protect,
    authController.restrictTo('client'),
    paymentController.makePayment
  )
  .patch(
    authController.protect,
    authController.restrictTo('client'),
    paymentController.updatePayment
  );
//   .delete(paymentController.deleteT);

module.exports = router;
