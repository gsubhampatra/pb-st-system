
import express from 'express';
import { printInvoice } from '../controllers/print.controller.js';

const router = express.Router();

router.post('/purchase', printInvoice);


export default router;
