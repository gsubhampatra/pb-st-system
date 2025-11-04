import express from 'express';
import {
  clearDatabase,
  resetDatabase,
} from '../controllers/database.controller.js';

const router = express.Router();

// Get database statistics

// Clear all database data (destructive!)
router.delete('/clear', clearDatabase);

// Reset database with seed data
router.post('/reset', resetDatabase);

export default router;
