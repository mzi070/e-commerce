/** Bank account details shown to customers after a bank-transfer order. */
export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string | null;
  swift: string | null;
  instructions: string | null;
}

export function getBankTransferDetails(): BankTransferDetails {
  return {
    bankName: process.env.BANK_TRANSFER_BANK_NAME ?? "Bank of Maldives",
    accountName:
      process.env.BANK_TRANSFER_ACCOUNT_NAME ?? "Mohamed Zihnee Ibrahim",
    accountNumber:
      process.env.BANK_TRANSFER_ACCOUNT_NUMBER ?? "7701484557001",
    iban: process.env.BANK_TRANSFER_IBAN ?? null,
    swift: process.env.BANK_TRANSFER_SWIFT ?? null,
    instructions:
      process.env.BANK_TRANSFER_INSTRUCTIONS ??
      "Transfer the order total to the account below, then upload a photo of your transfer receipt. Include your order reference in the transfer description.",
  };
}
