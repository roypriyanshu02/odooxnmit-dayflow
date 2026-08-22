import { describe, it, expect } from 'bun:test';
import {
	calculateSalaryBreakdown,
	calculatePayslip,
	calculateAnnualSalary,
	calculateBatchSummary,
	formatCurrencyINR,
	roundToTwoDecimals,
	PAYROLL_CONSTANTS
} from './calculator';

describe('Payroll Calculator Engine', () => {
	describe('Standard Salary Breakdown Formula', () => {
		it('calculates exact breakdown for ₹50,000 monthly wage', () => {
			const result = calculateSalaryBreakdown(50000);

			// Basic: 50% of 50,000 = 25,000
			expect(result.basicSalary).toBe(25000);
			// HRA: 50% of Basic (25% of wage) = 12,500
			expect(result.hra).toBe(12500);
			// Standard Allowance: Fixed ₹4,167
			expect(result.standardAllowance).toBe(4167);
			// Performance Bonus: 8.33% of Basic = 25000 * 0.0833 = 2,082.50
			expect(result.performanceBonus).toBe(2082.5);
			// LTA: 8.33% of Basic = 25000 * 0.0833 = 2,082.50
			expect(result.lta).toBe(2082.5);
			// Fixed Allowance: 50,000 - (25000 + 12500 + 4167 + 2082.5 + 2082.5) = 4,168
			expect(result.fixedAllowance).toBe(4168);
			// Gross Salary: Sum of all earnings = 50,000
			expect(result.grossSalary).toBe(50000);

			// Employee PF: 12% of Basic = 3,000
			expect(result.employeePf).toBe(3000);
			// Employer PF: 12% of Basic = 3,000
			expect(result.employerPf).toBe(3000);
			// Professional Tax: ₹200 (since wage > 15,000)
			expect(result.professionalTax).toBe(200);

			// Total Deductions = Employee PF + PT = 3,200
			expect(result.totalDeductions).toBe(3200);
			// Net Salary = Gross - Total Deductions = 46,800
			expect(result.netSalary).toBe(46800);
		});

		it('calculates exact breakdown for ₹1,20,000 monthly wage', () => {
			const result = calculateSalaryBreakdown(120000);

			// Basic: 50% of 120,000 = 60,000
			expect(result.basicSalary).toBe(60000);
			// HRA: 50% of Basic = 30,000
			expect(result.hra).toBe(30000);
			// Standard Allowance: 4,167
			expect(result.standardAllowance).toBe(4167);
			// Performance Bonus: 60000 * 0.0833 = 4,998
			expect(result.performanceBonus).toBe(4998);
			// LTA: 60000 * 0.0833 = 4,998
			expect(result.lta).toBe(4998);
			// Fixed Allowance: 120,000 - (60000 + 30000 + 4167 + 4998 + 4998) = 15,837
			expect(result.fixedAllowance).toBe(15837);
			// Gross Salary = 120,000
			expect(result.grossSalary).toBe(120000);

			// PF: 60000 * 0.12 = 7,200
			expect(result.employeePf).toBe(7200);
			expect(result.employerPf).toBe(7200);
			// PT: 200
			expect(result.professionalTax).toBe(200);
			// Deductions: 7200 + 200 = 7,400
			expect(result.totalDeductions).toBe(7400);
			// Net: 120,000 - 7,400 = 112,600
			expect(result.netSalary).toBe(112600);
		});

		it('calculates exact breakdown for ₹2,50,000 monthly wage', () => {
			const result = calculateSalaryBreakdown(250000);

			// Basic: 50% of 250,000 = 125,000
			expect(result.basicSalary).toBe(125000);
			// HRA: 50% of 125,000 = 62,500
			expect(result.hra).toBe(62500);
			// Standard Allowance: 4,167
			expect(result.standardAllowance).toBe(4167);
			// Performance Bonus: 125000 * 0.0833 = 10,412.50
			expect(result.performanceBonus).toBe(10412.5);
			// LTA: 125000 * 0.0833 = 10,412.50
			expect(result.lta).toBe(10412.5);
			// Fixed Allowance: 250000 - 212492 = 37,508
			expect(result.fixedAllowance).toBe(37508);
			// Gross Salary = 250,000
			expect(result.grossSalary).toBe(250000);

			// Employee PF = 125000 * 0.12 = 15,000
			expect(result.employeePf).toBe(15000);
			expect(result.employerPf).toBe(15000);
			// PT = 200
			expect(result.professionalTax).toBe(200);
			// Total Deductions = 15,200
			expect(result.totalDeductions).toBe(15200);
			// Net Salary = 234,800
			expect(result.netSalary).toBe(234800);
		});

		it('handles wage below professional tax threshold (₹15,000)', () => {
			const result = calculateSalaryBreakdown(12000);

			expect(result.basicSalary).toBe(6000);
			expect(result.hra).toBe(3000);
			expect(result.standardAllowance).toBe(4167);
			expect(result.performanceBonus).toBe(499.8);
			expect(result.lta).toBe(499.8);
			expect(result.fixedAllowance).toBe(0); // Minimum 0 clamp
			expect(result.grossSalary).toBe(14166.6);

			// PT should be 0 because wage <= 15000
			expect(result.professionalTax).toBe(0);
			expect(result.employeePf).toBe(720);
			expect(result.totalDeductions).toBe(720);
			expect(result.netSalary).toBe(13446.6);
		});

		it('handles edge case of 0 monthly wage', () => {
			const result = calculateSalaryBreakdown(0);

			expect(result.monthlyWage).toBe(0);
			expect(result.basicSalary).toBe(0);
			expect(result.hra).toBe(0);
			expect(result.standardAllowance).toBe(0);
			expect(result.grossSalary).toBe(0);
			expect(result.totalDeductions).toBe(0);
			expect(result.netSalary).toBe(0);
		});

		it('handles negative or invalid monthly wage gracefully', () => {
			const result = calculateSalaryBreakdown(-5000);
			expect(result.monthlyWage).toBe(0);
			expect(result.grossSalary).toBe(0);
			expect(result.netSalary).toBe(0);
		});
	});

	describe('Pro-Rated Payslip Calculation', () => {
		it('calculates pro-rated payslip for 15 payable days out of 30', () => {
			const result = calculatePayslip({
				monthlyWage: 50000,
				payableDays: 15,
				totalWorkingDays: 30
			});

			expect(result.payableDays).toBe(15);
			expect(result.totalWorkingDays).toBe(30);
			expect(result.prorationRatio).toBe(0.5);

			// Components pro-rated by 50%
			expect(result.basicSalary).toBe(12500);
			expect(result.hra).toBe(6250);
			expect(result.standardAllowance).toBe(2083.5);
			expect(result.performanceBonus).toBe(1041.25);
			expect(result.lta).toBe(1041.25);
			expect(result.fixedAllowance).toBe(2084);
			expect(result.grossSalary).toBe(25000);

			// PF is 12% of pro-rated basic = 12500 * 0.12 = 1,500
			expect(result.employeePf).toBe(1500);
			expect(result.employerPf).toBe(1500);
			// PT = 200 (since monthlyWage > 15000)
			expect(result.professionalTax).toBe(200);
			expect(result.totalDeductions).toBe(1700);
			expect(result.netSalary).toBe(23300);
		});

		it('handles full attendance (payableDays = totalWorkingDays)', () => {
			const result = calculatePayslip({
				monthlyWage: 120000,
				payableDays: 31,
				totalWorkingDays: 31
			});

			expect(result.prorationRatio).toBe(1);
			expect(result.grossSalary).toBe(120000);
			expect(result.netSalary).toBe(112600);
		});

		it('applies custom bonuses and custom deductions correctly', () => {
			const result = calculatePayslip({
				monthlyWage: 50000,
				payableDays: 30,
				totalWorkingDays: 30,
				customBonuses: 5000,
				customDeductions: 1000
			});

			// Gross includes 5,000 custom bonus
			expect(result.grossSalary).toBe(55000);
			// Deductions: 3000 (PF) + 200 (PT) + 1000 (Custom) = 4,200
			expect(result.totalDeductions).toBe(4200);
			// Net: 55000 - 4200 = 50,800
			expect(result.netSalary).toBe(50800);
			expect(result.customBonuses).toBe(5000);
			expect(result.customDeductions).toBe(1000);
		});

		it('supports proRateWage mode', () => {
			const result = calculatePayslip({
				monthlyWage: 60000,
				payableDays: 15,
				totalWorkingDays: 30,
				prorationMode: 'proRateWage'
			});

			// Effective wage: 30,000
			expect(result.basicSalary).toBe(15000);
			expect(result.hra).toBe(7500);
			expect(result.standardAllowance).toBe(4167);
			expect(result.grossSalary).toBe(30000);
			expect(result.employeePf).toBe(1800);
			expect(result.professionalTax).toBe(200);
			expect(result.totalDeductions).toBe(2000);
			expect(result.netSalary).toBe(28000);
		});

		it('handles 0 payable days safely', () => {
			const result = calculatePayslip({
				monthlyWage: 50000,
				payableDays: 0,
				totalWorkingDays: 30
			});

			expect(result.payableDays).toBe(0);
			expect(result.grossSalary).toBe(0);
			expect(result.employeePf).toBe(0);
			expect(result.netSalary).toBe(0);
		});
	});

	describe('Annual Salary & CTC Breakdown', () => {
		it('computes annual breakdown and CTC including employer PF contribution', () => {
			const result = calculateAnnualSalary(50000);

			expect(result.annual.monthlyWage).toBe(600000);
			expect(result.annual.basicSalary).toBe(300000);
			expect(result.annual.hra).toBe(150000);
			expect(result.annual.standardAllowance).toBe(50004);
			expect(result.annual.grossSalary).toBe(600000);
			expect(result.annual.employeePf).toBe(36000);
			expect(result.annual.employerPf).toBe(36000);
			expect(result.annual.professionalTax).toBe(2400);
			expect(result.annual.totalDeductions).toBe(38400);
			expect(result.annual.netSalary).toBe(561600);

			// Annual CTC = Annual Gross (600,000) + Annual Employer PF (36,000) = 636,000
			expect(result.annual.ctc).toBe(636000);
		});
	});

	describe('Batch Payroll Summary', () => {
		it('aggregates payroll metrics across multiple employees', () => {
			const employees = [
				{ monthlyWage: 50000, payableDays: 30, totalWorkingDays: 30 },
				{ monthlyWage: 120000, payableDays: 30, totalWorkingDays: 30 },
				{ monthlyWage: 250000, payableDays: 30, totalWorkingDays: 30 }
			];

			const summary = calculateBatchSummary(employees, 8, 2026);

			expect(summary.month).toBe(8);
			expect(summary.year).toBe(2026);
			expect(summary.processedCount).toBe(3);
			// Total Gross = 50,000 + 120,000 + 250,000 = 420,000
			expect(summary.totalGrossSalary).toBe(420000);
			// Total Net = 46,800 + 112,600 + 234,800 = 394,200
			expect(summary.totalNetSalary).toBe(394200);
			// Total Deductions = 3,200 + 7,400 + 15,200 = 25,800
			expect(summary.totalDeductions).toBe(25800);
			// Total Employer PF = 3,000 + 7,200 + 15,000 = 25,200
			expect(summary.totalEmployerPf).toBe(25200);
			// Total Employee PF = 3,000 + 7,200 + 15,000 = 25,200
			expect(summary.totalEmployeePf).toBe(25200);
			// Total PT = 200 + 200 + 200 = 600
			expect(summary.totalProfessionalTax).toBe(600);
		});
	});

	describe('Utilities & Formatting', () => {
		it('rounds numbers to 2 decimal places properly', () => {
			expect(roundToTwoDecimals(123.456)).toBe(123.46);
			expect(roundToTwoDecimals(123.454)).toBe(123.45);
			expect(roundToTwoDecimals(100)).toBe(100);
		});

		it('formats INR currency strings with symbol', () => {
			const formatted = formatCurrencyINR(50000);
			expect(formatted).toContain('50,000.00');
			expect(formatted).toMatch(/₹|INR/);
		});
	});
});
