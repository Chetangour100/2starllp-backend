import Settings from "../models/settings.model.js";

import type {
  ISettings,
  PayrollCycle,
  Currency,
  Theme,
} from "../models/settings.model.js";

import type {
  UpdateSettingsInput,
} from "../schemas/settings.schema.js";

/* =====================================================
   DEFAULT SETTINGS
===================================================== */

const DEFAULT_SETTINGS: ISettings = {
  key: "global",

  profile: {
    fullName: "Admin User",
    email: "admin@2starllp.com",
    phone: "",
  },

  company: {
    name: "2STAR STAFFING",
    email: "admin@2starllp.com",
    phone: "",
    address: "",
  },

  payroll: {
    cycle: "Monthly" as PayrollCycle,
    payrollDate: 31,
    currency: "INR" as Currency,
  },

  bankAccount: {
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
  },

  notifications: {
    payrollReminder: true,
    paymentNotification: true,
    employeeNotification: true,
    monthlyReport: false,
  },

  appearance: {
    theme: "system" as Theme,
  },
};

/* =====================================================
   SERVICE
===================================================== */

export const settingsService = {
  /* ===================================================
     GET SETTINGS
  =================================================== */

  async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne({
      key: "global",
    })
      .lean<ISettings>()
      .exec();

    /* -----------------------------------------------
       FIRST TIME
       Create default settings
    ----------------------------------------------- */

    if (!settings) {
      const created =
        await Settings.create(
          DEFAULT_SETTINGS,
        );

      settings = created.toObject() as ISettings;
    }

    return settings;
  },

  /* ===================================================
     UPDATE SETTINGS
  =================================================== */

  async updateSettings(
    input: UpdateSettingsInput,
  ): Promise<ISettings> {
    /* -----------------------------------------------
       Build update object
    ----------------------------------------------- */

    const updateData: Partial<ISettings> = {};

    if (input.profile) {
      updateData.profile =
        input.profile as ISettings["profile"];
    }

    if (input.company) {
      updateData.company =
        input.company as ISettings["company"];
    }

    if (input.payroll) {
      updateData.payroll =
        input.payroll as ISettings["payroll"];
    }

    if (input.bankAccount) {
      updateData.bankAccount =
        input.bankAccount as ISettings["bankAccount"];
    }

    if (input.notifications) {
      updateData.notifications =
        input.notifications as ISettings["notifications"];
    }

    if (input.appearance) {
      updateData.appearance =
        input.appearance as ISettings["appearance"];
    }

    /* -----------------------------------------------
       Update
    ----------------------------------------------- */

    let settings =
      await Settings.findOneAndUpdate(
        {
          key: "global",
        },

        {
          $set: updateData,
        },

        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,

          // Important:
          // Return document instead of ModifyResult
          includeResultMetadata: false,
        },
      )
        .lean<ISettings>()
        .exec();

    /* -----------------------------------------------
       Safety fallback
    ----------------------------------------------- */

    if (!settings) {
      settings = await this.getSettings();
    }

    return settings;
  },

  /* ===================================================
     RESET SETTINGS
  =================================================== */

  async resetSettings(): Promise<ISettings> {
    let settings =
      await Settings.findOneAndUpdate(
        {
          key: "global",
        },

        {
          $set: DEFAULT_SETTINGS,
        },

        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,

          includeResultMetadata: false,
        },
      )
        .lean<ISettings>()
        .exec();

    /* -----------------------------------------------
       Safety fallback
    ----------------------------------------------- */

    if (!settings) {
      settings = await this.getSettings();
    }

    return settings;
  },
};

export default settingsService;