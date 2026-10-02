import {
  Schema,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from 'mongoose';

/* =====================================================
   EMPLOYEE SCHEMA
===================================================== */

const employeeSchema = new Schema(
  {
    // =====================================================
    // EMPLOYEE ID
    // =====================================================

    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // =====================================================
    // BASIC DETAILS
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // =====================================================
    // EMPLOYEE APP LOGIN
    // (mobile number + password se login karne ke liye)
    // =====================================================

    // NOTE: required nahi hai — purane employees (jo is feature se
    // pehle bane the) ke paas password nahi hota. Unka pehla login
    // default password (= phone number) se hota hai aur tabhi
    // hashed password save ho jata hai (EmployeeService.login).
    password: {
      type: String,
      select: false,
    },

    resetOtp: {
      type: String,
      default: null,
      select: false,
    },

    resetOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    // =====================================================
    // JOB DETAILS
    // =====================================================

    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    joiningDate: {
      type: String,
      required: true,
    },

    salary: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================================
    // EMPLOYEE STATUS
    // =====================================================

    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active',
    },

    // =====================================================
    // LEAVE MANAGEMENT
    // =====================================================

    leaveStartDate: {
      type: String,
      default: null,
    },

    leaveEndDate: {
      type: String,
      default: null,
    },

    // =====================================================
    // MONTHLY PAID LEAVE QUOTA
    //
    // Kitne din tak leave "paid" mani jayegi.
    // Isse zyada leave automatically unpaid ho
    // jayegi aur payroll me salary se katega.
    // =====================================================

    paidLeaveQuota: {
      type: Number,
      default: 2,
      min: 0,
    },

    // =====================================================
    // ADDRESS
    // =====================================================

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      match: [
        /^[A-Za-z\s.'-]+$/,
        'City can contain only letters',
      ],
    },

    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // =====================================================
    // EMERGENCY CONTACT
    // =====================================================

    emergencyContact: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^\+?[0-9]{10,13}$/,
        'Invalid emergency contact number',
      ],
    },

    // =====================================================
    // BANK / TAX DETAILS
    // =====================================================

    bankName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    bankAccount: {
      type: String,
      required: true,
      trim: true,
      minlength: 9,
      maxlength: 18,
      match: [
        /^\d+$/,
        'Bank account must contain digits only',
      ],
    },

    ifscCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 11,
      maxlength: 11,
      match: [
        /^[A-Z]{4}0[A-Z0-9]{6}$/,
        'Invalid IFSC code',
      ],
    },

    // =====================================================
    // ESIC (Employee State Insurance)
    // =====================================================

    esicNumber: {
      type: String,
      trim: true,
      default: '',
    },

    maritalStatus: {
      type: String,
      enum: [
        'Single',
        'Married',
        '',
      ],
      default: '',
    },

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        'Invalid PAN number',
      ],
    },

    // =====================================================
    // PERSONAL DETAILS
    // =====================================================

    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },

    dateOfBirth: {
      type: String,
      required: true,
    },
  },

  // =====================================================
  // SCHEMA OPTIONS
  // =====================================================

  {
    timestamps: true,
    collection: 'employees',
  }
);

// =========================================================
// TYPES
// =========================================================

export type EmployeeDocument =
  InferSchemaType<typeof employeeSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export type EmployeeModel =
  Model<EmployeeDocument>;

// =========================================================
// MODEL
// =========================================================

export const Employee =
  model<EmployeeDocument>(
    'Employee',
    employeeSchema
  );