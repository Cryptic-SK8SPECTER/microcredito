const User = require('../models/userModel');
const Loans = require('../models/loanModel');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 2) Build template
  // 3) Render that template using tour data from 1)
  res.status(200).render('base', {});
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Login'
  });
};

exports.getAccount = catchAsync(async (req, res, next) => {
  const clients = await User.find({ role: 'client' });
  res.status(200).render('account', {
    title: 'Perfil',
    clients
  });
});

exports.getHistoric = catchAsync(async (req, res, next) => {
  // 1) Find all laons
  const loans = await Loans.find({ user: req.user.id });

  const userId = mongoose.Types.ObjectId(req.user.id);

  const aggregationResult = await Loans.aggregate([
    {
      $match: { user: userId } // Filtra os empréstimos do usuário atual
    },
    {
      $group: {
        _id: '$status', // Agrupa pelo campo "status"
        count: { $sum: 1 } // Conta o número de documentos para cada status
      }
    }
  ]);

  const loanStatusCounts = {
    Pagos: 0,
    Pendentes: 0,
    Cancelados: 0
  };

  aggregationResult.forEach(item => {
    if (item._id === 'Paid') {
      loanStatusCounts.Pagos = item.count;
    } else if (item._id === 'Pending') {
      loanStatusCounts.Pendentes = item.count;
    } else if (item._id === 'Canceled') {
      loanStatusCounts.Cancelados = item.count;
    }
  });

  console.log('Yo new data here ', aggregationResult);

  res.status(200).render('historic', {
    title: 'Histórico',
    loans,
    loanStatusCounts
  });
});

exports.getRegister = (req, res) => {
  res.status(200).render('register', {
    title: 'Cadastro de usuário '
  });
};

exports.getRequests = async (req, res) => {
  // Busca todos os empréstimos com status "Pending"
  const loans = await Loans.find({ status: 'Pending' });

  console.log(loans);
  res.status(200).render('requests', {
    title: 'Requisições de empréstimo',
    loans
  });
};

exports.getForgotPassword = (req, res) => {
  res.status(200).render('forgot-password', {
    title: 'Recuperar senha'
  });
};

exports.getMain = (req, res) => {
  res.status(200).render('main', {
    title: 'Análise'
  });
};

exports.getSuport = (req, res) => {
  res.status(200).render('suport', {
    title: 'Suporte'
  });
};

exports.resetPassword = (req, res) => {
  const { token } = req.params;

  res.status(200).render(`resetPassword`, {
    title: 'Redefinir senha',
    token
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
      photo: req.body.photo,
      address: req.body.address,
      contact: req.body.contact,
      country: req.body.country,
      nuit: req.body.nuit,
      role: req.body.role
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('account', {
    title: 'Perfil',
    user: updatedUser
  });
});
