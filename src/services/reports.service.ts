import mongoose from "mongoose";

type Doc = Record<string, any>;

/* ================================================== */
/* Response Types                                     */
/* ================================================== */

export interface ReportsData {
  summary: {
    totalPayrollYtd: number;
    totalDeductionsYtd: number;
    activeEmployees: number;
    totalEmployees: number;
    paymentSuccessRate: number;
    avgSalary: number;
  };

  payrollSummary: Array<{
    month: string;
    payrollId: string;
    employees: number;
    grossPay: number;
    deductions: number;
    netPay: number;
    status: string;
  }>;

  taxDeductions: Array<{
    month: string;
    tds: number;
    pf: number;
    esi: number;
    professionalTax: number;
    totalDeductions: number;
  }>;

  departments: Array<{
    department: string;
    headcount: number;
    totalSalary: number;
    avgSalary: number;
    payrollShare: number;
  }>;

  paymentStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    amount: number;
  }>;

  departmentChart: Array<{
    label: string;
    value: number;
  }>;

  monthlyPayrollChart: Array<{
    label: string;
    value: number;
  }>;
}

/* ================================================== */
/* MongoDB                                           */
/* ================================================== */

const db = () => {
  if (!mongoose.connection.db) {
    throw new Error(
      "MongoDB database connection is not ready.",
    );
  }

  return mongoose.connection.db;
};

/* ================================================== */
/* Collection Resolver                                */
/* ================================================== */

async function collection(
  candidates: string[],
) {
  const names = (
    await db()
      .listCollections({}, { nameOnly: true })
      .toArray()
  ).map((item) => item.name);

  const lower = new Map(
    names.map((name) => [
      name.toLowerCase(),
      name,
    ]),
  );

  /*
   * Exact match
   */
  for (const candidate of candidates) {
    const exact = lower.get(
      candidate.toLowerCase(),
    );

    if (exact) {
      return db().collection(exact);
    }
  }

  /*
   * Plural match
   */
  for (const name of names) {
    const lowerName =
      name.toLowerCase();

    if (
      candidates.some(
        (candidate) =>
          lowerName ===
          `${candidate.toLowerCase()}s`,
      )
    ) {
      return db().collection(name);
    }
  }

  throw new Error(
    `MongoDB collection not found: ${candidates.join(
      ", ",
    )}`,
  );
}

/* ================================================== */
/* Read Collection                                    */
/* ================================================== */

async function all(
  candidates: string[],
): Promise<Doc[]> {
  const selectedCollection =
    await collection(candidates);

  return (await selectedCollection
    .find({})
    .toArray()) as Doc[];
}

/* ================================================== */
/* Generic Value Helper                               */
/* ================================================== */

function value(
  doc: Doc,
  keys: string[],
): unknown {
  for (const key of keys) {
    let current: any = doc;

    for (const part of key.split(".")) {
      if (current == null) {
        break;
      }

      current = current[part];
    }

    if (
      current !== undefined &&
      current !== null &&
      current !== ""
    ) {
      return current;
    }
  }

  return undefined;
}

/* ================================================== */
/* Number Helper                                      */
/* ================================================== */

function num(value: unknown): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(
      value
        .replace(/,/g, "")
        .replace(/₹/g, "")
        .trim(),
    );

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
}

/* ================================================== */
/* Date Helper                                        */
/* ================================================== */

function date(
  value: unknown,
): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime(),
    )
      ? null
      : value;
  }

  if (
    value &&
    typeof value === "object" &&
    "$date" in value
  ) {
    return date(
      (value as any).$date,
    );
  }

  if (
    typeof value === "number" ||
    typeof value === "string"
  ) {
    const parsed = new Date(value);

    return Number.isNaN(
      parsed.getTime(),
    )
      ? null
      : parsed;
  }

  return null;
}

/* ================================================== */
/* Document Date                                      */
/* ================================================== */

function docDate(
  doc: Doc,
  keys: string[],
) {
  return date(
    value(doc, keys),
  );
}

