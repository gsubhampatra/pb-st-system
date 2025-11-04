import { Router } from 'express';
import {
  getDashboardSummary,
  getSalesReport,
  getPurchaseReport,
  getStockReport,
  getCustomerStatement,
  getSupplierStatement,
  downloadReport,
  getReportDownloadHistory,
} from '../controllers/report.controller.optimized.js';

const router = Router();

// Dashboard and summaries
router.get('/summary', getDashboardSummary);
router.get('/sales', getSalesReport);
router.get('/purchase', getPurchaseReport);
router.get('/stock', getStockReport);

// Customer and supplier statements
router.get('/customer/:customerId', getCustomerStatement);
router.get('/supplier/:supplierId', getSupplierStatement);

// Download report (Excel)
router.get('/download', downloadReport);

// Report download history
router.get('/history', getReportDownloadHistory);

export default router;