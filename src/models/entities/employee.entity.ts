// =========================================================
// EMPLOYEE STATUS
// =========================================================

export type EmployeeStatus =
  'Active' |
  'Inactive' |
  'On Leave';

// =========================================================
// EMPLOYEE GENDER
// =========================================================

export type EmployeeGender =
  'Male' |
  'Female' |
  'Other';

// =========================================================
// EMPLOYEE ENTITY
// =========================================================

export interface EmployeeEntity {
  // =======================================================
  // BASIC DETAILS
  // =======================================================

  id: string;

  employeeId: string;

  name: string;

  email: string;

  phone: string;

  // =======================================================
  // JOB DETAILS
  // =======================================================

  department: string;

  designation: string;

  joiningDate: string;

  salary: number;

  // =======================================================
  // EMPLOYEE STATUS
  // =======================================================

  status: EmployeeStatus;

  // =======================================================
  // LEAVE DETAILS
  // =======================================================

  leaveStartDate: string | null;

  leaveEndDate: string | null;

  paidLeaveQuota: number;

  // =======================================================
  // ADDRESS
  // =======================================================

  address: string;

  city: string;

  state: string;

  // =======================================================
  // EMERGENCY CONTACT
  // =======================================================

  emergencyContact: string;

  // =======================================================
  // BANK DETAILS
  // =======================================================

  bankName: string;

  bankAccount: string;

  ifscCode: string;

  esicNumber: string;

  maritalStatus: string;

  // =======================================================
  // TAX DETAILS
  // =======================================================

  panNumber: string;

  // =======================================================
  // PERSONAL DETAILS
  // =======================================================

  gender: EmployeeGender;

  dateOfBirth: string;

  // =======================================================
  // TIMESTAMPS
  // =======================================================

  createdAt: Date;

  updatedAt: Date;
}