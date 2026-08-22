import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { invalidateSession, deleteSessionCookie, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		await invalidateSession(sessionId);
		deleteSessionCookie(cookies);
	}
	throw redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		const sessionId = cookies.get(SESSION_COOKIE_NAME);
		if (sessionId) {
			await invalidateSession(sessionId);
			deleteSessionCookie(cookies);
		}
		throw redirect(303, '/login');
	}
};
