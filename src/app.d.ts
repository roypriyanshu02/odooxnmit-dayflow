// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('$lib/server/auth').AuthenticatedUser | null;
			session: import('$lib/server/auth').SessionData | null;
		}
		interface PageData {
			user?: import('$lib/server/auth').AuthenticatedUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
