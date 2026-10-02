import { Router } from 'express';

import { EmployeeController } from '../controllers/employee.controller.js';

import { asyncHandler } from '../middleware/async-handler.middleware.js';

const router = Router();

const employeeController =
  EmployeeController.getInstance();

// =====================================================
// CREATE EMPLOYEE
// =====================================================

router.post(
  '/',
  asyncHandler(
    employeeController.create
  )
);

// =====================================================
// GET ALL EMPLOYEES
// =====================================================

router.get(
  '/',
  asyncHandler(
    employeeController.findAll
  )
);

// =====================================================
// GET EMPLOYEE BY ID
// =====================================================

router.get(
  '/:id',
  asyncHandler(
    employeeController.findById
  )
);

// =====================================================
// UPDATE EMPLOYEE
// =====================================================

router.put(
  '/:id',
  asyncHandler(
    employeeController.update
  )
);

// =====================================================
// DELETE EMPLOYEE
// =====================================================

router.delete(
  '/:id',
  asyncHandler(
    employeeController.delete
  )
);

// =====================================================
// SET EMPLOYEE ACTIVE
// =====================================================

router.patch(
  '/:id/active',
  asyncHandler(
    employeeController.setActive
  )
);

// =====================================================
// SET EMPLOYEE INACTIVE
// =====================================================

router.patch(
  '/:id/inactive',
  asyncHandler(
    employeeController.setInactive
  )
);

// =====================================================
// GIVE EMPLOYEE LEAVE
// =====================================================

router.patch(
  '/:id/leave',
  asyncHandler(
    employeeController.giveLeave
  )
);

// =====================================================
// CANCEL EMPLOYEE LEAVE
// =====================================================

router.patch(
  '/:id/cancel-leave',
  asyncHandler(
    employeeController.cancelLeave
  )
);

export default router;