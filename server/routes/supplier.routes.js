import express from 'express';
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} from '../controllers/supplier.controller.optimized.js';
import { validate, supplierSchema } from '../middleware/validate.js';

const router = express.Router();

// Define routes for Suppliers with validation
router.post('/', validate(supplierSchema), createSupplier);
router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.put('/:id', validate(supplierSchema), updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;