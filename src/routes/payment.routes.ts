import { Router } from 'express';

import {
  PaymentController,
} from '../controllers/payment.controller.js';

import {
  asyncHandler,
} from '../middleware/async-handler.middleware.js';

const router = Router();

const paymentController =
  PaymentController.getInstance();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment management APIs
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a payment
 *     description: Create a new employee payment.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - employeeId
 *               - employeeName
 *               - department
 *               - amount
 *               - date
 *               - method
 *               - payrollId
 *               - payrollMonth
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: PAY-2026-001
 *               employeeId:
 *                 type: string
 *                 example: EMP-001
 *               employeeName:
 *                 type: string
 *                 example: Rahul Sharma
 *               department:
 *                 type: string
 *                 example: IT
 *               amount:
 *                 type: number
 *                 example: 45000
 *               date:
 *                 type: string
 *                 example: 2026-08-30
 *               status:
 *                 type: string
 *                 enum:
 *                   - Paid
 *                   - Pending
 *                   - Failed
 *                 example: Paid
 *               method:
 *                 type: string
 *                 enum:
 *                   - NEFT
 *                   - IMPS
 *                   - RTGS
 *                   - UPI
 *                 example: NEFT
 *               bankReference:
 *                 type: string
 *                 nullable: true
 *                 example: BANK-REF-12345
 *               utrNumber:
 *                 type: string
 *                 nullable: true
 *                 example: UTR123456789
 *               accountNumber:
 *                 type: string
 *                 nullable: true
 *                 example: 123456789012
 *               bankName:
 *                 type: string
 *                 nullable: true
 *                 example: State Bank of India
 *               payrollId:
 *                 type: string
 *                 example: PAYROLL-2026-08
 *               payrollMonth:
 *                 type: string
 *                 example: August 2026
 *               initiatedAt:
 *                 type: string
 *                 nullable: true
 *                 example: 2026-08-30T10:00:00Z
 *               completedAt:
 *                 type: string
 *                 nullable: true
 *                 example: 2026-08-30T10:05:00Z
 *               failureReason:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               remarks:
 *                 type: string
 *                 nullable: true
 *                 example: Monthly salary payment
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Invalid payment data
 *       409:
 *         description: Payment ID already exists
 */
router.post(
  '/',
  asyncHandler(paymentController.create)
);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     description: Fetch all payments.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */
router.get(
  '/',
  asyncHandler(paymentController.findAll)
);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Fetch a single payment using its payment ID.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-001
 *     responses:
 *       200:
 *         description: Payment fetched successfully
 *       404:
 *         description: Payment not found
 */
router.get(
  '/:id',
  asyncHandler(paymentController.findById)
);

/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Update payment
 *     description: Update an existing payment.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *                 example: EMP-001
 *               employeeName:
 *                 type: string
 *                 example: Rahul Sharma
 *               department:
 *                 type: string
 *                 example: IT
 *               amount:
 *                 type: number
 *                 example: 45000
 *               date:
 *                 type: string
 *                 example: 2026-08-30
 *               status:
 *                 type: string
 *                 enum:
 *                   - Paid
 *                   - Pending
 *                   - Failed
 *               method:
 *                 type: string
 *                 enum:
 *                   - NEFT
 *                   - IMPS
 *                   - RTGS
 *                   - UPI
 *               bankReference:
 *                 type: string
 *                 nullable: true
 *               utrNumber:
 *                 type: string
 *                 nullable: true
 *               accountNumber:
 *                 type: string
 *                 nullable: true
 *               bankName:
 *                 type: string
 *                 nullable: true
 *               payrollId:
 *                 type: string
 *               payrollMonth:
 *                 type: string
 *               initiatedAt:
 *                 type: string
 *                 nullable: true
 *               completedAt:
 *                 type: string
 *                 nullable: true
 *               failureReason:
 *                 type: string
 *                 nullable: true
 *               remarks:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 */
router.put(
  '/:id',
  asyncHandler(paymentController.update)
);

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Delete payment
 *     description: Delete a payment using its payment ID.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PAY-2026-001
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 */
router.delete(
  '/:id',
  asyncHandler(paymentController.delete)
);

export default router;