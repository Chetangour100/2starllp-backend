import {
  ConflictException,
  NotFoundException,
} from '../common/exceptions/index.js';

import { Payment } from '../schemas/payment.schema.js';

/* =====================================================
   TYPES
===================================================== */

export interface CreatePaymentDto {
  paymentId: string;

  employeeId: string;
  employeeName: string;
  department: string;

  amount: number;
  date: string;

  status?: 'Paid' | 'Pending' | 'Failed';

  method: 'NEFT' | 'IMPS' | 'RTGS' | 'UPI';

  bankReference?: string | null;
  utrNumber?: string | null;

  accountNumber?: string | null;
  bankName?: string | null;

  payrollId: string;
  payrollMonth: string;

  initiatedAt?: string | null;
  completedAt?: string | null;

  failureReason?: string | null;
  remarks?: string | null;
}

export interface UpdatePaymentDto {
  employeeId?: string;
  employeeName?: string;
  department?: string;

  amount?: number;
  date?: string;

  status?: 'Paid' | 'Pending' | 'Failed';

  method?: 'NEFT' | 'IMPS' | 'RTGS' | 'UPI';

  bankReference?: string | null;
  utrNumber?: string | null;

  accountNumber?: string | null;
  bankName?: string | null;

  payrollId?: string;
  payrollMonth?: string;

  initiatedAt?: string | null;
  completedAt?: string | null;

  failureReason?: string | null;
  remarks?: string | null;
}

export interface PaymentEntity {
  id: string;

  employeeId: string;
  employeeName: string;
  department: string;

  amount: number;
  date: string;

  status: 'Paid' | 'Pending' | 'Failed';

  method: 'NEFT' | 'IMPS' | 'RTGS' | 'UPI';

  bankReference: string | null;
  utrNumber: string | null;

  accountNumber: string | null;
  bankName: string | null;

  payrollId: string;
  payrollMonth: string;

  initiatedAt: string | null;
  completedAt: string | null;

  failureReason: string | null;
  remarks: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/* =====================================================
   PAYMENT SERVICE
===================================================== */

export class PaymentService {
  private static instance: PaymentService;

  /* ---------------------------------------------------
     Singleton
  --------------------------------------------------- */

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }

    return PaymentService.instance;
  }

  /* ===================================================
     CREATE PAYMENT
  =================================================== */

  public async create(
    payload: CreatePaymentDto
  ): Promise<PaymentEntity> {
    /* Check duplicate Payment ID */

    const existingPayment = await Payment.findOne({
      paymentId: payload.paymentId,
    }).lean();

    if (existingPayment) {
      throw new ConflictException(
        'Payment ID already exists',
        'PAYMENT_CREATE'
      );
    }

    /* Amount validation */

    if (payload.amount < 0) {
      throw new ConflictException(
        'Payment amount cannot be negative',
        'PAYMENT_CREATE'
      );
    }

    /* Create payment */

    const payment = await Payment.create({
      paymentId: payload.paymentId,

      employeeId: payload.employeeId,
      employeeName: payload.employeeName,
      department: payload.department,

      amount: payload.amount,
      date: payload.date,

      status: payload.status ?? 'Pending',

      method: payload.method,

      bankReference:
        payload.bankReference ?? null,

      utrNumber:
        payload.utrNumber ?? null,

      accountNumber:
        payload.accountNumber ?? null,

      bankName:
        payload.bankName ?? null,

      payrollId: payload.payrollId,
      payrollMonth: payload.payrollMonth,

      initiatedAt:
        payload.initiatedAt ?? null,

      completedAt:
        payload.completedAt ?? null,

      failureReason:
        payload.failureReason ?? null,

      remarks:
        payload.remarks ?? null,
    });

    return this.toEntity(payment);
  }

  /* ===================================================
     GET ALL PAYMENTS
  =================================================== */

  public async findAll(): Promise<PaymentEntity[]> {
    const payments = await Payment.find()
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return payments.map((payment) =>
      this.toEntity(payment)
    );
  }

  /* ===================================================
     GET PAYMENT BY ID
  =================================================== */

  public async findById(
    id: string
  ): Promise<PaymentEntity> {
    const payment = await Payment.findOne({
      paymentId: id,
    }).lean();

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
        'PAYMENT_GET'
      );
    }

    return this.toEntity(payment);
  }

  /* ===================================================
     UPDATE PAYMENT
  =================================================== */

  public async update(
    id: string,
    payload: UpdatePaymentDto
  ): Promise<PaymentEntity> {
    const payment = await Payment.findOne({
      paymentId: id,
    });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
        'PAYMENT_UPDATE'
      );
    }

    /* Amount validation */

    if (
      payload.amount !== undefined &&
      payload.amount < 0
    ) {
      throw new ConflictException(
        'Payment amount cannot be negative',
        'PAYMENT_UPDATE'
      );
    }

    /* Update fields */

    Object.assign(payment, payload);

    await payment.save();

    return this.toEntity(payment);
  }

  /* ===================================================
     DELETE PAYMENT
  =================================================== */

  public async delete(
    id: string
  ): Promise<void> {
    const payment =
      await Payment.findOneAndDelete({
        paymentId: id,
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
        'PAYMENT_DELETE'
      );
    }
  }

  /* ===================================================
     CONVERT DATABASE DOCUMENT → ENTITY
  =================================================== */

  private toEntity(
    payment: {
      _id: unknown;

      paymentId: string;

      employeeId: string;
      employeeName: string;
      department: string;

      amount: number;
      date: string;

      status:
        | 'Paid'
        | 'Pending'
        | 'Failed';

      method:
        | 'NEFT'
        | 'IMPS'
        | 'RTGS'
        | 'UPI';

      bankReference?: string | null;
      utrNumber?: string | null;

      accountNumber?: string | null;
      bankName?: string | null;

      payrollId: string;
      payrollMonth: string;

      initiatedAt?: string | null;
      completedAt?: string | null;

      failureReason?: string | null;
      remarks?: string | null;

      createdAt: Date;
      updatedAt: Date;
    }
  ): PaymentEntity {
    return {
      id: payment.paymentId,

      employeeId: payment.employeeId,
      employeeName: payment.employeeName,
      department: payment.department,

      amount: payment.amount,
      date: payment.date,

      status: payment.status,
      method: payment.method,

      bankReference:
        payment.bankReference ?? null,

      utrNumber:
        payment.utrNumber ?? null,

      accountNumber:
        payment.accountNumber ?? null,

      bankName:
        payment.bankName ?? null,

      payrollId: payment.payrollId,
      payrollMonth: payment.payrollMonth,

      initiatedAt:
        payment.initiatedAt ?? null,

      completedAt:
        payment.completedAt ?? null,

      failureReason:
        payment.failureReason ?? null,

      remarks:
        payment.remarks ?? null,

      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}