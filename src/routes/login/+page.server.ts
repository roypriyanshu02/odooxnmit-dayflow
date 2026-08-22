import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession, setSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required',
				email
			});
		}

		const users = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.email, email))
			.limit(1);

		if (users.length === 0) {
			return fail(400, {
				error: 'Invalid email or password',
				email
			});
		}

		const user = users[0];
		const isValid = await verifyPassword(password, user.passwordHash);

		if (!isValid) {
			return fail(400, {
				error: 'Invalid email or password',
				email
			});
		}

		// Create database session
		const session = await createSession(user.id);
		setSessionCookie(cookies, session.id, session.expiresAt);

		throw redirect(303, '/dashboard');
	},

	demoLogin: async ({ request, cookies }) => {
		const formData = await request.formData();
		const targetEmail = (formData.get('email') as string)?.trim().toLowerCase();
		const role = (formData.get('role') as string)?.trim().toLowerCase();

		let email = targetEmail;
		if (!email) {
			if (role === 'admin') email = 'admin@dayflow.internal';
			else if (role === 'hr') email = 'hr@dayflow.internal';
			else email = 'employee@dayflow.internal';
		}

		const users = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.email, email))
			.limit(1);

		if (users.length === 0) {
			return fail(404, {
				error: `Demo user '${email}' not found. Ensure database is seeded.`
			});
		}

		const user = users[0];
		const session = await createSession(user.id);
		setSessionCookie(cookies, session.id, session.expiresAt);

		throw redirect(303, '/dashboard');
	}
};
