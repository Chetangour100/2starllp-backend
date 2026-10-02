import type {
  Request,
  Response,
} from "express";

import {
  ResponseCode,
  ResponseService,
} from "../core/response-management/index.js";

import { sendResponse } from "../utils/send-response.util.js";

import { DashboardService } from "../services/dashboard.service.js";

export class DashboardController {
  private static instance: DashboardController;

  private readonly dashboardService =
    DashboardService.getInstance();

  private readonly responseService =
    ResponseService.getInstance();

  public static getInstance(): DashboardController {
    if (!DashboardController.instance) {
      DashboardController.instance =
        new DashboardController();
    }

    return DashboardController.instance;
  }

  /* =====================================================
     GET DASHBOARD
  ===================================================== */

  public getDashboard = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const dashboard =
      await this.dashboardService.getDashboard();

    sendResponse(
      res,
      this.responseService.success(
        ResponseCode.SUCCESS,
        "Dashboard data fetched successfully",
        dashboard
      )
    );
  };
}

export default DashboardController;