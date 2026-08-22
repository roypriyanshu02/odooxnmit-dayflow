import type {
	SalaryBreakdown,
	SalaryEarnings,
	SalaryDeductions,
	PayslipCalculationInput,
	PayslipCalculationResult,
	PayrollBatchSummary
} from '$lib/types/payroll';

/**
 * Rounds a number to exactly two decimal places.
 */
export function roundToTwoDecimals(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Constant values defined by company payroll policy
 */
export const PAYROLL_CONSTANTS = {
	BASIC_PERCENTAGE: 0.5, // 50% of Monthly Wage
	HRA_PERCENTAGE_OF_BASIC: 0.5, // 50% of Basic Salary (25% of Monthly Wage)
	STANDARD_ALLOWANCE_FIXED: 4167, // Fixed ₹4,167
	PERFORMANCE_BONUS_PERCENTAGE_OF_BASIC: 0.0833, // 8.33% of Basic Salary
	LTA_PERCENTAGE_OF_BASIC: 0.0833, // 8.33% of Basic Salary
	EMPLOYEE_PF_PERCENTAGE_OF_BASIC: 0.12, // 12% of Basic Salary
	EMPLOYER_PF_PERCENTAGE_OF_BASIC: 0.12, // 12% of Basic Salary
	PROFESSIONAL_TAX_THRESHOLD: 15000, // monthlyWage > 15000 qualifies for PT
	PROFESSIONAL_TAX_AMOUNT: 200 // Fixed ₹200
} as const;

/**
 * Computes standard full-month formula-driven salary breakdown from monthly wage.
 *
 * Requirements:
 * - Basic Salary: 50% of monthlyWage
 * - House Rent Allowance (HRA): 50% of Basic Salary (25% of monthlyWage)
 * - Standard Allowance: Fixed ₹4,167
 * - Performance Bonus: 8.33% of Basic Salary
 * - Leave Travel Allowance (LTA): 8.33% of Basic Salary
 * - Fixed Allowance: Remaining balance (monthlyWage - Basic - HRA - Standard - Bonus - LTA), minimum 0
 * - Gross Salary = Basic + HRA + Standard + Bonus + LTA + Fixed Allowance
 * - Employee PF: 12% of Basic Salary
 * - Employer PF: 12% of Basic Salary
 * - Professional Tax (PT): ₹200 fixed (if monthlyWage > 15,000, else 0)
 * - Total Deductions = Employee PF + Professional Tax
 * - Net Salary = Gross Salary - Total Deductions
 * - Round all calculated components to 2 decimal places.
 */
export function calculateSalaryBreakdown(monthlyWage: number): SalaryBreakdown {
	const sanitizedWage = Math.max(0, Number(monthlyWage) || 0);

	if (sanitizedWage === 0) {
		return {
			monthlyWage: 0,
			basicSalary: 0,
			hra: 0,
			standardAllowance: 0,
			performanceBonus: 0,
			lta: 0,
			fixedAllowance: 0,
			grossSalary: 0,
			employeePf: 0,
			employerPf: 0,
			professionalTax: 0,
			totalDeductions: 0,
			netSalary: 0
		};
	}

	const basicSalary = roundToTwoDecimals(sanitizedWage * PAYROLL_CONSTANTS.BASIC_PERCENTAGE);
	const hra = roundToTwoDecimals(basicSalary * PAYROLL_CONSTANTS.HRA_PERCENTAGE_OF_BASIC);
	const standardAllowance = PAYROLL_CONSTANTS.STANDARD_ALLOWANCE_FIXED;
	const performanceBonus = roundToTwoDecimals(
		basicSalary * PAYROLL_CONSTANTS.PERFORMANCE_BONUS_PERCENTAGE_OF_BASIC
	);
	const lta = roundToTwoDecimals(basicSalary * PAYROLL_CONSTANTS.LTA_PERCENTAGE_OF_BASIC);

	// Fixed allowance: Remaining balance (monthlyWage - Basic - HRA - Standard - Bonus - LTA), minimum 0
	const sumPreFixed = basicSalary + hra + standardAllowance + performanceBonus + lta;
	const remainingBalance = sanitizedWage - sumPreFixed;
	const fixedAllowance = roundToTwoDecimals(Math.max(0, remainingBalance));

	// Gross salary is the sum of all earnings
	const grossSalary = roundToTwoDecimals(
		basicSalary + hra + standardAllowance + performanceBonus + lta + fixedAllowance
	);

	// Deductions
	const employeePf = roundToTwoDecimals(
		basicSalary * PAYROLL_CONSTANTS.EMPLOYEE_PF_PERCENTAGE_OF_BASIC
	);
	const employerPf = roundToTwoDecimals(
		basicSalary * PAYROLL_CONSTANTS.EMPLOYER_PF_PERCENTAGE_OF_BASIC
	);
	const professionalTax =
		sanitizedWage > PAYROLL_CONSTANTS.PROFESSIONAL_TAX_THRESHOLD
			? PAYROLL_CONSTANTS.PROFESSIONAL_TAX_AMOUNT
			: 0;

	const totalDeductions = roundToTwoDecimals(employeePf + professionalTax);
	const netSalary = roundToTwoDecimals(grossSalary - totalDeductions);

	return {
		monthlyWage: roundToTwoDecimals(sanitizedWage),
		basicSalary,
		hra,
		standardAllowance,
		performanceBonus,
		lta,
		fixedAllowance,
		grossSalary,
		employeePf,
		employerPf,
		professionalTax,
		totalDeductions,
		netSalary
	};
}

/**
 * Calculates a payslip with optional pro-rating for payable days vs total working days,
 * along with custom bonuses and deductions.
 */
export function calculatePayslip(input: PayslipCalculationInput): PayslipCalculationResult {
	const sanitizedWage = Math.max(0, Number(input.monthlyWage) || 0);
	const totalWorkingDays = input.totalWorkingDays !== undefined ? Math.max(0, input.totalWorkingDays) : 30;
	const payableDays =
		input.payableDays !== undefined ? Math.max(0, input.payableDays) : totalWorkingDays;
	const customDeductions = roundToTwoDecimals(Math.max(0, Number(input.customDeductions) || 0));
	const customBonuses = roundToTwoDecimals(Math.max(0, Number(input.customBonuses) || 0));
	const prorationMode = input.prorationMode || 'proRateComponents';

	if (sanitizedWage === 0 || totalWorkingDays === 0 || payableDays === 0) {
		const emptyEarnings: SalaryEarnings = {
			basicSalary: 0,
			hra: 0,
			standardAllowance: 0,
			performanceBonus: 0,
			lta: 0,
			fixedAllowance: 0,
			grossSalary: customBonuses
		};
		const emptyDeductions: SalaryDeductions = {
			employeePf: 0,
			employerPf: 0,
			professionalTax: 0,
			totalDeductions: customDeductions
		};

		return {
			monthlyWage: roundToTwoDecimals(sanitizedWage),
			payableDays,
			totalWorkingDays,
			prorationRatio: 0,
			customDeductions,
			customBonuses,
			basicSalary: 0,
			hra: 0,
			standardAllowance: 0,
			performanceBonus: 0,
			lta: 0,
			fixedAllowance: 0,
			grossSalary: customBonuses,
			employeePf: 0,
			employerPf: 0,
			professionalTax: 0,
			totalDeductions: customDeductions,
			netSalary: roundToTwoDecimals(customBonuses - customDeductions),
			earnings: emptyEarnings,
			deductions: emptyDeductions
		};
	}

	const prorationRatio = payableDays / totalWorkingDays;

	if (prorationMode === 'proRateWage' && prorationRatio !== 1) {
		const proRatedWage = roundToTwoDecimals(sanitizedWage * prorationRatio);
		const breakdown = calculateSalaryBreakdown(proRatedWage);
		const grossSalary = roundToTwoDecimals(breakdown.grossSalary + customBonuses);
		const totalDeductions = roundToTwoDecimals(breakdown.totalDeductions + customDeductions);
		const netSalary = roundToTwoDecimals(grossSalary - totalDeductions);

		const earnings: SalaryEarnings = {
			basicSalary: breakdown.basicSalary,
			hra: breakdown.hra,
			standardAllowance: breakdown.standardAllowance,
			performanceBonus: breakdown.performanceBonus,
			lta: breakdown.lta,
			fixedAllowance: breakdown.fixedAllowance,
			grossSalary
		};

		const deductions: SalaryDeductions = {
			employeePf: breakdown.employeePf,
			employerPf: breakdown.employerPf,
			professionalTax: breakdown.professionalTax,
			totalDeductions
		};

		return {
			monthlyWage: roundToTwoDecimals(sanitizedWage),
			payableDays,
			totalWorkingDays,
			prorationRatio: roundToTwoDecimals(prorationRatio),
			customDeductions,
			customBonuses,
			basicSalary: breakdown.basicSalary,
			hra: breakdown.hra,
			standardAllowance: breakdown.standardAllowance,
			performanceBonus: breakdown.performanceBonus,
			lta: breakdown.lta,
			fixedAllowance: breakdown.fixedAllowance,
			grossSalary,
			employeePf: breakdown.employeePf,
			employerPf: breakdown.employerPf,
			professionalTax: breakdown.professionalTax,
			totalDeductions,
			netSalary,
			earnings,
			deductions
		};
	}

	// Default: Pro-rate individual earnings components
	const full = calculateSalaryBreakdown(sanitizedWage);

	const basicSalary = roundToTwoDecimals(full.basicSalary * prorationRatio);
	const hra = roundToTwoDecimals(full.hra * prorationRatio);
	const standardAllowance = roundToTwoDecimals(full.standardAllowance * prorationRatio);
	const performanceBonus = roundToTwoDecimals(full.performanceBonus * prorationRatio);
	const lta = roundToTwoDecimals(full.lta * prorationRatio);
	const fixedAllowance = roundToTwoDecimals(full.fixedAllowance * prorationRatio);

	const grossSalary = roundToTwoDecimals(
		basicSalary + hra + standardAllowance + performanceBonus + lta + fixedAllowance + customBonuses
	);

	const employeePf = roundToTwoDecimals(
		basicSalary * PAYROLL_CONSTANTS.EMPLOYEE_PF_PERCENTAGE_OF_BASIC
	);
	const employerPf = roundToTwoDecimals(
		basicSalary * PAYROLL_CONSTANTS.EMPLOYER_PF_PERCENTAGE_OF_BASIC
	);

	const professionalTax =
		sanitizedWage > PAYROLL_CONSTANTS.PROFESSIONAL_TAX_THRESHOLD && grossSalary > 0
			? PAYROLL_CONSTANTS.PROFESSIONAL_TAX_AMOUNT
			: 0;

	const totalDeductions = roundToTwoDecimals(employeePf + professionalTax + customDeductions);
	const netSalary = roundToTwoDecimals(grossSalary - totalDeductions);

	const earnings: SalaryEarnings = {
		basicSalary,
		hra,
		standardAllowance,
		performanceBonus,
		lta,
		fixedAllowance,
		grossSalary
	};

	const deductions: SalaryDeductions = {
		employeePf,
		employerPf,
		professionalTax,
		totalDeductions
	};

	return {
		monthlyWage: roundToTwoDecimals(sanitizedWage),
		payableDays,
		totalWorkingDays,
		prorationRatio: roundToTwoDecimals(prorationRatio),
		customDeductions,
		customBonuses,
		basicSalary,
		hra,
		standardAllowance,
		performanceBonus,
		lta,
		fixedAllowance,
		grossSalary,
		employeePf,
		employerPf,
		professionalTax,
		totalDeductions,
		netSalary,
		earnings,
		deductions
	};
}

/**
 * Calculates annual salary breakdown and Total CTC.
 * Annual CTC = Annual Gross + Annual Employer PF
 */
export function calculateAnnualSalary(monthlyWage: number) {
	const monthly = calculateSalaryBreakdown(monthlyWage);
	const annualBasic = roundToTwoDecimals(monthly.basicSalary * 12);
	const annualHra = roundToTwoDecimals(monthly.hra * 12);
	const annualStandard = roundToTwoDecimals(monthly.standardAllowance * 12);
	const annualBonus = roundToTwoDecimals(monthly.performanceBonus * 12);
	const annualLta = roundToTwoDecimals(monthly.lta * 12);
	const annualFixed = roundToTwoDecimals(monthly.fixedAllowance * 12);
	const annualGross = roundToTwoDecimals(monthly.grossSalary * 12);
	const annualEmployeePf = roundToTwoDecimals(monthly.employeePf * 12);
	const annualEmployerPf = roundToTwoDecimals(monthly.employerPf * 12);
	const annualPt = roundToTwoDecimals(monthly.professionalTax * 12);
	const annualTotalDeductions = roundToTwoDecimals(monthly.totalDeductions * 12);
	const annualNet = roundToTwoDecimals(monthly.netSalary * 12);
	const annualCtc = roundToTwoDecimals(annualGross + annualEmployerPf);

	return {
		monthly,
		annual: {
			monthlyWage: roundToTwoDecimals(monthlyWage * 12),
			basicSalary: annualBasic,
			hra: annualHra,
			standardAllowance: annualStandard,
			performanceBonus: annualBonus,
			lta: annualLta,
			fixedAllowance: annualFixed,
			grossSalary: annualGross,
			employeePf: annualEmployeePf,
			employerPf: annualEmployerPf,
			professionalTax: annualPt,
			totalDeductions: annualTotalDeductions,
			netSalary: annualNet,
			ctc: annualCtc
		}
	};
}

/**
 * Computes batch summary across multiple employee wage records.
 */
export function calculateBatchSummary(
	records: Array<{
		monthlyWage: number;
		payableDays?: number;
		totalWorkingDays?: number;
	}>,
	month: number,
	year: number
): PayrollBatchSummary {
	let totalGrossSalary = 0;
	let totalNetSalary = 0;
	let totalEmployerPf = 0;
	let totalEmployeePf = 0;
	let totalProfessionalTax = 0;
	let totalDeductions = 0;

	for (const record of records) {
		const payslip = calculatePayslip(record);
		totalGrossSalary += payslip.grossSalary;
		totalNetSalary += payslip.netSalary;
		totalEmployerPf += payslip.employerPf;
		totalEmployeePf += payslip.employeePf;
		totalProfessionalTax += payslip.professionalTax;
		totalDeductions += payslip.totalDeductions;
	}

	return {
		month,
		year,
		processedCount: records.length,
		totalGrossSalary: roundToTwoDecimals(totalGrossSalary),
		totalNetSalary: roundToTwoDecimals(totalNetSalary),
		totalEmployerPf: roundToTwoDecimals(totalEmployerPf),
		totalEmployeePf: roundToTwoDecimals(totalEmployeePf),
		totalProfessionalTax: roundToTwoDecimals(totalProfessionalTax),
		totalDeductions: roundToTwoDecimals(totalDeductions)
	};
}

/**
 * Formats a currency amount into Indian Rupee format (e.g. ₹50,000.00).
 */
export function formatCurrencyINR(amount: number): string {
	const val = Number(amount) || 0;
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(val);
}
