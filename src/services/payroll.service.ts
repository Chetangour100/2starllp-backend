import {
  ConflictException,
  NotFoundException,
} from '../common/exceptions/index.js';

import { Employee } from '../schemas/employee.schema.js';
import { Payroll } from '../schemas/payroll.schema.js';

import { PaymentService } from './payment.service.js';
import { settingsService } from './settings.service.js';

/* =====================================================
   TYPES
===================================================== */

export interface DepartmentBreakdownDto {
  department: string;
  employees: number;
  amount: number;
}

export interface CreatePayrollDto {
  payrollId?: string;
  month: string;
  periodStart: string;
  periodEnd: string;
  payrollDate?: string | null;

  status?:
    | 'Completed'
    | 'Pending'
    | 'Processing'
    | 'Failed';

  processedDate?: string | null;
  processedBy?: string | null;

  otherDeductions?: number;

  notes?: string | null;
}

export interface UpdatePayrollDto {
  month?: string;
  periodStart?: string;
  periodEnd?: string;
  payrollDate?: string | null;

  status?:
    | 'Completed'
    | 'Pending'
    | 'Processing'
    | 'Failed';

  processedDate?: string | null;
  processedBy?: string | null;

  notes?: string | null;
}

export interface PayrollEntity {
  id: string;
  month: string;
  periodStart: string;
  periodEnd: string;
  payrollDate: string | null;

  totalEmployees: number;
  grossPayroll: number;
  deductions: number;
  netPayroll: number;

  status:
    | 'Completed'
    | 'Pending'
    | 'Processing'
    | 'Failed';

  processedDate: string | null;
  processedBy: string | null;

  employeePayrolls: any[];

  departmentBreakdown:
    DepartmentBreakdownDto[];

  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/* =====================================================
   SERVICE
===================================================== */

export class PayrollService {
  private static instance: PayrollService;

  public static getInstance(): PayrollService {
    if (!PayrollService.instance) {
      PayrollService.instance =
        new PayrollService();
    }

    return PayrollService.instance;
  }

  /* ===================================================
     CREATE / GENERATE PAYROLL
  =================================================== */

  public async create(
    payload: CreatePayrollDto
  ): Promise<PayrollEntity> {

    const payrollId =
      payload.payrollId ??
      `PAY-${payload.periodStart.slice(0, 7)}`;

    /* -----------------------------------------------
       DUPLICATE PAYROLL
    ------------------------------------------------ */

    const existingPayroll =
      await Payroll.findOne({
        payrollId,
      }).lean();

    if (existingPayroll) {
      throw new ConflictException(
        'Payroll for this month already exists',
        'PAYROLL_CREATE'
      );
    }

    const calculation =
      await this.calculatePayroll(
        payload.periodStart,
        payload.periodEnd
      );

    /* -----------------------------------------------
       SAVE PAYROLL

       Default status ab "Completed" hai (pehle
       "Pending" tha) — payroll banate hi turant
       processed maana jayega, aur uske saath
       employees ke payment records bhi turant
       ban jayenge (neeche dekhein).
    ------------------------------------------------ */

    const finalStatus =
      payload.status ??
      'Completed';

    const payroll =
      await Payroll.create({
        payrollId,

        month:
          payload.month,

        periodStart:
          payload.periodStart,

        periodEnd:
          payload.periodEnd,

        payrollDate:
          payload.payrollDate ??
          null,

        employeePayrolls:
          calculation.employeePayrolls,

        totalEmployees:
          calculation.employeePayrolls.length,

        grossPayroll:
          Math.round(
            calculation.grossPayroll
          ),

        deductions:
          Math.round(
            calculation.totalDeductions
          ),

        netPayroll:
          Math.round(
            calculation.netPayroll
          ),

        status:
          finalStatus,

        processedDate:
          payload.processedDate ??
          (finalStatus === 'Completed'
            ? new Date()
                .toISOString()
                .slice(0, 10)
            : null),

        processedBy:
          payload.processedBy ??
          null,

        departmentBreakdown:
          calculation.departmentBreakdown,

        notes:
          payload.notes ??
          null,
      });

    /* -----------------------------------------------
       AUTO PAYMENT GENERATION
       Payroll seedhe "Completed" bana hai, isliye
       yahin turant har employee ke liye Payment
       record bhi bana do (Payroll ke update() flow
       jaisa hi behaviour).
    ------------------------------------------------ */

    if (
      finalStatus === 'Completed'
    ) {
      await this.processPaymentsForPayroll(
        payroll
      );
    }

    return this.toEntity(
      payroll.toObject()
    );
  }

