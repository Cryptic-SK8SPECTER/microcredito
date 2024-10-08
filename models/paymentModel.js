const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'The loan is mandatory']
    },
    price: {
      type: Number,
      required: [true, 'Payment amount is mandatory'],
      min: [0, 'The payment amount must be positive']
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is mandatory'],
      enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Other']
    },
    transactionNumber: {
      type: String,
      unique: true,
      default: () => `TXN${Date.now()}` // Gerar um número de transação único
    },
    status: {
      type: String,
      default: 'Approved',
      enum: ['Approved', 'Partially Paid']
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

paymentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'loan'
  });
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
