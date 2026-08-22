<script lang="ts">
	import { auth, DEMO_USERS } from '$lib/state/auth.svelte';
	import type { UserRole } from '$lib/types';
	import { 
		ShieldCheck, 
		UserCheck, 
		User as UserIcon, 
		ChevronDown, 
		Check, 
		Sparkles, 
		LogOut,
		UserCircle
	} from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	let isOpen = $state(false);
	const currentUser = $derived(auth.user);

	function getRoleConfig(role: UserRole) {
		switch (role) {
			case 'admin':
				return {
					label: 'Admin',
					badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
					activeDotClass: 'bg-purple-500',
					avatarClass: 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white',
					icon: ShieldCheck
				};
			case 'hr':
				return {
					label: 'HR Officer',
					badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
					activeDotClass: 'bg-emerald-500',
					avatarClass: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
					icon: UserCheck
				};
			case 'employee':
			default:
				return {
					label: 'Employee',
					badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
					activeDotClass: 'bg-sky-500',
					avatarClass: 'bg-gradient-to-br from-blue-600 to-cyan-700 text-white',
					icon: UserIcon
				};
		}
	}

	const currentRoleConfig = $derived(getRoleConfig(currentUser.role));
	const ActiveRoleIcon = $derived(currentRoleConfig.icon);
</script>

<DropdownMenu.Root bind:open={isOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="h-auto rounded-full px-2.5 py-1.5 font-medium shadow-2xs gap-2.5"
				{...props}
				title="User Profile & Settings"
			>
				<!-- Avatar / Initials with Status Dot -->
				<div class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs {currentRoleConfig.avatarClass}">
					<span>{currentUser.initials}</span>
					<span class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background {currentRoleConfig.activeDotClass}"></span>
				</div>

				<!-- User details -->
				<div class="hidden flex-col items-start text-left sm:flex leading-tight">
					<span class="font-semibold text-foreground tracking-tight text-xs">{currentUser.name}</span>
					<span class="text-[10px] text-muted-foreground">{currentUser.jobTitle}</span>
				</div>

				<!-- Role Badge -->
				<Badge class="gap-1 text-[10px] uppercase tracking-wider {currentRoleConfig.badgeClass}">
					<ActiveRoleIcon class="h-3 w-3" />
					{currentRoleConfig.label}
				</Badge>

				<ChevronDown
					class="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180 text-foreground' : ''}"
				/>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class="w-80 p-1.5" align="end">
		<!-- User Account Header -->
		<div class="border-b border-border/80 px-3 py-3">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-2xs {currentRoleConfig.avatarClass}">
					<span>{currentUser.initials}</span>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="font-bold text-foreground truncate text-sm">{currentUser.name}</span>
					<span class="text-[11px] text-muted-foreground truncate">{currentUser.email}</span>
					<div class="mt-1 flex items-center gap-1.5">
						<Badge class="gap-1 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider {currentRoleConfig.badgeClass}">
							{currentRoleConfig.label}
						</Badge>
						<span class="text-[10px] text-muted-foreground truncate">• {currentUser.department}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Navigation Links -->
		{#if currentUser.employeeId}
			<div class="py-1 border-b border-border/60">
				<DropdownMenu.Item class="p-0">
					<a
						href="/employees/{currentUser.employeeId}"
						class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
						onclick={() => (isOpen = false)}
					>
						<UserCircle class="h-4 w-4 text-primary" />
						<span>View My Employee Profile</span>
					</a>
				</DropdownMenu.Item>
			</div>
		{/if}

		<!-- Quick Switch Demo Account Header -->
		<div class="px-3 pt-2.5 pb-1 flex items-center justify-between">
			<div class="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
				<Sparkles class="h-3.5 w-3.5 text-amber-500" />
				<span>Switch Demo Persona</span>
			</div>
			<span class="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">1-Click</span>
		</div>

		<!-- Demo Switch List -->
		<div class="py-1 space-y-0.5">
			{#each DEMO_USERS as user (user.id)}
				{@const config = getRoleConfig(user.role)}
				{@const isSelected = user.email === currentUser.email}
				<form action="/login?/demoLogin" method="POST" use:enhance>
					<input type="hidden" name="email" value={user.email} />
					<input type="hidden" name="role" value={user.role} />
					<button
						type="submit"
						class="group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent focus:bg-accent focus:outline-hidden cursor-pointer {isSelected ? 'bg-accent/70' : ''}"
					>
						<div class="flex items-center gap-2 min-w-0">
							<div class="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold {config.avatarClass}">
								<span>{user.initials}</span>
							</div>
							<div class="flex flex-col min-w-0">
								<span class="font-medium text-foreground text-[12px] truncate">{user.name}</span>
								<span class="text-[10px] text-muted-foreground truncate">{config.label} • {user.email}</span>
							</div>
						</div>

						{#if isSelected}
							<Check class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
						{/if}
					</button>
				</form>
			{/each}
		</div>

		<!-- Sign Out Action -->
		<DropdownMenu.Separator />
		<div class="p-1">
			<form action="/logout" method="POST" use:enhance class="w-full">
				<Button
					type="submit"
					variant="destructive"
					class="w-full h-8 text-xs font-semibold gap-2"
				>
					<LogOut class="h-3.5 w-3.5" />
					<span>Sign Out of Dayflow</span>
				</Button>
			</form>
		</div>
	</DropdownMenu.Content>
</DropdownMenu.Root>
