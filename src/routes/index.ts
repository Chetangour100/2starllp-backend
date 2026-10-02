import { Router } from "express";

import authRoutes from "./auth.routes.js";
import employeeRoutes from "./employee.routes.js";
import employeeAuthRoutes from "./employee-auth.routes.js";
import payrollRoutes from "./payroll.routes.js";
import paymentRoutes from "./payment.routes.js";
import reportsRoutes from "./reports.routes.js";
import settingsRoutes from "./settings.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

/* =========================================================
   AUTH
   ========================================================= */

router.use("/auth", authRoutes);

/* =========================================================
   EMPLOYEE APP AUTH (login, change/forgot password)
   ========================================================= */

router.use("/employees", employeeAuthRoutes);

/* =========================================================
   EMPLOYEES (admin CRUD)
   ========================================================= */

router.use("/employees", employeeRoutes);

/* =========================================================
   PAYROLL
   ========================================================= */

router.use("/payrolls", payrollRoutes);

/* =========================================================
   PAYMENTS
   ========================================================= */

router.use("/payments", paymentRoutes);

/* =========================================================
   REPORTS
   ========================================================= */

router.use("/reports", reportsRoutes);

/* =========================================================
   SETTINGS
   ========================================================= */

router.use("/settings", settingsRoutes);

/* =========================================================
   DASHBOARD
   ========================================================= */

router.use("/dashboard", dashboardRoutes);

export default router;