import { describe, it, expect } from 'bun:test';
import { GET, POST } from './+server';

// Helper to simulate SvelteKit GET RequestEvent
function createGetEvent(searchParams: Record<string, string> = {}) {
	const url = new URL('http://localhost:5173/api/employees/chatter');
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
		route: { id: '/api/employees/chatter' },
		setHeaders: () => {},
		isDataRequest: false,
		isSubRequest: false
	} as any;
}

// Helper to simulate SvelteKit POST RequestEvent
function createPostEvent(body: any) {
	const url = new URL('http://localhost:5173/api/employees/chatter');
	return {
		url,
		params: {},
		request: new Request(url.toString(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		}),
		cookies: {} as any,
		fetch: {} as any,
		getClientAddress: () => '127.0.0.1',
		locals: {} as any,
		platform: {} as any,
		route: { id: '/api/employees/chatter' },
		setHeaders: () => {},
		isDataRequest: false,
		isSubRequest: false
	} as any;
}

describe('Chatter API (/api/employees/chatter)', () => {
	const testEmployeeId = 'TEST_EMP_' + Date.now();

	describe('Input Validation on POST', () => {
		it('should reject requests with missing entityId', async () => {
			const event = createPostEvent({
				message: 'Test message without entityId'
			});
			const response = await POST(event);
			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toContain('entityId is required');
		});

		it('should reject requests with empty whitespace entityId', async () => {
			const event = createPostEvent({
				entityId: '   ',
				message: 'Valid message'
			});
			const response = await POST(event);
			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toContain('entityId is required');
		});

		it('should reject requests with missing message', async () => {
			const event = createPostEvent({
				entityId: 'EMP001'
			});
			const response = await POST(event);
			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toContain('message is required');
		});

		it('should reject requests with empty whitespace message', async () => {
			const event = createPostEvent({
				entityId: 'EMP001',
				message: '   '
			});
			const response = await POST(event);
			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toContain('message is required');
		});

		it('should reject requests with invalid entityType', async () => {
			const event = createPostEvent({
				entityId: 'EMP001',
				message: 'Hello World',
				entityType: 'unsupported_entity_type'
			});
			const response = await POST(event);
			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toContain('Invalid entityType');
		});
	});

	describe('Creating Chatter Entries on POST', () => {
		it('should successfully create a standard note for an employee', async () => {
			const event = createPostEvent({
				entityType: 'employee',
				entityId: testEmployeeId,
				message: 'Completed initial orientation and security training.',
				authorName: 'Arnav Kini',
				authorRole: 'hr',
				logType: 'note'
			});

			const response = await POST(event);
			expect(response.status).toBe(201);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.entry).toBeDefined();
			expect(data.entry.id).toBeDefined();
			expect(data.entry.entityId).toBe(testEmployeeId);
			expect(data.entry.entityType).toBe('employee');
			expect(data.entry.authorName).toBe('Arnav Kini');
			expect(data.entry.type).toBe('note');
			expect(data.entry.metadata?.authorRole).toBe('hr');
		});

		it('should successfully record salary modification log', async () => {
			const event = createPostEvent({
				entityType: 'employee',
				entityId: testEmployeeId,
				message: 'Monthly wage revised from ₹85,000 to ₹95,000.',
				authorName: 'Priyanshu Roy',
				authorRole: 'admin',
				logType: 'salary_modification',
				metadata: { previousWage: 85000, newWage: 95000 }
			});

			const response = await POST(event);
			expect(response.status).toBe(201);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.entry.type).toBe('field_update');
			expect(data.entry.metadata?.logType).toBe('salary_modification');
			expect(data.entry.metadata?.newWage).toBe(95000);
		});

		it('should successfully record status transition log', async () => {
			const event = createPostEvent({
				entityType: 'employee',
				entityId: testEmployeeId,
				message: 'Employee marked on approved medical leave.',
				authorName: 'Arnav Kini',
				authorRole: 'hr',
				logType: 'status_transition',
				metadata: { fromStatus: 'active', toStatus: 'on_leave' }
			});

			const response = await POST(event);
			expect(response.status).toBe(201);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.entry.type).toBe('status_change');
			expect(data.entry.metadata?.logType).toBe('status_transition');
		});

		it('should successfully record leave approval log', async () => {
			const event = createPostEvent({
				entityType: 'leave',
				entityId: 'LEAVE_999',
				message: 'Leave request for 4 days approved.',
				authorName: 'Priyanshu Roy',
				authorRole: 'admin',
				logType: 'leave_approval'
			});

			const response = await POST(event);
			expect(response.status).toBe(201);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.entry.entityType).toBe('leave');
			expect(data.entry.type).toBe('status_change');
		});
	});

	describe('Fetching Chatter Entries on GET', () => {
		it('should fetch all chatter entries for the test employee', async () => {
			const event = createGetEvent({
				entityType: 'employee',
				entityId: testEmployeeId
			});

			const response = await GET(event);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(Array.isArray(data.entries)).toBe(true);
			expect(data.entries.length).toBeGreaterThanOrEqual(3);

			// Verify all returned entries belong to the requested employee
			for (const item of data.entries) {
				expect(item.entityId).toBe(testEmployeeId);
				expect(item.entityType).toBe('employee');
			}
		});

		it('should filter chatter entries by type', async () => {
			const event = createGetEvent({
				entityType: 'employee',
				entityId: testEmployeeId,
				type: 'field_update'
			});

			const response = await GET(event);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.entries.length).toBeGreaterThanOrEqual(1);
			for (const item of data.entries) {
				expect(item.type).toBe('field_update');
			}
		});

		it('should support ascending and descending sort order', async () => {
			const eventDesc = createGetEvent({
				entityId: testEmployeeId,
				order: 'desc'
			});
			const resDesc = await GET(eventDesc);
			const dataDesc = await resDesc.json();

			const datesDesc = dataDesc.entries.map((e: any) => new Date(e.createdAt).getTime());
			for (let i = 0; i < datesDesc.length - 1; i++) {
				expect(datesDesc[i]).toBeGreaterThanOrEqual(datesDesc[i + 1]);
			}

			const eventAsc = createGetEvent({
				entityId: testEmployeeId,
				order: 'asc'
			});
			const resAsc = await GET(eventAsc);
			const dataAsc = await resAsc.json();

			const datesAsc = dataAsc.entries.map((e: any) => new Date(e.createdAt).getTime());
			for (let i = 0; i < datesAsc.length - 1; i++) {
				expect(datesAsc[i]).toBeLessThanOrEqual(datesAsc[i + 1]);
			}
		});

		it('should return empty list gracefully when no entries match entityId', async () => {
			const event = createGetEvent({
				entityId: 'NON_EXISTENT_ID_999999'
			});

			const response = await GET(event);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.entries.length).toBe(0);
			expect(data.total).toBe(0);
		});
	});
});
