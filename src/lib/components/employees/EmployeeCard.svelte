<script lang="ts">
	import type { EmployeeCardProps } from './types';
	import type { Employee, EmployeeWithRelations, AttendanceDisplayStatus } from '$lib/types/employee';
	import {
		Mail,
		Phone,
		Building2,
		ExternalLink,
		MoreVertical,
		Plane,
		Circle,
		CheckCircle2,
		Briefcase,
		User,
		Sparkles
	} from '@lucide/svelte';

	let {
		employee,
		viewMode = 'kanban',
		isSelected = false,
		showActions = true,
		canEdit = false,
		onSelect,
		onEdit,
		onDelete,
		onStatusChange
	}: EmployeeCardProps = $props();

	// Image fallback state
	let imgError = $state(false);

	// Compute full name
	const fullName = $derived(`${employee.firstName} ${employee.lastName}`.trim());

	// Initials for avatar fallback
	const initials = $derived(
		`${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'EM'
	);

	// Presence status determination
	const presenceStatus = $derived.by<AttendanceDisplayStatus>(() => {
		const empWithRel = employee as EmployeeWithRelations;
		if (empWithRel.attendanceStatus) {
			return empWithRel.attendanceStatus;
		}
		if (employee.status === 'on_leave') {
			return 'on_leave';
		}
		if (empWithRel.attendanceToday?.status === 'present' || empWithRel.attendanceToday?.checkIn) {
			return 'present';
		}
		if (employee.status === 'active') {
			return 'absent';
		}
		return 'absent';
	});

	// Department color styling badge mapping
	function getDepartmentColor(dept: string): { bg: string; text: string; border: string; dot: string } {
		const d = dept?.toLowerCase() || '';
		if (d.includes('eng')) {
			return {
				bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
				text: 'text-indigo-700 dark:text-indigo-300',
				border: 'border-indigo-200/60 dark:border-indigo-800/40',
				dot: 'bg-indigo-500'
			};
		}
		if (d.includes('prod')) {
			return {
				bg: 'bg-amber-500/10 dark:bg-amber-500/20',
				text: 'text-amber-700 dark:text-amber-300',
				border: 'border-amber-200/60 dark:border-amber-800/40',
				dot: 'bg-amber-500'
			};
		}
		if (d.includes('design')) {
			return {
				bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20',
				text: 'text-fuchsia-700 dark:text-fuchsia-300',
				border: 'border-fuchsia-200/60 dark:border-fuchsia-800/40',
				dot: 'bg-fuchsia-500'
			};
		}
		if (d.includes('sales')) {
			return {
				bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
				text: 'text-emerald-700 dark:text-emerald-300',
				border: 'border-emerald-200/60 dark:border-emerald-800/40',
				dot: 'bg-emerald-500'
			};
		}
		if (d.includes('market')) {
			return {
				bg: 'bg-purple-500/10 dark:bg-purple-500/20',
				text: 'text-purple-700 dark:text-purple-300',
				border: 'border-purple-200/60 dark:border-purple-800/40',
				dot: 'bg-purple-500'
			};
		}
		if (d.includes('hr') || d.includes('human')) {
			return {
				bg: 'bg-rose-500/10 dark:bg-rose-500/20',
				text: 'text-rose-700 dark:text-rose-300',
				border: 'border-rose-200/60 dark:border-rose-800/40',
				dot: 'bg-rose-500'
			};
		}
		if (d.includes('fin')) {
			return {
				bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
				text: 'text-cyan-700 dark:text-cyan-300',
				border: 'border-cyan-200/60 dark:border-cyan-800/40',
				dot: 'bg-cyan-500'
			};
		}
		return {
			bg: 'bg-slate-500/10 dark:bg-slate-500/20',
			text: 'text-slate-700 dark:text-slate-300',
			border: 'border-slate-200/60 dark:border-slate-800/40',
			dot: 'bg-slate-500'
		};
	}

	const deptTheme = $derived(getDepartmentColor(employee.department));

	function handleCardClick() {
		if (onSelect) {
			onSelect(employee);
		}
	}
</script>

{#if viewMode === 'list'}
	<!-- List Row Mode -->
	<div
		class="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-all duration-150 hover:border-border {isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}"
		onclick={handleCardClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleCardClick();
			}
		}}
	>
		<!-- Left: Avatar, Presence, Name, Role -->
		<div class="flex items-center gap-3.5 min-w-[260px]">
			<!-- Avatar with Presence Badge -->
			<div class="relative shrink-0">
				{#if employee.avatarUrl && !imgError}
					<img
						src={employee.avatarUrl}
						alt={fullName}
						class="h-11 w-11 rounded-full object-cover border border-border/60 shadow-2xs group-hover:scale-105 transition-transform"
						onerror={() => (imgError = true)}
					/>
				{:else}
					<div class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200/40">
						{initials}
					</div>
				{/if}

				<!-- Presence Dot Indicator -->
				<span class="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-card">
					{#if presenceStatus === 'present'}
						<span class="relative flex h-3 w-3">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" title="Present"></span>
						</span>
					{:else if presenceStatus === 'on_leave'}
						<span
							class="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 text-white text-[9px] font-bold shadow-2xs"
							title="On Leave"
						>
							✈️
						</span>
					{:else}
						<span class="inline-block h-3 w-3 rounded-full bg-amber-400" title="Absent / Remote"></span>
					{/if}
				</span>
			</div>

			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<a
						href="/employees/{employee.id}"
						class="font-bold text-foreground text-sm hover:text-primary transition-colors truncate"
						onclick={(e) => e.stopPropagation()}
					>
						{fullName}
					</a>
					<span class="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 shrink-0">
						{employee.id}
					</span>
				</div>
				<p class="text-xs text-muted-foreground truncate">{employee.jobTitle}</p>
			</div>
		</div>

		<!-- Middle: Department badge & Contact links -->
		<div class="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-muted-foreground">
			<!-- Department Badge -->
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border {deptTheme.bg} {deptTheme.text} {deptTheme.border}">
				<span class="h-1.5 w-1.5 rounded-full {deptTheme.dot}"></span>
				{employee.department}
			</span>

			<!-- Email -->
			{#if employee.email}
				<a
					href="mailto:{employee.email}"
					class="flex items-center gap-1.5 hover:text-foreground transition-colors max-w-[200px] truncate"
					onclick={(e) => e.stopPropagation()}
					title={employee.email}
				>
					<Mail class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
					<span class="truncate">{employee.email}</span>
				</a>
			{/if}

			<!-- Phone -->
			{#if employee.phone}
				<a
					href="tel:{employee.phone}"
					class="hidden md:flex items-center gap-1.5 hover:text-foreground transition-colors"
					onclick={(e) => e.stopPropagation()}
				>
					<Phone class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
					<span>{employee.phone}</span>
				</a>
			{/if}
		</div>

		<!-- Right: Status Badge & View Button -->
		<div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
			<!-- Presence Indicator Status Pill -->
			{#if presenceStatus === 'present'}
				<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
					Present
				</span>
			{:else if presenceStatus === 'on_leave'}
				<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
					<span>✈️</span>
					On Leave
				</span>
			{:else}
				<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
					<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
					Absent
				</span>
			{/if}

			<a
				href="/employees/{employee.id}"
				class="inline-flex items-center gap-1 p-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg border border-border/80 hover:bg-muted transition-colors"
				onclick={(e) => e.stopPropagation()}
				title="View Full Profile"
			>
				<ExternalLink class="h-3.5 w-3.5" />
			</a>
		</div>
	</div>
{:else}
	<!-- Kanban / Grid Card Mode (Odoo Style) -->
	<div
		class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md {isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}"
		onclick={handleCardClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleCardClick();
			}
		}}
	>
		<div>
			<!-- Top Header: Department Pill & Presence Indicator Status -->
			<div class="flex items-center justify-between gap-2 mb-4">
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-wide {deptTheme.bg} {deptTheme.text} {deptTheme.border}">
					<span class="h-1.5 w-1.5 rounded-full {deptTheme.dot}"></span>
					{employee.department}
				</span>

				<!-- Presence indicator pill -->
				{#if presenceStatus === 'present'}
					<span
						class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40"
						title="Present Today"
					>
						<span class="relative flex h-2 w-2">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
						</span>
						Present
					</span>
				{:else if presenceStatus === 'on_leave'}
					<span
						class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/40"
						title="On Leave"
					>
						<span>✈️</span>
						On Leave
					</span>
				{:else}
					<span
						class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40"
						title="Absent / Offline"
					>
						<span class="h-2 w-2 rounded-full bg-amber-400"></span>
						Absent
					</span>
				{/if}
			</div>

			<!-- Center Profile Information: Avatar & Identity -->
			<div class="flex items-start gap-4">
				<!-- Avatar with presence badge badgelet -->
				<div class="relative shrink-0">
					{#if employee.avatarUrl && !imgError}
						<img
							src={employee.avatarUrl}
							alt={fullName}
							class="h-14 w-14 rounded-2xl object-cover border border-border/80 shadow-2xs group-hover:scale-105 transition-transform duration-200"
							onerror={() => (imgError = true)}
						/>
					{:else}
						<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-base border border-indigo-200/50 shadow-2xs">
							{initials}
						</div>
					{/if}

					<!-- Mini presence dot overlay on avatar -->
					<div class="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5 shadow-xs">
						{#if presenceStatus === 'present'}
							<span class="block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card" title="🟢 Present"></span>
						{:else if presenceStatus === 'on_leave'}
							<span class="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 text-[9px] text-white ring-2 ring-card" title="✈️ On Leave">
								✈️
							</span>
						{:else}
							<span class="block h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-card" title="🟡 Absent/Remote"></span>
						{/if}
					</div>
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-1.5 flex-wrap">
						<a
							href="/employees/{employee.id}"
							class="text-base font-bold text-foreground hover:text-primary transition-colors truncate tracking-tight"
							onclick={(e) => e.stopPropagation()}
						>
							{fullName}
						</a>
					</div>

					<p class="text-xs font-medium text-muted-foreground line-clamp-1 mt-0.5">
						{employee.jobTitle}
					</p>

					<div class="mt-1 flex items-center gap-1.5">
						<span class="font-mono text-[10px] font-semibold text-muted-foreground bg-muted/60 border border-border/50 px-1.5 py-0.2 rounded">
							{employee.id}
						</span>
						{#if employee.about?.passions}
							<span class="text-[10px] text-muted-foreground/80 truncate max-w-[120px]" title={employee.about.passions}>
								• {employee.about.passions}
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Contact Metadata Details -->
			<div class="mt-4 space-y-1.5 border-t border-border/60 pt-3">
				<!-- Email Row -->
				<a
					href="mailto:{employee.email}"
					class="group/item flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
					onclick={(e) => e.stopPropagation()}
					title={employee.email}
				>
					<div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground group-hover/item:text-primary">
						<Mail class="h-3 w-3" />
					</div>
					<span class="truncate">{employee.email}</span>
				</a>

				<!-- Phone Row -->
				{#if employee.phone}
					<a
						href="tel:{employee.phone}"
						class="group/item flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
						onclick={(e) => e.stopPropagation()}
					>
						<div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground group-hover/item:text-primary">
							<Phone class="h-3 w-3" />
						</div>
						<span class="truncate font-mono">{employee.phone}</span>
					</a>
				{/if}
			</div>

			<!-- Top Skills Preview Pills -->
			{#if employee.resume?.skills && employee.resume.skills.length > 0}
				<div class="mt-3 flex flex-wrap items-center gap-1 pt-2">
					{#each employee.resume.skills.slice(0, 3) as skill (skill)}
						<span class="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/40 truncate max-w-[100px]">
							{skill}
						</span>
					{/each}
					{#if employee.resume.skills.length > 3}
						<span class="text-[10px] text-muted-foreground font-semibold">
							+{employee.resume.skills.length - 3}
						</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Card Footer: Profile Button -->
		<div class="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
			<a
				href="/employees/{employee.id}"
				class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground hover:border-border transition-all"
				onclick={(e) => e.stopPropagation()}
			>
				<span>View Profile</span>
				<ExternalLink class="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
			</a>

			{#if canEdit && onEdit}
				<button
					type="button"
					class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
					onclick={(e) => {
						e.stopPropagation();
						onEdit?.(employee);
					}}
					title="Edit Employee"
				>
					<Briefcase class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
	</div>
{/if}