  /* ===================================================
     PREVIEW PAYROLL (NO SAVE)

     Frontend "Create Payroll" form isse call
     karta hai jab admin ek month select karta
     hai — taaki create karne se pehle har
     employee ki salary, leave, deduction aur
     department-wise total dikh sake (review
     ke liye), bina database me kuch save
     kiye.
  =================================================== */

  public async previewPayroll(
    periodStart: string,
    periodEnd: string
  ): Promise<{
    totalEmployees: number;
    grossPayroll: number;
    deductions: number;
    netPayroll: number;
    employeePayrolls: any[];
    departmentBreakdown: any[];
  }> {

    const calculation =
      await this.calculatePayroll(
        periodStart,
        periodEnd
      );

    return {
      totalEmployees:
        calculation.employeePayrolls
          .length,

      grossPayroll:
        Math.round(
          calculation.grossPayroll
        ),

      deductions:
        Math.round(
          calculation.totalDeductions
        ),

      netPayroll:
        Math.round(
          calculation.netPayroll
        ),

      employeePayrolls:
        calculation.employeePayrolls,

      departmentBreakdown:
        calculation.departmentBreakdown,
    };
  }

  /* ===================================================
     CALCULATE PAYROLL (SHARED LOGIC)

     Yeh method "create" aur "previewPayroll"
     dono ke liye same calculation karta hai,
     taaki preview aur asli save hamesha
     match kare.
  =================================================== */

  private async calculatePayroll(
    periodStart: string,
    periodEnd: string
  ): Promise<{
    employeePayrolls: any[];
    departmentBreakdown: any[];
    grossPayroll: number;
    totalDeductions: number;
    netPayroll: number;
  }> {

    /* -----------------------------------------------
       DATE VALIDATION
    ------------------------------------------------ */

    const start =
      new Date(
        `${periodStart}T00:00:00`
      );

    const end =
      new Date(
        `${periodEnd}T23:59:59`
      );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      throw new ConflictException(
        'Invalid payroll period dates',
        'PAYROLL_CREATE'
      );
    }

    if (start > end) {
      throw new ConflictException(
        'Payroll start date cannot be after end date',
        'PAYROLL_CREATE'
      );
    }

    /* -----------------------------------------------
       ACTIVE EMPLOYEES
    ------------------------------------------------ */

    const employees =
      await Employee.find({
        status: {
          $ne: 'Inactive',
        },
      })
        .sort({ employeeId: 1 })
        .lean();

    if (employees.length === 0) {
      throw new NotFoundException(
        'No active employees found',
        'PAYROLL_CREATE'
      );
    }

    /* -----------------------------------------------
       TOTAL DAYS
    ------------------------------------------------ */

    const totalDays =
      this.getDaysBetween(
        periodStart,
        periodEnd
      );

    /* -----------------------------------------------
       EMPLOYEE PAYROLL CALCULATION
    ------------------------------------------------ */

    const employeePayrolls: any[] = [];

    const departmentMap =
      new Map<
        string,
        {
          employees: number;
          amount: number;
        }
      >();

    let grossPayroll = 0;
    let totalDeductions = 0;
    let netPayroll = 0;

