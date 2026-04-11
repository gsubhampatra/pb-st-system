
import express from 'express';
import { printInvoice } from '../controllers/print.controller.js';

const router = express.Router();

// Print purchase or sale invoice
router.post('/invoice', printInvoice);

export default router;