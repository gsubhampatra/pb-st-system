import express from 'express';
import {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem
} from '../controllers/item.controller.js';
import { validate, itemSchema, itemUpdateSchema } from '../middleware/validate.js';

const router = express.Router();

// Define routes for Items with validation
router.post('/', validate(itemSchema), createItem);
router.get('/', getAllItems);
router.get('/:id', getItemById);
// Allow partial updates on PUT with relaxed schema
router.put('/:id', validate(itemUpdateSchema), updateItem);
router.delete('/:id', deleteItem);

export default router;