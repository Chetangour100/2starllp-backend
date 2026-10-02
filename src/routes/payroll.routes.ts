import { Router } from "express";

import { PayrollController } from "../controllers/payroll.controller.js";

import { asyncHandler } from "../middleware/async-handler.middleware.js";

const router = Router();

const payrollController =
  PayrollController.getInstance();

/**
 * @swagger
 * tags:
 *   name: Payroll
 *   description: Payroll management APIs
 */

/**
 * @swagger
 * /payroll:
 *   post:
 *     summary: Create a payroll
 *     tags: [Payroll]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payrollId
 *               - month
 *               - periodStart
 *               - periodEnd
 *               - totalEmployees
 *               - grossPayroll
 *               - deductions
 *               - departmentBreakdown
 *             properties:
 *               payrollId:
 *                 type: string
 *                 example: PAY-2026-09
 *               month:
 *                 type: string
 *                 example: September 2026
 *               periodStart:
 *                 type: string
 *                 example: 2026-09-01
 *               periodEnd:
 *                 type: string
 *                 example: 2026-09-30
 *               totalEmployees:
 *                 type: number
 *                 example: 6
 *               grossPayroll:
 *                 type: number
 *                 example: 505694
 *               deductions:
 *                 type: number
 *                 example: 50000
 *               netPayroll:
 *                 type: number
 *                 example: 455694
 *               status:
 *                 type: string
 *                 enum:
 *                   - Completed
 *                   - Pending
 *                   - Processing
 *                 example: Pending
 *               processedDate:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               processedBy:
 *                 type: string
 *                 nullable: true
 *                 example: Admin
 *               departmentBreakdown:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     department:
 *                       type: string
 *                       example: IT
 *                     employees:
 *                       type: number
 *                       example: 3
 *                     amount:
 *                       type: number
 *                       example: 250000
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: September payroll
 *     responses:
 *       201:
 *         description: Payroll created successfully
 *       409:
 *         description: Payroll ID already exists
 */
/**
 * @swagger
 * /payroll/preview:
 *   post:
 *     summary: Preview payroll calculation without saving
 *     tags: [Payroll]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               periodStart:
 *                 type: string
 *               periodEnd:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preview generated
 */
router.post(
  "/preview",
  asyncHandler(payrollController.preview)
);

router.post(
  "/",
  asyncHandler(payrollController.create)
);

/**
 * @swagger
 * /payroll:
 *   get:
 *     summary: Get all payrolls
 *     tags: [Payroll]
 *     responses:
 *       200:
 *         description: Payrolls fetched successfully
 */
router.get(
  "/",
  asyncHandler(payrollController.findAll)
);

/**
 * @swagger
 * /payroll/{id}:
 *   get:
 *     summary: Get payroll by ID
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-09
 *     responses:
 *       200:
 *         description: Payroll fetched successfully
 *       404:
 *         description: Payroll not found
 */
/**
 * @swagger
 * /payroll/employee/{employeeId}:
 *   get:
 *     summary: Get an employee's full salary/payroll history
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         example: EMP-001
 *     responses:
 *       200:
 *         description: Salary history fetched successfully
 */
router.get(
  "/employee/:employeeId",
  asyncHandler(payrollController.getEmployeeHistory)
);

router.get(
  "/:id",
  asyncHandler(payrollController.findById)
);

/**
 * @swagger
 * /payroll/{id}/bank-file:
 *   get:
 *     summary: Download bank transfer CSV file for a payroll
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-09
 *     responses:
 *       200:
 *         description: CSV file for bulk bank upload
 */
router.get(
  "/:id/bank-file",
  asyncHandler(payrollController.exportBankFile)
);

/**
 * @swagger
 * /payroll/{id}/payslip/{employeeId}:
 *   get:
 *     summary: Download an employee's payslip for a payroll
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-09
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         example: EMP-001
 *     responses:
 *       200:
 *         description: Payslip text file
 */
router.get(
  "/:id/payslip/:employeeId",
  asyncHandler(payrollController.exportPayslip)
);

/**
 * @swagger
 * /payroll/{id}:
 *   put:
 *     summary: Update payroll
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-09
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *               periodStart:
 *                 type: string
 *               periodEnd:
 *                 type: string
 *               totalEmployees:
 *                 type: number
 *               grossPayroll:
 *                 type: number
 *               deductions:
 *                 type: number
 *               netPayroll:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum:
 *                   - Completed
 *                   - Pending
 *                   - Processing
 *               processedDate:
 *                 type: string
 *                 nullable: true
 *               processedBy:
 *                 type: string
 *                 nullable: true
 *               departmentBreakdown:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     department:
 *                       type: string
 *                     employees:
 *                       type: number
 *                     amount:
 *                       type: number
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Payroll updated successfully
 *       404:
 *         description: Payroll not found
 */
router.put(
  "/:id",
  asyncHandler(payrollController.update)
);

/**
 * @swagger
 * /payroll/{id}:
 *   delete:
 *     summary: Delete payroll
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-09
 *     responses:
 *       200:
 *         description: Payroll deleted successfully
 *       404:
 *         description: Payroll not found
 */
router.delete(
  "/:id",
  asyncHandler(payrollController.delete)
);

export default router;