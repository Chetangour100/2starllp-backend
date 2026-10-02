import { Router } from "express";

import { getReports } from "../controllers/reports.controller.js";

const router = Router();

/**
 * @swagger
 * /reports/summary:
 *   get:
 *     summary: Get reports summary
 *     description: Get payroll, employee, department, tax and payment reports from the database.
 *     tags:
 *       - Reports
 *     parameters:
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - ytd
 *             - this-month
 *             - last-month
 *             - this-quarter
 *             - last-quarter
 *             - this-year
 *             - last-year
 *           default: ytd
 *         description: Report period
 *
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *
 *       400:
 *         description: Invalid report period
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Failed to fetch reports
 */
router.get("/summary", getReports);

export default router;