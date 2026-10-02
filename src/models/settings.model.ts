import mongoose, {
  Schema,
  type Model,
  type HydratedDocument,
} from "mongoose";

/* =====================================================
   TYPES
===================================================== */

export type PayrollCycle =
  | "Monthly"
  | "Bi-Weekly"
  | "Weekly";

export type Currency =
  | "INR"
  | "USD"
  | "EUR";

export type Theme =
  | "system"
  | "light"
  | "dark";

/* =====================================================
   SETTINGS DOCUMENT
===================================================== */

export interface ISettings {
  key: string;

  profile: {
    fullName: string;
    email: string;
    phone: string;
  };

  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  payroll: {
    cycle: PayrollCycle;
    payrollDate: number;
    currency: Currency;
  };

  bankAccount: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };

  notifications: {
    payrollReminder: boolean;
    paymentNotification: boolean;
    employeeNotification: boolean;
    monthlyReport: boolean;
  };

  appearance: {
    theme: Theme;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export type SettingsDocument =
  HydratedDocument<ISettings>;

/* =====================================================
   SCHEMA
===================================================== */

const settingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },

    /* ---------------------------------------------
       PROFILE
    --------------------------------------------- */

    profile: {
      fullName: {
        type: String,
        required: true,
        trim: true,
        default: "Admin User",
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        default: "admin@2starllp.com",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /* ---------------------------------------------
       COMPANY
    --------------------------------------------- */

    company: {
      name: {
        type: String,
        required: true,
        trim: true,
        default: "2STAR STAFFING",
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        default: "admin@2starllp.com",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },

      address: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /* ---------------------------------------------
       PAYROLL
    --------------------------------------------- */

    payroll: {
      cycle: {
        type: String,
        enum: [
          "Monthly",
          "Bi-Weekly",
          "Weekly",
        ],
        default: "Monthly",
      },

      payrollDate: {
        type: Number,
        min: 1,
        max: 31,
        default: 31,
      },

      currency: {
        type: String,
        enum: [
          "INR",
          "USD",
          "EUR",
        ],
        default: "INR",
      },
    },

    /* ---------------------------------------------
       BANK ACCOUNT
       (jis account se employees ki salary
       transfer hogi)
    --------------------------------------------- */

    bankAccount: {
      bankName: {
        type: String,
        trim: true,
        default: "",
      },

      accountHolderName: {
        type: String,
        trim: true,
        default: "",
      },

      accountNumber: {
        type: String,
        trim: true,
        default: "",
      },

      ifscCode: {
        type: String,
        trim: true,
        default: "",
      },

      branch: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /* ---------------------------------------------
       NOTIFICATIONS
    --------------------------------------------- */

    notifications: {
      payrollReminder: {
        type: Boolean,
        default: true,
      },

      paymentNotification: {
        type: Boolean,
        default: true,
      },

      employeeNotification: {
        type: Boolean,
        default: true,
      },

      monthlyReport: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------
       APPEARANCE
    --------------------------------------------- */

    appearance: {
      theme: {
        type: String,
        enum: [
          "system",
          "light",
          "dark",
        ],
        default: "system",
      },
    },
  },
  {
    timestamps: true,
    collection: "settings",
  },
);

/* =====================================================
   MODEL
===================================================== */

const Settings: Model<ISettings> =
  (mongoose.models.Settings as Model<ISettings>) ||
  mongoose.model<ISettings>(
    "Settings",
    settingsSchema,
  );

export default Settings;