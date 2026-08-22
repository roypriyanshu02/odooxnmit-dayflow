import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * GET /api/employees/chatter
 * Query Params:
 * - entityType: 'employee' | 'leave' | 'payroll' (default: 'employee')
 * - entityId: ID of the entity (e.g. employeeId)
 * - logType / type: filter by type
 * - order: 'asc' | 'desc' (default: 'desc')
 * - limit: max records (default: 100)
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const entityTypeParam = url.searchParams.get('entityType');
		const entityId = url.searchParams.get('entityId');
		const typeParam = url.searchParams.get('logType') || url.searchParams.get('type');
		const order = url.searchParams.get('order') || 'desc';
		const limit = Math.max(1, Math.min(200, parseInt(url.searchParams.get('limit') || '100', 10)));

		const conditions = [];

		if (entityId && entityId.trim() !== '') {
			conditions.push(eq(schema.chatter.entityId, entityId.trim()));
		}

		if (entityTypeParam && entityTypeParam !== 'all') {
			conditions.push(eq(schema.chatter.entityType, entityTypeParam as 'employee' | 'leave' | 'payroll'));
		}

		if (typeParam && typeParam !== 'all' && ['note', 'status_change', 'field_update'].includes(typeParam)) {
			conditions.push(eq(schema.chatter.type, typeParam as 'note' | 'status_change' | 'field_update'));
		}

		const whereClause =
			conditions.length > 0
				? conditions.length === 1
					? conditions[0]
					: and(...conditions)
				: undefined;

		let query = db.select().from(schema.chatter);
		if (whereClause) {
			query = query.where(whereClause) as any;
		}

		if (order === 'asc') {
			query = query.orderBy(asc(schema.chatter.createdAt)) as any;
		} else {
			query = query.orderBy(desc(schema.chatter.createdAt)) as any;
		}

		const entries = query.limit(limit).all();

		// Parse metadata safely if stringified
		const formattedEntries = entries.map((entry: typeof schema.chatter.$inferSelect) => {
			let meta = entry.metadata;
			if (typeof meta === 'string') {
				try {
					meta = JSON.parse(meta);
				} catch {
					meta = {};
				}
			}
			return {
				...entry,
				metadata: meta || {}
			};
		});

		return json({
			success: true,
			chatter: formattedEntries,
			entries: formattedEntries,
			total: formattedEntries.length
		});
	} catch (error: any) {
		console.error('Error fetching chatter entries:', error);
		return json(
			{
				success: false,
				error: error?.message || 'Failed to fetch chatter feed',
				chatter: [],
				entries: [],
				total: 0
			},
			{ status: 500 }
		);
	}
};

/**
 * POST /api/employees/chatter
 * Payload:
 * {
 *   entityType?: 'employee' | 'leave' | 'payroll',
 *   entityId: string,
 *   message: string,
 *   authorId?: string,
 *   authorName?: string,
 *   authorRole?: string,
 *   authorAvatar?: string,
 *   logType?: string,
 *   type?: 'note' | 'status_change' | 'field_update',
 *   metadata?: Record<string, unknown>
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const {
			entityType = 'employee',
			entityId,
			message,
			authorId,
			authorName,
			authorRole,
			authorAvatar,
			logType,
			type,
			metadata = {}
		} = body;

		// 1. Validation
		if (!entityId || typeof entityId !== 'string' || entityId.trim() === '') {
			return json(
				{ success: false, error: 'entityId is required and must be a non-empty string' },
				{ status: 400 }
			);
		}

		if (!message || typeof message !== 'string' || message.trim() === '') {
			return json(
				{ success: false, error: 'message is required and must be a non-empty string' },
				{ status: 400 }
			);
		}

		const validEntityTypes = ['employee', 'leave', 'payroll'];
		if (entityType && !validEntityTypes.includes(entityType)) {
			return json(
				{ success: false, error: `Invalid entityType '${entityType}'. Allowed values: ${validEntityTypes.join(', ')}` },
				{ status: 400 }
			);
		}

		// 2. Map logType or type to valid schema enum ('note' | 'status_change' | 'field_update')
		let schemaType: 'note' | 'status_change' | 'field_update' = 'note';
		const specifiedType = type || logType;

		if (specifiedType === 'status_change' || specifiedType === 'status_transition' || specifiedType === 'leave_approval') {
			schemaType = 'status_change';
		} else if (
			specifiedType === 'field_update' ||
			specifiedType === 'salary_modification' ||
			specifiedType === 'profile_update'
		) {
			schemaType = 'field_update';
		} else {
			schemaType = 'note';
		}

		// 3. Resolve authorId from users table to prevent FK constraint failures
		let validAuthorId = authorId;
		if (validAuthorId) {
			const existingUser = db.select().from(schema.users).where(eq(schema.users.id, validAuthorId)).get();
			if (!existingUser) {
				const fallbackUser = db.select().from(schema.users).limit(1).get();
				if (fallbackUser) {
					validAuthorId = fallbackUser.id;
				}
			}
		} else {
			const fallbackUser = db.select().from(schema.users).limit(1).get();
			if (fallbackUser) {
				validAuthorId = fallbackUser.id;
			} else {
				validAuthorId = 'system-author';
			}
		}

		const now = new Date().toISOString();
		const finalMetadata = {
			...(typeof metadata === 'object' && metadata !== null ? metadata : {}),
			logType: logType || specifiedType || 'note',
			authorRole: authorRole || 'employee'
		};

		const newEntry: typeof schema.chatter.$inferInsert = {
			id: crypto.randomUUID(),
			entityType: (entityType || 'employee') as 'employee' | 'leave' | 'payroll',
			entityId: entityId.trim(),
			authorId: validAuthorId,
			authorName: (authorName || 'System User').trim(),
			authorAvatar: authorAvatar || null,
			message: message.trim(),
			type: schemaType,
			metadata: finalMetadata,
			createdAt: now
		};

		await db.insert(schema.chatter).values(newEntry);

		return json(
			{
				success: true,
				entry: newEntry,
				chatter: newEntry
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error creating chatter entry:', error);
		return json(
			{
				success: false,
				error: error?.message || 'Failed to create chatter entry'
			},
			{ status: 500 }
		);
	}
};
