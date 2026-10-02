import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../common/exceptions/index.js";

import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from "../models/dtos/employee.dto.js";

import type {
  EmployeeEntity,
} from "../models/entities/employee.entity.js";

import { Employee } from "../schemas/employee.schema.js";
import { generateToken } from "../utils/jwt.util.js";
import { sendOtpEmail } from "../utils/email.util.js";

export class EmployeeService {
  private static instance: EmployeeService;

  public static getInstance(): EmployeeService {
    if (!EmployeeService.instance) {
      EmployeeService.instance =
        new EmployeeService();
    }

    return EmployeeService.instance;
  }

  // =====================================================
  // CREATE EMPLOYEE
  // =====================================================

  public async create(
    payload: CreateEmployeeDto
  ): Promise<EmployeeEntity> {
    const existingEmail =
      await Employee.findOne({
        email: payload.email,
      }).lean();

    if (existingEmail) {
      throw new ConflictException(
        "Employee email already exists",
        "EMPLOYEE_CREATE"
      );
    }

    const existingPhone =
      await Employee.findOne({
        phone: payload.phone,
      }).lean();

    if (existingPhone) {
      throw new ConflictException(
        "Employee phone number already exists",
        "EMPLOYEE_CREATE"
      );
    }

    const employeeId =
      await this.generateEmployeeId();

    /*
     * Employee App me login karne ke liye
     * default password = apna phone number
     * (hashed). Employee baad me profile se
     * ya "Forgot Password" (OTP) se badal
     * sakta hai.
     */

    const defaultPassword =
      await bcrypt.hash(
        payload.phone,
        10
      );

    const employee =
      await Employee.create({
        employeeId,
        ...payload,
        password: defaultPassword,
        status: "Active",
        leaveStartDate: null,
        leaveEndDate: null,
      });

    return this.toEntity(employee);
  }

  // =====================================================
  // EMPLOYEE APP — LOGIN (mobile + password)
  // =====================================================

  public async login(
    phone: string,
    password: string
  ): Promise<{
    employee: EmployeeEntity;
    token: string;
  }> {

    const employee =
      await Employee.findOne({
        phone,
      }).select("+password");

    if (!employee) {
      throw new UnauthorizedException(
        "Invalid mobile number or password",
        "EMPLOYEE_LOGIN"
      );
    }

    if (employee.status === "Inactive") {
      throw new UnauthorizedException(
        "Your account is inactive. Please contact HR/Admin.",
        "EMPLOYEE_LOGIN"
      );
    }

    let isPasswordValid = false;

    if (employee.password) {
      isPasswordValid =
        await bcrypt.compare(
          password,
          employee.password
        );
    } else {
      /*
       * Purana employee (password abhi set nahi hua) —
       * default password = phone number. Sahi hone par
       * hashed password save kar do.
       */
      isPasswordValid =
        password === employee.phone;

      if (isPasswordValid) {
        employee.password =
          await bcrypt.hash(
            password,
            10
          );

        await employee.save();
      }
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "Invalid mobile number or password",
        "EMPLOYEE_LOGIN"
      );
    }

    const token = generateToken(
      String(employee._id)
    );

