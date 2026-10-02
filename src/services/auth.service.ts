import bcrypt from 'bcryptjs';

import {
  ConflictException,
  UnauthorizedException,
} from '../common/exceptions/index.js';

import { AuthErrorMessages } from '../core/messages/auth/auth.messages.js';

import type {
  LoginDto,
  SignupDto,
} from '../models/dtos/auth.dto.js';

import type { UserEntity } from '../models/entities/user.entity.js';
import { User } from '../schemas/user.schema.js';

import { generateToken } from '../utils/jwt.util.js';
import { sendOtpEmail } from '../utils/email.util.js';

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }

    return AuthService.instance;
  }

  /**
   * Signup
   */
  public async signup(payload: SignupDto): Promise<UserEntity> {
    const existingUser = await User.findOne({
      email: payload.email,
    }).lean();

    if (existingUser) {
      throw new ConflictException(
        AuthErrorMessages.EMAIL_ALREADY_EXISTS,
        'AUTH_SIGNUP'
      );
    }

    const hashedPassword = await bcrypt.hash(
      payload.password,
      10
    );

    const user = await User.create({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
    });

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Login
   */
  public async login(payload: LoginDto) {
    const user = await User.findOne({
      email: payload.email,
    }).select('+password');

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
        'AUTH_LOGIN'
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive',
        'AUTH_LOGIN'
      );
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
        'AUTH_LOGIN'
      );
    }

    const token = generateToken(String(user._id));

    return {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
      token,
    };
  }

  /**
   * Change Password
   * (logged-in user apna current password
   * verify karke naya password set karta hai)
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {

    const user =
      await User.findById(
        userId
      ).select('+password');

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
        'AUTH_CHANGE_PASSWORD'
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Current password is incorrect',
        'AUTH_CHANGE_PASSWORD'
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    user.password = hashedPassword;

    await user.save();
  }

  /**
   * Forgot Password — Step 1
   * Email diye gaye user ke liye ek 6-digit
   * OTP generate karke DB me (hashed) save
   * karta hai, 10 minute ke liye valid.
   *
   * Return value me OTP bhi diya jata hai —
   * kyunki abhi tak SMTP/email service
   * configure nahi hai, isliye OTP server
   * console me print hota hai aur (sirf
   * non-production environment me) response
   * me bhi bhej diya jata hai taaki testing
   * turant ho sake.
   */
  public async forgotPassword(
    email: string
  ): Promise<{ devOtp?: string }> {

    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      throw new UnauthorizedException(
        'No account found with this email',
        'AUTH_FORGOT_PASSWORD'
      );
    }

    const otp = String(
      Math.floor(
        100000 +
          Math.random() * 900000
      )
    );

    const hashedOtp =
      await bcrypt.hash(
        otp,
        10
      );

    user.resetOtp = hashedOtp;

    user.resetOtpExpiresAt =
      new Date(
        Date.now() +
          10 * 60 * 1000
      );

    await user.save();

    /*
     * Pehle asli Gmail se OTP bhejne ki
     * koshish karo. Agar GMAIL_USER /
     * GMAIL_APP_PASSWORD .env me set nahi
     * hain, ya bhejte waqt koi error aaye,
     * to emailSent false rahega.
     */

    const emailSent =
      await sendOtpEmail(
        email,
        otp
      ).catch((error) => {
        console.error(
          'Failed to send OTP email:',
          error
        );
        return false;
      });

    console.log(
      `[Forgot Password] OTP for ${email}: ${otp} (valid 10 minutes)`
    );

    const isProduction =
      process.env.NODE_ENV ===
      'production';

    /*
     * Email successfully bhej diya gaya —
     * ab OTP UI me kabhi mat dikhao
     * (security ke liye).
     */

    if (emailSent) {
      return {};
    }

    /*
     * Email nahi bheja gaya (Gmail
     * configure nahi hai) — sirf tab dev
     * OTP dikhao jab production me na ho.
     */

    return isProduction
      ? {}
      : { devOtp: otp };
  }

  /**
   * Forgot Password — Step 2
   * OTP verify karta hai (consume nahi
   * karta, sirf check karta hai ki sahi
   * hai aur expire nahi hua).
   */
  public async verifyResetOtp(
    email: string,
    otp: string
  ): Promise<void> {

    const user =
      await User.findOne({
        email,
      }).select(
        '+resetOtp +resetOtpExpiresAt'
      );

    if (
      !user ||
      !user.resetOtp ||
      !user.resetOtpExpiresAt
    ) {
      throw new UnauthorizedException(
        'No OTP request found — please request a new OTP',
        'AUTH_VERIFY_OTP'
      );
    }

    if (
      user.resetOtpExpiresAt.getTime() <
      Date.now()
    ) {
      throw new UnauthorizedException(
        'OTP has expired — please request a new one',
        'AUTH_VERIFY_OTP'
      );
    }

    const isOtpValid =
      await bcrypt.compare(
        otp,
        user.resetOtp
      );

    if (!isOtpValid) {
      throw new UnauthorizedException(
        'Invalid OTP',
        'AUTH_VERIFY_OTP'
      );
    }
  }

  /**
   * Forgot Password — Step 3
   * OTP dobara verify karke (consume karte
   * hue) naya password set karta hai.
   */
  public async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {

    const user =
      await User.findOne({
        email,
      }).select(
        '+resetOtp +resetOtpExpiresAt'
      );

    if (
      !user ||
      !user.resetOtp ||
      !user.resetOtpExpiresAt
    ) {
      throw new UnauthorizedException(
        'No OTP request found — please request a new OTP',
        'AUTH_RESET_PASSWORD'
      );
    }

    if (
      user.resetOtpExpiresAt.getTime() <
      Date.now()
    ) {
      throw new UnauthorizedException(
        'OTP has expired — please request a new one',
        'AUTH_RESET_PASSWORD'
      );
    }

    const isOtpValid =
      await bcrypt.compare(
        otp,
        user.resetOtp
      );

    if (!isOtpValid) {
      throw new UnauthorizedException(
        'Invalid OTP',
        'AUTH_RESET_PASSWORD'
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    user.password = hashedPassword;

    /* OTP consume karo — dobara istemal na ho */

    user.resetOtp = null;
    user.resetOtpExpiresAt = null;

    await user.save();
  }
}