    for (const employee of employees) {

      const monthlySalary =
        Number(employee.salary) || 0;

      /* ---------------------------------------------
         LEAVE CALCULATION
      --------------------------------------------- */

      const leaveDays =
        this.calculateLeaveDays(
          employee.leaveStartDate,
          employee.leaveEndDate,
          periodStart,
          periodEnd
        );

      /*
       * Employee ki monthly "Paid Leave Quota"
       * se leave days ko paid aur unpaid me
       * split kiya ja raha hai.
       */

      const leaveQuota =
        Number(
          employee.paidLeaveQuota
        ) || 0;

      const paidLeaveDays =
        Math.min(
          leaveDays,
          leaveQuota
        );

      const unpaidLeaveDays =
        Math.max(
          leaveDays - leaveQuota,
          0
        );

      const absentDays = 0;

      const workingDays =
        Math.max(
          totalDays -
            unpaidLeaveDays -
            absentDays,
          0
        );

      const dailySalary =
        totalDays > 0
          ? monthlySalary / totalDays
          : 0;

      const leaveDeduction =
        unpaidLeaveDays *
        dailySalary;

      const otherDeductions = 0;

      const deductions =
        leaveDeduction +
        otherDeductions;

      const employeeNetSalary =
        Math.max(
          monthlySalary - deductions,
          0
        );

      grossPayroll += monthlySalary;
      totalDeductions += deductions;
      netPayroll += employeeNetSalary;

      const department =
        employee.department ||
        'Other';

      const existingDepartment =
        departmentMap.get(
          department
        );

      if (existingDepartment) {
        existingDepartment.employees += 1;

        existingDepartment.amount +=
          employeeNetSalary;
      } else {
        departmentMap.set(
          department,
          {
            employees: 1,
            amount: employeeNetSalary,
          }
        );
      }

      employeePayrolls.push({
        employeeId:
          employee.employeeId,

        employeeName:
          employee.name,

        department,

        designation:
          employee.designation,

        monthlySalary,

        grossSalary:
          monthlySalary,

        totalDays,

        workingDays,

        paidLeaveDays,

        unpaidLeaveDays,

        absentDays,

        leaveDeduction,

        otherDeductions,

        totalDeductions:
          deductions,

        netSalary:
          employeeNetSalary,

        bankName:
          employee.bankName ?? null,

        bankAccount:
          employee.bankAccount ?? null,

        ifscCode:
          employee.ifscCode ?? null,

        paymentStatus:
          'Pending',

        transactionId:
          null,

        paidAt:
          null,

        paymentMethod:
          'Bank Transfer',
      });
    }

    const departmentBreakdown =
      Array.from(
        departmentMap.entries()
      ).map(
        ([department, data]) => ({
          department,
          employees:
            data.employees,
          amount:
            Math.round(
              data.amount
            ),
        })
      );

    return {
      employeePayrolls,
      departmentBreakdown,
      grossPayroll,
      totalDeductions,
      netPayroll,
    };
  }

  /* ===================================================
     FIND ALL
  =================================================== */

  public async findAll(): Promise<PayrollEntity[]> {

    const payrolls =
      await Payroll.find()
        .sort({
          periodStart: -1,
        })
        .lean();

    return payrolls.map(
      (payroll) =>
        this.toEntity(payroll)
    );
  }

  /* ===================================================
     FIND BY ID
  =================================================== */

  public async findById(
    id: string
  ): Promise<PayrollEntity> {

    const payroll =
      await Payroll.findOne({
        payrollId: id,
      }).lean();

    if (!payroll) {
      throw new NotFoundException(
        'Payroll not found',
        'PAYROLL_GET'
      );
    }

    return this.toEntity(payroll);
  }

  /* ===================================================
     UPDATE
  =================================================== */

