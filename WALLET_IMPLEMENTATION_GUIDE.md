# RAVITO Wallet System - Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [User Flows](#user-flows)
5. [API Reference](#api-reference)
6. [Security & Compliance](#security--compliance)
7. [Phase 2 Roadmap](#phase-2-roadmap)
8. [Troubleshooting](#troubleshooting)

## Overview

The RAVITO Wallet is a Phase 1 MVP implementation of an electronic wallet system designed to retain liquidity within the platform and streamline payment flows between clients and suppliers.

### Key Features

**For Clients:**
- ✅ Deposit funds via simulated Mobile Money and bank transfers
- ✅ Pay for orders instantly with wallet balance
- ✅ View transaction history with filters and export
- ✅ Request withdrawals with automatic fee calculation
- ✅ Track withdrawal request status

**For Suppliers:**
- ✅ Automatic earnings credit on order completion
- ✅ Dashboard with revenue analytics (day/week/month)
- ✅ Request withdrawals with 24h processing simulation
- ✅ Detailed earnings history by order
- ✅ Export functionality for accounting

### Phase 1 Limitations

⚠️ **Current Phase (MVP - Simulation Mode):**
- No real banking/payment processor integration
- Simulated payment confirmations
- Withdrawal requests processed automatically after 24h (simulation)
- No KYC/AML verification
- Commission rates are configurable but fixed in code

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│  • WalletContext (State Management)                     │
│  • Client Wallet Components                             │
│  • Supplier Wallet Components                           │
│  • Real-time Updates (Supabase Realtime)               │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Services Layer (TypeScript)                 │
├─────────────────────────────────────────────────────────┤
│  • walletService.ts (Business Logic)                    │
│  • Transaction Management                                │
│  • Commission Calculations                               │
│  • Balance Operations                                    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│            Database (Supabase PostgreSQL)                │
├─────────────────────────────────────────────────────────┤
│  • wallets                                              │
│  • wallet_transactions                                   │
│  • withdrawal_requests                                   │
│  • RLS Policies                                         │
│  • Database Functions                                    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend:** React 18, TypeScript, TailwindCSS, Recharts
- **State Management:** React Context API
- **Backend:** Supabase (PostgreSQL, Row Level Security)
- **Real-time:** Supabase Realtime subscriptions
- **Validation:** Custom validation with limits

## Database Schema

### Wallets Table

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes:**
- `idx_wallets_user_id` on `user_id`
- `idx_wallets_active` on `is_active`

### Wallet Transactions Table

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'earning', 'refund')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  commission DECIMAL(10, 2) DEFAULT 0.00,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  related_order_id UUID REFERENCES orders(id),
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes:**
- `idx_wallet_transactions_wallet_id` on `wallet_id`
- `idx_wallet_transactions_user_id` on `user_id`
- `idx_wallet_transactions_type` on `type`
- `idx_wallet_transactions_status` on `status`
- `idx_wallet_transactions_created_at` on `created_at DESC`
- `idx_wallet_transactions_order_id` on `related_order_id`

### Withdrawal Requests Table

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(10, 2) NOT NULL CHECK (net_amount > 0),
  method VARCHAR(50) NOT NULL CHECK (method IN ('mobile_money', 'bank_transfer', 'orange', 'mtn', 'moov', 'wave')),
  account_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes:**
- `idx_withdrawal_requests_wallet_id` on `wallet_id`
- `idx_withdrawal_requests_user_id` on `user_id`
- `idx_withdrawal_requests_status` on `status`
- `idx_withdrawal_requests_request_date` on `request_date DESC`

## User Flows

### Client Deposit Flow

```
1. Client clicks "Ajouter des fonds" in wallet dashboard
2. Deposit modal opens
3. Client enters amount (min: 1,000 XOF, max: 10,000,000 XOF)
4. Client selects payment method (Orange Money, MTN, Moov, Wave, Card, Bank)
5. Client confirms transaction
6. System creates deposit transaction (status: completed)
7. Wallet balance updates instantly
8. Transaction appears in history
9. Real-time update triggers UI refresh
```

### Client Payment Flow

```
1. Client proceeds to checkout with order
2. System checks wallet balance >= order total
3. If sufficient, payment option "RAVITO Wallet" is available
4. Client selects wallet payment
5. System creates payment transaction
6. Balance deducted
7. Order status updated to "paid"
8. Transaction recorded with order reference
```

### Supplier Earning Flow

```
1. Order is delivered and confirmed by client
2. System calculates supplier earnings:
   - Order total - platform commission (2%)
3. System creates earning transaction for supplier
4. Supplier wallet balance increases
5. Real-time notification sent to supplier
6. Transaction appears in earnings history
7. Revenue statistics updated
```

### Withdrawal Flow

```
1. User clicks "Demander un retrait"
2. Withdrawal modal opens
3. User enters amount (min: 1,000 XOF, max: 5,000,000 XOF)
4. System calculates withdrawal fee (2% with min 100 XOF)
5. User selects withdrawal method
6. User enters account details (phone number or bank account)
7. User confirms withdrawal request
8. System creates withdrawal request (status: pending)
9. Estimated completion date set (24h later)
10. [Simulation] After 24h, status automatically changes to "completed"
11. User receives notification
```

## API Reference

### Core Service Functions

#### `getOrCreateWallet(userId: string): Promise<Wallet | null>`
Gets existing wallet or creates a new one for the user.

#### `getWalletBalance(userId: string): Promise<number>`
Returns current wallet balance for the user.

#### `createDepositTransaction(userId, amount, paymentMethod, description)`
Creates a deposit transaction and updates balance.

**Parameters:**
- `userId`: User ID
- `amount`: Amount to deposit (min: 1,000 XOF, max: 10,000,000 XOF)
- `paymentMethod`: Payment method identifier
- `description`: Optional transaction description

**Returns:**
```typescript
{
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}
```

#### `createPaymentTransaction(userId, amount, orderId, description)`
Creates a payment transaction for an order.

**Validations:**
- Checks sufficient balance
- Verifies order exists
- Ensures amount > 0

#### `createEarningTransaction(userId, amount, orderId, commission, description)`
Records supplier earnings from completed orders.

**Note:** Commission is deducted from amount automatically.

#### `createWithdrawalRequest(userId, amount, method, accountDetails)`
Creates a withdrawal request.

**Fee Calculation:**
- Mobile Money: 2% (min 100 XOF)
- Bank Transfer: 1.5% (min 100 XOF)

#### `getTransactionHistory(userId, limit?, offset?): Promise<Transaction[]>`
Returns paginated transaction history.

#### `getWalletStats(userId): Promise<WalletStats>`
Returns comprehensive wallet statistics including:
- Total balance
- Total deposits/withdrawals/payments/earnings
- Transaction count
- Pending withdrawals
- Last 7 days activity

## Security & Compliance

### Row Level Security (RLS)

All wallet tables have RLS policies enabled:

**Wallets:**
- Users can view and update their own wallet
- Admins can view all wallets

**Transactions:**
- Users can view their own transactions
- Users can create transactions for themselves
- System can update all transactions
- Admins have full access

**Withdrawal Requests:**
- Users can view/create/update their own pending requests
- Admins can view and manage all requests

### Validation & Limits

```typescript
WALLET_LIMITS = {
  MIN_DEPOSIT: 1000,        // 1,000 XOF
  MAX_DEPOSIT: 10000000,    // 10,000,000 XOF
  MIN_WITHDRAWAL: 1000,     // 1,000 XOF
  MAX_WITHDRAWAL: 5000000,  // 5,000,000 XOF
  MIN_BALANCE_AFTER_WITHDRAWAL: 0,
  MAX_DAILY_TRANSACTIONS: 50
}
```

### Commission Structure

```typescript
DEFAULT_COMMISSION_SETTINGS = {
  depositCommission: 0,       // No fee on deposits
  withdrawalCommission: 2,    // 2% withdrawal fee
  paymentCommission: 0,       // No additional payment fee
  minimumWithdrawalFee: 100   // 100 XOF minimum
}
```

### Audit Trail

Every transaction includes:
- Unique transaction reference
- Balance before/after
- Timestamp (created, completed)
- User ID
- Related order ID (if applicable)
- Metadata JSON field for additional data

## Phase 2 Roadmap

### Banking Integration

**Partner Selection:**
- [ ] Select financial partner (bank or EMI)
- [ ] Negotiate commission structure
- [ ] Setup API integration

**Technical Implementation:**
- [ ] Integrate KYC/AML verification
- [ ] Connect to payment processor APIs
- [ ] Implement real deposit confirmation
- [ ] Add webhook handlers for payment status
- [ ] Implement real withdrawal processing

**Mobile Money Integration:**
- [ ] Orange Money API integration
- [ ] MTN Mobile Money API integration
- [ ] Moov Money API integration
- [ ] Wave API integration

**Enhanced Features:**
- [ ] Scheduled transfers
- [ ] Recurring deposits
- [ ] Wallet-to-wallet transfers
- [ ] QR code payments
- [ ] Export financial statements
- [ ] Tax documentation

**Compliance & Security:**
- [ ] PCI-DSS compliance
- [ ] Enhanced fraud detection
- [ ] Transaction monitoring
- [ ] AML screening
- [ ] Regulatory reporting

**Advanced Features:**
- [ ] Credit scoring based on transaction history
- [ ] Micro-loans for suppliers
- [ ] Supplier cash advance
- [ ] Client credit lines
- [ ] Insurance products

## Troubleshooting

### Common Issues

**Issue: Wallet not showing balance**
- Solution: Check if wallet was created (automatic on first login)
- Check RLS policies are correct
- Verify user authentication

**Issue: Transaction not appearing in history**
- Solution: Check if transaction status is 'completed'
- Verify userId matches logged-in user
- Check database indexes

**Issue: Withdrawal request stuck in pending**
- Solution: In Phase 1, withdrawals are simulated
- Check estimated_date field
- Manually update status if needed for testing

**Issue: Real-time updates not working**
- Solution: Verify Supabase realtime is enabled
- Check channel subscriptions in WalletContext
- Ensure proper cleanup on unmount

### Development Testing

**Test Deposit:**
```typescript
// Use DepositModal component
// Amount: 50000 XOF
// Method: orange
// Expected: Balance increases, transaction created
```

**Test Payment:**
```typescript
// Prerequisites: Wallet balance >= order total
// Use payment flow in checkout
// Expected: Balance decreases, order marked as paid
```

**Test Withdrawal:**
```typescript
// Use WithdrawalModal
// Amount: 20000 XOF
// Expected: Fee calculated (400 XOF), net amount shown
// Request created with pending status
```

### Database Queries

**Check wallet balance:**
```sql
SELECT * FROM wallets WHERE user_id = '<user_id>';
```

**View recent transactions:**
```sql
SELECT * FROM wallet_transactions 
WHERE user_id = '<user_id>' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Pending withdrawal requests:**
```sql
SELECT * FROM withdrawal_requests 
WHERE status = 'pending' 
ORDER BY request_date DESC;
```

## Support

For technical support or questions about the wallet implementation:
1. Check this guide first
2. Review the code comments in services/walletService.ts
3. Check database migrations in supabase/migrations/
4. Contact the development team

---

**Document Version:** 1.0
**Last Updated:** December 17, 2024
**Author:** RAVITO Development Team
