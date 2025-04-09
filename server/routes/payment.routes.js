// src/routes/payment.routes.js
import express from 'express';
import {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment
} from '../controllers/payment.controller.js'; // Adjust path if needed

const router = express.Router();

// Define routes for Payments (made to suppliers)
router.post('/', createPayment);       // POST /api/payments
router.get('/', getPayments);         // GET /api/payments (with optional query params)
router.get('/:id', getPaymentById);   // GET /api/payments/some-cuid
router.put('/:id', updatePayment);    // PUT /api/payments/some-cuid (for note/date)
router.delete('/:id', deletePayment); // DELETE /api/payments/some-cuid

export default router;