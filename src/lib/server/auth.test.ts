import { describe, it, expect, beforeEach } from 'bun:test';
import { db, sqlite } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import {
	hashPassword,
	verifyPassword,
	createSession,
	validateSession,
	invalidateSession,
	generateSessionToken,
	SESSION_DURATION_MS
} from '$lib/server/auth';
import { seedDatabase } from '$lib/server/db/seed';
import { eq } from 'drizzle-orm';

describe('Authentication & Session System', () => {
	beforeEach(async () => {
		await seedDatabase();
	});

	describe('Password Hashing & Verification', () => {
		it('should hash passwords consistently and verify positive match', async () => {
			const password = 'SecureSecretPassword!2026';
			const hash = await hashPassword(password);

			expect(hash).toBeTruthy();
			expect(typeof hash).toBe('string');
			expect(hash.length).toBeGreaterThan(10);

			const isMatch = await verifyPassword(password, hash);
			expect(isMatch).toBe(true);
		});

		it('should fail verification for incorrect passwords', async () => {
			const password = 'CorrectPassword123';
			const wrongPassword = 'WrongPassword456';
			const hash = await hashPassword(password);

			const isMatch = await verifyPassword(wrongPassword, hash);
			expect(isMatch).toBe(false);
		});

		it('should verify standard seeded password Dayflow@2026', async () => {
			const adminUser = await db
				.select()
				.from(schema.users)
				.where(eq(schema.users.email, 'admin@dayflow.internal'))
				.limit(1);

			expect(adminUser.length).toBe(1);
			const isValid = await verifyPassword('Dayflow@2026', adminUser[0].passwordHash);
			expect(isValid).toBe(true);
		});
	});

	describe('Session Management in Database', () => {
		it('should create and retrieve a valid session with user & employee details', async () => {
			const users = await db
				.select()
				.from(schema.users)
				.where(eq(schema.users.email, 'admin@dayflow.internal'))
				.limit(1);

			const user = users[0];
			const session = await createSession(user.id);

			expect(session.id).toBeTruthy();
			expect(session.userId).toBe(user.id);
			expect(session.expiresAt).toBeGreaterThan(Date.now());

			const validation = await validateSession(session.id);
			expect(validation).not.toBeNull();
			expect(validation?.user.email).toBe('admin@dayflow.internal');
			expect(validation?.user.name).toBe(user.name);
			expect(validation?.user.role).toBe('admin');
			expect(validation?.user.employeeId).toBeTruthy();
			expect(validation?.session.id).toBe(session.id);
		});

		it('should return null for non-existent session token', async () => {
			const randomToken = generateSessionToken();
			const validation = await validateSession(randomToken);
			expect(validation).toBeNull();
		});

		it('should return null and clean up expired session', async () => {
			const users = await db.select().from(schema.users).limit(1);
			const user = users[0];

			const expiredToken = generateSessionToken();
			const pastTime = Date.now() - 10000; // 10 seconds ago

			await db.insert(schema.sessions).values({
				id: expiredToken,
				userId: user.id,
				expiresAt: pastTime,
				createdAt: new Date(pastTime).toISOString()
			});

			const validation = await validateSession(expiredToken);
			expect(validation).toBeNull();

			// Verify it was deleted from db
			const records = await db
				.select()
				.from(schema.sessions)
				.where(eq(schema.sessions.id, expiredToken));
			expect(records.length).toBe(0);
		});

		it('should successfully invalidate/logout a session', async () => {
			const users = await db.select().from(schema.users).limit(1);
			const session = await createSession(users[0].id);

			let validation = await validateSession(session.id);
			expect(validation).not.toBeNull();

			await invalidateSession(session.id);

			validation = await validateSession(session.id);
			expect(validation).toBeNull();
		});
	});
});
