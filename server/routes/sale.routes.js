// src/routes/sale.routes.js
import express from 'express';
import {
    createSale,
    getSales,
    getSaleById,
    updateSale,
    deleteSale
} from '../controllers/sale.controller.js'; // Adjust path if needed

const router = express.Router();

// Define routes for Sales
router.post('/', createSale);       // POST /api/sales
router.get('/', getSales);         // GET /api/sales (with optional query params)
router.get('/:id', getSaleById);   // GET /api/sales/some-cuid
router.put('/:id', updateSale);    // PUT /api/sales/some-cuid (for status/receivedAmount)
router.delete('/:id', deleteSale); // DELETE /api/sales/some-cuid

export default router;