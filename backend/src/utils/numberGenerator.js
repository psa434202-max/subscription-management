const generateNumber = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
};

module.exports = {
  generateSubscriptionNumber: () => generateNumber('SUB'),
  generateInvoiceNumber: () => generateNumber('INV'),
  generateQuotationNumber: () => generateNumber('QT'),
  generatePaymentNumber: () => generateNumber('PAY'),
  generateProductCode: () => generateNumber('PRD')
};