  public async update(
    id: string,
    payload: UpdatePayrollDto
  ): Promise<PayrollEntity> {

    const payroll =
      await Payroll.findOne({
        payrollId: id,
      });

    if (!payroll) {
      throw new NotFoundException(
        'Payroll not found',
        'PAYROLL_UPDATE'
      );
    }

    const wasCompleted =
      payroll.status === 'Completed';

    Object.assign(
      payroll,
      payload
    );

    /* -----------------------------------------------
       AUTO: MARK PROCESSED DATE / BY
       jab pehli baar Completed ho
    ------------------------------------------------ */

    const isNowCompleted =
      payroll.status === 'Completed';

    if (
      !wasCompleted &&
      isNowCompleted
    ) {
      if (!payroll.processedDate) {
        payroll.processedDate =
          new Date()
            .toISOString()
            .slice(0, 10);
      }
    }

    await payroll.save();

    /* -----------------------------------------------
       AUTO PAYMENT GENERATION
       jab payroll pehli baar "Completed"
       mark ho, tab har employee ke liye
       ek Payment record apne aap ban
       jaye aur salary "transfer" ho jaye.
    ------------------------------------------------ */

    if (
      !wasCompleted &&
      isNowCompleted
    ) {
      await this.processPaymentsForPayroll(
        payroll
      );
    }

    return this.toEntity(
      payroll.toObject()
    );
  }

  /* ===================================================
     PROCESS PAYMENTS FOR A COMPLETED PAYROLL

     Har employee ke liye ek Payment record
     banata hai (Payments page par dikhne ke
     liye) aur employeePayrolls me paymentStatus
     "Paid" kar deta hai.

     NOTE: Yeh abhi asli bank transfer nahi
     karta — yeh sirf record create karta hai.
     Asli paisa bhejne ke liye ise bank/payment
     gateway API (Razorpay X, Cashfree Payouts,
     ya bank ki NEFT bulk file) se jodna hoga.
  =================================================== */

  private async processPaymentsForPayroll(
    payroll: any
  ): Promise<void> {

    const paymentService =
      PaymentService.getInstance();

    const now =
      new Date();

    const todayStr =
      now
        .toISOString()
        .slice(0, 10);

    const nowIso =
      now.toISOString();

    const validMethods = [
      'NEFT',
      'IMPS',
      'RTGS',
      'UPI',
    ];

    for (
      const employeePayroll of payroll.employeePayrolls
    ) {

      const paymentId =
        `PMT-${payroll.payrollId}-${employeePayroll.employeeId}`;

      const method =
        validMethods.includes(
          employeePayroll.paymentMethod
        )
          ? employeePayroll.paymentMethod
          : 'NEFT';

      try {

        await paymentService.create({
          paymentId,

          employeeId:
            employeePayroll.employeeId,

          employeeName:
            employeePayroll.employeeName,

          department:
            employeePayroll.department,

          amount:
            employeePayroll.netSalary,

          date: todayStr,

          status: 'Paid',

          method,

          accountNumber:
            employeePayroll.bankAccount ??
            null,

          bankName:
            employeePayroll.bankName ??
            null,

          payrollId:
            payroll.payrollId,

          payrollMonth:
            payroll.month,

          initiatedAt: nowIso,

          completedAt: nowIso,

          remarks:
            `Auto-generated on payroll completion`,
        });

        /*
         * Employee payroll row par bhi
         * paid status reflect karo.
         */

        employeePayroll.paymentStatus =
          'Paid';

        employeePayroll.paidAt =
          nowIso;

        employeePayroll.transactionId =
          paymentId;

      } catch (error) {

        /*
         * Agar payment already exist karta
         * hai (duplicate call ya retry),
         * to usse skip kar do — process
         * ko rukne mat do.
         */

        employeePayroll.paymentStatus =
          'Failed';
      }
    }

    await payroll.save();
  }

  /* ===================================================
     GENERATE BANK TRANSFER FILE (CSV)

     Yeh CSV file bank ke corporate/NEFT
     bulk-upload portal me daalne ke liye
     hai — taaki ek click me sabhi employees
     ko salary transfer ho sake (jab tak
     direct payment-gateway API integrate
     na ho).
  =================================================== */

