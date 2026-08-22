import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const employeeId = body.employeeId?.trim();

		if (!employeeId) {
			return json(
				{ success: false, error: 'employeeId is required.' },
				{ status: 400 }
			);
		}

		// 1. Fetch current employee
		const current = (
			await db
				.select()
				.from(schema.employees)
				.where(eq(schema.employees.id, employeeId))
		)[0];

		if (!current) {
			return json(
				{ success: false, error: `Employee '${employeeId}' not found.` },
				{ status: 404 }
			);
		}

		// 2. Prepare update payload
		const now = new Date().toISOString();
		const updateData: Partial<typeof schema.employees.$inferInsert> = {
			updatedAt: now
		};

		const changes: string[] = [];

		if (body.firstName !== undefined && body.firstName.trim() !== current.firstName) {
			updateData.firstName = body.firstName.trim();
			changes.push(`First Name changed to "${updateData.firstName}"`);
		}
		if (body.lastName !== undefined && body.lastName.trim() !== current.lastName) {
			updateData.lastName = body.lastName.trim();
			changes.push(`Last Name changed to "${updateData.lastName}"`);
		}
		if (body.jobTitle !== undefined && body.jobTitle.trim() !== current.jobTitle) {
			updateData.jobTitle = body.jobTitle.trim();
			changes.push(`Job Title changed to "${updateData.jobTitle}"`);
		}
		if (body.department !== undefined && body.department.trim() !== current.department) {
			updateData.department = body.department.trim();
			changes.push(`Department changed to "${updateData.department}"`);
		}
		if (body.phone !== undefined && body.phone !== current.phone) {
			updateData.phone = body.phone?.trim() || '';
			changes.push(`Phone updated`);
		}
		if (body.aboutBio !== undefined && body.aboutBio !== current.aboutBio) {
			updateData.aboutBio = body.aboutBio?.trim() || '';
			changes.push(`Bio summary updated`);
		}
		if (body.aboutPassions !== undefined && body.aboutPassions !== current.aboutPassions) {
			updateData.aboutPassions = body.aboutPassions?.trim() || '';
			changes.push(`Passions updated`);
		}
		if (body.aboutHobbies !== undefined && body.aboutHobbies !== current.aboutHobbies) {
			updateData.aboutHobbies = body.aboutHobbies?.trim() || '';
			changes.push(`Hobbies updated`);
		}
		if (body.dob !== undefined && body.dob !== current.dob) {
			updateData.dob = body.dob?.trim() || '';
			changes.push(`Date of Birth updated`);
		}
		if (body.panNumber !== undefined && body.panNumber !== current.panNumber) {
			updateData.panNumber = body.panNumber?.trim() || '';
			changes.push(`PAN number updated`);
		}
		if (body.uanNumber !== undefined && body.uanNumber !== current.uanNumber) {
			updateData.uanNumber = body.uanNumber?.trim() || '';
			changes.push(`UAN number updated`);
		}
		if (body.bankName !== undefined && body.bankName !== current.bankName) {
			updateData.bankName = body.bankName?.trim() || '';
			changes.push(`Bank Name updated`);
		}
		if (body.bankAccountNumber !== undefined && body.bankAccountNumber !== current.bankAccountNumber) {
			updateData.bankAccountNumber = body.bankAccountNumber?.trim() || '';
			changes.push(`Bank Account Number updated`);
		}
		if (body.bankIfsc !== undefined && body.bankIfsc !== current.bankIfsc) {
			updateData.bankIfsc = body.bankIfsc?.trim() || '';
			changes.push(`Bank IFSC updated`);
		}
		if (body.address !== undefined && body.address !== current.address) {
			updateData.address = body.address?.trim() || '';
			changes.push(`Address updated`);
		}
		if (body.avatarUrl !== undefined && body.avatarUrl !== current.avatarUrl) {
			updateData.avatarUrl = body.avatarUrl?.trim() || null;
			changes.push(`Profile Avatar changed`);
		}

		// Salary modification check
		let salaryModified = false;
		if (body.monthlyWage !== undefined) {
			const newWage = Number(body.monthlyWage);
			if (!isNaN(newWage) && newWage > 0 && newWage !== current.monthlyWage) {
				updateData.monthlyWage = newWage;
				salaryModified = true;
				changes.push(
					`Monthly Wage adjusted from ₹${current.monthlyWage?.toLocaleString('en-IN')} to ₹${newWage.toLocaleString('en-IN')}`
				);
			}
		}

		if (Object.keys(updateData).length <= 1) {
			return json({
				success: true,
				message: 'No changes detected.',
				employee: current
			});
		}

		// 3. Execute update in DB
		await db
			.update(schema.employees)
			.set(updateData)
			.where(eq(schema.employees.id, employeeId));

		// 4. Fetch updated employee
		const updated = (
			await db
				.select()
				.from(schema.employees)
				.where(eq(schema.employees.id, employeeId))
		)[0];

		// 5. Write chatter audit log
		try {
			const authorId = body.authorId || current.userId;
			const authorName = body.authorName || 'HR Administration';

			await db.insert(schema.chatter).values({
				id: crypto.randomUUID(),
				entityType: 'employee',
				entityId: employeeId,
				authorId,
				authorName,
				type: salaryModified ? 'status_change' : 'field_update',
				message: `Employee profile updated by ${authorName}: ${changes.join('; ')}.`,
				metadata: {
					changes,
					salaryModified,
					updatedBy: authorName
				},
				createdAt: now
			});
		} catch (chatterErr) {
			console.error('Failed to log employee update in chatter:', chatterErr);
		}

		return json({
			success: true,
			message: 'Employee profile updated successfully.',
			employee: updated,
			changes
		});
	} catch (err: any) {
		console.error('Error updating employee:', err);
		return json(
			{ success: false, error: err.message || 'Internal server error updating employee.' },
			{ status: 500 }
		);
	}
};
