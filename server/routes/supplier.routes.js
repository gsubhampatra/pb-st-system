// src/routes/supplier.routes.js
import express from 'express';
import {
    createSupplier,
    getSuppliers, // Handles both list and search
    getSupplierById,
    updateSupplier,
    deleteSupplier
} from '../controllers/supplier.controller.js'; // Adjust path if needed

const router = express.Router();

// Define routes for Suppliers
router.post('/', createSupplier);       // POST /api/suppliers
router.get('/', getSuppliers);         // GET /api/suppliers (gets all)
                                       // GET /api/suppliers?search=John (searches)
router.get('/:id', getSupplierById);   // GET /api/suppliers/some-cuid
router.put('/:id', updateSupplier);    // PUT /api/suppliers/some-cuid
router.delete('/:id', deleteSupplier); // DELETE /api/suppliers/some-cuid

export default router;