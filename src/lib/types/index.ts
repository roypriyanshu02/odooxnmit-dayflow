export type UserRole = 'admin' | 'hr' | 'employee';

export interface User {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
}

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';

export interface Certification {
	name: string;
	issuer: string;
	year: number | string;
}

export interface WorkHistory {
	company: string;
	role: string;
	duration: string;
	description?: string;
}

export interface EmployeeAbout {
	bio: string;
	passions: string;
	hobbies: string;
}

export interface EmployeeResume {
	skills: string[];
	certifications: Certification[];
	workHistory: WorkHistory[];
}

export interface EmployeePrivateInfo {
	panNumber: string;
	uanNumber: string;
	dob: string;
	gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
	maritalStatus: 'single' | 'married' | 'other';
	address: string;
	bankAccountNumber: string;
	bankIfsc: string;
	bankName: string;
}

export interface SalaryBreakdown {
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
}

export interface Employee {
	id: string; // Dynamic ID format: OIJODO20250001
	userId: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	jobTitle: string;
	department: string;
	managerId?: string | null;
	avatarUrl?: string | null;
	status: EmployeeStatus;
	joinDate: string;
	about: EmployeeAbout;
	resume: EmployeeResume;
	privateInfo: EmployeePrivateInfo;
	monthlyWage: number;
	createdAt: string;
	updatedAt: string;
}

export * from './attendance';

export * from './leaves';

export type PayslipStatus = 'draft' | 'processed' | 'paid';

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

export type ChatterType = 'note' | 'status_change' | 'field_update';

export interface ChatterEntry {
	id: string;
	entityType: 'employee' | 'leave' | 'payroll';
	entityId: string;
	authorId: string;
	authorName: string;
	authorAvatar?: string | null;
	message: string;
	type: ChatterType;
	metadata?: Record<string, unknown> | null;
	createdAt: string;
}

export interface HRAnalyticsSummary {
	totalEmployees: number;
	activeEmployees: number;
	presentToday: number;
	onLeaveToday: number;
	absentToday: number;
	pendingLeaveRequests: number;
	monthlyPayrollCost: number;
	departmentDistribution: Record<string, number>;
}
