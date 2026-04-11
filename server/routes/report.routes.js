import { Router } from 'express';
import {
  getSummary,
  downloadReport,
  getDownloadHistory,
} from '../controllers/report.controller.js';

const router = Router();

// Dashboard summary
router.get('/summary', getSummary);

// Download report (Excel)
router.get('/download', downloadReport);

// Report download history
router.get('/history', getDownloadHistory);

export default router;