import { Router } from "express";

import { DashboardController } from "../controllers/dashboard.controller.js";

const router = Router();

const dashboardController =
  DashboardController.getInstance();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard data
 *     description: Returns dashboard statistics, charts, recent employees, payrolls and payments.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 */

router.get(
  "/",
  dashboardController.getDashboard
);

export default router;