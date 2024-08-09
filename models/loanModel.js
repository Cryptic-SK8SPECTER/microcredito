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
    paymentDeadline: {
      type: Date,
      required: [true, 'A loan must have a payment deadline']
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
      enum: ['Pending', 'Late', 'Approved', 'Paid', 'Canceled', 'Rejected'],
      default: 'Pending'
    },
    createdAt: {
      type: String,
      default: function() {
        const formattedDate = new Date();
        const day = String(formattedDate.getDate()).padStart(2, '0');
        const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
        const year = formattedDate.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

loanSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user'
  });
  next();
});

// Middleware para calcular o prazo de pagamento com base no paymentTerm e na data de criação
loanSchema.pre('save', function(next) {
  if (this.isNew) {
    const termInMonths = this.paymentTerm;
    this.paymentDeadline = new Date(this.createdAt);
    this.paymentDeadline.setMonth(
      this.paymentDeadline.getMonth() + termInMonths
    );
  }
  next();
});

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

loanSchema.pre('save', function(next) {
  const formattedDate = new Date(this.createdAt);
  const day = String(formattedDate.getDate()).padStart(2, '0');
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
  const year = formattedDate.getFullYear();
  this.createdAt = `${day}/${month}/${year}`;
  next();
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
