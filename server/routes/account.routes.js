// src/routes/account.routes.js
import express from 'express';
import {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
    getAccountPayments, // Specific function for account payments
    getAccountReceipts  // Specific function for account receipts
} from '../controllers/account.controller.js'; // Adjust path if needed

const router = express.Router();

// --- Standard CRUD for Accounts ---
router.post('/', createAccount);       // POST /api/accounts
router.get('/', getAccounts);         // GET /api/accounts (list/search all)
router.get('/:id', getAccountById);   // GET /api/accounts/some-cuid
router.put('/:id', updateAccount);    // PUT /api/accounts/some-cuid
router.delete('/:id', deleteAccount); // DELETE /api/accounts/some-cuid

// --- Routes to get related Payments/Receipts for a specific Account ---
// Nested routes under the account ID
router.get('/:id/payments', getAccountPayments); // GET /api/accounts/some-cuid/payments?startDate=...
router.get('/:id/receipts', getAccountReceipts); // GET /api/accounts/some-cuid/receipts?startDate=...

export default router;