  public async generateBankTransferFile(
    id: string
  ): Promise<string> {

    const payroll =
      await Payroll.findOne({
        payrollId: id,
      }).lean();

    if (!payroll) {
      throw new NotFoundException(
        'Payroll not found',
        'PAYROLL_BANK_FILE'
      );
    }

    const header =
      'Employee ID,Employee Name,Bank Name,Account Number,IFSC Code,Net Salary\n';

    const rows =
      payroll.employeePayrolls
        .map(
          (employeePayroll: any) =>
            [
              employeePayroll.employeeId,
              employeePayroll.employeeName,
              employeePayroll.bankName ?? '',
              employeePayroll.bankAccount ?? '',
              employeePayroll.ifscCode ?? '',
              employeePayroll.netSalary,
            ].join(',')
        )
        .join('\n');

    return header + rows;
  }

  /* ===================================================
     GENERATE PAYSLIP (TEXT FORMAT)

     Ek employee ka pura salary breakdown
     (leave, deduction, net salary, bank
     details) ek readable payslip document
     ke form me deta hai — employee isse
     download/print kar sakta hai.
  =================================================== */

  public async generatePayslip(
    payrollId: string,
    employeeId: string
  ): Promise<string> {

    const payroll =
      await Payroll.findOne({
        payrollId,
      }).lean();

    if (!payroll) {
      throw new NotFoundException(
        'Payroll not found',
        'PAYROLL_PAYSLIP'
      );
    }

    const employeePayroll =
      (payroll.employeePayrolls as any[]).find(
        (item) =>
          item.employeeId ===
          employeeId
      );

    if (!employeePayroll) {
      throw new NotFoundException(
        'Employee not found in this payroll',
        'PAYROLL_PAYSLIP'
      );
    }

    const settings =
      await settingsService.getSettings();

    const company =
      settings.company;

    const line =
      '-'.repeat(50);

    const doubleLine =
      '='.repeat(50);

    const rupee = (
      value: number
    ) =>
      `Rs. ${Number(
        value ?? 0
      ).toLocaleString('en-IN')}`;

    const lines = [
      doubleLine,
      company.name ??
        '2STAR STAFFING',
      company.address ?? '',
      doubleLine,
      '',
      `PAYSLIP - ${payroll.month}`,
      '',
      `Employee ID   : ${employeePayroll.employeeId}`,
      `Employee Name : ${employeePayroll.employeeName}`,
      `Department    : ${employeePayroll.department}`,
      `Designation   : ${employeePayroll.designation}`,
      '',
      line,
      'ATTENDANCE & LEAVE',
      line,
      `Total Days        : ${employeePayroll.totalDays}`,
      `Working Days      : ${employeePayroll.workingDays}`,
      `Paid Leave Days   : ${employeePayroll.paidLeaveDays}`,
      `Unpaid Leave Days : ${employeePayroll.unpaidLeaveDays}`,
      `Absent Days       : ${employeePayroll.absentDays}`,
      '',
      line,
      'SALARY BREAKDOWN',
      line,
      `Monthly Salary (Gross) : ${rupee(
        employeePayroll.monthlySalary
      )}`,
      `Leave Deduction        : ${rupee(
        employeePayroll.leaveDeduction
      )}`,
      `Other Deductions       : ${rupee(
        employeePayroll.otherDeductions
      )}`,
      `Total Deductions       : ${rupee(
        employeePayroll.totalDeductions
      )}`,
      line,
      `NET SALARY             : ${rupee(
        employeePayroll.netSalary
      )}`,
      '',
      line,
      'PAYMENT DETAILS',
      line,
      `Bank Name      : ${employeePayroll.bankName ?? '-'}`,
      `Account Number : ${employeePayroll.bankAccount ?? '-'}`,
      `IFSC Code      : ${employeePayroll.ifscCode ?? '-'}`,
      `Payment Status : ${employeePayroll.paymentStatus}`,
      `Paid On        : ${employeePayroll.paidAt ?? '-'}`,
      `Transaction ID : ${employeePayroll.transactionId ?? '-'}`,
      '',
      doubleLine,
      'This is a system-generated payslip.',
      doubleLine,
    ];

    return lines.join('\n');
  }

