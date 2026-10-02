import {
  Schema,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from 'mongoose';

/* =====================================================
   DEPARTMENT BREAKDOWN
===================================================== */

const departmentBreakdownSchema = new Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    employees: {
      type: Number,
      required: true,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

/* =====================================================
   EMPLOYEE PAYROLL
===================================================== */

const employeePayrollSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    /* -------------------------------------------------
       SALARY
    ------------------------------------------------- */

    monthlySalary: {
      type: Number,
      required: true,
      min: 0,
    },

    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    /* -------------------------------------------------
       ATTENDANCE / LEAVE
    ------------------------------------------------- */

    totalDays: {
      type: Number,
      required: true,
      min: 0,
    },

    workingDays: {
      type: Number,
      required: true,
      min: 0,
    },

    paidLeaveDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    unpaidLeaveDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    absentDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /* -------------------------------------------------
       DEDUCTIONS
    ------------------------------------------------- */

    leaveDeduction: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    otherDeductions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalDeductions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /* -------------------------------------------------
       NET SALARY
    ------------------------------------------------- */

    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    /* -------------------------------------------------
       BANK DETAILS SNAPSHOT
    ------------------------------------------------- */

    bankName: {
      type: String,
      default: null,
      trim: true,
    },

    bankAccount: {
      type: String,
      default: null,
      trim: true,
    },

    ifscCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    /* -------------------------------------------------
       PAYMENT
    ------------------------------------------------- */

    paymentStatus: {
      type: String,
      enum: [
        'Pending',
        'Processing',
        'Paid',
        'Failed',
      ],
      default: 'Pending',
    },

    transactionId: {
      type: String,
      default: null,
      trim: true,
    },

    paidAt: {
      type: String,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: [
        'NEFT',
        'IMPS',
        'RTGS',
        'UPI',
        'Bank Transfer',
      ],
      default: 'Bank Transfer',
    },
  },
  {
    _id: false,
  }
);

/* =====================================================
   PAYROLL SCHEMA
===================================================== */

const payrollSchema = new Schema(
  {
    /* -------------------------------------------------
       PAYROLL ID
    ------------------------------------------------- */

    payrollId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    /* -------------------------------------------------
       MONTH
    ------------------------------------------------- */

    month: {
      type: String,
      required: true,
      trim: true,
    },

    periodStart: {
      type: String,
      required: true,
    },

    periodEnd: {
      type: String,
      required: true,
    },

    payrollDate: {
      type: String,
      default: null,
    },

    /* -------------------------------------------------
       EMPLOYEE PAYROLL
    ------------------------------------------------- */

    employeePayrolls: {
      type: [employeePayrollSchema],
      required: true,
      default: [],
    },

    /* -------------------------------------------------
       SUMMARY
    ------------------------------------------------- */

    totalEmployees: {
      type: Number,
      required: true,
      min: 0,
    },

    grossPayroll: {
      type: Number,
      required: true,
      min: 0,
    },

    deductions: {
      type: Number,
      required: true,
      min: 0,
    },

    netPayroll: {
      type: Number,
      required: true,
      min: 0,
    },

    /* -------------------------------------------------
       STATUS
    ------------------------------------------------- */

    status: {
      type: String,
      enum: [
        'Completed',
        'Pending',
        'Processing',
        'Failed',
      ],
      required: true,
      default: 'Pending',
    },

    /* -------------------------------------------------
       PROCESSING
    ------------------------------------------------- */

    processedDate: {
      type: String,
      default: null,
    },

    processedBy: {
      type: String,
      default: null,
      trim: true,
    },

    /* -------------------------------------------------
       DEPARTMENT BREAKDOWN
    ------------------------------------------------- */

    departmentBreakdown: {
      type: [departmentBreakdownSchema],
      required: true,
      default: [],
    },

    /* -------------------------------------------------
       NOTES
    ------------------------------------------------- */

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'payrolls',
  }
);

/* =====================================================
   TYPES
===================================================== */

export type PayrollDocument =
  InferSchemaType<typeof payrollSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export type PayrollModel =
  Model<PayrollDocument>;

/* =====================================================
   MODEL
===================================================== */

export const Payroll =
  model<PayrollDocument>(
    'Payroll',
    payrollSchema
  );