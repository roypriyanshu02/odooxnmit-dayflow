import type {
	Employee,
	EmployeeWithRelations,
	EmployeeFilter,
	EmployeeStatus,
	ProfileTabId,
	SkillTag,
	CertificationItem,
	WorkHistoryItem,
	EmployeeAbout,
	EmployeeResume,
	EmployeePrivateInfo,
	SalaryBreakdown,
	Department,
	EmployeeViewMode
} from '$lib/types/employee';
import type { ChatterEntry, ChatterType, UserRole } from '$lib/types';

/**
 * Prop interface for EmployeeCard component
 */
export interface EmployeeCardProps {
	employee: Employee | EmployeeWithRelations;
	viewMode?: EmployeeViewMode;
	isSelected?: boolean;
	showActions?: boolean;
	canEdit?: boolean;
	onSelect?: (employee: Employee | EmployeeWithRelations) => void;
	onEdit?: (employee: Employee | EmployeeWithRelations) => void;
	onDelete?: (employee: Employee | EmployeeWithRelations) => void;
	onStatusChange?: (employee: Employee | EmployeeWithRelations, status: EmployeeStatus) => void;
}

/**
 * Prop interface for EmployeeGrid component
 */
export interface EmployeeGridProps {
	employees: (Employee | EmployeeWithRelations)[];
	viewMode?: EmployeeViewMode;
	isLoading?: boolean;
	selectedId?: string | null;
	emptyMessage?: string;
	canEdit?: boolean;
	onSelect?: (employee: Employee | EmployeeWithRelations) => void;
	onEdit?: (employee: Employee | EmployeeWithRelations) => void;
	onDelete?: (employee: Employee | EmployeeWithRelations) => void;
}

/**
 * Prop interface for EmployeeFilters component
 */
export interface EmployeeFiltersProps {
	filters: EmployeeFilter;
	departments?: Department[];
	totalCount?: number;
	filteredCount?: number;
	isLoading?: boolean;
	onFilterChange: (filters: EmployeeFilter) => void;
	onReset?: () => void;
	onSearchInput?: (query: string) => void;
	onCreateNew?: () => void;
}

/**
 * Prop interface for Odoo-style Profile Header
 */
export interface ProfileHeaderProps {
	employee: EmployeeWithRelations;
	canEdit?: boolean;
	isHRorAdmin?: boolean;
	currentUserRole?: UserRole;
	onEditProfile?: () => void;
	onAvatarUpload?: (file: File) => Promise<void> | void;
	onStatusChange?: (newStatus: EmployeeStatus) => Promise<void> | void;
	onBack?: () => void;
}

/**
 * Prop interface for Profile Navigation Tabs
 */
export interface ProfileTabsProps {
	activeTab: ProfileTabId;
	canViewSalary?: boolean;
	canViewPrivateInfo?: boolean;
	onTabChange: (tabId: ProfileTabId) => void;
}

/**
 * Prop interface for About tab
 */
export interface AboutTabProps {
	about: EmployeeAbout;
	employee: Employee | EmployeeWithRelations;
	canEdit?: boolean;
	onSave?: (updatedAbout: Partial<EmployeeAbout>) => Promise<void> | void;
}

/**
 * Prop interface for Resume / Skills / Work History tab
 */
export interface ResumeTabProps {
	resume: EmployeeResume;
	employee: Employee | EmployeeWithRelations;
	canEdit?: boolean;
	onAddSkill?: (skill: string) => Promise<void> | void;
	onRemoveSkill?: (skillIndex: number) => Promise<void> | void;
	onAddCertification?: (cert: CertificationItem) => Promise<void> | void;
	onRemoveCertification?: (certIndex: number) => Promise<void> | void;
	onAddWorkHistory?: (work: WorkHistoryItem) => Promise<void> | void;
	onRemoveWorkHistory?: (workIndex: number) => Promise<void> | void;
	onSave?: (updatedResume: Partial<EmployeeResume>) => Promise<void> | void;
}

/**
 * Prop interface for Private Info tab
 */
export interface PrivateInfoTabProps {
	privateInfo: EmployeePrivateInfo;
	employee: Employee | EmployeeWithRelations;
	canEdit?: boolean;
	isHRorAdmin?: boolean;
	onSave?: (updatedPrivateInfo: Partial<EmployeePrivateInfo>) => Promise<void> | void;
}

/**
 * Prop interface for Salary Info tab
 */
export interface SalaryInfoTabProps {
	salary: SalaryBreakdown;
	monthlyWage: number;
	employee: Employee | EmployeeWithRelations;
	isHRorAdmin?: boolean;
	onUpdateWage?: (newMonthlyWage: number) => Promise<void> | void;
}

/**
 * Prop interface for Chatter feed component
 */
export interface ChatterFeedProps {
	entityType: 'employee' | 'leave' | 'payroll';
	entityId: string;
	entries: ChatterEntry[];
	currentUserId: string;
	currentUserName: string;
	currentUserAvatar?: string | null;
	isLoading?: boolean;
	onSendMessage: (
		message: string,
		type?: ChatterType,
		metadata?: Record<string, unknown>
	) => Promise<void> | void;
}

/**
 * Prop interface for Profile Edit Modal dialog
 */
export interface ProfileEditModalProps {
	isOpen: boolean;
	employee: Employee | EmployeeWithRelations;
	activeTab?: ProfileTabId;
	isHRorAdmin?: boolean;
	onClose: () => void;
	onSave: (updatedData: Partial<Employee>) => Promise<void> | void;
}

/**
 * Prop interface for Skill tags list component
 */
export interface SkillTagListProps {
	skills: (string | SkillTag)[];
	editable?: boolean;
	onRemove?: (skill: string) => void;
	onAdd?: (skill: string) => void;
}

/**
 * Prop interface for Certification list component
 */
export interface CertificationListProps {
	certifications: CertificationItem[];
	editable?: boolean;
	onAdd?: (cert: CertificationItem) => void;
	onRemove?: (index: number) => void;
}

/**
 * Prop interface for Work History timeline component
 */
export interface WorkHistoryTimelineProps {
	workHistory: WorkHistoryItem[];
	editable?: boolean;
	onAdd?: (work: WorkHistoryItem) => void;
	onRemove?: (index: number) => void;
}
