const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A loan must belong to a client']
    },
    price: {
      type: Number,
      required: [true, 'Loan amount is mandatory'],
      min: [0, 'Amount paid cannot be less than 0']
    },
    paymentTerm: {
      type: Number,
      required: [true, 'A tour must have a payment term'],
      min: [1, 'Payment term must be at least 1 month'],
      max: [12, 'Payment term must be less than 12 months']
    },
    rate: {
      type: Number,
      default: 30,
      min: [1, 'loan rate must be above 1%'],
      max: [100, 'loan rate must be below 100%']
    },
    totalPrice: {
      type: Number
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be less than 0']
    },
    GuaranteesOffered: {
      type: String,
      required: false,
      trim: true,
      maxlength: [
        40,
        'A Guarantees offered must have less or equal then 40 characters'
      ],
      minlength: [
        10,
        'A Guarantees offered must have more or equal then 10 characters'
      ]
    },
    status: {
      type: String,
      enum: ['Pending', 'Late', 'Approved', 'Partially Paid'],
      default: 'Pending'
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

// Pre-save middleware to calculate total price before saving
loanSchema.pre('save', function(next) {
  this.totalPrice = this.price + this.price * (this.rate / 100);
  next();
});

// Pre-update middleware to calculate total price before updating
loanSchema.pre('findOneAndUpdate', function(next) {
  if (this._update.price != null && this._update.rate != null) {
    this._update.totalPrice =
      this._update.price + this._update.price * (this._update.rate / 100);
  } else if (this._update.price != null) {
    this._update.totalPrice =
      this._update.price + this._update.price * (this.rate / 100);
  } else if (this._update.rate != null) {
    this._update.totalPrice =
      this.price + this.price * (this._update.rate / 100);
  }
  next();
});

// Check if payment is late and update status
loanSchema.pre('save', function(next) {
  const currentDate = new Date();
  const createdAt = new Date(this.createdAt);
  const monthsPassed =
    (currentDate.getFullYear() - createdAt.getFullYear()) * 12 +
    currentDate.getMonth() -
    createdAt.getMonth();
  if (monthsPassed > this.paymentTerm) {
    this.status = 'Late';
  }
  next();
});

// Virtual property to calculate remaining months
loanSchema.virtual('remainingMonths').get(function() {
  const currentDate = new Date();
  const createdAt = new Date(this.createdAt);
  const monthsPassed =
    (currentDate.getFullYear() - createdAt.getFullYear()) * 12 +
    currentDate.getMonth() -
    createdAt.getMonth();
  return Math.max(0, this.paymentTerm - monthsPassed);
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
