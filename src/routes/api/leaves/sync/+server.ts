import { json, type RequestHandler } from '@sveltejs/kit';
import { syncAllApprovedLeaves, syncApprovedLeaveToAttendance } from '$lib/server/leaves/sync-attendance';

export const POST: RequestHandler = async ({ request }) => {
	try {
		let body: any = {};
		try {
			body = await request.json();
		} catch {
			body = {};
		}

		if (body.leaveRequestId) {
			const result = await syncApprovedLeaveToAttendance(body.leaveRequestId);
			return json({
				success: true,
				mode: 'single',
				result
			});
		}

		const batchResult = await syncAllApprovedLeaves();
		return json({
			success: true,
			mode: 'batch',
			...batchResult
		});
	} catch (err: any) {
		console.error('Error syncing leaves to attendance:', err);
		return json(
			{
				success: false,
				error: err.message || 'Failed to sync leaves to attendance.'
			},
			{ status: 500 }
		);
	}
};
