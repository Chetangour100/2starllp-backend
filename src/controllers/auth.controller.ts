// import type { Request, Response } from 'express';
import type {Request , Response } from 'express';
import {
  ResponseCode,
  ResponseService,
} from '../core/response-management/index.js';

import { AuthSuccessMessages } from '../core/messages/auth/auth.messages.js';

import type {
  LoginDto,
  SignupDto,
} from '../models/dtos/auth.dto.js';

import { AuthService } from '../services/auth.service.js';
import { sendResponse } from '../utils/send-response.util.js';

export class AuthController {
  private static instance: AuthController;

  private readonly authService = AuthService.getInstance();
  private readonly responseService = ResponseService.getInstance();

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }

    return AuthController.instance;
  }

  /**
   * Signup
   */
  public signup = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const payload = req.body as SignupDto;

    const user = await this.authService.signup(payload);

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.CREATED,
        AuthSuccessMessages.SIGNUP_SUCCESS,
        user
      )
    );
  };

  /**
   * Login
   */
  public login = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const payload = req.body as LoginDto;

    const result = await this.authService.login(payload);

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Login successful',
        result
      )
    );
  };

  /**
   * Change Password
   */
  public changePassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const {
      userId,
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body as {
      userId?: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

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

    if (!userId) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'User ID is required'
        )
      );
      return;
    }

    await this.authService.changePassword(
      userId,
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

  /**
   * Forgot Password — Step 1 (send OTP)
   */
  public forgotPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const { email } =
      req.body as { email: string };

    if (!email) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Email is required'
        )
      );
      return;
    }

    const result =
      await this.authService.forgotPassword(
        email
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'An OTP has been sent to your email',
        result
      )
    );
  };

  /**
   * Forgot Password — Step 2 (verify OTP)
   */
  public verifyResetOtp = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const { email, otp } =
      req.body as {
        email: string;
        otp: string;
      };

    if (!email || !otp) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Email and OTP are required'
        )
      );
      return;
    }

    await this.authService.verifyResetOtp(
      email,
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

  /**
   * Forgot Password — Step 3 (set new password)
   */
  public resetPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body as {
      email: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
    };

    if (
      !email ||
      !otp ||
      !newPassword
    ) {
      sendResponse(
        res,
        this.responseService.error(
          ResponseCode.VALIDATION_ERROR,
          'Email, OTP and new password are required'
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

    await this.authService.resetPassword(
      email,
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