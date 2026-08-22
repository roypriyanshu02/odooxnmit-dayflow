<script lang="ts">
	import {
		Building2,
		UserCheck,
		Users,
		Heart,
		Compass,
		BookOpen,
		Sparkles,
		Briefcase,
		Calendar,
		Mail,
		Phone,
		ArrowUpRight
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';

	interface ManagerInfo {
		id: string;
		firstName: string;
		lastName: string;
		jobTitle: string;
		department: string;
		email: string;
		phone: string;
		avatarUrl?: string | null;
	}

	interface SubordinateInfo {
		id: string;
		firstName: string;
		lastName: string;
		jobTitle: string;
		department: string;
		avatarUrl?: string | null;
	}

	interface EmployeeData {
		id: string;
		firstName: string;
		lastName: string;
		jobTitle: string;
		department: string;
		joinDate: string;
		aboutBio?: string;
		aboutPassions?: string;
		aboutHobbies?: string;
		skills?: string[] | null;
		managerId?: string | null;
	}

	let {
		employee,
		manager = null,
		subordinates = []
	}: {
		employee: EmployeeData;
		manager?: ManagerInfo | null;
		subordinates?: SubordinateInfo[];
	} = $props();

	// Formatted join date
	const formattedJoinDate = $derived.by(() => {
		if (!employee.joinDate) return 'N/A';
		try {
			return new Date(employee.joinDate).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return employee.joinDate;
		}
	});

	const skillsList = $derived(Array.isArray(employee.skills) ? employee.skills : []);
</script>

<div class="space-y-6">
	<!-- Top Section: Bio Summary & Personal Drivers Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Professional Bio -->
		<Card.Root class="lg:col-span-2 p-6 shadow-2xs">
			<div class="flex items-center gap-2.5 mb-4">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
					<BookOpen class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Professional Summary</h3>
					<p class="text-xs text-muted-foreground">Executive overview and career mission</p>
				</div>
			</div>

			<p class="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
				{employee.aboutBio ||
					'No professional summary provided. Update the profile details to include career highlights and domain specialization.'}
			</p>

			<!-- Quick Metric Highlights -->
			<div class="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-border/60 pt-5">
				<div class="rounded-xl border border-border/60 bg-muted/30 p-3">
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
						<Briefcase class="h-3.5 w-3.5 text-primary" />
						<span class="font-medium">Primary Role</span>
					</div>
					<div class="font-semibold text-xs text-foreground truncate" title={employee.jobTitle}>
						{employee.jobTitle}
					</div>
				</div>

				<div class="rounded-xl border border-border/60 bg-muted/30 p-3">
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
						<Building2 class="h-3.5 w-3.5 text-primary" />
						<span class="font-medium">Department</span>
					</div>
					<div class="font-semibold text-xs text-foreground truncate" title={employee.department}>
						{employee.department}
					</div>
				</div>

				<div class="rounded-xl border border-border/60 bg-muted/30 p-3 col-span-2 sm:col-span-1">
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
						<Calendar class="h-3.5 w-3.5 text-primary" />
						<span class="font-medium">Joined On</span>
					</div>
					<div class="font-semibold text-xs text-foreground truncate">
						{formattedJoinDate}
					</div>
				</div>
			</div>
		</Card.Root>

		<!-- Passions & Hobbies Card -->
		<div class="space-y-4">
			<!-- Passions -->
			<Card.Root class="p-5 shadow-2xs">
				<div class="flex items-center gap-2 mb-2.5">
					<div class="flex h-7 w-7 items-center justify-center rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
						<Heart class="h-3.5 w-3.5" />
					</div>
					<h4 class="text-xs font-bold uppercase tracking-wider text-foreground">Passions & Focus</h4>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					{employee.aboutPassions || 'Continuous learning, high-impact systems, and engineering excellence.'}
				</p>
			</Card.Root>

			<!-- Hobbies -->
			<Card.Root class="p-5 shadow-2xs">
				<div class="flex items-center gap-2 mb-2.5">
					<div class="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
						<Compass class="h-3.5 w-3.5" />
					</div>
					<h4 class="text-xs font-bold uppercase tracking-wider text-foreground">Hobbies & Interests</h4>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					{employee.aboutHobbies || 'Reading technical literature, outdoor trekking, and photography.'}
				</p>
			</Card.Root>
		</div>
	</div>

	<!-- Middle Section: Skills Cloud & Specializations -->
	<Card.Root class="p-6 shadow-2xs">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-2.5">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<Sparkles class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Skills & Core Competencies</h3>
					<p class="text-xs text-muted-foreground">Verified technical proficiencies and domain capabilities</p>
				</div>
			</div>
			<Badge variant="outline" class="border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
				{skillsList.length} {skillsList.length === 1 ? 'Skill' : 'Skills'}
			</Badge>
		</div>

		{#if skillsList.length > 0}
			<div class="flex flex-wrap gap-2 pt-2">
				{#each skillsList as skill}
					<Badge variant="secondary" class="gap-1.5 px-3 py-1 text-xs font-medium">
						<span class="h-1.5 w-1.5 rounded-full bg-primary/60"></span>
						<span>{skill}</span>
					</Badge>
				{/each}
			</div>
		{:else}
			<div class="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
				<p class="text-xs text-muted-foreground">No specific skills listed for this profile yet.</p>
			</div>
		{/if}
	</Card.Root>

	<!-- Bottom Section: Organizational Hierarchy & Team Structure -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Reporting Manager Card -->
		<Card.Root class="p-6 shadow-2xs flex flex-col justify-between">
			<div>
				<div class="flex items-center gap-2.5 mb-4">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
						<UserCheck class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-base font-bold text-foreground">Reporting Manager</h3>
						<p class="text-xs text-muted-foreground">Direct managerial hierarchy</p>
					</div>
				</div>

				{#if manager}
					<div class="flex items-start gap-3.5 rounded-xl border border-border/70 bg-muted/30 p-4 transition-all hover:bg-muted/50">
						<Avatar.Root class="h-12 w-12 rounded-xl ring-2 ring-border/80">
							{#if manager.avatarUrl}
								<Avatar.Image src={manager.avatarUrl} alt="{manager.firstName} {manager.lastName}" class="rounded-xl" />
							{/if}
							<Avatar.Fallback class="rounded-xl bg-primary/10 text-primary font-bold">
								{manager.firstName?.[0]}{manager.lastName?.[0]}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between">
								<h4 class="text-sm font-bold text-foreground truncate">
									{manager.firstName} {manager.lastName}
								</h4>
								<a
									href="/employees/{manager.id}"
									class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-2 shrink-0"
								>
									<span>View</span>
									<ArrowUpRight class="h-3 w-3" />
								</a>
							</div>
							<p class="text-xs text-muted-foreground truncate">{manager.jobTitle}</p>
							<div class="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
								{#if manager.email}
									<a href="mailto:{manager.email}" class="flex items-center gap-1 hover:text-foreground">
										<Mail class="h-3 w-3 text-primary/70" />
										<span class="truncate max-w-[150px]">{manager.email}</span>
									</a>
								{/if}
								{#if manager.phone}
									<a href="tel:{manager.phone}" class="flex items-center gap-1 hover:text-foreground">
										<Phone class="h-3 w-3 text-primary/70" />
										<span>{manager.phone}</span>
									</a>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<div class="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-center">
						<p class="text-xs font-medium text-foreground">Top Level Executive</p>
						<p class="text-[11px] text-muted-foreground mt-0.5">Reports directly to Board of Directors & Governance</p>
					</div>
				{/if}
			</div>
		</Card.Root>

		<!-- Direct Reports & Team Members -->
		<Card.Root class="p-6 shadow-2xs flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2.5">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
							<Users class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">Direct Reports</h3>
							<p class="text-xs text-muted-foreground">Subordinate team members</p>
						</div>
					</div>
					<Badge variant="secondary" class="text-[11px] font-semibold">
						{subordinates.length} {subordinates.length === 1 ? 'member' : 'members'}
					</Badge>
				</div>

				{#if subordinates.length > 0}
					<div class="space-y-2.5 max-h-56 overflow-y-auto pr-1">
						{#each subordinates as sub}
							<a
								href="/employees/{sub.id}"
								class="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 transition-colors hover:border-primary/40 hover:bg-muted/50 group"
							>
								<div class="flex items-center gap-2.5 min-w-0">
									<Avatar.Root class="h-8 w-8 rounded-lg ring-1 ring-border">
										{#if sub.avatarUrl}
											<Avatar.Image src={sub.avatarUrl} alt="{sub.firstName} {sub.lastName}" class="rounded-lg" />
										{/if}
										<Avatar.Fallback class="rounded-lg bg-primary/10 text-primary font-bold text-xs">
											{sub.firstName?.[0]}{sub.lastName?.[0]}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="min-w-0">
										<div class="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
											{sub.firstName} {sub.lastName}
										</div>
										<div class="text-[11px] text-muted-foreground truncate">{sub.jobTitle}</div>
									</div>
								</div>
								<ArrowUpRight class="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
							</a>
						{/each}
					</div>
				{:else}
					<div class="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-center">
						<p class="text-xs text-muted-foreground">Individual Contributor with no direct reports assigned.</p>
					</div>
				{/if}
			</div>
		</Card.Root>
	</div>
</div>
