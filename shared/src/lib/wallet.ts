// ============================================================
// EduMyles — eWallet Transfer System
// ============================================================

export interface Wallet {
  id: string;
  tenantId: string;
  userId: string;
  balanceCents: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  dailyLimitCents: number;
  monthlyLimitCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  tenantId: string;
  fromWalletId: string;
  toWalletId: string;
  amountCents: number;
  currency: string;
  type: 'transfer' | 'payment' | 'refund' | 'withdrawal' | 'deposit';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  feeCents: number;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferRequest {
  fromWalletId: string;
  toWalletId: string;
  amountCents: number;
  description: string;
  pin: string;
  requirePin: boolean;
}

export interface WalletBalance {
  balanceCents: number;
  currency: string;
  availableCents: number; // Balance minus pending transfers
  pendingOutgoingCents: number; // Pending outgoing transfers
  pendingIncomingCents: number; // Pending incoming transfers
}

export class WalletEngine {
  /**
   * Calculate transfer fee based on amount and type
   */
  static calculateTransferFee(
    amountCents: number,
    type: 'transfer' | 'withdrawal' = 'transfer'
  ): number {
    // Fee structure: 1% for transfers, 2% for withdrawals
    const feeRate = type === 'withdrawal' ? 0.02 : 0.01;
    return Math.round(amountCents * feeRate);
  }

  /**
   * Validate transfer amount
   */
  static validateTransferAmount(
    amountCents: number,
    wallet: Wallet
  ): {
    valid: boolean;
    error?: string;
  } {
    if (amountCents <= 0) {
      return { valid: false, error: "Transfer amount must be positive" };
    }

    if (amountCents < 100) { // Minimum KES 1.00
      return { valid: false, error: "Minimum transfer amount is KES 1.00" };
    }

    const availableBalance = wallet.balanceCents;
    if (amountCents > availableBalance) {
      return { valid: false, error: "Insufficient balance" };
    }

    // Check daily/monthly limits
    if (wallet.dailyLimitCents > 0 && amountCents > wallet.dailyLimitCents) {
      return { valid: false, error: "Exceeds daily transfer limit" };
    }

    if (wallet.monthlyLimitCents > 0) {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get total transfers this month
      // This would need to be calculated from database
      
      if (amountCents > wallet.monthlyLimitCents) {
        return { valid: false, error: "Exceeds monthly transfer limit" };
      }
    }

    return { valid: true };
  }

  /**
   * Generate unique transaction reference
   */
  static generateTransactionReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${random}`;
  }

  /**
   * Calculate wallet balance including pending transactions
   */
  static calculateAvailableBalance(
    wallet: Wallet,
    pendingOutgoingCents: number = 0,
    pendingIncomingCents: number = 0
  ): WalletBalance {
    const totalPending = pendingOutgoingCents + pendingIncomingCents;
    const availableCents = Math.max(0, wallet.balanceCents - totalPending);

    return {
      balanceCents: wallet.balanceCents,
      currency: wallet.currency,
      availableCents,
      pendingOutgoingCents,
      pendingIncomingCents,
    };
  }

  /**
   * Check if wallet can perform transfer
   */
  static canTransfer(wallet: Wallet): boolean {
    return wallet.status === 'active';
  }

  /**
   * Validate recipient wallet
   */
  static validateRecipientWallet(
    fromWallet: Wallet,
    toWallet: Wallet
  ): { valid: boolean; error?: string } {
    if (fromWallet.tenantId !== toWallet.tenantId) {
      return { valid: false, error: "Cannot transfer between different tenants" };
    }

    if (toWallet.status !== 'active') {
      return { valid: false, error: "Recipient wallet is not active" };
    }

    if (fromWallet.status !== 'active') {
      return { valid: false, error: "Source wallet is not active" };
    }

    return { valid: true };
  }

  /**
   * Format amount for display
   */
  static formatAmount(amountCents: number, currency: string): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Get transaction status description
   */
  static getTransactionStatusDescription(status: string): string {
    switch (status) {
      case 'pending':
        return 'Transfer is being processed';
      case 'completed':
        return 'Transfer completed successfully';
      case 'failed':
        return 'Transfer failed - please check details';
      case 'cancelled':
        return 'Transfer was cancelled';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Calculate total fees for a period
   */
  static calculateTotalFees(transactions: WalletTransaction[]): number {
    return transactions
      .filter(tx => tx.feeCents > 0)
      .reduce((total, tx) => total + tx.feeCents, 0);
  }

  /**
   * Get wallet statistics
   */
  static calculateWalletStatistics(
    wallet: Wallet,
    transactions: WalletTransaction[]
  ): {
    totalTransfers: number;
    totalReceived: number;
    totalSent: number;
    totalFees: number;
    averageTransferAmount: number;
    mostActiveRecipient?: string;
  } {
    const transfers = transactions.filter(tx => tx.type === 'transfer');
    const payments = transactions.filter(tx => tx.type === 'payment');
    const refunds = transactions.filter(tx => tx.type === 'refund');

    const totalTransfers = transfers.length;
    const totalReceived = payments
      .filter(tx => tx.toWalletId === wallet.id)
      .reduce((sum, tx) => sum + tx.amountCents, 0);
    const totalSent = transfers
      .filter(tx => tx.fromWalletId === wallet.id)
      .reduce((sum, tx) => sum + tx.amountCents, 0);
    const totalFees = this.calculateTotalFees(transactions);

    const averageTransferAmount = totalTransfers > 0 
      ? Math.round((totalSent + totalReceived) / totalTransfers) 
      : 0;

    // Find most active recipient
    const recipientCounts: Record<string, number> = {};
    transfers.forEach(tx => {
      const recipient = tx.toWalletId;
      recipientCounts[recipient] = (recipientCounts[recipient] || 0) + 1;
    });

    const mostActiveRecipient = Object.entries(recipientCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([recipient]) => recipient)[0];

    return {
      totalTransfers,
      totalReceived,
      totalSent,
      totalFees,
      averageTransferAmount,
      mostActiveRecipient,
    };
  }
}
