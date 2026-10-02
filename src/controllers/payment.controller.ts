import type { Request, Response } from 'express';

import {
  ResponseCode,
  ResponseService,
} from '../core/response-management/index.js';

import type {
  CreatePaymentDto,
  UpdatePaymentDto,
} from '../services/payment.service.js';

import { PaymentService } from '../services/payment.service.js';

import { sendResponse } from '../utils/send-response.util.js';

export class PaymentController {
  private static instance: PaymentController;

  private readonly paymentService =
    PaymentService.getInstance();

  private readonly responseService =
    ResponseService.getInstance();

  /* =====================================================
     SINGLETON
  ===================================================== */

  public static getInstance(): PaymentController {
    if (!PaymentController.instance) {
      PaymentController.instance =
        new PaymentController();
    }

    return PaymentController.instance;
  }

  /* =====================================================
     CREATE PAYMENT
  ===================================================== */

  public create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const payload =
      req.body as CreatePaymentDto;

    const payment =
      await this.paymentService.create(payload);

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.CREATED,
        'Payment created successfully',
        payment
      )
    );
  };

  /* =====================================================
     GET ALL PAYMENTS
  ===================================================== */

  public findAll = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const payments =
      await this.paymentService.findAll();

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payments fetched successfully',
        payments
      )
    );
  };

  /* =====================================================
     GET PAYMENT BY ID
  ===================================================== */

  public findById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Payment ID is required'
      );
    }

    const payment =
      await this.paymentService.findById(id);

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payment fetched successfully',
        payment
      )
    );
  };

  /* =====================================================
     UPDATE PAYMENT
  ===================================================== */

  public update = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Payment ID is required'
      );
    }

    const payload =
      req.body as UpdatePaymentDto;

    const payment =
      await this.paymentService.update(
        id,
        payload
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payment updated successfully',
        payment
      )
    );
  };

  /* =====================================================
     DELETE PAYMENT
  ===================================================== */

  public delete = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Payment ID is required'
      );
    }

    await this.paymentService.delete(id);

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payment deleted successfully',
        undefined
      )
    );
  };
}