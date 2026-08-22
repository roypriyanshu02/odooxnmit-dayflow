import { describe, it, expect, beforeAll } from 'bun:test';
import { POST } from './+server';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { seedDatabase } from '$lib/server/db/seed';

describe('Batch Payroll API (POST /api/payroll/batch)', () => {
	beforeAll(async () => {
		await seedDatabase();
	});

	it('should reject requests with invalid or missing month', async () => {
		const req = new Request('http://localhost/api/payroll/batch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month: 13, year: 2026 })
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error).toContain('Invalid month');
	});

	it('should reject requests with invalid year', async () => {
		const req = new Request('http://localhost/api/payroll/batch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month: 8, year: 1990 })
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error).toContain('Invalid year');
	});

	it('should successfully run batch payroll for all active employees for August 2026', async () => {
		const req = new Request('http://localhost/api/payroll/batch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month: 8, year: 2026, overwrite: true })
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(200);
		const json = await res.json();

		expect(json.success).toBe(true);
		expect(json.processedCount).toBeGreaterThan(5);
		expect(json.summary.totalGross).toBeGreaterThan(100000);
		expect(json.summary.totalNet).toBeGreaterThan(80000);
		expect(json.summary.totalPf).toBeGreaterThan(5000);
		expect(Array.isArray(json.results)).toBe(true);
	});

	it('should filter batch payroll by department when department is specified', async () => {
		const req = new Request('http://localhost/api/payroll/batch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month: 8, year: 2026, department: 'Engineering', overwrite: true })
		});

		const res = await POST({ request: req } as any);
		expect(res.status).toBe(200);
		const json = await res.json();

		expect(json.success).toBe(true);
		expect(json.results.every((r: any) => r.department === 'Engineering')).toBe(true);
	});
});
