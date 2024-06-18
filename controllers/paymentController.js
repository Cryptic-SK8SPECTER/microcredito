const Payment = require('./../models/paymentModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Loan = require('./../models/loanModel');
const APIFeatures = require('./../utils/apiFeatures');
const factory = require('./handlerFactory');

exports.getAllPayments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Payment.find().populate(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const payment = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: payment.length,
    data: {
      payment
    }
  });
});

exports.makePayment = catchAsync(async (req, res, next) => {
  const loanId = req.params.id;
  const { price, paymentMethod } = req.body;
  const loan = await Loan.findById(loanId);

  if (!loanId || !price) {
    return next(new AppError('Please provide a loan ID and price', 400));
  }
  if (loan.status === 'Pending') {
    return next(
      new AppError('Cannot make payment for a loan with status "Pending"', 400)
    );
  }

  if (price <= 0) {
    return next(new AppError('Please provide a valid price', 400));
  }

  if (price > loan.totalPrice) {
    return next(new AppError('Payment exceeds total amount due', 400));
  }

  if (price !== loan.totalPrice) {
    return next(
      new AppError(
        'Payment does not equal total amount due. Please make a full payment',
        400
      )
    );
  }

  // Check if a payment for this loan already exists
  const existingPayment = await Payment.findOne({ loan: loanId });
  if (existingPayment) {
    return next(
      new AppError('Payment for this loan has already been made', 400)
    );
  }

  const paymentData = {
    loan: loanId,
    price,
    paymentMethod,
    status: 'Approved'
  };

  const payment = await Payment.create(paymentData);
  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

exports.updatePayment = catchAsync(async (req, res, next) => {
  const loanId = req.params.id; // Extrai o loanId dos parâmetros da URL
  const { partialAmount } = req.body; // Extrai o partialAmount do corpo da requisição

  // Checks if the loan exists
  const loan = await Loan.findById(loanId);
  if (!loan) {
    return next(new AppError('Loan not found', 404));
  }

  // Checks if the partial payment amount is valid
  if (!partialAmount || partialAmount <= 0) {
    return next(new AppError('Please provide a valid partial amount', 400));
  }

  // Checks if the loan status is "Pending"
  if (loan.status === 'Pending') {
    return next(
      new AppError('Cannot make payment for a loan with status "Pending"', 400)
    );
  }

  // Calculate the remaining loan amount
  const remainingAmount = loan.totalPrice - loan.amountPaid;

  // Checks whether the partial payment amount exceeds the remaining amount
  if (partialAmount > remainingAmount) {
    return next(new AppError('Payment exceeds remaining amount due', 400));
  }

  // Update the amount paid on the loan
  loan.amountPaid += partialAmount;

  // Update loan status based on amount paid
  if (loan.amountPaid === loan.totalPrice) {
    loan.status = 'Approved';
  } else if (loan.amountPaid < loan.totalPrice) {
    loan.status = 'Partially Paid';
  }

  // Save the updated loan
  await loan.save();

  // Create the payment record
  const paymentData = {
    loan: loanId,
    price: partialAmount,
    status: loan.status
  };

  const payment = await Payment.create(paymentData);

  // Returns the updated loan and payment record as a response
  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

exports.deletePayment = factory.deleteOne(Payment);
