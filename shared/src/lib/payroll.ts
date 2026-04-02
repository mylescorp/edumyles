// ============================================================
// EduMyles — Payroll Processing System
// ============================================================

export interface Employee {
  id: string;
  tenantId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  basicSalary: number;
  allowance: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branchCode?: string;
  };
  taxInfo: {
    pinNumber: string;
    nhifNumber?: string;
    nitaNumber?: string;
    taxBand: 'band1' | 'band2' | 'band3' | 'band4';
  };
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollPeriod {
  id: string;
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'processing' | 'completed' | 'cancelled';
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payslip {
  id: string;
  tenantId: string;
  employeeId: string;
  payrollPeriodId: string;
  basicSalary: number;
  allowance: number;
  grossPay: number;
  deductions: {
    paye: number; // Pay As You Earn
    nhif: number; // National Hospital Insurance Fund
    nssf: number; // National Social Security Fund
    housingLevy: number; // Housing Levy
    otherDeductions: number;
  };
  netPay: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'mobile_money';
  bankReference?: string;
  mobileReference?: string;
  status: 'draft' | 'approved' | 'paid' | 'failed';
  approvedBy?: string;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollConfiguration {
  tenantId: string;
  currency: string;
  taxYear: number;
  payeRates: {
    band1: { min: number; max: number; rate: number };
    band2: { min: number; max: number; rate: number };
    band3: { min: number; max: number; rate: number };
    band4: { min: number; max: number; rate: number };
  };
  nhifRates: {
    tier1: { min: number; max: number; rate: number };
    tier2: { min: number; max: number; rate: number };
    tier3: { min: number; max: number; rate: number };
    tier4: { min: number; max: number; rate: number };
  };
  nssfRates: {
    employeeRate: number; // Employee contribution rate
    employerRate: number; // Employer contribution rate
    maxContribution: number; // Maximum monthly contribution
  };
  housingLevyRate: number; // Percentage of gross pay
  minimumWage: number; // Minimum monthly wage
  overtimeRates: {
    weekday: number; // Weekday overtime multiplier
    weekend: number; // Weekend overtime multiplier
    holiday: number; // Holiday overtime multiplier
  };
}

export class PayrollEngine {
  // Kenya tax rates for 2024 (example - should be configurable)
  private static readonly KENYA_PAYE_RATES_2024 = {
    band1: { min: 0, max: 24000, rate: 0.10 },
    band2: { min: 24001, max: 32333, rate: 0.25 },
    band3: { min: 32334, max: 500000, rate: 0.30 },
    band4: { min: 500001, max: Infinity, rate: 0.35 },
  };

  private static readonly KENYA_NHIF_RATES_2024 = {
    tier1: { min: 0, max: 5999, rate: 0.015 },
    tier2: { min: 6000, max: 7999, rate: 0.03 },
    tier3: { min: 8000, max: 11999, rate: 0.04 },
    tier4: { min: 12000, max: 14999, rate: 0.05 },
    tier5: { min: 15000, max: 17999, rate: 0.06 },
    tier6: { min: 18000, max: 24999, rate: 0.07 },
    tier7: { min: 25000, max: 29999, rate: 0.08 },
    tier8: { min: 30000, max: 39999, rate: 0.09 },
    tier9: { min: 40000, max: 49999, rate: 0.10 },
    tier10: { min: 50000, max: 69999, rate: 0.11 },
    tier11: { min: 70000, max: 99999, rate: 0.12 },
    tier12: { min: 100000, max: Infinity, rate: 0.13 },
  };

  private static readonly KENYA_NSSF_RATES_2024 = {
    employeeRate: 0.06, // 6% employee contribution
    employerRate: 0.06, // 6% employer contribution
    maxContribution: 2160, // Maximum KES 2,160 per month
  };

  private static readonly KENYA_HOUSING_LEVY_RATE = 0.015; // 1.5% of gross pay

  /**
   * Calculate PAYE (Pay As You Earn) for Kenya
   */
  static calculatePAYE(grossMonthlySalary: number): number {
    const rates = this.KENYA_PAYE_RATES_2024;
    
    if (grossMonthlySalary <= rates.band1.max) {
      return grossMonthlySalary * rates.band1.rate;
    } else if (grossMonthlySalary <= rates.band2.max) {
      const band1Tax = rates.band1.max * rates.band1.rate;
      const remainingSalary = grossMonthlySalary - rates.band1.max;
      const band2Tax = remainingSalary * rates.band2.rate;
      return band1Tax + band2Tax;
    } else if (grossMonthlySalary <= rates.band3.max) {
      const band1Tax = rates.band1.max * rates.band1.rate;
      const band2Tax = rates.band2.max * rates.band2.rate;
      const remainingSalary = grossMonthlySalary - rates.band1.max - rates.band2.max;
      const band3Tax = remainingSalary * rates.band3.rate;
      return band1Tax + band2Tax + band3Tax;
    } else {
      const band1Tax = rates.band1.max * rates.band1.rate;
      const band2Tax = rates.band2.max * rates.band2.rate;
      const band3Tax = rates.band3.max * rates.band3.rate;
      const remainingSalary = grossMonthlySalary - rates.band1.max - rates.band2.max - rates.band3.max;
      const band4Tax = remainingSalary * rates.band4.rate;
      return band1Tax + band2Tax + band3Tax + band4Tax;
    }
  }

  /**
   * Calculate NHIF deduction for Kenya
   */
  static calculateNHIF(grossMonthlySalary: number): number {
    const rates = this.KENYA_NHIF_RATES_2024;
    
    for (const tier of Object.values(rates)) {
      if (grossMonthlySalary >= tier.min && grossMonthlySalary <= tier.max) {
        return grossMonthlySalary * tier.rate;
      }
    }
    
    // Return maximum rate if salary exceeds all tiers
    return grossMonthlySalary * rates.tier12.rate;
  }

  /**
   * Calculate NSSF deduction for Kenya
   */
  static calculateNSSF(grossMonthlySalary: number): number {
    const rates = this.KENYA_NSSF_RATES_2024;
    const contribution = grossMonthlySalary * rates.employeeRate;
    
    // Cap at maximum contribution
    return Math.min(contribution, rates.maxContribution);
  }

  /**
   * Calculate Housing Levy
   */
  static calculateHousingLevy(grossMonthlySalary: number): number {
    return grossMonthlySalary * this.KENYA_HOUSING_LEVY_RATE;
  }

  /**
   * Calculate total statutory deductions
   */
  static calculateStatutoryDeductions(grossMonthlySalary: number): {
    paye: number;
    nhif: number;
    nssf: number;
    housingLevy: number;
    otherDeductions: number;
    total: number;
  } {
    const paye = this.calculatePAYE(grossMonthlySalary);
    const nhif = this.calculateNHIF(grossMonthlySalary);
    const nssf = this.calculateNSSF(grossMonthlySalary);
    const housingLevy = this.calculateHousingLevy(grossMonthlySalary);
    
    return {
      paye,
      nhif,
      nssf,
      housingLevy,
      otherDeductions: 0,
      total: paye + nhif + nssf + housingLevy,
    };
  }

  /**
   * Calculate overtime pay
   */
  static calculateOvertimePay(
    basicSalary: number,
    overtimeHours: number,
    rate: 'weekday' | 'weekend' | 'holiday' = 'weekday'
  ): number {
    const hourlyRate = basicSalary / (22 * 8); // Assuming 22 working days, 8 hours per day
    
    let multiplier = 1.5; // Default weekday rate
    if (rate === 'weekend') multiplier = 2.0;
    if (rate === 'holiday') multiplier = 2.5;
    
    return overtimeHours * hourlyRate * multiplier;
  }

  /**
   * Generate payslip calculations
   */
  static generatePayslip(
    employee: Employee,
    payrollPeriod: PayrollPeriod,
    overtimeHours: number = 0,
    overtimeRate: 'weekday' | 'weekend' | 'holiday' = 'weekday',
    otherDeductions: number = 0,
    configuration: PayrollConfiguration
  ): Omit<Payslip, 'id' | 'tenantId' | 'employeeId' | 'payrollPeriodId' | 'createdAt' | 'updatedAt'> {
    const basicSalary = employee.basicSalary;
    const allowance = employee.allowance || 0;
    
    // Calculate overtime if provided
    const overtimePay = overtimeHours && overtimeRate
      ? this.calculateOvertimePay(basicSalary, overtimeHours, overtimeRate)
      : 0;

    const grossPay = basicSalary + allowance + overtimePay;
    
    // Calculate statutory deductions
    const statutoryDeductions = this.calculateStatutoryDeductions(grossPay);
    
    const totalDeductions = statutoryDeductions.total + otherDeductions;
    const netPay = grossPay - totalDeductions;

    return {
      basicSalary,
      allowance,
      grossPay,
      deductions: {
        paye: statutoryDeductions.paye,
        nhif: statutoryDeductions.nhif,
        nssf: statutoryDeductions.nssf,
        housingLevy: statutoryDeductions.housingLevy,
        otherDeductions,
      },
      netPay,
      paymentMethod: 'bank_transfer', // Default to bank transfer
      status: 'draft',
    };
  }

  /**
   * Validate payroll period
   */
  static validatePayrollPeriod(
    startDate: Date,
    endDate: Date
  ): { valid: boolean; error?: string } {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 1) {
      return { valid: false, error: "Payroll period must be at least 1 day" };
    }
    
    if (daysDiff > 365) {
      return { valid: false, error: "Payroll period cannot exceed 365 days" };
    }
    
    return { valid: true };
  }

  /**
   * Calculate payroll totals for reporting
   */
  static calculatePayrollTotals(payslips: Payslip[]): {
    totalEmployees: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    averageGrossPay: number;
    averageNetPay: number;
  } {
    const totalEmployees = payslips.length;
    const totalGrossPay = payslips.reduce((sum, slip) => sum + slip.grossPay, 0);
    const totalNetPay = payslips.reduce((sum, slip) => sum + slip.netPay, 0);
    const totalDeductions = payslips.reduce(
      (sum, slip) =>
        sum +
        slip.deductions.paye +
        slip.deductions.nhif +
        slip.deductions.nssf +
        slip.deductions.housingLevy +
        slip.deductions.otherDeductions,
      0
    );
    
    return {
      totalEmployees,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      averageGrossPay: totalEmployees > 0 ? totalGrossPay / totalEmployees : 0,
      averageNetPay: totalEmployees > 0 ? totalNetPay / totalEmployees : 0,
    };
  }

  /**
   * Get tax band for salary
   */
  static getTaxBand(salary: number): string {
    const rates = this.KENYA_PAYE_RATES_2024;
    
    if (salary <= rates.band1.max) return "Band 1";
    if (salary <= rates.band2.max) return "Band 2";
    if (salary <= rates.band3.max) return "Band 3";
    if (salary <= rates.band4.max) return "Band 4";
    return "Band 5";
  }

  /**
   * Check if employee is eligible for overtime
   */
  static isEligibleForOvertime(employee: Employee): boolean {
    return employee.employmentType === 'full_time' || employee.employmentType === 'part_time';
  }

  /**
   * Calculate monthly salary from annual
   */
  static calculateMonthlySalary(annualSalary: number): number {
    return annualSalary / 12;
  }

  /**
   * Calculate annual salary from monthly
   */
  static calculateAnnualSalary(monthlySalary: number): number {
    return monthlySalary * 12;
  }
}