/* ================================================== */
/* Money                                             */
/* ================================================== */

function money(
  doc: Doc,
  keys: string[],
) {
  return num(
    value(doc, keys),
  );
}

/* ================================================== */
/* Round                                              */
/* ================================================== */

function round(
  value: number,
): number {
  return (
    Math.round(value * 100) / 100
  );
}

/* ================================================== */
/* Month Key                                          */
/* ================================================== */

function monthKey(
  date: Date,
) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

/* ================================================== */
/* Month Label                                        */
/* ================================================== */

function monthLabel(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

/* ================================================== */
/* Period Range                                       */
/* ================================================== */

function range(
  period: string,
): {
  start: Date | null;
  end: Date;
} {
  const now = new Date();

  const end = new Date(
    now.getTime(),
  );

  end.setHours(
    23,
    59,
    59,
    999,
  );

  const currentPeriod =
    String(period || "ytd")
      .toLowerCase();

  /*
   * All data
   */
  if (
    currentPeriod === "all" ||
    currentPeriod === "alltime"
  ) {
    return {
      start: null,
      end,
    };
  }

  /*
   * Current month
   */
  if (
    currentPeriod === "month" ||
    currentPeriod ===
      "currentmonth" ||
    currentPeriod ===
      "thismonth"
  ) {
    return {
      start: new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
      end,
    };
  }

  /*
   * Current quarter
   */
  if (
    currentPeriod === "qtd" ||
    currentPeriod ===
      "thisquarter"
  ) {
    return {
      start: new Date(
        now.getFullYear(),
        Math.floor(
          now.getMonth() / 3,
        ) * 3,
        1,
      ),
      end,
    };
  }

  /*
   * Last N months
   *
   * Examples:
   * last3months
   * last6months
   * last12months
   */
  const match =
    currentPeriod.match(
      /(?:last|previous)[_-]?(\d+)[_-]?(?:months?|m)/,
    );

  if (match) {
    const start = new Date(
      now.getTime(),
    );

    start.setMonth(
      start.getMonth() -
        Number(match[1]),
    );

    start.setHours(
      0,
      0,
      0,
      0,
    );

    return {
      start,
      end,
    };
  }

  /*
   * Default = Year To Date
   */
  return {
    start: new Date(
      now.getFullYear(),
      0,
      1,
    ),
    end,
  };
}

/* ================================================== */
/* Check Date Range                                   */
/* ================================================== */

function inRange(
  date: Date | null,
  start: Date | null,
  end: Date,
) {
  /*
   * All-time
   */
  if (start === null) {
    return true;
  }

  if (!date) {
    return false;
  }

  return (
    date.getTime() >=
      start.getTime() &&
    date.getTime() <=
      end.getTime()
  );
}

/* ================================================== */
/* Status                                             */
/* ================================================== */

function status(
  value: unknown,
) {
  const current =
    String(value ?? "")
      .trim()
      .toLowerCase();

  if (
    [
      "paid",
      "success",
      "successful",
    ].includes(current)
  ) {
    return "Paid";
  }

  if (
    [
      "pending",
      "queued",
    ].includes(current)
  ) {
    return "Pending";
  }

  if (
    [
      "failed",
      "failure",
    ].includes(current)
  ) {
    return "Failed";
  }

  if (
    [
      "completed",
      "complete",
    ].includes(current)
  ) {
    return "Completed";
  }

  if (
    [
      "processing",
      "in progress",
    ].includes(current)
  ) {
    return "Processing";
  }

  return value
    ? String(value)
    : "Pending";
}

/* ================================================== */
/* Deduction Breakdown                                */
/* ================================================== */

function deductions(
  payroll: Doc,
) {
  const raw = value(
    payroll,
    [
      "deductions",
      "deductionBreakdown",
      "taxDeductions",
    ],
  );

  let tds = money(
    payroll,
    [
      "tds",
      "TDS",
      "taxDeduction",
    ],
  );

  let pf = money(
    payroll,
    [
      "pf",
      "PF",
      "providentFund",
    ],
  );

  let esi = money(
    payroll,
    [
      "esi",
      "ESI",
      "employeeStateInsurance",
    ],
  );

  let professionalTax =
    money(
      payroll,
      [
        "professionalTax",
        "profTax",
        "PT",
      ],
    );

  let total = 0;

  /*
   * deductions = number
   */
  if (
    typeof raw === "number" ||
    typeof raw === "string"
  ) {
    total = num(raw);
  }

  /*
   * deductions = object
   */
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw)
  ) {
    const breakdown =
      raw as Doc;

    if (!tds) {
      tds = money(
        breakdown,
        [
          "tds",
          "TDS",
          "incomeTax",
        ],
      );
    }

    if (!pf) {
      pf = money(
        breakdown,
        [
          "pf",
          "PF",
          "providentFund",
        ],
      );
    }

    if (!esi) {
      esi = money(
        breakdown,
        [
          "esi",
          "ESI",
        ],
      );
    }

    if (!professionalTax) {
      professionalTax =
        money(
          breakdown,
          [
            "professionalTax",
            "profTax",
            "PT",
          ],
        );
    }

    total = money(
      breakdown,
      [
        "total",
        "totalDeductions",
      ],
    );
  }

  /*
   * Fallback total deductions
   */
  if (!total) {
    total = money(
      payroll,
      [
        "totalDeductions",
        "deductionAmount",
      ],
    );
  }

  /*
   * Calculate total from breakdown
   */
  if (!total) {
    total =
      tds +
      pf +
      esi +
      professionalTax;
  }

  return {
    tds,
    pf,
    esi,
    professionalTax,
    total,
  };
}

