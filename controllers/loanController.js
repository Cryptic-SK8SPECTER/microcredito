const Loan = require('./../models/loanModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const MicroInvoice = require('./../utils/pdf');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
('use strict');

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
    return next(new AppError('Nenhum empréstimo encontrado com esse ID', 404));
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

exports.approveLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findByIdAndUpdate(
    req.params.id,
    { status: 'Approved' },
    { new: true, runValidators: true }
  );

  if (!loan) return next(new AppError('Empréstimo não encontrado', 404));

  res.status(200).send({ message: 'Empréstimo aprovado com sucesso', loan });
});

exports.rejectLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findByIdAndUpdate(
    req.params.id,
    { status: 'Rejected' },
    { new: true, runValidators: true }
  );

  if (!loan) return next(new AppError('Empréstimo não encontrado', 404));

  res.status(200).send({ message: 'Empréstimo rejeitado com sucesso', loan });
});

// Função para exportar relatório em PDF
async function exportToPDF(data, filename) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const outputPath = path.join(__dirname, '..', 'exports', `${filename}.pdf`);
    const outputStream = fs.createWriteStream(outputPath);

    doc.pipe(outputStream);

    // Título do documento
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('Relatório de Empréstimos', { align: 'center' });
    doc.moveDown();

    data.forEach((item, index) => {
      // Detalhes do empréstimo
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .font('Helvetica')
        .fontSize(12)
        .text(`Data: ${new Date().toLocaleDateString()}`, { align: 'right' })
        .moveDown(2);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Total de Empréstimos: ${item.totalEmpréstimos}`);
      doc.text(`Valor Total: ${formatCurrency(item.valorTotal)}`);
      doc.text(`Taxa de Juros Média: ${item.taxaDeJurosMédia.toFixed(2)}%`);
      doc.text(`Juros Totais: ${formatCurrency(item.jurosTotais)}`);
      doc.text(`Meses Restantes Média: ${item.mesesRestantesMédia || 'N/A'}`);

      // Separador entre os empréstimos
      if (index < data.length - 1) {
        doc.moveDown();
        doc
          .font('Helvetica')
          .fontSize(12)
          .text(
            '-------------------------------------------------------------'
          );
        doc.moveDown();
      } else {
        doc.moveDown();
      }
    });

    doc.end();

    outputStream.on('finish', () => resolve(outputPath));
    outputStream.on('error', err => reject(err));
  });
}

// Função para formatar moeda
function formatCurrency(amount) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

// Função para exportar relatório em Excel
async function exportToExcel(data, filename) {
  return new Promise((resolve, reject) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Empréstimos');

    // Adicione cabeçalhos de coluna
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 10 },
      { header: 'Quantidade', key: 'quantidade', width: 15 },
      { header: 'Valor Total', key: 'valorTotal', width: 15 }
      // Adicione mais colunas conforme necessário
    ];

    // Preencha os dados
    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Salve o arquivo Excel
    const outputPath = path.join(
      __dirname,
      '..',
      'exports',
      `${filename}.xlsx`
    );
    workbook.xlsx
      .writeFile(outputPath)
      .then(() => resolve(outputPath))
      .catch(err => reject(err));
  });
}

// Função para exportar dados com base no tipo de relatório e formato
async function exportReport(reportType, format, data) {
  let filename = `report_${reportType}_${new Date()
    .toISOString()
    .slice(0, 10)}`;

  if (format === 'pdf') {
    return await exportToPDF(data, filename);
  } else if (format === 'excel') {
    return await exportToExcel(data, filename);
  } else {
    throw new AppError('Formato de exportação não suportado.', 400);
  }
}

// Desempenho da Carteira de Empréstimos
exports.getLoanPerformance = catchAsync(async (req, res, next) => {
  const result = await Loan.aggregate([
    {
      $match: { status: { $in: ['Approved', 'Partially Paid'] } }
    },
    {
      $group: {
        _id: null,
        totalEmpréstimos: { $sum: 1 },
        valorTotal: { $sum: '$price' },
        taxaDeJurosMédia: { $avg: '$rate' },
        valorTotalJuros: { $sum: '$totalPrice' },
        jurosTotais: {
          $sum: { $multiply: ['$price', { $divide: ['$rate', 100] }] }
        }
      }
    }
  ]);

  if (req.query.export) {
    const {
      totalEmpréstimos,
      valorTotal,
      taxaDeJurosMédia,
      valorTotalJuros,
      jurosTotais
    } = result[0];

    // Cria a nova fatura com os dados do resultado
    let myInvoice = new MicroInvoice({
      style: {
        header: {
          image: {
            path: './public/img/logo.png',
            width: 50,
            height: 19
          }
        }
      },
      data: {
        invoice: {
          name: 'Desempenho da Carteira de Empréstimos',

          header: [
            {
              label: 'Data do relatório',
              value: new Date().toLocaleDateString('pt-PT')
            },
            {
              label: 'Status',
              value: 'Gerado'
            }
          ],

          currency: 'MZN',

          customer: [
            {
              label: 'Resumo do relatório',
              value: [
                `Total Empréstimos: ${totalEmpréstimos}`,
                `Valor Total: ${valorTotalJuros} MZN`,
                `Taxa de Juros Média: ${taxaDeJurosMédia}%`,
                `Juros Totais: ${jurosTotais} MZN`
              ]
            }
          ],

          legal: [
            {
              value: 'Relatório de desempenho de empréstimos.',
              weight: 'bold',
              color: 'primary'
            }
          ],

          details: {
            header: [
              {
                value: 'Descrição'
              },
              {
                value: 'Quantidade'
              },
              {
                value: 'Subtotal'
              }
            ],

            parts: [
              [
                {
                  value: 'Desempenho da Carteira de Empréstimos'
                },
                {
                  value: totalEmpréstimos
                },
                {
                  value: valorTotal,
                  price: true
                }
              ]
              // ,

              // [
              //   {
              //     value: 'Discount'
              //   },
              //   {
              //     value: 1
              //   },
              //   {
              //     value: '-10',
              //     price: true
              //   }
              // ]
            ],

            total: [
              {
                label: 'Total sem IVA',
                value: valorTotal,
                price: true
              },
              {
                label: 'Taxa do IVA',
                value: jurosTotais
              },
              {
                label: 'Total pago com IVA',
                value: valorTotalJuros,
                price: true
              }
            ]
          }

          // details: {
          //   header: [
          //     {
          //       value: 'Descrição'
          //     },
          //     {
          //       value: 'Valor'
          //     }
          //   ],

          //   parts: [
          //     [
          //       {
          //         value: 'Total Empréstimos'
          //       },
          //       {
          //         value: totalEmpréstimos
          //       }
          //     ],
          //     [
          //       {
          //         value: 'Valor Total (MZN)'
          //       },
          //       {
          //         value: valorTotal.toFixed(2),
          //         price: true
          //       }
          //     ],
          //     [
          //       {
          //         value: 'Taxa de Juros Média (%)'
          //       },
          //       {
          //         value: taxaDeJurosMédia.toFixed(2)
          //       }
          //     ],
          //     [
          //       {
          //         value: 'Juros Totais (MZN)'
          //       },
          //       {
          //         value: jurosTotais.toFixed(2),
          //         price: true
          //       }
          //     ]
          //   ]
          // }
        }
      }
    });

    const randomFileName = `DesempenhoCarteiraEmpréstimos_${Date.now()}.pdf`;

    const filePath = path.join(__dirname, './../exports/', randomFileName);

    // Renderiza a fatura como PDF
    myInvoice
      .generate(filePath)
      .then(() => {
        console.log('Relatório exportado com sucesso.');
      })
      .catch(error => {
        console.error(error);
      });

    // Envia o caminho do arquivo exportado como resposta
    res.status(200).json({
      status: 'success',
      message: 'Relatório exportado com sucesso.'
    });
  } else {
    // Responde com os dados normalmente
    res.status(200).json({
      status: 'success',
      data: {
        result
      }
    });
  }
});

// Distribuição dos Empréstimos por Status
exports.getLoanDistributionByStatus = catchAsync(async (req, res, next) => {
  const result = await Loan.aggregate([
    {
      $group: {
        _id: '$status',
        quantidade: { $sum: 1 },
        valorTotal: { $sum: '$price' },
        valorMédio: { $avg: '$price' }
      }
    }
  ]);

  if (req.query.export) {
    const exportedFilePath = await exportReport(
      'loanDistribution',
      req.query.export,
      result
    );

    // Envia o caminho do arquivo exportado como resposta
    res.status(200).json({
      status: 'success',
      message: 'Relatório exportado com sucesso.',
      data: {
        exportedFilePath
      }
    });
  } else {
    res.status(200).json({
      status: 'success',
      data: {
        DistribuiçãoDosEmpréstimosPorStatus: result
      }
    });
  }
});

// Taxa de Inadimplência
exports.getDelinquencyRate = catchAsync(async (req, res, next) => {
  const totalLoans = await Loan.countDocuments({});
  const totalValue = await Loan.aggregate([
    {
      $group: {
        _id: null,
        valorTotal: { $sum: '$price' }
      }
    }
  ]);

  const delinquentLoans = await Loan.aggregate([
    {
      $match: { status: 'Late' }
    },
    {
      $group: {
        _id: null,
        quantidadeInadimplente: { $sum: 1 },
        valorInadimplente: { $sum: '$price' }
      }
    }
  ]);

  const taxaInadimplência =
    (delinquentLoans[0]?.quantidadeInadimplente / totalLoans) * 100 || 0;
  const taxaValorInadimplente =
    (delinquentLoans[0]?.valorInadimplente / totalValue[0]?.valorTotal) * 100 ||
    0;

  const responseData = {
    status: 'success',
    data: {
      TaxaDeInadimplência: {
        quantidadeInadimplente: delinquentLoans[0]?.quantidadeInadimplente || 0,
        valorInadimplente: delinquentLoans[0]?.valorInadimplente || 0,
        taxaInadimplência,
        taxaValorInadimplente
      }
    }
  };

  if (req.query.export) {
    const exportedFilePath = await exportReport(
      'delinquencyRate',
      req.query.export,
      responseData
    );

    // Envia o caminho do arquivo exportado como resposta
    res.status(200).json({
      status: 'success',
      message: 'Relatório exportado com sucesso.',
      data: {
        exportedFilePath
      }
    });
  } else {
    res.status(200).json(responseData);
  }
});

// Rentabilidade dos Empréstimos
exports.getLoanProfitability = catchAsync(async (req, res, next) => {
  const result = await Loan.aggregate([
    {
      $group: {
        _id: null,
        jurosTotais: {
          $sum: { $multiply: ['$price', { $divide: ['$rate', 100] }] }
        },
        jurosMédiosPorEmpréstimo: {
          $avg: { $multiply: ['$price', { $divide: ['$rate', 100] }] }
        },
        valorMédioPago: { $avg: '$amountPaid' }
      }
    }
  ]);

  if (req.query.export) {
    const exportedFilePath = await exportReport(
      'loanProfitability',
      req.query.export,
      result
    );

    // Envia o caminho do arquivo exportado como resposta
    res.status(200).json({
      status: 'success',
      message: 'Relatório exportado com sucesso.',
      data: {
        exportedFilePath
      }
    });
  } else {
    res.status(200).json({
      status: 'success',
      data: {
        result
      }
    });
  }
});
