// Currency configuration for Mozambique
export const CURRENCY = {
  code: 'MZN',
  symbol: 'MT',
  locale: 'pt-MZ',
  decimalPlaces: 2,
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${CURRENCY.symbol}`;
};

export const formatCurrencyFull = (amount: number): string => {
  return `${amount.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${CURRENCY.symbol}`;
};

// Payment methods available in Mozambique
export const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'emola', label: 'e-Mola' },
  { value: 'conta_movel', label: 'Conta Móvel' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'ponto24', label: 'Ponto 24' },
  { value: 'cheque', label: 'Cheque' },
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];

// Payment types for installments
export const PAYMENT_TYPES = [
  { value: 'integral', label: 'Pagamento Integral' },
  { value: 'prestacao_1', label: '1ª Prestação' },
  { value: 'prestacao_2', label: '2ª Prestação' },
  { value: 'prestacao_3', label: '3ª Prestação' },
  { value: 'prestacao_4', label: '4ª Prestação' },
  { value: 'final', label: 'Pagamento Final' },
  { value: 'outro', label: 'Outro' },
] as const;

export type PaymentType = typeof PAYMENT_TYPES[number]['value'];