/* ================================================== */
/* Department Payroll                                 */
/* ================================================== */

function departmentPayroll(
  payroll: Doc,
): Array<{
  department: string;
  amount: number;
}> {
  const raw = value(
    payroll,
    [
      "departmentBreakdown",
      "departmentBreakdowns",
    ],
  );

  if (!raw) {
    return [];
  }

  const amount = (
    value: unknown,
  ) => {
    if (
      typeof value === "number" ||
      typeof value === "string"
    ) {
      return num(value);
    }

    return money(
      value as Doc,
      [
        "grossPayroll",
        "grossPay",
        "netPayroll",
        "netPay",
        "totalPayroll",
        "amount",
        "value",
      ],
    );
  };

  /*
   * Array format
   *
   * [
   *   {
   *     department: "IT",
   *     amount: 50000
   *   }
   * ]
   */
  if (Array.isArray(raw)) {
    return raw.flatMap(
      (item: any) => {
        const name = value(
          item,
          [
            "department",
            "name",
            "label",
          ],
        );

        return name
          ? [
              {
                department:
                  String(name),
                amount:
                  amount(item),
              },
            ]
          : [];
      },
    );
  }

  /*
   * Object format
   *
   * {
   *   IT: 50000,
   *   HR: 30000
   * }
   */
  if (
    typeof raw === "object"
  ) {
    return Object.entries(
      raw as Doc,
    ).map(
      ([
        department,
        value,
      ]) => ({
        department,
        amount:
          amount(value),
      }),
    );
  }

  return [];
}

/* ================================================== */
/* REPORT SERVICE                                     */
/* ================================================== */

