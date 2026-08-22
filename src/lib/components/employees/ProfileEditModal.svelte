<script lang="ts">
	import {
		Upload,
		User,
		Lock,
		ShieldCheck,
		CheckCircle2,
		AlertTriangle,
		Loader2,
		Camera
	} from '@lucide/svelte';
	import type { Employee } from '$lib/types/employee';
	import { auth } from '$lib/state/auth.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Tabs from '$lib/components/ui/tabs';

	interface Props {
		open?: boolean;
		employee: Employee;
		onClose?: () => void;
		onSuccess?: (updated: Employee) => void;
	}

	let {
		open = $bindable(false),
		employee,
		onClose,
		onSuccess
	}: Props = $props();

	let activeTab = $state('general');

	// Editable form states
	let firstName = $state('');
	let lastName = $state('');
	let jobTitle = $state('');
	let department = $state('Engineering');
	let phone = $state('');
	let aboutBio = $state('');
	let avatarUrl = $state('');

	// Private Info
	let dob = $state('');
	let panNumber = $state('');
	let uanNumber = $state('');
	let bankName = $state('');
	let bankAccountNumber = $state('');
	let bankIfsc = $state('');
	let address = $state('');

	// Salary Config
	let monthlyWage = $state(0);

	// Synchronize when employee prop changes
	$effect(() => {
		if (employee) {
			firstName = employee.firstName || '';
			lastName = employee.lastName || '';
			jobTitle = employee.jobTitle || '';
			department = employee.department || 'Engineering';
			phone = employee.phone || '';
			aboutBio = employee.about?.bio || (employee as any).aboutBio || '';
			avatarUrl = employee.avatarUrl || '';

			dob = employee.privateInfo?.dob || (employee as any).dob || '';
			panNumber = employee.privateInfo?.panNumber || (employee as any).panNumber || '';
			uanNumber = employee.privateInfo?.uanNumber || (employee as any).uanNumber || '';
			bankName = employee.privateInfo?.bankName || (employee as any).bankName || '';
			bankAccountNumber = employee.privateInfo?.bankAccountNumber || (employee as any).bankAccountNumber || '';
			bankIfsc = employee.privateInfo?.bankIfsc || (employee as any).bankIfsc || '';
			address = employee.privateInfo?.address || (employee as any).address || '';

			monthlyWage = employee.monthlyWage || 0;
		}
	});

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

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			onClose?.();
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
				open = false;
				onClose?.();
			}, 1200);
		} catch (err: any) {
			errorMessage = err.message || 'An unexpected error occurred.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-2xl p-0 overflow-hidden gap-0">
		<!-- Header -->
		<Dialog.Header class="flex flex-row items-center gap-3 p-5 bg-muted/20 border-b border-border space-y-0">
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
			<div class="space-y-0.5">
				<Dialog.Title class="text-base font-bold text-foreground">Edit Employee Profile</Dialog.Title>
				<Dialog.Description class="text-xs text-muted-foreground font-mono">{employee.id} • {employee.department}</Dialog.Description>
			</div>
		</Dialog.Header>

		<!-- Tabs -->
		<Tabs.Root bind:value={activeTab} class="w-full">
			<Tabs.List class="w-full justify-start rounded-none border-b border-border bg-muted/10 px-5 h-11">
				<Tabs.Trigger value="general" class="gap-1.5 text-xs">
					<User class="h-3.5 w-3.5" />
					<span>General Details</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="private" class="gap-1.5 text-xs">
					<Lock class="h-3.5 w-3.5" />
					<span>Private & Banking</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="salary" class="gap-1.5 text-xs">
					<ShieldCheck class="h-3.5 w-3.5" />
					<span>Salary Configuration</span>
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Body Form Fields -->
			<div class="p-5 max-h-[55vh] overflow-y-auto space-y-4">
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
				<Tabs.Content value="general" class="space-y-3.5 text-xs mt-0">
					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<Label for="first-name">First Name</Label>
							<Input id="first-name" type="text" bind:value={firstName} class="h-8 text-xs" />
						</div>
						<div class="space-y-1.5">
							<Label for="last-name">Last Name</Label>
							<Input id="last-name" type="text" bind:value={lastName} class="h-8 text-xs" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<Label for="job-title">Job Title / Designation</Label>
							<Input id="job-title" type="text" bind:value={jobTitle} class="h-8 text-xs" />
						</div>
						<div class="space-y-1.5">
							<Label for="department">Department</Label>
							<select
								id="department"
								bind:value={department}
								class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8"
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
						<div class="space-y-1.5">
							<Label for="phone">Contact Phone</Label>
							<Input id="phone" type="text" bind:value={phone} placeholder="+91 98765 43210" class="h-8 text-xs" />
						</div>
						<div class="space-y-1.5">
							<Label for="avatar-url">Avatar Image URL</Label>
							<Input id="avatar-url" type="text" bind:value={avatarUrl} placeholder="https://..." class="h-8 text-xs" />
						</div>
					</div>

					<div class="space-y-1.5">
						<Label for="about-bio">About / Bio Summary</Label>
						<textarea
							id="about-bio"
							bind:value={aboutBio}
							rows="3"
							placeholder="Brief summary of background and passions..."
							class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
						></textarea>
					</div>
				</Tabs.Content>

				<!-- TAB 2: Private & Banking -->
				<Tabs.Content value="private" class="space-y-3.5 text-xs mt-0">
					<div class="grid grid-cols-3 gap-3">
						<div class="space-y-1.5">
							<Label for="dob">Date of Birth</Label>
							<Input id="dob" type="date" bind:value={dob} class="h-8 text-xs" />
						</div>
						<div class="space-y-1.5">
							<Label for="pan">PAN Number</Label>
							<Input id="pan" type="text" bind:value={panNumber} placeholder="ABCDE1234F" class="h-8 text-xs font-mono uppercase" />
						</div>
						<div class="space-y-1.5">
							<Label for="uan">UAN Number</Label>
							<Input id="uan" type="text" bind:value={uanNumber} placeholder="100900200300" class="h-8 text-xs font-mono" />
						</div>
					</div>

					<div class="grid grid-cols-3 gap-3">
						<div class="space-y-1.5">
							<Label for="bank-name">Bank Name</Label>
							<Input id="bank-name" type="text" bind:value={bankName} placeholder="HDFC Bank" class="h-8 text-xs" />
						</div>
						<div class="space-y-1.5">
							<Label for="account-number">Account Number</Label>
							<Input id="account-number" type="text" bind:value={bankAccountNumber} placeholder="501004829102" class="h-8 text-xs font-mono" />
						</div>
						<div class="space-y-1.5">
							<Label for="ifsc">IFSC Code</Label>
							<Input id="ifsc" type="text" bind:value={bankIfsc} placeholder="HDFC0001234" class="h-8 text-xs font-mono uppercase" />
						</div>
					</div>

					<div class="space-y-1.5">
						<Label for="address">Residential Address</Label>
						<Input id="address" type="text" bind:value={address} placeholder="City, State, Country" class="h-8 text-xs" />
					</div>
				</Tabs.Content>

				<!-- TAB 3: Salary Configuration -->
				<Tabs.Content value="salary" class="space-y-4 text-xs mt-0">
					{#if !canEditSalary}
						<div class="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
							<strong>Restricted Access:</strong> Only HR Officers and System Administrators have permission to modify monthly wage contracts.
						</div>
					{/if}

					<div class="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
						<div class="space-y-1.5">
							<Label for="monthly-wage">Total Monthly Wage (CTC Basis ₹)</Label>
							<div class="relative w-full max-w-xs">
								<span class="absolute left-3 top-2 font-bold text-muted-foreground">₹</span>
								<Input
									id="monthly-wage"
									type="number"
									bind:value={monthlyWage}
									disabled={!canEditSalary}
									min="0"
									step="1000"
									class="pl-7 h-8 font-mono font-bold"
								/>
							</div>
							<p class="text-[11px] text-muted-foreground">
								Base figure used by the statutory formula engine to compute Basic (50%), HRA (25%), PF (12%), and Allowances.
							</p>
						</div>
					</div>
				</Tabs.Content>
			</div>
		</Tabs.Root>

		<!-- Footer Actions -->
		<Dialog.Footer class="flex items-center justify-end gap-2 border-t border-border p-4 bg-muted/20">
			<Button
				variant="outline"
				size="sm"
				onclick={() => {
					open = false;
					onClose?.();
				}}
				disabled={isSubmitting}
			>
				Cancel
			</Button>
			<Button
				size="sm"
				onclick={handleSave}
				disabled={isSubmitting}
				class="gap-1.5"
			>
				{#if isSubmitting}
					<Loader2 class="h-3.5 w-3.5 animate-spin" />
					<span>Saving Changes...</span>
				{:else}
					<CheckCircle2 class="h-3.5 w-3.5" />
					<span>Save Profile</span>
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
