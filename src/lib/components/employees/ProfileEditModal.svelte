<script lang="ts">
	import {
		X,
		Upload,
		User,
		Lock,
		ShieldCheck,
		Building2,
		Briefcase,
		Phone,
		Mail,
		CheckCircle2,
		AlertTriangle,
		Loader2,
		DollarSign,
		Camera,
		Sparkles
	} from '@lucide/svelte';
	import type { Employee } from '$lib/types/employee';
	import { auth } from '$lib/state/auth.svelte';

	interface Props {
		open?: boolean;
		employee: Employee;
		onClose?: () => void;
		onSuccess?: (updated: Employee) => void;
	}

	let {
		open = false,
		employee,
		onClose,
		onSuccess
	}: Props = $props();

	type TabKey = 'general' | 'private' | 'salary';
	let activeTab = $state<TabKey>('general');

	// Editable form states initialized from employee prop
	let firstName = $state(employee.firstName || '');
	let lastName = $state(employee.lastName || '');
	let jobTitle = $state(employee.jobTitle || '');
	let department = $state(employee.department || 'Engineering');
	let phone = $state(employee.phone || '');
	let aboutBio = $state(employee.aboutBio || '');
	let avatarUrl = $state(employee.avatarUrl || '');

	// Private Info
	let dob = $state(employee.dob || '');
	let panNumber = $state(employee.panNumber || '');
	let uanNumber = $state(employee.uanNumber || '');
	let bankName = $state(employee.bankName || '');
	let bankAccountNumber = $state(employee.bankAccountNumber || '');
	let bankIfsc = $state(employee.bankIfsc || '');
	let address = $state(employee.address || '');

	// Salary Config (Only editable by admin or hr)
	let monthlyWage = $state(employee.monthlyWage || 0);

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const canEditSalary = $derived(
		auth.user.role === 'admin' || auth.user.role === 'hr'
	);

	function handleAvatarFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			const reader = new FileReader();
			reader.onload = (uploadEvent) => {
				if (uploadEvent.target?.result) {
					avatarUrl = uploadEvent.target.result as string;
				}
			};
			reader.readAsDataURL(file);
		}
	}

	async function handleSave() {
		isSubmitting = true;
		errorMessage = null;
		successMessage = null;

		try {
			const payload: any = {
				employeeId: employee.id,
				firstName,
				lastName,
				jobTitle,
				department,
				phone,
				aboutBio,
				avatarUrl,
				dob,
				panNumber,
				uanNumber,
				bankName,
				bankAccountNumber,
				bankIfsc,
				address,
				authorId: auth.user.id,
				authorName: auth.user.name
			};

			if (canEditSalary) {
				payload.monthlyWage = Number(monthlyWage);
			}

			const res = await fetch('/api/employees/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await res.json();
			if (!res.ok || !data.success) {
				throw new Error(data.error || 'Failed to update employee profile.');
			}

			successMessage = 'Profile changes saved successfully!';
			if (onSuccess) {
				onSuccess(data.employee);
			}

			setTimeout(() => {
				onClose?.();
			}, 1200);
		} catch (err: any) {
			errorMessage = err.message || 'An unexpected error occurred.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
			onclick={onClose}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && onClose?.()}
		></div>

		<!-- Dialog Modal -->
		<div
			class="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl transition-all animate-in fade-in-0 zoom-in-95 overflow-hidden"
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border p-5 bg-muted/20">
				<div class="flex items-center gap-3">
					<div class="relative h-12 w-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0">
						{#if avatarUrl}
							<img src={avatarUrl} alt="Avatar" class="h-full w-full object-cover" />
						{:else}
							<span>{firstName?.[0] || ''}{lastName?.[0] || ''}</span>
						{/if}
						<label class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
							<Camera class="h-4 w-4 text-white" />
							<input type="file" accept="image/*" class="hidden" onchange={handleAvatarFileChange} />
						</label>
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">Edit Employee Profile</h2>
						<p class="text-xs text-muted-foreground font-mono">{employee.id} • {employee.department}</p>
					</div>
				</div>

				<button
					type="button"
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					onclick={onClose}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Tab Navigation Bar -->
			<div class="flex border-b border-border bg-muted/10 px-5 text-xs font-semibold">
				<button
					type="button"
					class="flex items-center gap-1.5 border-b-2 py-3 px-3 transition-colors {activeTab === 'general'
						? 'border-primary text-primary font-bold'
						: 'border-transparent text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeTab = 'general')}
				>
					<User class="h-3.5 w-3.5" />
					<span>General Details</span>
				</button>

				<button
					type="button"
					class="flex items-center gap-1.5 border-b-2 py-3 px-3 transition-colors {activeTab === 'private'
						? 'border-primary text-primary font-bold'
						: 'border-transparent text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeTab = 'private')}
				>
					<Lock class="h-3.5 w-3.5" />
					<span>Private &amp; Banking</span>
				</button>

				<button
					type="button"
					class="flex items-center gap-1.5 border-b-2 py-3 px-3 transition-colors {activeTab === 'salary'
						? 'border-primary text-primary font-bold'
						: 'border-transparent text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeTab = 'salary')}
				>
					<ShieldCheck class="h-3.5 w-3.5" />
					<span>Salary Configuration</span>
					{#if !canEditSalary}
						<span class="rounded bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground uppercase">Locked</span>
					{/if}
				</button>
			</div>

			<!-- Body Form Fields -->
			<div class="p-5 max-h-[60vh] overflow-y-auto space-y-4">
				{#if errorMessage}
					<div class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
						<AlertTriangle class="h-4 w-4 shrink-0" />
						<span>{errorMessage}</span>
					</div>
				{/if}

				{#if successMessage}
					<div class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
						<CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600" />
						<span>{successMessage}</span>
					</div>
				{/if}

				<!-- TAB 1: General Details -->
				{#if activeTab === 'general'}
					<div class="space-y-3.5 text-xs">
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="first-name" class="block font-semibold text-foreground mb-1">First Name</label>
								<input
									id="first-name"
									type="text"
									bind:value={firstName}
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label for="last-name" class="block font-semibold text-foreground mb-1">Last Name</label>
								<input
									id="last-name"
									type="text"
									bind:value={lastName}
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="job-title" class="block font-semibold text-foreground mb-1">Job Title / Designation</label>
								<input
									id="job-title"
									type="text"
									bind:value={jobTitle}
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label for="department" class="block font-semibold text-foreground mb-1">Department</label>
								<select
									id="department"
									bind:value={department}
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								>
									<option value="Engineering">Engineering</option>
									<option value="Product">Product</option>
									<option value="Design">Design</option>
									<option value="Sales">Sales</option>
									<option value="Marketing">Marketing</option>
									<option value="HR">HR</option>
								</select>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="phone" class="block font-semibold text-foreground mb-1">Contact Phone</label>
								<input
									id="phone"
									type="text"
									bind:value={phone}
									placeholder="+91 98765 43210"
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label for="avatar-url" class="block font-semibold text-foreground mb-1">Avatar Image URL (or upload above)</label>
								<input
									id="avatar-url"
									type="text"
									bind:value={avatarUrl}
									placeholder="https://..."
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>

						<div>
							<label for="about-bio" class="block font-semibold text-foreground mb-1">About / Bio Summary</label>
							<textarea
								id="about-bio"
								bind:value={aboutBio}
								rows="3"
								placeholder="Brief summary of background and passions..."
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
							></textarea>
						</div>
					</div>
				{/if}

				<!-- TAB 2: Private & Banking -->
				{#if activeTab === 'private'}
					<div class="space-y-3.5 text-xs">
						<div class="grid grid-cols-3 gap-3">
							<div>
								<label for="dob" class="block font-semibold text-foreground mb-1">Date of Birth</label>
								<input
									id="dob"
									type="date"
									bind:value={dob}
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label for="pan" class="block font-semibold text-foreground mb-1">PAN Number</label>
								<input
									id="pan"
									type="text"
									bind:value={panNumber}
									placeholder="ABCDE1234F"
									class="w-full rounded-lg border border-border bg-background px-3 py-2 uppercase font-mono text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label for="uan" class="block font-semibold text-foreground mb-1">UAN Number</label>
								<input
									id="uan"
									type="text"
									bind:value={uanNumber}
									placeholder="100900200300"
									class="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>

						<div class="grid grid-cols-3 gap-3">
							<div>
								<label for="bank-name" class="block font-semibold text-foreground mb-1">Bank Name</label>
								<input
									id="bank-name"
									type="text"
									bind:value={bankName}
									placeholder="HDFC Bank"
									class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label for="account-number" class="block font-semibold text-foreground mb-1">Account Number</label>
								<input
									id="account-number"
									type="text"
									bind:value={bankAccountNumber}
									placeholder="501004829102"
									class="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label for="ifsc" class="block font-semibold text-foreground mb-1">IFSC Code</label>
								<input
									id="ifsc"
									type="text"
									bind:value={bankIfsc}
									placeholder="HDFC0001234"
									class="w-full rounded-lg border border-border bg-background px-3 py-2 uppercase font-mono text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>

						<div>
							<label for="address" class="block font-semibold text-foreground mb-1">Residential Address</label>
							<input
								id="address"
								type="text"
								bind:value={address}
								placeholder="City, State, Country"
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>
				{/if}

				<!-- TAB 3: Salary Configuration -->
				{#if activeTab === 'salary'}
					<div class="space-y-4 text-xs">
						{#if !canEditSalary}
							<div class="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
								<strong>Restricted Access:</strong> Only HR Officers and System Administrators have permission to modify monthly wage contracts.
							</div>
						{/if}

						<div class="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
							<div>
								<label for="monthly-wage" class="block font-semibold text-foreground mb-1">Total Monthly Wage (CTC Basis ₹)</label>
								<div class="relative w-full max-w-xs">
									<span class="absolute left-3 top-2.5 font-bold text-muted-foreground">₹</span>
									<input
										id="monthly-wage"
										type="number"
										bind:value={monthlyWage}
										disabled={!canEditSalary}
										min="0"
										step="1000"
										class="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 font-mono font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
									/>
								</div>
								<p class="mt-1 text-[11px] text-muted-foreground">
									Base figure used by the statutory formula engine to compute Basic (50%), HRA (25%), PF (12%), and Allowances.
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="flex items-center justify-end gap-2 border-t border-border p-4 bg-muted/20">
				<button
					type="button"
					class="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					onclick={onClose}
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="button"
					class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50"
					onclick={handleSave}
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						<span>Saving Changes...</span>
					{:else}
						<CheckCircle2 class="h-3.5 w-3.5" />
						<span>Save Profile</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
