import { z } from "zod";

/* =====================================================
   HELPERS
===================================================== */

const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^\d{10}$/.test(value),
    {
      message:
        "Phone number must contain exactly 10 digits",
    },
  );

/* =====================================================
   PROFILE
===================================================== */

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      2,
      "Full name must be at least 2 characters",
    )
    .max(
      100,
      "Full name cannot exceed 100 characters",
    ),

  email: z
    .string()
    .trim()
    .email("Invalid profile email"),

  phone: phoneSchema,
});

/* =====================================================
   COMPANY
===================================================== */

const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Company name must be at least 2 characters",
    )
    .max(
      150,
      "Company name cannot exceed 150 characters",
    ),

  email: z
    .string()
    .trim()
    .email("Invalid company email"),

  phone: phoneSchema,

  address: z
    .string()
    .trim()
    .max(
      500,
      "Address cannot exceed 500 characters",
    ),
});

/* =====================================================
   PAYROLL
===================================================== */

const payrollSchema = z.object({
  cycle: z.enum([
    "Monthly",
    "Bi-Weekly",
    "Weekly",
  ]),

  payrollDate: z.coerce
    .number()
    .int()
    .min(1)
    .max(31),

  currency: z.enum([
    "INR",
    "USD",
    "EUR",
  ]),
});

/* =====================================================
   BANK ACCOUNT
===================================================== */

const bankAccountSchema = z.object({
  bankName: z
    .string()
    .trim()
    .max(150, "Bank name cannot exceed 150 characters"),

  accountHolderName: z
    .string()
    .trim()
    .max(150, "Account holder name cannot exceed 150 characters"),

  accountNumber: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        /^\d{9,18}$/.test(value),
      {
        message:
          "Account number must be 9-18 digits",
      },
    ),

  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (value) =>
        value === "" ||
        /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value),
      {
        message: "Invalid IFSC code",
      },
    ),

  branch: z
    .string()
    .trim()
    .max(150, "Branch name cannot exceed 150 characters"),
});

/* =====================================================
   NOTIFICATIONS
===================================================== */

const notificationsSchema =
  z.object({
    payrollReminder: z.boolean(),

    paymentNotification: z.boolean(),

    employeeNotification: z.boolean(),

    monthlyReport: z.boolean(),
  });

/* =====================================================
   APPEARANCE
===================================================== */

const appearanceSchema =
  z.object({
    theme: z.enum([
      "system",
      "light",
      "dark",
    ]),
  });

/* =====================================================
   COMPLETE SETTINGS
===================================================== */

export const updateSettingsSchema =
  z.object({
    profile: profileSchema,

    company: companySchema,

    payroll: payrollSchema,

    bankAccount:
      bankAccountSchema.optional(),

    notifications:
      notificationsSchema,

    appearance:
      appearanceSchema.optional(),
  });

/* =====================================================
   TYPES
===================================================== */

export type UpdateSettingsInput =
  z.infer<
    typeof updateSettingsSchema
  >;