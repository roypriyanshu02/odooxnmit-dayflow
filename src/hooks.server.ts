import type { Handle, HandleServerError } from '@sveltejs/kit';
import { validateSession, setSessionCookie, deleteSessionCookie, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

	if (sessionId) {
		const sessionResult = await validateSession(sessionId);
		if (sessionResult) {
			event.locals.user = sessionResult.user;
			event.locals.session = sessionResult.session;
			// Refresh cookie expiry
			setSessionCookie(event.cookies, sessionResult.session.id, sessionResult.session.expiresAt);
		} else {
			event.locals.user = null;
			event.locals.session = null;
			deleteSessionCookie(event.cookies);
		}
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	const pathname = event.url.pathname;
	const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/logout';
	const isApiRoute = pathname.startsWith('/api');

	// If logged in and visiting login/signup on GET, redirect to dashboard
	if (event.locals.user && (pathname === '/login' || pathname === '/signup') && event.request.method === 'GET') {
		throw redirect(303, '/dashboard');
	}

	// If not logged in and trying to access protected page routes
	if (!event.locals.user && !isAuthRoute && !isApiRoute) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};

export const handleError: HandleServerError = ({ error, event }) => {
	console.error(`[Server Error on ${event.request.method} ${event.url.pathname}]:`, error);
	return {
		message: (error as any)?.message || 'An unexpected error occurred'
	};
};
