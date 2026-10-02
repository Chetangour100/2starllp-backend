import type { Request, Response } from "express";

import { reportService } from "../services/reports.service.js";

type ReportPeriod =
  | "ytd"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "last-quarter"
  | "this-year"
  | "last-year";

function isValidPeriod(value: unknown): value is ReportPeriod {
  return (
    value === "ytd" ||
    value === "this-month" ||
    value === "last-month" ||
    value === "this-quarter" ||
    value === "last-quarter" ||
    value === "this-year" ||
    value === "last-year"
  );
}

export async function getReports(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const requestedPeriod = req.query.period;

    const period: ReportPeriod = isValidPeriod(
      requestedPeriod,
    )
      ? requestedPeriod
      : "ytd";

    const reports =
      await reportService.getReports(period);

    res.status(200).json({
      success: true,
      period,
      data: reports,
    });
  } catch (error) {
    console.error(
      "Reports Controller Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
}