import { describe, it, expect, beforeEach } from 'bun:test';
import { actions } from './+page.server';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { seedDatabase } from '$lib/server/db/seed';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

describe('Login Server Actions', () => {
	beforeEach(async () => {
		await seedDatabase();
	});

	it('should successfully log in via default action with valid credentials', async () => {
		const cookiesStore: Record<string, { value: string; options: any }> = {};
		const cookies: any = {
			set: (name: string, value: string, options: any) => {
				cookiesStore[name] = { value, options };
			},
			get: (name: string) => cookiesStore[name]?.value,
			delete: (name: string) => {
				delete cookiesStore[name];
			}
		};

		const formData = new FormData();
		formData.append('email', 'admin@dayflow.internal');
		formData.append('password', 'Dayflow@2026');

		const request = new Request('http://localhost:5173/login', {
			method: 'POST',
			body: formData
		});

		try {
			await actions.login({ request, cookies } as any);
			expect(true).toBe(false); // Should have thrown redirect
		} catch (err: any) {
			// SvelteKit redirect throws an error with status and location
			expect(err.status).toBe(303);
			expect(err.location).toBe('/dashboard');
		}

		expect(cookiesStore[SESSION_COOKIE_NAME]).toBeDefined();
		const sessionId = cookiesStore[SESSION_COOKIE_NAME].value;
		expect(sessionId).toBeTruthy();

		const validation = await validateSession(sessionId);
		expect(validation).not.toBeNull();
		expect(validation?.user.email).toBe('admin@dayflow.internal');
		expect(validation?.user.role).toBe('admin');
	});

	it('should successfully log in via demoLogin action for admin role', async () => {
		const cookiesStore: Record<string, { value: string; options: any }> = {};
		const cookies: any = {
			set: (name: string, value: string, options: any) => {
				cookiesStore[name] = { value, options };
			},
			get: (name: string) => cookiesStore[name]?.value,
			delete: (name: string) => {
				delete cookiesStore[name];
			}
		};

		const formData = new FormData();
		formData.append('role', 'admin');
		formData.append('email', 'admin@dayflow.internal');

		const request = new Request('http://localhost:5173/login?/demoLogin', {
			method: 'POST',
			body: formData
		});

		try {
			await actions.demoLogin({ request, cookies } as any);
			expect(true).toBe(false);
		} catch (err: any) {
			expect(err.status).toBe(303);
			expect(err.location).toBe('/dashboard');
		}

		expect(cookiesStore[SESSION_COOKIE_NAME]).toBeDefined();
		const sessionId = cookiesStore[SESSION_COOKIE_NAME].value;
		const validation = await validateSession(sessionId);
		expect(validation?.user.email).toBe('admin@dayflow.internal');
	});

	it('should successfully log in via demoLogin action for HR role', async () => {
		const cookiesStore: Record<string, { value: string; options: any }> = {};
		const cookies: any = {
			set: (name: string, value: string, options: any) => {
				cookiesStore[name] = { value, options };
			},
			get: (name: string) => cookiesStore[name]?.value,
			delete: (name: string) => {
				delete cookiesStore[name];
			}
		};

		const formData = new FormData();
		formData.append('role', 'hr');
		formData.append('email', 'hr@dayflow.internal');

		const request = new Request('http://localhost:5173/login?/demoLogin', {
			method: 'POST',
			body: formData
		});

		try {
			await actions.demoLogin({ request, cookies } as any);
			expect(true).toBe(false);
		} catch (err: any) {
			expect(err.status).toBe(303);
			expect(err.location).toBe('/dashboard');
		}

		expect(cookiesStore[SESSION_COOKIE_NAME]).toBeDefined();
		const sessionId = cookiesStore[SESSION_COOKIE_NAME].value;
		const validation = await validateSession(sessionId);
		expect(validation?.user.email).toBe('hr@dayflow.internal');
		expect(validation?.user.role).toBe('hr');
	});

	it('should successfully log in via demoLogin action for employee role', async () => {
		const cookiesStore: Record<string, { value: string; options: any }> = {};
		const cookies: any = {
			set: (name: string, value: string, options: any) => {
				cookiesStore[name] = { value, options };
			},
			get: (name: string) => cookiesStore[name]?.value,
			delete: (name: string) => {
				delete cookiesStore[name];
			}
		};

		const formData = new FormData();
		formData.append('role', 'employee');
		formData.append('email', 'employee@dayflow.internal');

		const request = new Request('http://localhost:5173/login?/demoLogin', {
			method: 'POST',
			body: formData
		});

		try {
			await actions.demoLogin({ request, cookies } as any);
			expect(true).toBe(false);
		} catch (err: any) {
			expect(err.status).toBe(303);
			expect(err.location).toBe('/dashboard');
		}

		expect(cookiesStore[SESSION_COOKIE_NAME]).toBeDefined();
		const sessionId = cookiesStore[SESSION_COOKIE_NAME].value;
		const validation = await validateSession(sessionId);
		expect(validation?.user.email).toBe('employee@dayflow.internal');
		expect(validation?.user.role).toBe('employee');
	});
});
