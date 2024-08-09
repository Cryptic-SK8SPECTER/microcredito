const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('./../utils/catchAsync');
const Payment = require('./../models/paymentModel');
const AppError = require('./../utils/appError');
const Loan = require('./../models/loanModel');
const APIFeatures = require('./../utils/apiFeatures');
const factory = require('./handlerFactory');
const Email = require('./../utils/paymentEmail');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Obter o empréstimo atual
  const loan = await Loan.findById(req.params.loanId);

  // 2) Criar sessão de checkout
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/historic`,
    cancel_url: `${req.protocol}://${req.get('host')}/historic`,
    customer_email: req.user.email,
    client_reference_id: req.params.loanId,
    mode: 'payment', // Adicionando o modo de transação
    line_items: [
      {
        price_data: {
          currency: 'MZN',
          product_data: {
            name: `Pagamento de empréstimo`,
            description: loan.status
          },
          unit_amount: loan.totalPrice * 100 // Convertendo para centavos
        },
        quantity: 1
      }
    ]
  });

  // 3) Enviar sessão como resposta
  res.status(200).json({
    status: 'success',
    session
  });
});

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
  const loan = await Loan.findById(loanId).populate('user');

  if (!loanId || !price) {
    return next(new AppError('Forneça um ID e preço do empréstimo', 400));
  }
  if (loan.status === 'Pending') {
    return next(
      new AppError(
        'Não é possível efetuar o pagamento de um empréstimo com status "Pendente"',
        400
      )
    );
  }

  if (price <= 0) {
    return next(new AppError('Forneça um preço válido', 400));
  }

  if (price > loan.totalPrice) {
    return next(new AppError('O pagamento excede o valor total devido', 400));
  }

  if (price !== loan.totalPrice) {
    return next(
      new AppError(
        'O pagamento não é igual ao valor total devido. Por favor, faça um pagamento integral',
        400
      )
    );
  }

  const existingPayment = await Payment.findOne({ loan: loanId });
  if (existingPayment) {
    return next(new AppError('O pagamento deste empréstimo já foi feito', 400));
  }

  const paymentData = {
    loan: loanId,
    price,
    paymentMethod,
    status: 'Approved'
  };

  const payment = await Payment.create(paymentData);

  // Enviar e-mail de confirmação de pagamento
  const { email, name } = loan.user;
  const firstName = name.split(' ')[0];
  const url = `${req.protocol}://${req.get('host')}/loans/${loanId}`; // URL de exemplo para detalhes do empréstimo

  await new Email(
    { email, name: firstName },
    url,
    payment.transactionNumber, // Passando transactionNumber para o email
    price,
    new Date().toLocaleDateString() // Passando a data do pagamento
  ).makePayment();

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
    return next(new AppError('Forneça um valor parcial válido', 400));
  }

  // Checks if the loan status is "Pending"
  if (loan.status === 'Pending') {
    return next(
      new AppError(
        'Não é possível efetuar o pagamento de um empréstimo com status "Pendente"',
        400
      )
    );
  }

  // Calculate the remaining loan amount
  const remainingAmount = loan.totalPrice - loan.amountPaid;

  // Checks whether the partial payment amount exceeds the remaining amount
  if (partialAmount > remainingAmount) {
    return next(
      new AppError('O pagamento excede o valor restante devido', 400)
    );
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
