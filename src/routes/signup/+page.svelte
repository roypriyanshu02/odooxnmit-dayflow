<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		Layers,
		Lock,
		Mail,
		User,
		Briefcase,
		Building2,
		ShieldCheck,
		ArrowRight,
		AlertCircle,
		CheckCircle2
	} from '@lucide/svelte';

	let { form } = $props();

	let firstName = $state(form?.values?.firstName ?? '');
	let lastName = $state(form?.values?.lastName ?? '');
	let email = $state(form?.values?.email ?? '');
	let password = $state('');
	let department = $state(form?.values?.department ?? 'Engineering');
	let jobTitle = $state(form?.values?.jobTitle ?? 'Software Engineer');
	let role = $state(form?.values?.role ?? 'employee');
	let isSubmitting = $state(false);

	const departments = [
		'Engineering',
		'Human Resources',
		'Product',
		'Design',
		'Marketing',
		'Sales',
		'Executive'
	];
</script>

<svelte:head>
	<title>Sign Up | Dayflow HRMS</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-8rem)] items-center justify-center py-6 px-4 sm:px-6">
	<div class="w-full max-w-lg space-y-6">
		<!-- Header -->
		<div class="text-center space-y-2">
			<div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30 mb-2">
				<Layers class="h-6 w-6" />
			</div>
			<h1 class="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
				Create Dayflow Account
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground">
				Set up your employee profile and access the HR suite
			</p>
		</div>

		<!-- Error Alert -->
		{#if form?.error}
			<div class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in-0 slide-in-from-top-1">
				<AlertCircle class="h-4 w-4 shrink-0" />
				<p class="font-medium">{form.error}</p>
			</div>
		{/if}

		<!-- Signup Form Card -->
		<div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
			<form
				action="/signup"
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						isSubmitting = false;
						if (result.type === 'redirect') {
							await goto(result.location, { invalidateAll: true });
						} else {
							await applyAction(result);
						}
					};
				}}
				class="space-y-4"
			>
				<!-- Name Row -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="firstName" class="block text-xs font-semibold text-foreground">
							First Name
						</label>
						<div class="relative">
							<User class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
							<input
								id="firstName"
								name="firstName"
								type="text"
								required
								bind:value={firstName}
								placeholder="Jane"
								class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="lastName" class="block text-xs font-semibold text-foreground">
							Last Name
						</label>
						<div class="relative">
							<User class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
							<input
								id="lastName"
								name="lastName"
								type="text"
								required
								bind:value={lastName}
								placeholder="Doe"
								class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
							/>
						</div>
					</div>
				</div>

				<!-- Email -->
				<div class="space-y-1.5">
					<label for="email" class="block text-xs font-semibold text-foreground">
						Work Email
					</label>
					<div class="relative">
						<Mail class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							placeholder="jane.doe@dayflow.internal"
							class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</div>
				</div>

				<!-- Password -->
				<div class="space-y-1.5">
					<label for="password" class="block text-xs font-semibold text-foreground">
						Password (minimum 6 characters)
					</label>
					<div class="relative">
						<Lock class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="new-password"
							required
							minlength="6"
							bind:value={password}
							placeholder="••••••••••••"
							class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</div>
				</div>

				<!-- Job Title & Department Row -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="department" class="block text-xs font-semibold text-foreground">
							Department
						</label>
						<div class="relative">
							<Building2 class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
							<select
								id="department"
								name="department"
								bind:value={department}
								class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
							>
								{#each departments as dept}
									<option value={dept}>{dept}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="jobTitle" class="block text-xs font-semibold text-foreground">
							Job Title
						</label>
						<div class="relative">
							<Briefcase class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
							<input
								id="jobTitle"
								name="jobTitle"
								type="text"
								required
								bind:value={jobTitle}
								placeholder="e.g. Senior Frontend Dev"
								class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
							/>
						</div>
					</div>
				</div>

				<!-- Role Selector -->
				<div class="space-y-1.5">
					<label for="role" class="block text-xs font-semibold text-foreground">
						Access Tier / System Role
					</label>
					<div class="grid grid-cols-3 gap-2">
						<label class="flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer text-xs transition-all {role === 'employee' ? 'border-primary bg-primary/5 text-foreground font-bold' : 'border-border bg-background/40 text-muted-foreground'}">
							<input type="radio" name="role" value="employee" bind:group={role} class="sr-only" />
							<span>Employee</span>
						</label>
						<label class="flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer text-xs transition-all {role === 'hr' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold' : 'border-border bg-background/40 text-muted-foreground'}">
							<input type="radio" name="role" value="hr" bind:group={role} class="sr-only" />
							<span>HR Officer</span>
						</label>
						<label class="flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer text-xs transition-all {role === 'admin' ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold' : 'border-border bg-background/40 text-muted-foreground'}">
							<input type="radio" name="role" value="admin" bind:group={role} class="sr-only" />
							<span>Admin</span>
						</label>
					</div>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all cursor-pointer mt-2"
				>
					{#if isSubmitting}
						<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
						<span>Creating account...</span>
					{:else}
						<span>Complete Registration</span>
						<ArrowRight class="h-3.5 w-3.5" />
					{/if}
				</button>
			</form>

			<div class="mt-4 pt-4 border-t border-border/60 text-center text-xs text-muted-foreground">
				Already have an account?
				<a href="/login" class="font-semibold text-primary hover:underline ml-1">
					Sign in
				</a>
			</div>
		</div>
	</div>
</div>
