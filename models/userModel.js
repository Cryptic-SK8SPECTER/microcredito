const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  photo: {
    type: String,
    default: 'default.jpg'
  },
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please tell us your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  address: {
    type: String,
    required: [true, 'Please provide your address']
  },
  country: {
    type: String,
    enum: [
      'Moçambique',
      'África do Sul',
      'Albânia',
      'Alemanha',
      'Andorra',
      'Angola',
      'Antígua e Barbuda',
      'Arábia Saudita',
      'Argélia',
      'Argentina',
      'Arménia',
      'Austrália',
      'Áustria',
      'Azerbaijão',
      'Bahamas',
      'Bangladesh',
      'Barbados',
      'Bélgica',
      'Belize',
      'Benim',
      'Bolívia',
      'Bósnia e Herzegovina',
      'Botswana',
      'Brasil',
      'Brunei',
      'Bulgária',
      'Burquina Faso',
      'Burundi'
    ],
    required: [true, 'Please select your country']
  },
  role: {
    type: String,
    enum: ['user', 'client', 'admin'],
    required: [true, 'Please provide your role']
  },
  contact: {
    type: String,
    required: [true, 'Please provide your contact number']
  },
  nuit: {
    type: Number,
    required: [true, 'Please provide your nuit number'],
    minlength: 9
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Please provide the start date'],
    get: function(value) {
      return value
        ? `${value.getDate()}/${value.getMonth() + 1}/${value.getFullYear()}`
        : value;
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.set('toJSON', { getters: true });
userSchema.set('toObject', { getters: true });

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
