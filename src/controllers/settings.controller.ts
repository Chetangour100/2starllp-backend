import type {
  Request,
  Response,
} from "express";

import {
  updateSettingsSchema,
} from "../schemas/settings.schema.js";

import settingsService from "../services/settings.service.js";

/* =====================================================
   GET SETTINGS
===================================================== */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get application settings
 *     description: Get profile, company, payroll, notification and appearance settings.
 *     tags:
 *       - Settings
 *     responses:
 *       200:
 *         description: Settings fetched successfully
 *       500:
 *         description: Failed to fetch settings
 */

export async function getSettings(
  _req: Request,
  res: Response,
) {
  try {
    const settings =
      await settingsService.getSettings();

    return res.status(200).json({
      success: true,

      message:
        "Settings fetched successfully",

      data: settings,
    });
  } catch (error) {
    console.error(
      "Get Settings Error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch settings",
    });
  }
}

/* =====================================================
   UPDATE SETTINGS
===================================================== */

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update application settings
 *     description: Update profile, company, payroll, notification and appearance settings.
 *     tags:
 *       - Settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profile
 *               - company
 *               - payroll
 *               - notifications
 *             properties:
 *               profile:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - email
 *                   - phone
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: Admin User
 *                   email:
 *                     type: string
 *                     example: admin@2starllp.com
 *                   phone:
 *                     type: string
 *                     example: "9876543210"
 *               company:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                   - phone
 *                   - address
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: 2STAR STAFFING
 *                   email:
 *                     type: string
 *                     example: admin@2starllp.com
 *                   phone:
 *                     type: string
 *                     example: "9876543210"
 *                   address:
 *                     type: string
 *                     example: Indore, Madhya Pradesh
 *               payroll:
 *                 type: object
 *                 required:
 *                   - cycle
 *                   - payrollDate
 *                   - currency
 *                 properties:
 *                   cycle:
 *                     type: string
 *                     enum:
 *                       - Monthly
 *                       - Bi-Weekly
 *                       - Weekly
 *                   payrollDate:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 31
 *                     example: 31
 *                   currency:
 *                     type: string
 *                     enum:
 *                       - INR
 *                       - USD
 *                       - EUR
 *               notifications:
 *                 type: object
 *                 required:
 *                   - payrollReminder
 *                   - paymentNotification
 *                   - employeeNotification
 *                   - monthlyReport
 *                 properties:
 *                   payrollReminder:
 *                     type: boolean
 *                   paymentNotification:
 *                     type: boolean
 *                   employeeNotification:
 *                     type: boolean
 *                   monthlyReport:
 *                     type: boolean
 *               appearance:
 *                 type: object
 *                 properties:
 *                   theme:
 *                     type: string
 *                     enum:
 *                       - system
 *                       - light
 *                       - dark
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to update settings
 */

export async function updateSettings(
  req: Request,
  res: Response,
) {
  try {
    /* -----------------------------------------------
       Validate request body
    ------------------------------------------------ */

    const validation =
      updateSettingsSchema.safeParse(
        req.body,
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid settings data",

        errors:
          validation.error.flatten()
            .fieldErrors,
      });
    }

    /* -----------------------------------------------
       Update MongoDB
    ------------------------------------------------ */

    const settings =
      await settingsService.updateSettings(
        validation.data,
      );

    return res.status(200).json({
      success: true,

      message:
        "Settings updated successfully",

      data: settings,
    });
  } catch (error) {
    console.error(
      "Update Settings Error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to update settings",
    });
  }
}

/* =====================================================
   RESET SETTINGS
===================================================== */

/**
 * @swagger
 * /settings/reset:
 *   post:
 *     summary: Reset application settings
 *     description: Reset all dashboard settings to their default values.
 *     tags:
 *       - Settings
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       500:
 *         description: Failed to reset settings
 */

export async function resetSettings(
  _req: Request,
  res: Response,
) {
  try {
    const settings =
      await settingsService.resetSettings();

    return res.status(200).json({
      success: true,

      message:
        "Settings reset successfully",

      data: settings,
    });
  } catch (error) {
    console.error(
      "Reset Settings Error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to reset settings",
    });
  }
}