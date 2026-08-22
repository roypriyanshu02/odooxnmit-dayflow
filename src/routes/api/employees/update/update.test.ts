import { describe, it, expect, beforeAll } from 'bun:test';
import { POST } from './+server';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { seedDatabase } from '$lib/server/db/seed';
import { eq } from 'drizzle-orm';

describe('Employee Profile Update API (POST /api/employees/update)', () => {
	beforeAll(async () => {
		await seedDatabase();
	});

	it('should return 400 when employeeId is missing', async () => {
		const req = new Request('http://localhost/api/employees/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ firstName: 'Alex' })
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error).toContain('employeeId is required');
	});

	it('should return 404 for non-existent employeeId', async () => {
		const req = new Request('http://localhost/api/employees/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ employeeId: 'OIFAKE99990000', jobTitle: 'Ghost' })
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json.success).toBe(false);
	});

	it('should successfully update personal info fields and log chatter entry', async () => {
		// Pick an existing employee
		const targetEmp = (await db.select().from(schema.employees).limit(1))[0];
		expect(targetEmp).toBeDefined();

		const req = new Request('http://localhost/api/employees/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				employeeId: targetEmp.id,
				jobTitle: 'Principal Lead Engineer',
				phone: '+91 98765 43210',
				aboutBio: 'Updated bio for testing purposes.'
			})
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.employee.jobTitle).toBe('Principal Lead Engineer');
		expect(json.employee.phone).toBe('+91 98765 43210');
		expect(json.employee.aboutBio).toBe('Updated bio for testing purposes.');

		// Verify chatter log was inserted
		const logs = await db
			.select()
			.from(schema.chatter)
			.where(eq(schema.chatter.entityId, targetEmp.id));
		expect(logs.length).toBeGreaterThan(0);
	});

	it('should support salary wage modifications', async () => {
		const targetEmp = (await db.select().from(schema.employees).limit(1))[0];
		expect(targetEmp).toBeDefined();

		const newWage = (targetEmp.monthlyWage || 50000) + 10000;

		const req = new Request('http://localhost/api/employees/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				employeeId: targetEmp.id,
				monthlyWage: newWage,
				authorName: 'Compensation Committee'
			})
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.employee.monthlyWage).toBe(newWage);
	});
});
