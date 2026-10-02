import type { Request, Response } from 'express';

import {
  ResponseCode,
  ResponseService,
} from '../core/response-management/index.js';

import { EmployeeService } from '../services/employee.service.js';

import { sendResponse } from '../utils/send-response.util.js';

export class EmployeeAuthController {
  private static instance: EmployeeAuthController;

  private readonly employeeService =
    EmployeeService.getInstance();

  private readonly responseService =
    ResponseService.getInstance();

  public static getInstance(): EmployeeAuthController {
    if (!EmployeeAuthController.instance) {
      EmployeeAuthController.instance =
        new EmployeeAuthController();
    }

    return EmployeeAuthController.instance;
  }

  /* ===================================================
     LOGIN (mobile number + password)
  =================================================== */

  public login = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const { phone, password } =
      req.body as {
        phone: string;
        password: string;
      };

    if (!phone || !password) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Mobile number and password are required'
        )
      );
      return;
    }

    const result =
      await this.employeeService.login(
        phone,
        password
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Login successful',
        result
      )
    );
  };

  /* ===================================================
     CHANGE PASSWORD (logged in)
  =================================================== */

  public changePassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const {
      employeeId,
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body as {
      employeeId: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

    if (
      !employeeId ||
      !currentPassword ||
      !newPassword
    ) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Employee ID, current password and new password are required'
        )
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'New password and confirm password do not match'
        )
      );
      return;
    }

    await this.employeeService.changePassword(
      employeeId,
      currentPassword,
      newPassword
    );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Password changed successfully',
        null
      )
    );
  };

  /* ===================================================
     FORGOT PASSWORD — STEP 1 (send OTP)
  =================================================== */

  public forgotPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const { phone } =
      req.body as {
        phone: string;
      };

    if (!phone) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Mobile number is required'
        )
      );
      return;
    }

    const result =
      await this.employeeService.forgotPassword(
        phone
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'An OTP has been sent to your registered email',
        result
      )
    );
  };

  /* ===================================================
     FORGOT PASSWORD — STEP 2 (verify OTP)
  =================================================== */

  public verifyResetOtp = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const { phone, otp } =
      req.body as {
        phone: string;
        otp: string;
      };

    if (!phone || !otp) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Mobile number and OTP are required'
        )
      );
      return;
    }

    await this.employeeService.verifyResetOtp(
      phone,
      otp
    );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'OTP verified successfully',
        null
      )
    );
  };

  /* ===================================================
     FORGOT PASSWORD — STEP 3 (set new password)
  =================================================== */

  public resetPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const {
      phone,
      otp,
      newPassword,
      confirmPassword,
    } = req.body as {
      phone: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
    };

    if (
      !phone ||
      !otp ||
      !newPassword
    ) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Mobile number, OTP and new password are required'
        )
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'New password and confirm password do not match'
        )
      );
      return;
    }

    await this.employeeService.resetPassword(
      phone,
      otp,
      newPassword
    );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Password has been reset successfully',
        null
      )
    );
  };
}
