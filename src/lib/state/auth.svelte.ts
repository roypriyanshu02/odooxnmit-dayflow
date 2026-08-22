import type { UserRole } from '$lib/types';

export interface DemoUser {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	roleTitle: string;
	initials: string;
	department: string;
	jobTitle: string;
	avatar?: string;
}

export const DEMO_USERS: DemoUser[] = [
	{
		id: 'demo-admin-01',
		name: 'Priyanshu Roy',
		email: 'admin@dayflow.internal',
		role: 'admin',
		roleTitle: 'Admin',
		initials: 'PR',
		department: 'Executive & Systems',
		jobTitle: 'System Administrator & Lead',
		avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
	},
	{
		id: 'demo-hr-02',
		name: 'Arnav Kini',
		email: 'hr@dayflow.internal',
		role: 'hr',
		roleTitle: 'HR Officer',
		initials: 'AK',
		department: 'Human Resources',
		jobTitle: 'HR Operations Lead',
		avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
	},
	{
		id: 'demo-emp-03',
		name: 'Sanchit Kumar Pandey',
		email: 'employee@dayflow.internal',
		role: 'employee',
		roleTitle: 'Employee',
		initials: 'SK',
		department: 'Engineering',
		jobTitle: 'Senior Full Stack Engineer',
		avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
	}
];

class AuthState {
	currentUser = $state<DemoUser>(DEMO_USERS[0]);

	get user(): DemoUser {
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

	switchUser(role: UserRole) {
		const target = DEMO_USERS.find((u) => u.role === role);
		if (target) {
			this.currentUser = target;
		}
	}

	setUser(user: DemoUser) {
		this.currentUser = user;
	}
}

export const auth = new AuthState();