export const reportService = {
  async getReports(
    period = "ytd",
  ): Promise<ReportsData> {
    const {
      start,
      end,
    } = range(period);

    /*
     * Read all three actual MongoDB collections.
     */
    const [
      employees,
      payrolls,
      payments,
    ] = await Promise.all([
      all([
        "employees",
        "employee",
      ]),

      all([
        "payrolls",
        "payroll",
        "payrollruns",
        "payrollrun",
      ]),

      all([
        "payments",
        "payment",
        "transactions",
        "transaction",
        "paymenttransactions",
      ]),
    ]);

    /*
     * Filter payrolls by selected period
     */
    const filteredPayrolls =
      payrolls.filter(
        (payroll) =>
          inRange(
            docDate(
              payroll,
              [
                "periodStart",
                "processedDate",
                "periodEnd",
                "createdAt",
                "date",
              ],
            ),
            start,
            end,
          ),
      );

    /*
     * Filter payments by selected period
     */
    const filteredPayments =
      payments.filter(
        (payment) =>
          inRange(
            docDate(
              payment,
              [
                "date",
                "paymentDate",
                "completedAt",
                "initiatedAt",
                "createdAt",
              ],
            ),
            start,
            end,
          ),
      );

    /* ============================================== */
    /* EMPLOYEE SUMMARY                               */
    /* ============================================== */

    const totalEmployees =
      employees.length;

    const activeEmployees =
      employees.filter(
        (employee) =>
          String(
            value(
              employee,
              [
                "status",
                "employeeStatus",
              ],
            ) ?? "active",
          ).toLowerCase() ===
          "active",
      ).length;

    const totalSalary =
      employees.reduce(
        (
          total,
          employee,
        ) =>
          total +
          money(
            employee,
            [
              "salary",
              "monthlySalary",
              "basicSalary",
              "grossSalary",
            ],
          ),
        0,
      );

    const avgSalary =
      totalEmployees > 0
        ? totalSalary /
          totalEmployees
        : 0;

    /* ============================================== */
    /* PAYROLL SUMMARY                                */
    /* ============================================== */

    const totalGross =
      filteredPayrolls.reduce(
        (
          total,
          payroll,
        ) =>
          total +
          money(
            payroll,
            [
              "grossPayroll",
              "grossPay",
              "grossSalary",
              "totalGross",
              "gross",
            ],
          ),
        0,
      );

    const totalDeductions =
      filteredPayrolls.reduce(
        (
          total,
          payroll,
        ) =>
          total +
          deductions(
            payroll,
          ).total,
        0,
      );

    /* ============================================== */
    /* PAYMENT SUMMARY                                */
    /* ============================================== */

    const counts = {
      Paid: 0,
      Pending: 0,
      Failed: 0,
    };

    const amounts = {
      Paid: 0,
      Pending: 0,
      Failed: 0,
    };

    for (
      const payment of filteredPayments
    ) {
      const paymentStatus =
        status(
          value(
            payment,
            [
              "status",
              "paymentStatus",
            ],
          ),
        );

      if (
        paymentStatus ===
          "Paid" ||
        paymentStatus ===
          "Pending" ||
        paymentStatus ===
          "Failed"
      ) {
        counts[
          paymentStatus
        ]++;

        amounts[
          paymentStatus
        ] += money(
          payment,
          [
            "amount",
            "paymentAmount",
            "netAmount",
            "netPay",
          ],
        );
      }
    }

    const totalPayments =
      filteredPayments.length;

    const paymentSuccessRate =
      totalPayments > 0
        ? (counts.Paid /
            totalPayments) *
          100
        : 0;

    /* ============================================== */
    /* PAYROLL TABLE                                  */
    /* ============================================== */

    const payrollSummary =
      filteredPayrolls
        .map((payroll) => {
          const payrollDate =
            docDate(
              payroll,
              [
                "periodStart",
                "processedDate",
                "periodEnd",
                "createdAt",
                "date",
              ],
            );

          const monthValue =
            value(
              payroll,
              [
                "month",
                "payrollMonth",
              ],
            );

          const employeesValue =
            num(
              value(
                payroll,
                [
                  "totalEmployees",
                  "employeeCount",
                  "employeesCount",
                  "headcount",
                ],
              ),
            );

          let employeeCount =
            employeesValue;

          if (
            employeeCount === 0
          ) {
            const payrollEmployees =
              value(
                payroll,
                [
                  "employees",
                  "employeeIds",
                ],
              );

            if (
              Array.isArray(
                payrollEmployees,
              )
            ) {
              employeeCount =
                payrollEmployees.length;
            }
          }

          return {
            month:
              monthValue
                ? String(
                    monthValue,
                  )
                : payrollDate
                  ? monthLabel(
                      payrollDate,
                    )
                  : "Unknown",

            payrollId:
              String(
                value(
                  payroll,
                  [
                    "payrollId",
                    "id",
                    "_id",
                  ],
                ) ?? "—",
              ),

            employees:
              employeeCount,

            grossPay:
              money(
                payroll,
                [
                  "grossPayroll",
                  "grossPay",
                  "grossSalary",
                  "totalGross",
                  "gross",
                ],
              ),

            deductions:
              deductions(
                payroll,
              ).total,

            netPay:
              money(
                payroll,
                [
                  "netPayroll",
                  "netPay",
                  "netSalary",
                  "totalNet",
                  "net",
                ],
              ),

            status:
              status(
                value(
                  payroll,
                  [
                    "status",
                    "payrollStatus",
                  ],
                ),
              ),

            _date:
              payrollDate?.getTime() ??
              0,
          };
        })
        .sort(
          (a, b) =>
            b._date -
            a._date,
        )
        .map(
          ({
            _date,
            ...row
          }) => row,
        );

    /* ============================================== */
    /* TAX & DEDUCTIONS                               */
    /* ============================================== */

    const taxMap =
      new Map<
        string,
        ReportsData["taxDeductions"][number]
      >();

    for (
      const payroll of filteredPayrolls
    ) {
      const payrollDate =
        docDate(
          payroll,
          [
            "periodStart",
            "processedDate",
            "periodEnd",
            "createdAt",
            "date",
          ],
        );

      const monthValue =
        value(
          payroll,
          [
            "month",
            "payrollMonth",
          ],
        );

      const key =
        payrollDate
          ? monthKey(
              payrollDate,
            )
          : String(
              monthValue ??
                "Unknown",
            );

      const row =
        taxMap.get(key) ?? {
          month:
            payrollDate
              ? monthLabel(
                  payrollDate,
                )
              : key,

          tds: 0,
          pf: 0,
          esi: 0,
          professionalTax: 0,
          totalDeductions: 0,
        };

      const deduction =
        deductions(
          payroll,
        );

      row.tds +=
        deduction.tds;

      row.pf +=
        deduction.pf;

      row.esi +=
        deduction.esi;

      row.professionalTax +=
        deduction.professionalTax;

      row.totalDeductions +=
        deduction.total;

      taxMap.set(
        key,
        row,
      );
    }

    const taxDeductions =
      Array.from(
        taxMap.entries(),
      )
        .sort(
          ([a], [b]) =>
            a.localeCompare(b),
        )
        .map(
          ([, row]) => ({
            ...row,
            tds: round(
              row.tds,
            ),
            pf: round(
              row.pf,
            ),
            esi: round(
              row.esi,
            ),
            professionalTax:
              round(
                row.professionalTax,
              ),
            totalDeductions:
              round(
                row.totalDeductions,
              ),
          }),
        );

    /* ============================================== */
    /* DEPARTMENT ANALYTICS                           */
    /* ============================================== */

    const departmentMap =
      new Map<
        string,
        {
          headcount: number;
          totalSalary: number;
        }
      >();

    for (
      const employee of employees
    ) {
      const department =
        String(
          value(
            employee,
            [
              "department",
              "departmentName",
            ],
          ) ??
            "Unassigned",
        );

      const row =
        departmentMap.get(
          department,
        ) ?? {
          headcount: 0,
          totalSalary: 0,
        };

      row.headcount++;

      row.totalSalary +=
        money(
          employee,
          [
            "salary",
            "monthlySalary",
            "basicSalary",
            "grossSalary",
          ],
        );

      departmentMap.set(
        department,
        row,
      );
    }

    const departments =
      Array.from(
        departmentMap.entries(),
      )
        .map(
          ([
            department,
            row,
          ]) => ({
            department,

            headcount:
              row.headcount,

            totalSalary:
              round(
                row.totalSalary,
              ),

            avgSalary:
              round(
                row.headcount > 0
                  ? row.totalSalary /
                      row.headcount
                  : 0,
              ),

            payrollShare:
              round(
                totalSalary > 0
                  ? (row.totalSalary /
                      totalSalary) *
                      100
                  : 0,
              ),
          }),
        )
        .sort(
          (a, b) =>
            b.totalSalary -
            a.totalSalary,
        );

    /* ============================================== */
    /* DEPARTMENT CHART                               */
    /* ============================================== */

    const departmentPayrollMap =
      new Map<
        string,
        number
      >();

    for (
      const payroll of filteredPayrolls
    ) {
      const entries =
        departmentPayroll(
          payroll,
        );

      for (
        const entry of entries
      ) {
        departmentPayrollMap.set(
          entry.department,
          (departmentPayrollMap.get(
            entry.department,
          ) ?? 0) +
            entry.amount,
        );
      }
    }

    const departmentChart =
      (
        departmentPayrollMap.size >
        0
          ? Array.from(
              departmentPayrollMap.entries(),
            ).map(
              ([
                label,
                value,
              ]) => ({
                label,
                value: round(
                  value,
                ),
              }),
            )
          : departments.map(
              (department) => ({
                label:
                  department.department,
                value:
                  department.totalSalary,
              }),
            )
      ).sort(
        (a, b) =>
          b.value -
          a.value,
      );

    /* ============================================== */
    /* MONTHLY PAYROLL CHART                          */
    /* ============================================== */

    const monthlyMap =
      new Map<
        string,
        {
          label: string;
          value: number;
        }
      >();

    for (
      const payroll of filteredPayrolls
    ) {
      const payrollDate =
        docDate(
          payroll,
          [
            "periodStart",
            "processedDate",
            "periodEnd",
            "createdAt",
            "date",
          ],
        );

      const monthValue =
        value(
          payroll,
          [
            "month",
            "payrollMonth",
          ],
        );

      const label =
        payrollDate
          ? monthLabel(
              payrollDate,
            )
          : String(
              monthValue ??
                "Unknown",
            );

      const key =
        payrollDate
          ? monthKey(
              payrollDate,
            )
          : label;

      const row =
        monthlyMap.get(
          key,
        ) ?? {
          label,
          value: 0,
        };

      row.value +=
        money(
          payroll,
          [
            "netPayroll",
            "netPay",
            "netSalary",
            "totalNet",
            "net",
          ],
        );

      monthlyMap.set(
        key,
        row,
      );
    }

    const monthlyPayrollChart =
      Array.from(
        monthlyMap.entries(),
      )
        .sort(
          ([a], [b]) =>
            a.localeCompare(b),
        )
        .map(
          ([, row]) => ({
            label: row.label,
            value: round(
              row.value,
            ),
          }),
        );

    /* ============================================== */
    /* PAYMENT STATUS                                 */
    /* ============================================== */

    const paymentStatus =
      (
        [
          "Paid",
          "Pending",
          "Failed",
        ] as const
      ).map(
        (currentStatus) => ({
          status:
            currentStatus,

          count:
            counts[
              currentStatus
            ],

          percentage:
            totalPayments > 0
              ? round(
                  (counts[
                    currentStatus
                  ] /
                    totalPayments) *
                    100,
                )
              : 0,

          amount:
            round(
              amounts[
                currentStatus
              ],
            ),
        }),
      );

    /* ============================================== */
    /* FINAL RESPONSE                                  */
    /* ============================================== */

    return {
      summary: {
        totalPayrollYtd:
          round(
            totalGross,
          ),

        totalDeductionsYtd:
          round(
            totalDeductions,
          ),

        activeEmployees,

        totalEmployees,

        paymentSuccessRate:
          round(
            paymentSuccessRate,
          ),

        avgSalary:
          round(
            avgSalary,
          ),
      },

      payrollSummary,

      taxDeductions,

      departments,

      paymentStatus,

      departmentChart,

      monthlyPayrollChart,
    };
  },
};