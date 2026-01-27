export interface VnpayConfig {
  vnp_TmnCode: string;
  vnp_HashSecret: string;
  vnp_Url: string;
  vnp_ReturnUrl: string;
  vnp_Version: string;
  vnp_Command: string;
  vnp_CurrCode: string;
  vnp_Locale: string;
}

export interface VnpayParams {
  vnp_Version?: string;
  vnp_Command?: string;
  vnp_TmnCode?: string;
  vnp_Locale?: string;
  vnp_CurrCode?: string;
  vnp_TxnRef?: string;
  vnp_OrderInfo?: string;
  vnp_OrderType?: string;
  vnp_Amount?: string;
  vnp_ReturnUrl?: string;
  vnp_IpAddr?: string;
  vnp_CreateDate?: string;
  vnp_BankCode?: string;
  vnp_SecureHash?: string;
  vnp_SecureHashType?: string;
  vnp_ResponseCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_CardType?: string;
  vnp_PayDate?: string;
  [key: string]: string | undefined;
}

export interface VnpayPaymentResponse {
  code: string;
  message: string;
  data?: string;
}

export interface VnpayCallbackResponse {
  success: boolean;
  message: string;
  orderId: string;
  transactionId?: string;
  amount?: number;
  platform?: string;
  appScheme?: string;
}

export interface VnpayIpnResponse {
  RspCode: string;
  Message: string;
}
