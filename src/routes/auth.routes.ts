import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/async-handler.middleware.js';

const router = Router();

const authController =
  AuthController.getInstance();

// =====================================================
// SIGNUP
// =====================================================

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Signup user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *     responses:
 *       201:
 *         description: Signup successful
 *       409:
 *         description: Email already exists
 */

router.post(
  '/signup',
  asyncHandler(
    authController.signup
  )
);

// =====================================================
// LOGIN
// =====================================================

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */

router.post(
  '/login',
  asyncHandler(
    authController.login
  )
);

// =====================================================
// CHANGE PASSWORD
// =====================================================

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Change logged-in user's password
 */

router.post(
  '/change-password',
  asyncHandler(
    authController.changePassword
  )
);

// =====================================================
// FORGOT PASSWORD (OTP FLOW)
// =====================================================

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send a 6-digit OTP to the user's email to reset password
 */

router.post(
  '/forgot-password',
  asyncHandler(
    authController.forgotPassword
  )
);

/**
 * @openapi
 * /api/auth/verify-reset-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify the OTP sent for password reset
 */

router.post(
  '/verify-reset-otp',
  asyncHandler(
    authController.verifyResetOtp
  )
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Set a new password after OTP verification
 */

router.post(
  '/reset-password',
  asyncHandler(
    authController.resetPassword
  )
);

// =====================================================
// EXPORT
// =====================================================

export default router;