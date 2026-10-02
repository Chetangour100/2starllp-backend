import { Employee } from "../schemas/employee.schema.js";
import { Payroll } from "../schemas/payroll.schema.js";
import { Payment } from "../schemas/payment.schema.js";
import { settingsService } from "./settings.service.js";

/* =====================================================
   DASHBOARD RESPONSE TYPE
===================================================== */

export interface DashboardData {
  stats: {
    totalEmployees: number;

    payrollThisMonth: number;

    payrollThisYear: number;

    nextPayrollDate: string | null;

    payrollFrequency: string;

    employeesTrend: number;

    payrollMonthTrend: number;

    payrollYearTrend: number;

    employeesOnLeaveToday: number;

    pendingPaymentsCount: number;

    pendingPaymentsAmount: number;

    totalLeaveDeductionThisMonth: number;
  };

  employeesChart: Array<{
    month: string;
    value: number;
  }>;

  payrollChart: Array<{
    month: string;
    value: number;
  }>;

  recentEmployees: unknown[];

  recentPayrolls: unknown[];

  recentPayments: unknown[];
}

/* =====================================================
   DASHBOARD SERVICE
===================================================== */

export class DashboardService {
  private static instance: DashboardService;

  /* =====================================================
     SINGLETON
  ===================================================== */

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance =
        new DashboardService();
    }

    return DashboardService.instance;
  }

  /* =====================================================
     GET DASHBOARD
  ===================================================== */

  public async getDashboard(): Promise<DashboardData> {

    /* ===================================================
       FETCH DATABASE DATA
    =================================================== */

    const employees = await Employee.find()
      .sort({ createdAt: -1 })
      .lean();

    const payrolls = await Payroll.find()
      .sort({ createdAt: -1 })
      .lean();

    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .lean();

    /* ===================================================
       CURRENT DATE
    =================================================== */

    const now = new Date();

    const currentMonth =
      now.getMonth();

    const currentYear =
      now.getFullYear();

    /* ===================================================
       EMPLOYEE TOTAL
    =================================================== */

    const totalEmployees =
      employees.length;

    /* ===================================================
       MONTH NAMES
    =================================================== */

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    /* ===================================================
       PAYROLL AMOUNT HELPER
    =================================================== */

    const getPayrollAmount = (
      payroll: any
    ): number => {

      const amount =
        payroll.netPayroll ??
        payroll.netAmount ??
        payroll.amount ??
        payroll.totalPayroll ??
        payroll.grossPayroll ??
        0;

      const numericAmount =
        Number(amount);

      return Number.isFinite(
        numericAmount
      )
        ? numericAmount
        : 0;
    };

    /* ===================================================
       PAYROLL DATE HELPER
    =================================================== */

    const getPayrollDate = (
      payroll: any
    ): Date | null => {

      const value =
        payroll.processedDate ??
        payroll.payrollDate ??
        payroll.date ??
        payroll.createdAt;

      if (!value) {
        return null;
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      return date;
    };

    /* ===================================================
       EMPLOYEE DATE HELPER
    =================================================== */

    const getEmployeeDate = (
      employee: any
    ): Date | null => {

      const value =
        employee.joiningDate ??
        employee.createdAt;

      if (!value) {
        return null;
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      return date;
    };

    /* ===================================================
       PAYROLL THIS MONTH
    =================================================== */

    let payrollThisMonth = 0;

    for (
      const payroll of payrolls
    ) {

      const date =
        getPayrollDate(
          payroll
        );

      if (!date) {
        continue;
      }

      if (
        date.getMonth() ===
          currentMonth &&
        date.getFullYear() ===
          currentYear
      ) {

        payrollThisMonth +=
          getPayrollAmount(
            payroll
          );
      }
    }

    /* ===================================================
       PAYROLL THIS YEAR
    =================================================== */

    let payrollThisYear = 0;

    for (
      const payroll of payrolls
    ) {

      const date =
        getPayrollDate(
          payroll
        );

      if (!date) {
        continue;
      }

      if (
        date.getFullYear() ===
        currentYear
      ) {

        payrollThisYear +=
          getPayrollAmount(
            payroll
          );
      }
    }

    /* ===================================================
       LAST 6 MONTHS
    =================================================== */

    const lastSixMonths =
      Array.from(
        {
          length: 6,
        },
        (_, index) => {

          const date =
            new Date(
              currentYear,
              currentMonth -
                (5 - index),
              1
            );

          return {
            year:
              date.getFullYear(),

            monthIndex:
              date.getMonth(),

            month:
              monthNames[
                date.getMonth()
              ] ?? "",
          };
        }
      );

    /* ===================================================
       EMPLOYEE MONTH-WISE CHART
       
       IMPORTANT:
       Ye cumulative total employees
       show karega.
       
       Example:
       Apr = 1
       May = 2
       Jun = 3
       Jul = 5
    =================================================== */

    const employeesChart =
      lastSixMonths.map(
        ({
          year,
          monthIndex,
          month,
        }) => {

          const totalEmployeesTillMonth =
            employees.filter(
              (employee: any) => {

                const date =
                  getEmployeeDate(
                    employee
                  );

                if (!date) {
                  return false;
                }

                const employeeYear =
                  date.getFullYear();

                const employeeMonth =
                  date.getMonth();

                /*
                 * Employee joined before
                 * or during this month.
                 */

                return (
                  employeeYear <
                    year ||
                  (
                    employeeYear ===
                      year &&
                    employeeMonth <=
                      monthIndex
                  )
                );
              }
            ).length;

          return {
            month:
              `${month} ${year}`,

            value:
              totalEmployeesTillMonth,
          };
        }
      );

    /* ===================================================
       PAYROLL MONTH-WISE CHART
    =================================================== */

    const payrollChart =
      lastSixMonths.map(
        ({
          year,
          monthIndex,
          month,
        }) => {

          let totalPayroll = 0;

          for (
            const payroll of payrolls
          ) {

            const date =
              getPayrollDate(
                payroll
              );

            if (!date) {
              continue;
            }

            if (
              date.getFullYear() ===
                year &&
              date.getMonth() ===
                monthIndex
            ) {

              totalPayroll +=
                getPayrollAmount(
                  payroll
                );
            }
          }

          return {
            month:
              `${month} ${year}`,

            value:
              totalPayroll,
          };
        }
      );

    /* ===================================================
       NEXT PAYROLL DATE
    =================================================== */

    const futurePayrollDates =
      payrolls
        .map(
          (payroll: any) =>
            getPayrollDate(
              payroll
            )
        )
        .filter(
          (
            date
          ): date is Date =>
            date !== null &&
            date.getTime() >=
              now.getTime()
        )
        .sort(
          (a, b) =>
            a.getTime() -
            b.getTime()
        );

    /*
     * Explicit Date variable
     * to avoid TypeScript
     * undefined error.
     */

    let nextPayrollDate:
      string | null = null;

    let payrollFrequencyLabel =
      "Monthly";

    const nextDate =
      futurePayrollDates[0];

    if (nextDate) {
      nextPayrollDate =
        nextDate.toISOString();
    } else {

      /*
       * Koi future-dated payroll record
       * database me nahi hai — is case me
       * Settings (Payroll Cycle) se agli
       * date khud calculate karo, taaki
       * "Not scheduled" hamesha na dikhe.
       */

      try {

        const settings =
          await settingsService.getSettings();

        const payrollDay =
          settings.payroll.payrollDate ?? 1;

        payrollFrequencyLabel =
          settings.payroll.cycle ??
          "Monthly";

        if (
          payrollFrequencyLabel ===
          "Monthly"
        ) {

          let candidate =
            new Date(
              currentYear,
              currentMonth,
              payrollDay
            );

          if (
            candidate.getTime() <
            now.getTime()
          ) {

            candidate =
              new Date(
                currentYear,
                currentMonth + 1,
                payrollDay
              );
          }

          nextPayrollDate =
            candidate.toISOString();
        }

      } catch (error) {

        /*
         * Settings fetch fail ho jaye to
         * bhi dashboard crash na ho —
         * "Not scheduled" hi dikhega.
         */

        nextPayrollDate = null;
      }
    }

    /* ===================================================
       EMPLOYEE TREND
       
       Current month new employees
       vs previous month new employees.
    =================================================== */

    const getNewEmployeesForMonth =
      (
        year: number,
        month: number
      ): number => {

        return employees.filter(
          (employee: any) => {

            const date =
              getEmployeeDate(
                employee
              );

            if (!date) {
              return false;
            }

            return (
              date.getFullYear() ===
                year &&
              date.getMonth() ===
                month
            );
          }
        ).length;
      };

    /* ===================================================
       CURRENT MONTH EMPLOYEES
    =================================================== */

    const currentMonthEmployees =
      getNewEmployeesForMonth(
        currentYear,
        currentMonth
      );

    /* ===================================================
       PREVIOUS MONTH
    =================================================== */

    const previousMonthDate =
      new Date(
        currentYear,
        currentMonth - 1,
        1
      );

    const previousMonthEmployees =
      getNewEmployeesForMonth(
        previousMonthDate.getFullYear(),
        previousMonthDate.getMonth()
      );

    /* ===================================================
       EMPLOYEE TREND %
    =================================================== */

    let employeesTrend = 0;

    if (
      previousMonthEmployees === 0
    ) {

      if (
        currentMonthEmployees > 0
      ) {
        employeesTrend = 100;
      } else {
        employeesTrend = 0;
      }

    } else {

      employeesTrend =
        Math.round(
          (
            (
              currentMonthEmployees -
              previousMonthEmployees
            ) /
            previousMonthEmployees
          ) *
            100
        );
    }

    /* ===================================================
       PAYROLL MONTH TREND
    =================================================== */

    const getPayrollForMonth =
      (
        year: number,
        month: number
      ): number => {

        return payrolls.reduce(
          (
            total: number,
            payroll: any
          ) => {

            const date =
              getPayrollDate(
                payroll
              );

            if (!date) {
              return total;
            }

            if (
              date.getFullYear() ===
                year &&
              date.getMonth() ===
                month
            ) {

              return (
                total +
                getPayrollAmount(
                  payroll
                )
              );
            }

            return total;
          },
          0
        );
      };

    const previousMonthPayroll =
      getPayrollForMonth(
        previousMonthDate.getFullYear(),
        previousMonthDate.getMonth()
      );

    /* ===================================================
       PAYROLL MONTH TREND %
    =================================================== */

    let payrollMonthTrend = 0;

    if (
      previousMonthPayroll === 0
    ) {

      if (
        payrollThisMonth > 0
      ) {
        payrollMonthTrend = 100;
      } else {
        payrollMonthTrend = 0;
      }

    } else {

      payrollMonthTrend =
        Math.round(
          (
            (
              payrollThisMonth -
              previousMonthPayroll
            ) /
            previousMonthPayroll
          ) *
            100
        );
    }

    /* ===================================================
       PAYROLL YEAR TREND
       
       Current year vs previous year
    =================================================== */

    const previousYear =
      currentYear - 1;

    let payrollPreviousYear = 0;

    for (
      const payroll of payrolls
    ) {

      const date =
        getPayrollDate(
          payroll
        );

      if (!date) {
        continue;
      }

      if (
        date.getFullYear() ===
        previousYear
      ) {

        payrollPreviousYear +=
          getPayrollAmount(
            payroll
          );
      }
    }

    /* ===================================================
       PAYROLL YEAR TREND %
    =================================================== */

    let payrollYearTrend = 0;

    if (
      payrollPreviousYear === 0
    ) {

      if (
        payrollThisYear > 0
      ) {
        payrollYearTrend = 100;
      } else {
        payrollYearTrend = 0;
      }

    } 
    else 
      {

      payrollYearTrend =
        Math.round(
          (
            (
              payrollThisYear -
              payrollPreviousYear
            ) /
            payrollPreviousYear
          ) *
            100
        );
     }

    /* ===================================================
       EMPLOYEES ON LEAVE TODAY
    =================================================== */

    const todayStr =
      now
        .toISOString()
        .slice(0, 10);

    const employeesOnLeaveToday =
      employees.filter(
        (employee: any) => {

          if (
            !employee.leaveStartDate ||
            !employee.leaveEndDate
          ) {
            return false;
          }

          return (
            employee.leaveStartDate <=
              todayStr &&
            employee.leaveEndDate >=
              todayStr
          );
        }
      ).length;

    /* ===================================================
       PENDING PAYMENTS
       (payments jinka status abhi
       "Paid" nahi hua)
    =================================================== */

    const pendingPayments =
      payments.filter(
        (payment: any) =>
          payment.status !== "Paid"
      );

    const pendingPaymentsCount =
      pendingPayments.length;

    const pendingPaymentsAmount =
      pendingPayments.reduce(
        (
          total: number,
          payment: any
        ) =>
          total +
          (Number(payment.amount) ||
            0),
        0
      );

    /* ===================================================
       TOTAL LEAVE DEDUCTION
       (is mahine ke payroll records me
       se unpaid-leave ki wajah se kata
       hua total amount)
    =================================================== */

    let totalLeaveDeductionThisMonth = 0;

    for (
      const payroll of payrolls
    ) {

      const date =
        getPayrollDate(payroll);

      if (!date) {
        continue;
      }

      if (
        date.getMonth() !==
          currentMonth ||
        date.getFullYear() !==
          currentYear
      ) {
        continue;
      }

      const employeePayrolls =
        (payroll as any)
          .employeePayrolls ?? [];

      for (
        const employeePayroll of employeePayrolls
      ) {
        totalLeaveDeductionThisMonth +=
          Number(
            employeePayroll.leaveDeduction
          ) || 0;
      }
    }

    /* ===================================================
       RECENT DATA
    =================================================== */

    const recentEmployees =
      employees.slice(0, 5);

    const recentPayrolls =
      payrolls.slice(0, 5);

    const recentPayments =
      payments.slice(0, 5);

    /* ===================================================
       FINAL RESPONSE
    =================================================== */

    return {

      stats: {

        totalEmployees,

        payrollThisMonth,

        payrollThisYear,

        nextPayrollDate,

        payrollFrequency:
          payrollFrequencyLabel,

        employeesTrend,

        payrollMonthTrend,

        payrollYearTrend,

        employeesOnLeaveToday,

        pendingPaymentsCount,

        pendingPaymentsAmount,

        totalLeaveDeductionThisMonth,
      },

      employeesChart,

      payrollChart,

      recentEmployees,

      recentPayrolls,

      recentPayments,
    };
  }
}

/* =====================================================
   DEFAULT EXPORT
===================================================== */

export default DashboardService;