    return {
      employee: this.toEntity(
        this.calculateCurrentStatus(
          employee.toObject()
        )
      ),
      token,
    };
  }

  // =====================================================
  // EMPLOYEE APP — CHANGE PASSWORD (logged in)
  // =====================================================

  public async changePassword(
    employeeId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {

    const employee =
      await Employee.findOne({
        employeeId,
      }).select("+password");

    if (!employee) {
      throw new NotFoundException(
        "Employee not found",
        "EMPLOYEE_CHANGE_PASSWORD"
      );
    }

    const isPasswordValid =
      employee.password
        ? await bcrypt.compare(
            currentPassword,
            employee.password
          )
        : currentPassword ===
          employee.phone;

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "Current password is incorrect",
        "EMPLOYEE_CHANGE_PASSWORD"
      );
    }

    employee.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await employee.save();
  }

  // =====================================================
  // EMPLOYEE APP — FORGOT PASSWORD (OTP via email)
  // =====================================================

  public async forgotPassword(
    phone: string
  ): Promise<{
    email: string;
    devOtp?: string;
  }> {

    const employee =
      await Employee.findOne({
        phone,
      });

    if (!employee) {
      throw new UnauthorizedException(
        "No account found with this mobile number",
        "EMPLOYEE_FORGOT_PASSWORD"
      );
    }

    const otp = String(
      Math.floor(
        100000 +
          Math.random() * 900000
      )
    );

    employee.resetOtp =
      await bcrypt.hash(
        otp,
        10
      );

    employee.resetOtpExpiresAt =
      new Date(
        Date.now() +
          10 * 60 * 1000
      );

    await employee.save();

    const emailSent =
      await sendOtpEmail(
        employee.email,
        otp
      ).catch((error) => {
        console.error(
          "Failed to send employee OTP email:",
          error
        );
        return false;
      });

    console.log(
      `[Employee Forgot Password] OTP for ${phone} (${employee.email}): ${otp}`
    );

    const isProduction =
      process.env.NODE_ENV ===
      "production";

    const maskedEmail =
      employee.email.replace(
        /^(.{2}).+(@.+)$/,
        "$1***$2"
      );

    if (emailSent) {
      return { email: maskedEmail };
    }

    return isProduction
      ? { email: maskedEmail }
      : {
          email: maskedEmail,
          devOtp: otp,
        };
  }

  public async verifyResetOtp(
    phone: string,
    otp: string
  ): Promise<void> {

    const employee =
      await Employee.findOne({
        phone,
      }).select(
        "+resetOtp +resetOtpExpiresAt"
      );

    if (
      !employee ||
      !employee.resetOtp ||
      !employee.resetOtpExpiresAt
    ) {
      throw new UnauthorizedException(
        "No OTP request found — please request a new OTP",
        "EMPLOYEE_VERIFY_OTP"
      );
    }

    if (
      employee.resetOtpExpiresAt.getTime() <
      Date.now()
    ) {
      throw new UnauthorizedException(
        "OTP has expired — please request a new one",
        "EMPLOYEE_VERIFY_OTP"
      );
    }

    const isOtpValid =
      await bcrypt.compare(
        otp,
        employee.resetOtp
      );

    if (!isOtpValid) {
      throw new UnauthorizedException(
        "Invalid OTP",
        "EMPLOYEE_VERIFY_OTP"
      );
    }
  }

  public async resetPassword(
    phone: string,
    otp: string,
    newPassword: string
  ): Promise<void> {

    const employee =
      await Employee.findOne({
        phone,
      }).select(
        "+resetOtp +resetOtpExpiresAt"
      );

    if (
      !employee ||
      !employee.resetOtp ||
      !employee.resetOtpExpiresAt
    ) {
      throw new UnauthorizedException(
        "No OTP request found — please request a new OTP",
        "EMPLOYEE_RESET_PASSWORD"
      );
    }

    if (
      employee.resetOtpExpiresAt.getTime() <
      Date.now()
    ) {
      throw new UnauthorizedException(
        "OTP has expired — please request a new one",
        "EMPLOYEE_RESET_PASSWORD"
      );
    }

    const isOtpValid =
      await bcrypt.compare(
        otp,
        employee.resetOtp
      );

    if (!isOtpValid) {
      throw new UnauthorizedException(
        "Invalid OTP",
        "EMPLOYEE_RESET_PASSWORD"
      );
    }

    employee.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    employee.resetOtp = null;
    employee.resetOtpExpiresAt = null;

    await employee.save();
  }

  // =====================================================
  // FIND ALL EMPLOYEES
  // =====================================================

  public async findAll(): Promise<
    EmployeeEntity[]
  > {
    const employees =
      await Employee.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    return employees.map(
      (employee) =>
        this.toEntity(
          this.calculateCurrentStatus(
            employee
          )
        )
    );
  }

  // =====================================================
  // FIND EMPLOYEE BY ID
  // =====================================================

  public async findById(
    id: string
  ): Promise<EmployeeEntity> {
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ employeeId: id }, { _id: id }] }
      : { employeeId: id };
    const employee =
      await Employee.findOne(query).lean();

    if (!employee) {
      throw new NotFoundException(
        "Employee not found",
        "EMPLOYEE_GET"
      );
    }

    return this.toEntity(
      this.calculateCurrentStatus(
        employee
      )
    );
  }

  // =====================================================
  // UPDATE EMPLOYEE
  // =====================================================

  public async update(
    id: string,
    payload: UpdateEmployeeDto
  ): Promise<EmployeeEntity> {
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ employeeId: id }, { _id: id }] }
      : { employeeId: id };
    const employee =
      await Employee.findOne(query);

    if (!employee) {
      throw new NotFoundException(
        "Employee not found",
        "EMPLOYEE_UPDATE"
      );
    }

    // -----------------------------------------------------
    // EMAIL DUPLICATE CHECK
    // -----------------------------------------------------

    if (
      payload.email &&
      payload.email !== employee.email
    ) {
      const existingEmail =
        await Employee.findOne({
          email: payload.email,
          employeeId: {
            $ne: id,
          },
        }).lean();

      if (existingEmail) {
        throw new ConflictException(
          "Employee email already exists",
          "EMPLOYEE_UPDATE"
        );
      }
    }

    // -----------------------------------------------------
    // UPDATE EMPLOYEE
    // -----------------------------------------------------

    Object.assign(
      employee,
      payload
    );

    // -----------------------------------------------------
    // MANUAL ACTIVE
    // -----------------------------------------------------

    if (
      payload.status === "Active"
    ) {
      employee.status = "Active";

      employee.leaveStartDate =
        null;

      employee.leaveEndDate =
        null;
    }

    // -----------------------------------------------------
    // MANUAL INACTIVE
    // -----------------------------------------------------

    if (
      payload.status === "Inactive"
    ) {
      employee.status = "Inactive";

      employee.leaveStartDate =
        null;

      employee.leaveEndDate =
        null;
    }

    await employee.save();

    return this.toEntity(
      this.calculateCurrentStatus(
        employee.toObject()
      )
    );
  }

  // =====================================================
  // SET STATUS
  // =====================================================

  public async setStatus(
    id: string,
    status:
      | "Active"
      | "Inactive"
  ): Promise<EmployeeEntity> {
    const employee =
      await Employee.findOne({
        employeeId: id,
      });

    if (!employee) {
      throw new NotFoundException(
        "Employee not found",
        "EMPLOYEE_STATUS"
      );
    }

    // -----------------------------------------------------
    // ACTIVE
    // -----------------------------------------------------

    if (
      status === "Active"
    ) {
      employee.status =
        "Active";

      employee.leaveStartDate =
        null;

      employee.leaveEndDate =
        null;

      await employee.save();

      return this.toEntity(
        this.calculateCurrentStatus(
          employee.toObject()
        )
      );
    }

    // -----------------------------------------------------
    // INACTIVE
    // -----------------------------------------------------

    employee.status =
      "Inactive";

    employee.leaveStartDate =
      null;

    employee.leaveEndDate =
      null;

    await employee.save();

    return this.toEntity(
      this.calculateCurrentStatus(
        employee.toObject()
      )
    );
  }

  // =====================================================
  // SET ACTIVE
  // =====================================================

  public async setActive(
    id: string
  ): Promise<EmployeeEntity> {
    return this.setStatus(
      id,
      "Active"
    );
  }

  // =====================================================
  // SET INACTIVE
  // =====================================================

  public async setInactive(
    id: string
  ): Promise<EmployeeEntity> {
    return this.setStatus(
      id,
      "Inactive"
    );
  }

  // =====================================================
  // GIVE LEAVE
  // =====================================================

  public async giveLeave(
    id: string,
    startDate: string,
    endDate: string
  ): Promise<EmployeeEntity> {
    const employee =
      await Employee.findOne({
        employeeId: id,
      });

    if (!employee) {
      throw new NotFoundException(
        "Employee not found",
        "EMPLOYEE_LEAVE"
      );
    }

    // -----------------------------------------------------
    // VALIDATE DATES
    // -----------------------------------------------------

    if (
      !startDate ||
      !endDate
    ) {
      throw new Error(
        "Leave start date and end date are required"
      );
    }

    const start =
      new Date(
        `${startDate}T00:00:00`
      );

    const end =
      new Date(
        `${endDate}T23:59:59`
      );

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      throw new Error(
        "Invalid leave dates"
      );
    }

    if (start > end) {
      throw new Error(
        "Leave start date cannot be after end date"
      );
    }

    // -----------------------------------------------------
    // SAVE LEAVE DATES
    // -----------------------------------------------------

    employee.leaveStartDate =
      startDate;

    employee.leaveEndDate =
      endDate;

    // -----------------------------------------------------
    // CALCULATE STATUS
    // -----------------------------------------------------

    const now =
      new Date();

    const todayStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const leaveStart =
      new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

    const leaveEnd =
      new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

    // -----------------------------------------------------
    // CURRENT LEAVE
    // -----------------------------------------------------

    if (
      todayStart >= leaveStart &&
      todayStart <= leaveEnd
    ) {
      employee.status =
        "On Leave";
    }

    // -----------------------------------------------------
    // FUTURE LEAVE
    // -----------------------------------------------------

    else if (
      todayStart < leaveStart
    ) {
      employee.status =
        "Active";
    }

    // -----------------------------------------------------
    // OLD LEAVE
    // -----------------------------------------------------

    else {
      employee.status =
        "Active";

      employee.leaveStartDate =
        null;

      employee.leaveEndDate =
        null;
    }

    await employee.save();

    return this.toEntity(
      this.calculateCurrentStatus(
        employee.toObject()
      )
    );
  }

  // =====================================================
  // CANCEL LEAVE
  // =====================================================

  public async cancelLeave(
    id: string
  ): Promise<EmployeeEntity> {
    const employee =
      await Employee.findOne({
        employeeId: id,
      });

    if (!employee) {
      throw new NotFoundException(
        "Employee not found",
        "EMPLOYEE_CANCEL_LEAVE"
      );
    }

    employee.leaveStartDate =
      null;

    employee.leaveEndDate =
      null;

    employee.status =
      "Active";

    await employee.save();

    return this.toEntity(
      this.calculateCurrentStatus(
        employee.toObject()
      )
    );
  }

  // =====================================================
  // DELETE EMPLOYEE
  // =====================================================

  public async delete(
    id: string
  ): Promise<void> {
    const employee =
      await Employee.findOneAndDelete({
        employeeId: id,
      });

    if (!employee) {
      throw new NotFoundException(
        "Employee not found",
        "EMPLOYEE_DELETE"
      );
    }
  }

  // =====================================================
  // CURRENT STATUS CALCULATION
  // =====================================================

  private calculateCurrentStatus(
    employee: any
  ): any {
    // -----------------------------------------------------
    // INACTIVE
    // -----------------------------------------------------

    if (
      employee.status ===
      "Inactive"
    ) {
      return employee;
    }

    // -----------------------------------------------------
    // NO LEAVE
    // -----------------------------------------------------

    if (
      !employee.leaveStartDate ||
      !employee.leaveEndDate
    ) {
      employee.status =
        "Active";

      return employee;
    }

    // -----------------------------------------------------
    // TODAY
    // -----------------------------------------------------

    const now =
      new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    // -----------------------------------------------------
    // START
    // -----------------------------------------------------

    const startRaw =
      new Date(
        `${employee.leaveStartDate}T00:00:00`
      );

    const start =
      new Date(
        startRaw.getFullYear(),
        startRaw.getMonth(),
        startRaw.getDate()
      );

    // -----------------------------------------------------
    // END
    // -----------------------------------------------------

    const endRaw =
      new Date(
        `${employee.leaveEndDate}T23:59:59`
      );

    const end =
      new Date(
        endRaw.getFullYear(),
        endRaw.getMonth(),
        endRaw.getDate()
      );

    // -----------------------------------------------------
    // CURRENT LEAVE
    // -----------------------------------------------------

    if (
      today >= start &&
      today <= end
    ) {
      employee.status =
        "On Leave";

      return employee;
    }

    // -----------------------------------------------------
    // FUTURE LEAVE
    // -----------------------------------------------------

    if (
      today < start
    ) {
      employee.status =
        "Active";

      return employee;
    }

    // -----------------------------------------------------
    // LEAVE FINISHED
    // -----------------------------------------------------

    employee.status =
      "Active";

    employee.leaveStartDate =
      null;

    employee.leaveEndDate =
      null;

    return employee;
  }

  // =====================================================
  // GENERATE EMPLOYEE ID
  // =====================================================

  private async generateEmployeeId(): Promise<string> {
    const lastEmployee =
      await Employee.findOne()
        .sort({
          employeeId: -1,
        })
        .select(
          "employeeId"
        )
        .lean();

    if (!lastEmployee) {
      return "EMP-001";
    }

    const match =
      lastEmployee.employeeId.match(
        /^EMP-(\d+)$/
      );

    if (!match) {
      return "EMP-001";
    }

    const nextNumber =
      Number(match[1]) + 1;

    return `EMP-${String(
      nextNumber
    ).padStart(3, "0")}`;
  }

  // =====================================================
  // ENTITY MAPPER
  // =====================================================

  private toEntity(employee: {
    _id: unknown;

    employeeId: string;

    name: string;

    email: string;

    phone: string;

    department: string;

    designation: string;

    joiningDate: string;

    salary: number;

    status:
      | "Active"
      | "Inactive"
      | "On Leave";

    leaveStartDate?:
      | string
      | null;

    leaveEndDate?:
      | string
      | null;

    paidLeaveQuota?: number;

    address: string;

    city: string;

    state: string;

    emergencyContact: string;

    // ===================================================
    // BANK DETAILS
    // ===================================================

    bankName: string;

    bankAccount: string;

    ifscCode: string;

    esicNumber?: string;

    maritalStatus?: string;

    // ===================================================
    // TAX DETAILS
    // ===================================================

    panNumber: string;

    // ===================================================
    // PERSONAL DETAILS
    // ===================================================

    gender:
      | "Male"
      | "Female"
      | "Other";

    dateOfBirth: string;

    createdAt: Date;

    updatedAt: Date;
  }): EmployeeEntity {
    return {
      // =================================================
      // BASIC
      // =================================================

      id:
        employee.employeeId,

      employeeId:
        employee.employeeId,

      name:
        employee.name,

      email:
        employee.email,

      phone:
        employee.phone,

      // =================================================
      // JOB
      // =================================================

      department:
        employee.department,

      designation:
        employee.designation,

      joiningDate:
        employee.joiningDate,

      salary:
        employee.salary,

      status:
        employee.status,

      // =================================================
      // LEAVE
      // =================================================

      leaveStartDate:
        employee.leaveStartDate ??
        null,

      leaveEndDate:
        employee.leaveEndDate ??
        null,

      paidLeaveQuota:
        employee.paidLeaveQuota ??
        2,

      // =================================================
      // ADDRESS
      // =================================================

      address:
        employee.address,

      city:
        employee.city,

      state:
        employee.state,

      // =================================================
      // EMERGENCY
      // =================================================

      emergencyContact:
        employee.emergencyContact,

      // =================================================
      // BANK DETAILS
      // =================================================

      bankName:
        employee.bankName,

      bankAccount:
        employee.bankAccount,

      ifscCode:
        employee.ifscCode,

      esicNumber:
        employee.esicNumber ??
        '',

      maritalStatus:
        employee.maritalStatus ??
        '',

      // =================================================
      // TAX
      // =================================================

      panNumber:
        employee.panNumber,

      // =================================================
      // PERSONAL
      // =================================================

      gender:
        employee.gender,

      dateOfBirth:
        employee.dateOfBirth,

      // =================================================
      // RECORD
      // =================================================

      createdAt:
        employee.createdAt,

      updatedAt:
        employee.updatedAt,
    };
  }
}

export default EmployeeService;