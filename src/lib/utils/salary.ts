import type { SalaryBreakdown } from '$lib/types';

/**
 * Calculates standard Dayflow HRMS salary breakdown from a monthly wage.
 * 
 * Formula:
 * - Basic Salary: 50% of Monthly Wage
 * - House Rent Allowance (HRA): 50% of Basic Salary
 * - Standard Allowance: Fixed ₹4,167
 * - Performance Bonus: 8.33% of Basic Salary
 * - Leave Travel Allowance (LTA): 8.33% of Basic Salary
 * - Fixed Allowance: Remaining balance (Monthly Wage - sum of above earnings)
 * - Gross Salary: Sum of all earnings components
 * - Employee PF: 12% of Basic Salary
 * - Employer PF: 12% of Basic Salary
 * - Professional Tax (PT): Fixed ₹200
 * - Total Deductions: Employee PF + Professional Tax
 * - Net Salary: Gross Salary - Total Deductions
 */
export function calculateSalaryBreakdown(monthlyWage: number): SalaryBreakdown {
	const wage = Math.max(0, monthlyWage || 0);
	const basicSalary = Math.round(wage * 0.5);
	const hra = Math.round(basicSalary * 0.5);
	const standardAllowance = wage > 0 ? 4167 : 0;
	const performanceBonus = Math.round(basicSalary * 0.0833);
	const lta = Math.round(basicSalary * 0.0833);
	
	const allocatedEarnings = basicSalary + hra + standardAllowance + performanceBonus + lta;
	const fixedAllowance = Math.max(0, wage - allocatedEarnings);
	
	const grossSalary = basicSalary + hra + standardAllowance + performanceBonus + lta + fixedAllowance;
	const employeePf = Math.round(basicSalary * 0.12);
	const employerPf = Math.round(basicSalary * 0.12);
	const professionalTax = wage > 0 ? 200 : 0;
	const totalDeductions = employeePf + professionalTax;
	const netSalary = grossSalary - totalDeductions;

	return {
		monthlyWage: wage,
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

export function formatINR(amount: number): string {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	}).format(amount);
}