  /* ===================================================
     GET EMPLOYEE SALARY HISTORY

     Ek employee ki ab tak ki saari payroll
     history (har mahine ki salary, leave,
     deduction, payment status) — Employee
     Details page par dikhane ke liye.
  =================================================== */

  public async getEmployeeSalaryHistory(
    employeeId: string
  ): Promise<any[]> {

    const payrolls =
      await Payroll.find({
        'employeePayrolls.employeeId':
          employeeId,
      })
        .sort({
          periodStart: -1,
        })
        .lean();

    return payrolls
      .map((payroll: any) => {

        const employeePayroll =
          (payroll.employeePayrolls ?? []).find(
            (item: any) =>
              item.employeeId ===
              employeeId
          );

        if (!employeePayroll) {
          return null;
        }

        return {
          payrollId:
            payroll.payrollId,

          month:
            payroll.month,

          periodStart:
            payroll.periodStart,

          periodEnd:
            payroll.periodEnd,

          payrollStatus:
            payroll.status,

          ...employeePayroll,
        };
      })
      .filter(
        (item) => item !== null
      );
  }

  /* ===================================================
     DELETE
  =================================================== */

  public async delete(
    id: string
  ): Promise<void> {

    const payroll =
      await Payroll.findOneAndDelete({
        payrollId: id,
      });

    if (!payroll) {
      throw new NotFoundException(
        'Payroll not found',
        'PAYROLL_DELETE'
      );
    }
  }

  /* ===================================================
     GET DAYS BETWEEN DATES
  =================================================== */

  private getDaysBetween(
    startDate: string,
    endDate: string
  ): number {

    const start =
      new Date(
        `${startDate}T00:00:00`
      );

    const end =
      new Date(
        `${endDate}T00:00:00`
      );

    const difference =
      end.getTime() -
      start.getTime();

    return (
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  }

  /* ===================================================
     CALCULATE LEAVE DAYS
  =================================================== */

  private calculateLeaveDays(
    leaveStartDate:
      | string
      | null
      | undefined,

    leaveEndDate:
      | string
      | null
      | undefined,

    payrollStart:
      string,

    payrollEnd:
      string
  ): number {

    if (
      !leaveStartDate ||
      !leaveEndDate
    ) {
      return 0;
    }

    const leaveStart =
      new Date(
        `${leaveStartDate}T00:00:00`
      );

    const leaveEnd =
      new Date(
        `${leaveEndDate}T00:00:00`
      );

    const salaryStart =
      new Date(
        `${payrollStart}T00:00:00`
      );

    const salaryEnd =
      new Date(
        `${payrollEnd}T00:00:00`
      );

    if (
      leaveStart > salaryEnd ||
      leaveEnd < salaryStart
    ) {
      return 0;
    }

    const actualStart =
      leaveStart > salaryStart
        ? leaveStart
        : salaryStart;

    const actualEnd =
      leaveEnd < salaryEnd
        ? leaveEnd
        : salaryEnd;

    const difference =
      actualEnd.getTime() -
      actualStart.getTime();

    return (
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  }

  /* ===================================================
     ENTITY MAPPER
  =================================================== */

  private toEntity(
    payroll: any
  ): PayrollEntity {

    return {
      id:
        payroll.payrollId,

      month:
        payroll.month,

      periodStart:
        payroll.periodStart,

      periodEnd:
        payroll.periodEnd,

      payrollDate:
        payroll.payrollDate ??
        null,

      totalEmployees:
        payroll.totalEmployees,

      grossPayroll:
        payroll.grossPayroll,

      deductions:
        payroll.deductions,

      netPayroll:
        payroll.netPayroll,

      status:
        payroll.status,

      processedDate:
        payroll.processedDate ??
        null,

      processedBy:
        payroll.processedBy ??
        null,

      employeePayrolls:
        payroll.employeePayrolls ??
        [],

      departmentBreakdown:
        payroll.departmentBreakdown ??
        [],

      notes:
        payroll.notes ??
        null,

      createdAt:
        payroll.createdAt,

      updatedAt:
        payroll.updatedAt,
    };
  }
}

export default PayrollService;