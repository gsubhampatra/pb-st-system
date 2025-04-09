// src/routes/reportDownload.routes.js
import express from "express";
import {
  logReportDownload,
  getReportDownloads,
  getReportDownloadById,
  deleteReportDownload,
} from "../controllers/reportDownload.controller.js"; // Adjust path if needed
// Optional: Add authentication/authorization middleware here if needed
// import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Define routes for ReportDownload logs
// Example: Protect log creation behind auth/admin role if necessary
// router.post('/', authenticate, authorize(['admin']), logReportDownload);
router.post("/", logReportDownload); // POST /api/report-downloads

// Example: Protect viewing logs behind auth
// router.get('/', authenticate, getReportDownloads);
router.get("/", getReportDownloads); // GET /api/report-downloads (list with filters)
router.get("/:id", getReportDownloadById); // GET /api/report-downloads/some-cuid

// Example: Protect deletion behind auth/admin role
// router.delete('/:id', authenticate, authorize(['admin']), deleteReportDownload);
router.delete("/:id", deleteReportDownload); // DELETE /api/report-downloads/some-cuid

export default router;
