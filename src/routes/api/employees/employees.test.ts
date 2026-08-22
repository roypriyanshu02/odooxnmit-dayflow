import { describe, it, expect } from 'bun:test';
import { GET } from './+server';

// Helper to simulate SvelteKit GET RequestEvent
function createGetEvent(searchParams: Record<string, string> = {}) {
	const url = new URL('http://localhost:5173/api/employees');
	for (const [key, value] of Object.entries(searchParams)) {
		url.searchParams.set(key, value);
	}
	return {
		url,
		params: {},
		request: new Request(url.toString()),
		cookies: {} as any,
		fetch: {} as any,
		getClientAddress: () => '127.0.0.1',
		locals: {} as any,
		platform: {} as any,
		route: { id: '/api/employees' },
		setHeaders: () => {},
		isDataRequest: false,
		isSubRequest: false
	} as any;
}

describe('Employee Directory API (GET /api/employees)', () => {
	it('should return all employees with status 200 and success flag', async () => {
		const event = createGetEvent();
		const response = await GET(event);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.success).toBe(true);
		expect(Array.isArray(data.employees)).toBe(true);
		expect(data.employees.length).toBeGreaterThan(0);
		expect(data.total).toBe(data.employees.length);
		expect(data.stats).toBeDefined();
		expect(data.departments).toBeDefined();
	});

	it('should include required Odoo card fields for each employee', async () => {
		const event = createGetEvent();
		const response = await GET(event);
		const data = await response.json();

		const firstEmp = data.employees[0];
		expect(firstEmp.id).toBeDefined();
		expect(firstEmp.firstName).toBeDefined();
		expect(firstEmp.lastName).toBeDefined();
		expect(firstEmp.jobTitle).toBeDefined();
		expect(firstEmp.department).toBeDefined();
		expect(firstEmp.email).toBeDefined();
		expect(firstEmp.attendanceStatus).toBeDefined();
		expect(['present', 'absent', 'on_leave']).toContain(firstEmp.attendanceStatus);
		expect(firstEmp.about).toBeDefined();
		expect(firstEmp.resume).toBeDefined();
		expect(Array.isArray(firstEmp.resume.skills)).toBe(true);
	});

	it('should filter employees by search query (name, role, skills, email)', async () => {
		// Search by name
		const event = createGetEvent({ query: 'Sharma' });
		const response = await GET(event);
		const data = await response.json();

		expect(data.success).toBe(true);
		expect(data.employees.length).toBeGreaterThan(0);
		for (const emp of data.employees) {
			const matches =
				emp.firstName.includes('Sharma') ||
				emp.lastName.includes('Sharma') ||
				emp.jobTitle.includes('Sharma') ||
				emp.department.includes('Sharma') ||
				emp.email.includes('sharma');
			expect(matches).toBe(true);
		}
	});

	it('should filter employees by department', async () => {
		const event = createGetEvent({ department: 'Engineering' });
		const response = await GET(event);
		const data = await response.json();

		expect(data.success).toBe(true);
		for (const emp of data.employees) {
			expect(emp.department.toLowerCase()).toContain('engineering');
		}
	});

	it('should filter employees by presence status', async () => {
		const event = createGetEvent({ status: 'on_leave' });
		const response = await GET(event);
		const data = await response.json();

		expect(data.success).toBe(true);
		for (const emp of data.employees) {
			expect(['on_leave']).toContain(emp.attendanceStatus);
		}
	});

	it('should return empty list gracefully when no match is found', async () => {
		const event = createGetEvent({ query: 'NonExistentPersonNameXYZ999' });
		const response = await GET(event);
		const data = await response.json();

		expect(data.success).toBe(true);
		expect(data.employees.length).toBe(0);
		expect(data.total).toBe(0);
	});

	it('should sort employees ascending and descending', async () => {
		const eventAsc = createGetEvent({ sortBy: 'name', sortOrder: 'asc' });
		const resAsc = await GET(eventAsc);
		const dataAsc = await resAsc.json();

		const namesAsc = dataAsc.employees.map((e: any) => `${e.firstName} ${e.lastName}`.toLowerCase());
		const sortedNamesAsc = [...namesAsc].sort();
		expect(namesAsc).toEqual(sortedNamesAsc);

		const eventDesc = createGetEvent({ sortBy: 'name', sortOrder: 'desc' });
		const resDesc = await GET(eventDesc);
		const dataDesc = await resDesc.json();

		const namesDesc = dataDesc.employees.map((e: any) => `${e.firstName} ${e.lastName}`.toLowerCase());
		const sortedNamesDesc = [...namesAsc].sort().reverse();
		expect(namesDesc).toEqual(sortedNamesDesc);
	});
});
