import type {
	User,
	UserRole,
	AttendanceRecord,
	AttendanceDisplayStatus,
	LeaveBalance,
	LeaveRequest,
	Payslip,
	ChatterEntry
} from './index';

export type { AttendanceDisplayStatus };

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';

export const DEPARTMENTS = [
	'Engineering',
	'Product',
	'Design',
	'Marketing',
	'Sales',
	'Human Resources',
	'Finance',
	'Legal',
	'Operations',
	'Customer Support'
] as const;

export type Department = (typeof DEPARTMENTS)[number] | string;

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type MaritalStatus = 'single' | 'married' | 'other';

export type ProfileTabId = 'about' | 'resume' | 'private_info' | 'salary_info';

export interface TabConfig {
	id: ProfileTabId;
	label: string;
	icon?: string;
	badge?: string | number;
	restrictedToRoles?: UserRole[];
}

export interface SkillTag {
	id?: string;
	name: string;
	level?: 'beginner' | 'intermediate' | 'expert' | 'master';
	category?: string;
	yearsOfExperience?: number;
}

export interface CertificationItem {
	id?: string;
	name: string;
	issuer: string;
	year: number | string;
	issueDate?: string;
	expiryDate?: string;
	credentialId?: string;
	credentialUrl?: string;
}

// Alias for database schema / backward compatibility
export type Certification = CertificationItem;

export interface WorkHistoryItem {
	id?: string;
	company: string;
	role: string;
	duration: string;
	startDate?: string;
	endDate?: string;
	isCurrent?: boolean;
	location?: string;
	description?: string;
	technologies?: string[];
}

// Alias for database schema / backward compatibility
export type WorkHistory = WorkHistoryItem;

export interface EmployeeAbout {
	bio: string;
	passions: string;
	hobbies: string;
}

export interface EmployeeResume {
	skills: string[];
	certifications: CertificationItem[];
	workHistory: WorkHistoryItem[];
}

export interface EmployeePrivateInfo {
	panNumber: string;
	uanNumber: string;
	dob: string;
	gender: Gender;
	maritalStatus: MaritalStatus;
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
	skillsList?: SkillTag[];
	certificationsList?: CertificationItem[];
	workHistoryList?: WorkHistoryItem[];
	createdAt: string;
	updatedAt: string;
}

export interface EmployeeWithRelations extends Employee {
	user?: User | null;
	manager?: Employee | null;
	subordinates?: Employee[];
	leaveBalances?: LeaveBalance[];
	recentLeaves?: LeaveRequest[];
	latestPayslip?: Payslip | null;
	attendanceToday?: AttendanceRecord | null;
	attendanceStatus?: AttendanceDisplayStatus;
	chatterEntries?: ChatterEntry[];
}

export type EmployeeSortField =
	| 'name'
	| 'department'
	| 'jobTitle'
	| 'joinDate'
	| 'status'
	| 'monthlyWage'
	| 'createdAt';

export type SortDirection = 'asc' | 'desc';

export interface EmployeeSortOption {
	field: EmployeeSortField;
	direction: SortDirection;
	label?: string;
}

export type EmployeeViewMode = 'grid' | 'list' | 'kanban';

export interface EmployeeFilter {
	search?: string;
	department?: Department | 'all';
	status?: EmployeeStatus | 'all';
	role?: UserRole | 'all';
	managerId?: string | 'all';
	skills?: string[];
	viewMode?: EmployeeViewMode;
	page?: number;
	limit?: number;
	sortBy?: EmployeeSortField;
	sortOrder?: SortDirection;
}

export interface EmployeeFilterState extends EmployeeFilter {
	search: string;
	department: Department | 'all';
	status: EmployeeStatus | 'all';
	viewMode: EmployeeViewMode;
	page: number;
	limit: number;
	sortBy: EmployeeSortField;
	sortOrder: SortDirection;
}

export interface CreateEmployeeInput {
	firstName: string;
	lastName: string;
	email: string;
	password?: string;
	role?: UserRole;
	phone?: string;
	jobTitle: string;
	department: Department;
	managerId?: string | null;
	avatarUrl?: string | null;
	status?: EmployeeStatus;
	joinDate?: string;
	about?: Partial<EmployeeAbout>;
	resume?: {
		skills?: string[];
		certifications?: CertificationItem[];
		workHistory?: WorkHistoryItem[];
	};
	privateInfo?: Partial<EmployeePrivateInfo>;
	monthlyWage?: number;
}

export interface UpdateEmployeeInput {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	jobTitle?: string;
	department?: Department;
	managerId?: string | null;
	avatarUrl?: string | null;
	status?: EmployeeStatus;
	joinDate?: string;
	about?: Partial<EmployeeAbout>;
	resume?: {
		skills?: string[];
		certifications?: CertificationItem[];
		workHistory?: WorkHistoryItem[];
	};
	privateInfo?: Partial<EmployeePrivateInfo>;
	monthlyWage?: number;
}

export interface EmployeeStatsSummary {
	totalCount: number;
	activeCount: number;
	onLeaveCount: number;
	inactiveCount: number;
	departmentCounts: Record<string, number>;
}
