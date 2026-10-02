import { z } from 'zod';

/* =====================================================
   EMPLOYEE STATUS
===================================================== */

export const employeeStatusSchema = z.enum([
  'Active',
  'Inactive',
  'On Leave',
]);

/* =====================================================
   EMPLOYEE GENDER
===================================================== */

export const employeeGenderSchema = z.enum([
  'Male',
  'Female',
  'Other',
]);

/* =====================================================
   CREATE EMPLOYEE
===================================================== */

export const createEmployeeSchema = z.object({
  // ===================================================
  // BASIC DETAILS
  // ===================================================

  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.email('Invalid email format')
    ),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9]{10,13}$/,
      'Invalid phone number'
    ),

  // ===================================================
  // JOB DETAILS
  // ===================================================

  department: z
    .string()
    .trim()
    .min(1, 'Department is required')
    .max(
      100,
      'Department must be at most 100 characters'
    ),

  designation: z
    .string()
    .trim()
    .min(1, 'Designation is required')
    .max(
      100,
      'Designation must be at most 100 characters'
    ),

  joiningDate: z
    .string()
    .min(1, 'Joining date is required'),

  salary: z
    .number()
    .nonnegative(
      'Salary cannot be negative'
    ),

  status: employeeStatusSchema.default(
    'Active'
  ),

  // ===================================================
  // MONTHLY PAID LEAVE QUOTA
  // (kitne din tak leave paid mani jayegi)
  // ===================================================

  paidLeaveQuota: z
    .number()
    .nonnegative(
      'Paid leave quota cannot be negative'
    )
    .default(2)
    .optional(),

  // ===================================================
  // ADDRESS
  // ===================================================

  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(
      500,
      'Address must be at most 500 characters'
    ),

  city: z
    .string()
    .trim()
    .min(1, 'City is required')
    .max(
      100,
      'City must be at most 100 characters'
    )
    .regex(
      /^[A-Za-z\s.'-]+$/,
      'City can contain only letters'
    ),

  state: z
    .string()
    .trim()
    .min(1, 'State is required')
    .max(
      100,
      'State must be at most 100 characters'
    ),

  // ===================================================
  // EMERGENCY CONTACT
  // ===================================================

  emergencyContact: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9]{10,13}$/,
      'Invalid emergency contact number'
    ),

  // ===================================================
  // BANK DETAILS
  // ===================================================

  bankName: z
    .string()
    .trim()
    .min(
      2,
      'Bank name is required'
    )
    .max(
      100,
      'Bank name must be at most 100 characters'
    )
    .regex(
      /^[A-Za-z0-9\s&.'()-]+$/,
      'Bank name contains invalid characters'
    ),

  bankAccount: z
    .string()
    .trim()
    .min(
      9,
      'Bank account number is too short'
    )
    .max(
      18,
      'Bank account number must be at most 18 digits'
    )
    .regex(
      /^\d+$/,
      'Bank account must contain digits only'
    ),

  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      'Invalid IFSC code'
    ),

  // ===================================================
  // ESIC
  // ===================================================

  esicNumber: z
    .string()
    .trim()
    .optional(),

  maritalStatus: z
    .enum([
      'Single',
      'Married',
      '',
    ])
    .optional(),

  // ===================================================
  // PAN
  // ===================================================

  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{5}[0-9]{4}[A-Z]$/,
      'Invalid PAN number'
    ),

  // ===================================================
  // PERSONAL DETAILS
  // ===================================================

  gender: employeeGenderSchema,

  dateOfBirth: z
    .string()
    .min(
      1,
      'Date of birth is required'
    ),
});

/* =====================================================
   UPDATE EMPLOYEE
===================================================== */

export const updateEmployeeSchema =
  createEmployeeSchema.partial();

/* =====================================================
   TYPES
===================================================== */

export type CreateEmployeeDto =
  z.infer<typeof createEmployeeSchema>;

export type UpdateEmployeeDto =
  z.infer<typeof updateEmployeeSchema>;