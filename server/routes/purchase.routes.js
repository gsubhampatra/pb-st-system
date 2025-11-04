import express from 'express';
import {
    createPurchase,
    getPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
} from '../controllers/purchase.controller.optimized.js';
import { validate, purchaseSchema } from '../middleware/validate.js';

const router = express.Router();

// Define routes for Purchases with validation
router.post('/', validate(purchaseSchema), createPurchase);
router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;