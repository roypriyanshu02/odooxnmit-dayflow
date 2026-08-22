import type { UserRole } from '$lib/types';

export interface UserProfile {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	roleTitle: string;
	initials: string;
	department: string;
	jobTitle: string;
	avatar?: string;
	employeeId?: string;
}

export const DEMO_USERS: UserProfile[] = [
	{
		id: 'demo-admin-01',
		name: 'Aarav Sharma',
		email: 'admin@dayflow.internal',
		role: 'admin',
		roleTitle: 'Admin',
		initials: 'AS',
		department: 'Executive',
		jobTitle: 'Chief Executive Officer & Admin',
		avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
	},
	{
		id: 'demo-hr-02',
		name: 'Priya Nair',
		email: 'hr@dayflow.internal',
		role: 'hr',
		roleTitle: 'HR Officer',
		initials: 'PN',
		department: 'Human Resources',
		jobTitle: 'Head of People & HR Operations',
		avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80'
	},
	{
		id: 'demo-emp-03',
		name: 'Rohan Verma',
		email: 'employee@dayflow.internal',
		role: 'employee',
		roleTitle: 'Employee',
		initials: 'RV',
		department: 'Engineering',
		jobTitle: 'Senior Full Stack Engineer',
		avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
	}
];

export function getInitials(name: string): string {
	if (!name) return 'DF';
	const parts = name.trim().split(/\s+/);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

export function getRoleTitle(role: UserRole): string {
	switch (role) {
		case 'admin':
			return 'Admin';
		case 'hr':
			return 'HR Officer';
		case 'employee':
		default:
			return 'Employee';
	}
}

class AuthState {
	currentUser = $state<UserProfile>(DEMO_USERS[0]);

	get user(): UserProfile {
		return this.currentUser;
	}

	get role(): UserRole {
		return this.currentUser.role;
	}

	get roleTitle(): string {
		return this.currentUser.roleTitle;
	}

	get isAdmin(): boolean {
		return this.currentUser.role === 'admin';
	}

	get isHR(): boolean {
		return this.currentUser.role === 'hr' || this.currentUser.role === 'admin';
	}

	get isEmployee(): boolean {
		return this.currentUser.role === 'employee';
	}

	syncWithServer(serverUser: {
		id: string;
		email: string;
		name: string;
		role: 'admin' | 'hr' | 'employee';
		employeeId?: string;
		department?: string;
		jobTitle?: string;
		avatarUrl?: string;
	} | null | undefined) {
		if (!serverUser) return;
		this.currentUser = {
			id: serverUser.id,
			name: serverUser.name,
			email: serverUser.email,
			role: serverUser.role,
			roleTitle: getRoleTitle(serverUser.role),
			initials: getInitials(serverUser.name),
			department: serverUser.department || 'Operations',
			jobTitle: serverUser.jobTitle || getRoleTitle(serverUser.role),
			avatar: serverUser.avatarUrl,
			employeeId: serverUser.employeeId
		};
	}

	switchUser(role: UserRole) {
		const target = DEMO_USERS.find((u) => u.role === role);
		if (target) {
			this.currentUser = target;
		}
	}

	setUser(user: UserProfile) {
		this.currentUser = user;
	}
}

export const auth = new AuthState();
export type DemoUser = UserProfile;
