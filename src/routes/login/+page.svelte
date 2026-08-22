<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		Layers,
		Lock,
		Mail,
		ShieldCheck,
		UserCheck,
		User as UserIcon,
		ArrowRight,
		Sparkles,
		AlertCircle,
		CheckCircle2,
		LogIn,
		MousePointerClick
	} from '@lucide/svelte';

	let { form } = $props();

	let email = $state(form?.email ?? '');
	let password = $state('');
	let isSubmitting = $state(false);
	let demoSubmittingRole = $state<string | null>(null);

	const demoAccounts = [
		{
			role: 'admin',
			roleLabel: 'Admin',
			name: 'Aarav Sharma',
			title: 'CEO & System Admin',
			email: 'admin@dayflow.internal',
			icon: ShieldCheck,
			color: 'border-purple-200 dark:border-purple-900/60 bg-purple-500/5 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300',
			badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
		},
		{
			role: 'hr',
			roleLabel: 'HR Officer',
			name: 'Priya Nair',
			title: 'Head of People & HR',
			email: 'hr@dayflow.internal',
			icon: UserCheck,
			color: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
			badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
		},
		{
			role: 'employee',
			roleLabel: 'Employee',
			name: 'Rohan Verma',
			title: 'Senior Software Engineer',
			email: 'employee@dayflow.internal',
			icon: UserIcon,
			color: 'border-sky-200 dark:border-sky-900/60 bg-sky-500/5 hover:bg-sky-500/10 text-sky-700 dark:text-sky-300',
			badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
		}
	];

	function fillCredentials(accEmail: string) {
		email = accEmail;
		password = 'Dayflow@2026';
	}
</script>

<svelte:head>
	<title>Sign In | Dayflow HRMS</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-8rem)] items-center justify-center py-6 px-4 sm:px-6">
	<div class="w-full max-w-md space-y-6">
		<!-- Header Card -->
		<div class="text-center space-y-2">
			<div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30 mb-2">
				<Layers class="h-6 w-6" />
			</div>
			<h1 class="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
				Sign in to Dayflow
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground">
				Enterprise Human Resource & Workforce Management Suite
			</p>
		</div>

		<!-- Error Alert -->
		{#if form?.error}
			<div class="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in-0 slide-from-top-1">
				<AlertCircle class="h-4 w-4 shrink-0" />
				<p class="font-medium">{form.error}</p>
			</div>
		{/if}

		<!-- Credentials Form Card -->
		<div class="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
			<!-- Quick Autofill Helper Header -->
			<div class="flex items-center justify-between pb-1 border-b border-border/50">
				<span class="text-[11px] font-semibold text-muted-foreground">Quick Autofill:</span>
				<div class="flex items-center gap-1.5">
					<button
						type="button"
						onclick={() => fillCredentials('admin@dayflow.internal')}
						class="rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300 transition-all cursor-pointer"
					>
						Admin
					</button>
					<button
						type="button"
						onclick={() => fillCredentials('hr@dayflow.internal')}
						class="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 transition-all cursor-pointer"
					>
						HR
					</button>
					<button
						type="button"
						onclick={() => fillCredentials('employee@dayflow.internal')}
						class="rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300 transition-all cursor-pointer"
					>
						Employee
					</button>
				</div>
			</div>

			<form
				action="/login?/login"
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
							placeholder="admin@dayflow.internal"
							class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<label for="password" class="block text-xs font-semibold text-foreground">
							Password
						</label>
						<span class="text-[11px] text-muted-foreground">Default: <code class="font-mono font-medium text-foreground bg-muted px-1 py-0.5 rounded">Dayflow@2026</code></span>
					</div>
					<div class="relative">
						<Lock class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							bind:value={password}
							placeholder="••••••••••••"
							class="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isSubmitting || demoSubmittingRole !== null}
					class="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all cursor-pointer"
				>
					{#if isSubmitting}
						<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
						<span>Signing in...</span>
					{:else}
						<span>Sign In to Dashboard</span>
						<ArrowRight class="h-3.5 w-3.5" />
					{/if}
				</button>
			</form>

			<div class="pt-3 border-t border-border/60 text-center text-xs text-muted-foreground">
				Need an account?
				<a href="/signup" class="font-semibold text-primary hover:underline ml-1">
					Create account
				</a>
			</div>
		</div>

		<!-- 1-Click Demo Accounts Quick-Login -->
		<div class="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-1.5 text-xs font-bold text-foreground">
					<Sparkles class="h-3.5 w-3.5 text-amber-500" />
					<span>Instant Demo Access</span>
				</div>
				<span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">1-Click Login</span>
			</div>
			<p class="text-[11px] text-muted-foreground leading-relaxed">
				Click any persona below to immediately log in with active credentials:
			</p>

			<div class="space-y-2.5">
				{#each demoAccounts as acc (acc.role)}
					{@const Icon = acc.icon}
					{@const isLoggingIn = demoSubmittingRole === acc.role}
					<form
						action="/login?/demoLogin"
						method="POST"
						use:enhance={() => {
							demoSubmittingRole = acc.role;
							return async ({ result, update }) => {
								demoSubmittingRole = null;
								if (result.type === 'redirect') {
									await goto(result.location, { invalidateAll: true });
								} else {
									await applyAction(result);
								}
							};
						}}
						class="w-full"
					>
						<input type="hidden" name="email" value={acc.email} />
						<input type="hidden" name="role" value={acc.role} />
						<button
							type="submit"
							disabled={isLoggingIn || isSubmitting}
							class="group w-full flex items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 {acc.color} cursor-pointer hover:shadow-xs disabled:opacity-60"
						>
							<div class="flex items-center gap-2.5 min-w-0">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-2xs">
									{#if isLoggingIn}
										<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
									{:else}
										<Icon class="h-4 w-4" />
									{/if}
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-1.5">
										<span class="text-xs font-bold text-foreground truncate">{acc.name}</span>
										<span class="rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider {acc.badge}">
											{acc.roleLabel}
										</span>
									</div>
									<p class="text-[10px] text-muted-foreground truncate">{acc.title} • {acc.email}</p>
								</div>
							</div>

							<div class="flex items-center gap-1 text-xs font-semibold shrink-0 ml-2">
								{#if isLoggingIn}
									<span class="text-[11px]">Logging in...</span>
								{:else}
									<span class="hidden sm:inline text-[11px]">Instant Login</span>
									<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
								{/if}
							</div>
						</button>
					</form>
				{/each}
			</div>
		</div>
	</div>
</div>
