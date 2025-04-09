// src/routes/item.routes.js
import express from 'express';
import {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem
} from '../controllers/item.controller.js'; // Adjust path if needed

const router = express.Router();

// Define routes for Items
router.post('/', createItem);       // POST /api/items
router.get('/', getAllItems);      // GET /api/items
router.get('/:id', getItemById);   // GET /api/items/some-cuid
router.put('/:id', updateItem);    // PUT /api/items/some-cuid
router.delete('/:id', deleteItem); // DELETE /api/items/some-cuid

export default router;