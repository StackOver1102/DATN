export enum TransactionMethod {
  PAYPAL = 'paypal',
  MOMO = 'momo',
  BANK_TRANSFER = 'bank_transfer',
  VQR = 'vqr',
  VNPAY = 'vnpay',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  DEPOSIT = 'deposit', // Nạp tiền
  WITHDRAWAL = 'withdrawal', // Rút tiền
  PAYMENT = 'payment', // Thanh toán đơn hàng
  REFUND = 'refund', // Hoàn tiền
}
