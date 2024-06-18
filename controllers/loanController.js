const Loan = require('./../models/loanModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.getAllLoans = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Loan.find().populate({ path: 'user', select: '-__v -passwordChangedAt' }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const loans = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: loans.length,
    data: {
      loans
    }
  });
});

exports.getLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id).populate({
    path: 'user',
    select: '-__v -passwordChangedAt'
  });
  // Tour.findOne({ _id: req.params.id })

  if (!loan) {
    return next(new AppError('No loan found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      loan
    }
  });
});

exports.createLoan = factory.createOne(Loan);
exports.updateLoan = factory.updateOne(Loan);
exports.deleteLoan = factory.deleteOne(Loan);

exports.getLoanStats = catchAsync(async (req, res, next) => {
  const stats = await Loan.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});
