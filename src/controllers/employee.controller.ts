import type { Request, Response } from 'express';

import {
  ResponseCode,
  ResponseService,
} from '../core/response-management/index.js';

import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../models/dtos/employee.dto.js';

import { EmployeeService } from '../services/employee.service.js';

import { sendResponse } from '../utils/send-response.util.js';

export class EmployeeController {
  private static instance: EmployeeController;

  private readonly employeeService =
    EmployeeService.getInstance();

  private readonly responseService =
    ResponseService.getInstance();

  public static getInstance(): EmployeeController {
    if (!EmployeeController.instance) {
      EmployeeController.instance =
        new EmployeeController();
    }

    return EmployeeController.instance;
  }

  // =====================================================
  // CREATE
  // =====================================================

  public create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const payload =
      req.body as CreateEmployeeDto;

    const employee =
      await this.employeeService.create(
        payload
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.CREATED,
        'Employee created successfully',
        employee
      )
    );
  };

  // =====================================================
  // GET ALL
  // =====================================================

  public findAll = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const employees =
      await this.employeeService.findAll();

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employees fetched successfully',
        employees
      )
    );
  };

  // =====================================================
  // GET BY ID
  // =====================================================

  public findById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Employee ID is required'
      );
    }

    const employee =
      await this.employeeService.findById(id);

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee fetched successfully',
        employee
      )
    );
  };

  // =====================================================
  // UPDATE
  // =====================================================

  public update = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Employee ID is required'
      );
    }

    const payload =
      req.body as UpdateEmployeeDto;

    const employee =
      await this.employeeService.update(
        id,
        payload
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee updated successfully',
        employee
      )
    );
  };

  // =====================================================
  // DELETE
  // =====================================================

  public delete = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Employee ID is required'
      );
    }

    await this.employeeService.delete(id);

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee deleted successfully',
        undefined
      )
    );
  };

  // =====================================================
  // ACTIVE
  // =====================================================

  public setActive = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Employee ID is required'
      );
    }

    const employee =
      await this.employeeService.setActive(
        id
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee activated successfully',
        employee
      )
    );
  };

  // =====================================================
  // INACTIVE
  // =====================================================

  public setInactive = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Employee ID is required'
      );
    }

    const employee =
      await this.employeeService.setInactive(
        id
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee marked as inactive successfully',
        employee
      )
    );
  };

  // =====================================================
  // GIVE LEAVE
  // =====================================================

  public giveLeave = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Employee ID is required'
      );
    }

    const {
      leaveStartDate,
      leaveEndDate,
    } = req.body as {
      leaveStartDate?: string;
      leaveEndDate?: string;
    };

    if (!leaveStartDate) {
      throw new Error(
        'Leave start date is required'
      );
    }

    if (!leaveEndDate) {
      throw new Error(
        'Leave end date is required'
      );
    }

    const employee =
      await this.employeeService.giveLeave(
        id,
        leaveStartDate,
        leaveEndDate
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee leave assigned successfully',
        employee
      )
    );
  };

  // =====================================================
  // CANCEL LEAVE
  // =====================================================

  public cancelLeave = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new Error(
        'Employee ID is required'
      );
    }

    const employee =
      await this.employeeService.cancelLeave(
        id
      );

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        'Employee leave cancelled successfully',
        employee
      )
    );
  };
}