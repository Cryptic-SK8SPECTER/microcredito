const express = require('express');
const loanController = require('./../controllers/loanController');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    loanController.getAllLoans
  )
  .post(
    authController.protect,
    authController.restrictTo('client'),
    userController.setUserId,
    loanController.createLoan
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    loanController.getLoan
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    loanController.updateLoan
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    loanController.deleteLoan
  );

module.exports = router;
