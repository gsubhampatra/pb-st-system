// src/routes/purchase.routes.js
import express from 'express';
import {
    createPurchase,
    getPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase
} from '../controllers/purchase.controller.js'; // Adjust path if needed

const router = express.Router();

// Define routes for Purchases
router.post('/', createPurchase);       // POST /api/purchases
router.get('/', getPurchases);         // GET /api/purchases (with optional query params)
router.get('/:id', getPurchaseById);   // GET /api/purchases/some-cuid
router.put('/:id', updatePurchase);    // PUT /api/purchases/some-cuid (for status/paidAmount)
router.delete('/:id', deletePurchase); // DELETE /api/purchases/some-cuid

export default router;