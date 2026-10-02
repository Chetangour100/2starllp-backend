import { Router } from 'express';

import { EmployeeAuthController } from '../controllers/employee-auth.controller.js';

import { asyncHandler } from '../middleware/async-handler.middleware.js';

const router = Router();

const employeeAuthController =
  EmployeeAuthController.getInstance();

// =====================================================
// LOGIN (mobile number + password)
// =====================================================

router.post(
  '/login',
  asyncHandler(
    employeeAuthController.login
  )
);

// =====================================================
// CHANGE PASSWORD (logged in)
// =====================================================

router.post(
  '/change-password',
  asyncHandler(
    employeeAuthController.changePassword
  )
);

// =====================================================
// FORGOT PASSWORD (OTP FLOW)
// =====================================================

router.post(
  '/forgot-password',
  asyncHandler(
    employeeAuthController.forgotPassword
  )
);

router.post(
  '/verify-reset-otp',
  asyncHandler(
    employeeAuthController.verifyResetOtp
  )
);

router.post(
  '/reset-password',
  asyncHandler(
    employeeAuthController.resetPassword
  )
);

// =====================================================
// EXPORT
// =====================================================

export default router;
