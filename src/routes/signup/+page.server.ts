import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { hashPassword, createSession, setSessionCookie } from '$lib/server/auth';
import { generateEmployeeId } from '$lib/utils/employee-id';
import crypto from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const firstName = (formData.get('firstName') as string)?.trim();
		const lastName = (formData.get('lastName') as string)?.trim();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const password = formData.get('password') as string;
		const department = (formData.get('department') as string)?.trim() || 'Engineering';
		const jobTitle = (formData.get('jobTitle') as string)?.trim() || 'Software Engineer';
		const role = ((formData.get('role') as string)?.trim().toLowerCase() || 'employee') as 'admin' | 'hr' | 'employee';

		// Form values for preserving input upon error
		const formValues = {
			firstName,
			lastName,
			email,
			department,
			jobTitle,
			role
		};

		if (!firstName || !lastName || !email || !password) {
			return fail(400, {
				error: 'First name, last name, email, and password are required',
				values: formValues
			});
		}

		if (password.length < 6) {
			return fail(400, {
				error: 'Password must be at least 6 characters long',
				values: formValues
			});
		}

		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				error: 'Please enter a valid email address',
				values: formValues
			});
		}

		// Check if user with email already exists
		const existingUsers = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.email, email))
			.limit(1);

		if (existingUsers.length > 0) {
			return fail(400, {
				error: 'An account with this email address already exists',
				values: formValues
			});
		}

		try {
			const now = new Date().toISOString();
			const userId = crypto.randomUUID();
			const passwordHash = await hashPassword(password);

			// Count existing employees to get serial
			const countRes = await db
				.select({ count: sql<number>`count(*)` })
				.from(schema.employees);
			const serial = (countRes[0]?.count ?? 0) + 1;

			const employeeId = generateEmployeeId(firstName, lastName, 2026, serial);

			// 1. Insert User
			await db.insert(schema.users).values({
				id: userId,
				email,
				passwordHash,
				name: `${firstName} ${lastName}`,
				role: ['admin', 'hr', 'employee'].includes(role) ? role : 'employee',
				createdAt: now,
				updatedAt: now
			});

			// 2. Insert Employee profile
			await db.insert(schema.employees).values({
				id: employeeId,
				userId,
				firstName,
				lastName,
				email,
				phone: '',
				jobTitle,
				department,
				status: 'active',
				joinDate: '2026-08-22',
				monthlyWage: 80000,
				createdAt: now,
				updatedAt: now
			});

			// 3. Initialize default Leave Balances for current year
			await db.insert(schema.leaveBalances).values({
				id: crypto.randomUUID(),
				employeeId,
				year: 2026,
				paidTimeOffTotal: 24,
				paidTimeOffUsed: 0,
				sickLeaveTotal: 7,
				sickLeaveUsed: 0,
				unpaidLeaveUsed: 0,
				updatedAt: now
			});

			// 4. Create Session and set Cookie
			const session = await createSession(userId);
			setSessionCookie(cookies, session.id, session.expiresAt);
		} catch (err: any) {
			console.error('Sign up error:', err);
			return fail(500, {
				error: 'Failed to create account. Please try again.',
				values: formValues
			});
		}

		throw redirect(303, '/dashboard');
	}
};
