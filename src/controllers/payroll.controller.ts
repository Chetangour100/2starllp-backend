import type {
  Request,
  Response,
} from 'express';

import {
  ResponseCode,
  ResponseService,
} from '../core/response-management/index.js';

import type {
  CreatePayrollDto,
  UpdatePayrollDto,
} from '../services/payroll.service.js';

import {
  PayrollService,
} from '../services/payroll.service.js';

import {
  sendResponse,
} from '../utils/send-response.util.js';

export class PayrollController {

  private static instance:
    PayrollController;

  private readonly payrollService =
    PayrollService.getInstance();

  private readonly responseService =
    ResponseService.getInstance();

  /* ===================================================
     SINGLETON
  =================================================== */

  public static getInstance():
    PayrollController {

    if (
      !PayrollController.instance
    ) {
      PayrollController.instance =
        new PayrollController();
    }

    return PayrollController.instance;
  }

  /* ===================================================
     CREATE / GENERATE PAYROLL
  =================================================== */

  public create = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const payload =
      req.body as CreatePayrollDto;

    const payroll =
      await this.payrollService.create(
        payload
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.CREATED,
        'Payroll generated successfully',
        payroll
      )
    );
  };

  /* ===================================================
     PREVIEW PAYROLL (BEFORE CREATE)
  =================================================== */

  public preview = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const {
      periodStart,
      periodEnd,
    } = req.body as {
      periodStart: string;
      periodEnd: string;
    };

    const preview =
      await this.payrollService.previewPayroll(
        periodStart,
        periodEnd
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payroll preview generated',
        preview
      )
    );
  };

  /* ===================================================
     GET EMPLOYEE SALARY HISTORY
  =================================================== */

  public getEmployeeHistory = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const employeeId =
      Array.isArray(
        req.params.employeeId
      )
        ? req.params.employeeId[0]
        : req.params.employeeId;

    if (!employeeId) {
      throw new Error(
        'Employee ID is required'
      );
    }

    const history =
      await this.payrollService.getEmployeeSalaryHistory(
        employeeId
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee salary history fetched',
        history
      )
    );
  };

  /* ===================================================
     GET ALL PAYROLLS
  =================================================== */

  public findAll = async (
    _req: Request,
    res: Response
  ): Promise<void> => {

    const payrolls =
      await this.payrollService.findAll();

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payrolls fetched successfully',
        payrolls
      )
    );
  };

  /* ===================================================
     GET PAYROLL BY ID
  =================================================== */

  public findById = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(
        req.params.id
      )
        ? req.params.id[0]
        : req.params.id;

    if (!id) {
      throw new Error(
        'Payroll ID is required'
      );
    }

    const payroll =
      await this.payrollService.findById(
        id
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payroll fetched successfully',
        payroll
      )
    );
  };

  /* ===================================================
     UPDATE PAYROLL
  =================================================== */

  public update = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(
        req.params.id
      )
        ? req.params.id[0]
        : req.params.id;

    if (!id) {
      throw new Error(
        'Payroll ID is required'
      );
    }

    const payload =
      req.body as UpdatePayrollDto;

    const payroll =
      await this.payrollService.update(
        id,
        payload
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payroll updated successfully',
        payroll
      )
    );
  };

  /* ===================================================
     DOWNLOAD BANK TRANSFER FILE (CSV)
  =================================================== */

  public exportBankFile = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(
        req.params.id
      )
        ? req.params.id[0]
        : req.params.id;

    if (!id) {
      throw new Error(
        'Payroll ID is required'
      );
    }

    const csv =
      await this.payrollService.generateBankTransferFile(
        id
      );

    res.setHeader(
      'Content-Type',
      'text/csv'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bank-transfer-${id}.csv"`
    );

    res.send(csv);
  };

  /* ===================================================
     DOWNLOAD PAYSLIP (TEXT FILE)
  =================================================== */

  public exportPayslip = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(
        req.params.id
      )
        ? req.params.id[0]
        : req.params.id;

    const employeeId =
      Array.isArray(
        req.params.employeeId
      )
        ? req.params.employeeId[0]
        : req.params.employeeId;

    if (!id || !employeeId) {
      throw new Error(
        'Payroll ID and Employee ID are required'
      );
    }

    const payslip =
      await this.payrollService.generatePayslip(
        id,
        employeeId
      );

    res.setHeader(
      'Content-Type',
      'text/plain'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip-${employeeId}-${id}.txt"`
    );

    res.send(payslip);
  };

  /* ===================================================
     DELETE PAYROLL
  =================================================== */

  public delete = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const id =
      Array.isArray(
        req.params.id
      )
        ? req.params.id[0]
        : req.params.id;

    if (!id) {
      throw new Error(
        'Payroll ID is required'
      );
    }

    await this.payrollService.delete(
      id
    );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Payroll deleted successfully',
        undefined
      )
    );
  };
}

export default PayrollController;