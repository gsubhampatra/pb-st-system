// src/routes/receipt.routes.js
import express from 'express';
import {
    createReceipt,
    getReceipts,
    getReceiptById,
    updateReceipt,
    deleteReceipt
} from '../controllers/receipt.controller.js'; // Adjust path if needed

const router = express.Router();

// Define routes for Receipts (received from customers)
router.post('/', createReceipt);       // POST /api/receipts
router.get('/', getReceipts);         // GET /api/receipts (with optional query params)
router.get('/:id', getReceiptById);   // GET /api/receipts/some-cuid
router.put('/:id', updateReceipt);    // PUT /api/receipts/some-cuid (for note/date)
router.delete('/:id', deleteReceipt); // DELETE /api/receipts/some-cuid

export default router;