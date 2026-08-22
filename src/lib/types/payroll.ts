export type PayslipStatus = 'draft' | 'processed' | 'paid';

export interface SalaryEarnings {
	basicSalary: number;
	hra: number;
	standardAllowance: number;
	performanceBonus: number;
	lta: number;
	fixedAllowance: number;
	grossSalary: number;
}

export interface SalaryDeductions {
	employeePf: number;
	employerPf: number;
	professionalTax: number;
	totalDeductions: number;
}

export interface SalaryBreakdown extends SalaryEarnings, SalaryDeductions {
	monthlyWage: number;
	netSalary: number;
}

export interface PayslipCalculationInput {
	monthlyWage: number;
	payableDays?: number;
	totalWorkingDays?: number;
	customDeductions?: number;
	customBonuses?: number;
	prorationMode?: 'proRateComponents' | 'proRateWage';
}

export interface PayslipCalculationResult extends SalaryBreakdown {
	payableDays: number;
	totalWorkingDays: number;
	prorationRatio: number;
	customDeductions: number;
	customBonuses: number;
	earnings: SalaryEarnings;
	deductions: SalaryDeductions;
}

export interface Payslip {
	id: string;
	employeeId: string;
	month: number;
	year: number;
	monthlyWage: number;
	basicSalary: number;
	hra: number;
	standardAllowance: number;
	performanceBonus: number;
	lta: number;
	fixedAllowance: number;
	grossSalary: number;
	employeePf: number;
	employerPf: number;
	professionalTax: number;
	totalDeductions: number;
	netSalary: number;
	payableDays: number;
	totalWorkingDays: number;
	status: PayslipStatus;
	paymentDate?: string | null;
	createdAt: string;
	updatedAt: string;
}

export type MonthlyPayrollRunStatus = 'draft' | 'processing' | 'completed';

export interface MonthlyPayrollRun {
	id: string;
	month: number;
	year: number;
	totalEmployees: number;
	totalGross: number;
	totalNet: number;
	totalDeductions: number;
	status: MonthlyPayrollRunStatus;
	processedAt?: string | null;
	createdAt: string;
}

export interface BatchPayrollProcessRequest {
	month: number;
	year: number;
	employeeIds?: string[];
	forceRecalculate?: boolean;
}

export interface PayrollBatchSummary {
	month: number;
	year: number;
	processedCount: number;
	totalGrossSalary: number;
	totalNetSalary: number;
	totalEmployerPf: number;
	totalEmployeePf: number;
	totalProfessionalTax: number;
	totalDeductions: number;
}
