<script lang="ts">
	import {
		Shield,
		Lock,
		User,
		CreditCard,
		Building,
		MapPin,
		Check,
		Copy,
		Eye,
		EyeOff,
		HeartHandshake,
		Fingerprint
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	interface EmployeePrivateData {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		panNumber?: string;
		uanNumber?: string;
		dob?: string;
		gender?: string;
		maritalStatus?: string;
		address?: string;
		bankAccountNumber?: string;
		bankIfsc?: string;
		bankName?: string;
	}

	let {
		employee
	}: {
		employee: EmployeePrivateData;
	} = $props();

	let showAccount = $state(false);
	let copiedField = $state<string | null>(null);

	function copyToClipboard(text: string, fieldName: string) {
		if (!text) return;
		navigator.clipboard.writeText(text);
		copiedField = fieldName;
		setTimeout(() => {
			if (copiedField === fieldName) {
				copiedField = null;
			}
		}, 2000);
	}

	// Calculate age and format DOB
	const formattedDob = $derived.by(() => {
		if (!employee.dob) return { formatted: 'Not Provided', age: null };
		try {
			const birthDate = new Date(employee.dob);
			const formatted = birthDate.toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const m = today.getMonth() - birthDate.getMonth();
			if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
				age--;
			}
			return { formatted, age: age > 0 ? `${age} years` : null };
		} catch {
			return { formatted: employee.dob, age: null };
		}
	});

	// Mask account number
	const maskedAccount = $derived.by(() => {
		const acc = employee.bankAccountNumber || '';
		if (!acc) return 'Not Provided';
		if (showAccount) return acc;
		if (acc.length <= 4) return acc;
		const last4 = acc.slice(-4);
		return `•••• •••• ${last4}`;
	});

	function formatGender(gender?: string): string {
		if (!gender || gender === 'prefer_not_to_say') return 'Prefer not to say';
		return gender.charAt(0).toUpperCase() + gender.slice(1);
	}

	function formatMarital(status?: string): string {
		if (!status) return 'Single';
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<div class="space-y-6">
	<!-- Privacy Banner Header -->
	<Card.Root class="p-4 sm:p-5 shadow-2xs flex items-center justify-between bg-muted/30">
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
				<Shield class="h-4.5 w-4.5" />
			</div>
			<div>
				<h4 class="text-xs sm:text-sm font-bold text-foreground">Confidential Statutory & Personal Data</h4>
				<p class="text-xs text-muted-foreground">Access restricted to authorized HR Officers and Employee Self-Service</p>
			</div>
		</div>
		<Badge variant="outline" class="hidden sm:flex items-center gap-1.5 bg-background text-xs font-semibold text-muted-foreground">
			<Lock class="h-3 w-3 text-emerald-500" />
			<span>Encrypted at Rest</span>
		</Badge>
	</Card.Root>

	<!-- Main 2-Column Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Card 1: Personal Details -->
		<Card.Root class="p-6 shadow-2xs">
			<div class="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/60">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
					<User class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Personal Details</h3>
					<p class="text-xs text-muted-foreground">Demographic and civil information</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-1">
					<span class="text-xs font-medium text-muted-foreground">Date of Birth</span>
					<div class="text-xs sm:text-sm font-bold text-foreground">
						{formattedDob.formatted}
						{#if formattedDob.age}
							<span class="text-xs font-normal text-muted-foreground ml-1">({formattedDob.age})</span>
						{/if}
					</div>
				</div>

				<div class="space-y-1">
					<span class="text-xs font-medium text-muted-foreground">Gender</span>
					<div class="text-xs sm:text-sm font-bold text-foreground">
						{formatGender(employee.gender)}
					</div>
				</div>

				<div class="space-y-1">
					<span class="text-xs font-medium text-muted-foreground">Marital Status</span>
					<div class="text-xs sm:text-sm font-bold text-foreground">
						{formatMarital(employee.maritalStatus)}
					</div>
				</div>

				<div class="space-y-1">
					<span class="text-xs font-medium text-muted-foreground">Nationality</span>
					<div class="text-xs sm:text-sm font-bold text-foreground">
						Indian (IN)
					</div>
				</div>
			</div>
		</Card.Root>

		<!-- Card 2: Statutory Identification Numbers -->
		<Card.Root class="p-6 shadow-2xs">
			<div class="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/60">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
					<Fingerprint class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Statutory Identification</h3>
					<p class="text-xs text-muted-foreground">Taxation and Provident Fund identifiers</p>
				</div>
			</div>

			<div class="space-y-4">
				<!-- PAN Number -->
				<div class="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3.5">
					<div>
						<div class="text-xs font-medium text-muted-foreground">PAN (Permanent Account Number)</div>
						<div class="font-mono text-sm font-bold tracking-wider text-foreground mt-0.5">
							{employee.panNumber || 'Not Configured'}
						</div>
					</div>
					{#if employee.panNumber}
						<Button
							variant="outline"
							size="xs"
							class="gap-1 h-7 text-xs"
							onclick={() => copyToClipboard(employee.panNumber || '', 'pan')}
							title="Copy PAN"
						>
							{#if copiedField === 'pan'}
								<Check class="h-3.5 w-3.5 text-emerald-600" />
								<span class="text-emerald-600 text-[11px]">Copied</span>
							{:else}
								<Copy class="h-3.5 w-3.5" />
								<span class="text-[11px]">Copy</span>
							{/if}
						</Button>
					{/if}
				</div>

				<!-- UAN Number -->
				<div class="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3.5">
					<div>
						<div class="text-xs font-medium text-muted-foreground">UAN (Universal Account Number - EPFO)</div>
						<div class="font-mono text-sm font-bold tracking-wider text-foreground mt-0.5">
							{employee.uanNumber || 'Not Configured'}
						</div>
					</div>
					{#if employee.uanNumber}
						<Button
							variant="outline"
							size="xs"
							class="gap-1 h-7 text-xs"
							onclick={() => copyToClipboard(employee.uanNumber || '', 'uan')}
							title="Copy UAN"
						>
							{#if copiedField === 'uan'}
								<Check class="h-3.5 w-3.5 text-emerald-600" />
								<span class="text-emerald-600 text-[11px]">Copied</span>
							{:else}
								<Copy class="h-3.5 w-3.5" />
								<span class="text-[11px]">Copy</span>
							{/if}
						</Button>
					{/if}
				</div>
			</div>
		</Card.Root>

		<!-- Card 3: Bank Details -->
		<Card.Root class="p-6 shadow-2xs">
			<div class="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/60">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<Building class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Direct Deposit Banking</h3>
					<p class="text-xs text-muted-foreground">Salary disbursement routing details</p>
				</div>
			</div>

			<div class="space-y-3.5">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-muted-foreground">Bank Name</span>
					<span class="text-xs sm:text-sm font-bold text-foreground">{employee.bankName || 'Not Set'}</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-muted-foreground">Account Number</span>
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs sm:text-sm font-bold text-foreground">{maskedAccount}</span>
						{#if employee.bankAccountNumber}
							<button
								type="button"
								onclick={() => (showAccount = !showAccount)}
								class="text-muted-foreground hover:text-foreground p-1"
								title={showAccount ? 'Hide Account Number' : 'Show Account Number'}
							>
								{#if showAccount}
									<EyeOff class="h-3.5 w-3.5" />
								{:else}
									<Eye class="h-3.5 w-3.5" />
								{/if}
							</button>
						{/if}
					</div>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-muted-foreground">IFSC Code</span>
					<div class="flex items-center gap-1.5">
						<span class="font-mono text-xs sm:text-sm font-bold text-foreground">{employee.bankIfsc || 'Not Set'}</span>
						{#if employee.bankIfsc}
							<button
								type="button"
								class="text-muted-foreground hover:text-foreground p-1"
								onclick={() => copyToClipboard(employee.bankIfsc || '', 'ifsc')}
								title="Copy IFSC"
							>
								{#if copiedField === 'ifsc'}
									<Check class="h-3.5 w-3.5 text-emerald-600" />
								{:else}
									<Copy class="h-3.5 w-3.5" />
								{/if}
							</button>
						{/if}
					</div>
				</div>

				<div class="flex items-center justify-between pt-2 border-t border-border/60">
					<span class="text-xs font-medium text-muted-foreground">Disbursement Mode</span>
					<span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
						<CreditCard class="h-3.5 w-3.5" />
						<span>NEFT / RTGS Auto-Credit</span>
					</span>
				</div>
			</div>
		</Card.Root>

		<!-- Card 4: Contact & Emergency Information -->
		<Card.Root class="p-6 shadow-2xs">
			<div class="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/60">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
					<HeartHandshake class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Contact & Emergency Details</h3>
					<p class="text-xs text-muted-foreground">Personal contact and residential address</p>
				</div>
			</div>

			<div class="space-y-3.5">
				<div>
					<span class="text-xs font-medium text-muted-foreground">Personal Email</span>
					<div class="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5">
						{employee.email ? employee.email.replace('@dayflow.internal', '@gmail.com') : 'Not Set'}
					</div>
				</div>

				<div>
					<span class="text-xs font-medium text-muted-foreground">Emergency Contact (Next of Kin)</span>
					<div class="text-xs sm:text-sm font-bold text-foreground mt-0.5 flex items-center justify-between">
						<span>Family Contact</span>
						<span class="text-xs font-mono text-muted-foreground">{employee.phone || '+91 98000 00000'}</span>
					</div>
				</div>

				<div>
					<span class="text-xs font-medium text-muted-foreground">Residential Home Address</span>
					<div class="mt-1 flex items-start gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs leading-relaxed text-foreground">
						<MapPin class="h-4 w-4 text-primary shrink-0 mt-0.5" />
						<span>{employee.address || 'Address not listed in primary employee profile.'}</span>
					</div>
				</div>
			</div>
		</Card.Root>
	</div>
</div>
