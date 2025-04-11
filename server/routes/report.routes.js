import { Router } from 'express';
import { downloadReport, getDownloadHistory, getSummary } from '../controllers/report.controller.js';

const router = Router();

router.get('/download', downloadReport);
router.get('/history', getDownloadHistory);
router.get('/summary', getSummary);

export default router;