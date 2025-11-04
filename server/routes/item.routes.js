import express from 'express';
import {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    updateStock
} from '../controllers/item.controller.optimized.js';
import { validate, itemSchema, itemUpdateSchema } from '../middleware/validate.js';

const router = express.Router();

// Define routes for Items with validation
router.post('/', validate(itemSchema), createItem);
router.get('/', getItems);
router.get('/:id', getItemById);
// Allow partial updates on PUT with relaxed schema
router.put('/:id', validate(itemUpdateSchema), updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/stock', updateStock);

export default router;