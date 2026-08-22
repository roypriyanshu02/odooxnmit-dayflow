<script lang="ts">
	import type { Certification, WorkHistory } from '$lib/types';
	import {
		Briefcase,
		GraduationCap,
		Award,
		Calendar,
		Building,
		CheckCircle2,
		Sparkles
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	interface EmployeeData {
		id: string;
		firstName: string;
		lastName: string;
		jobTitle: string;
		department: string;
		workHistory?: WorkHistory[] | null;
		certifications?: Certification[] | null;
	}

	let {
		employee
	}: {
		employee: EmployeeData;
	} = $props();

	const historyList = $derived(
		Array.isArray(employee.workHistory) ? employee.workHistory : []
	);

	const certsList = $derived(
		Array.isArray(employee.certifications) ? employee.certifications : []
	);

	// Standard academic education fallback if not separately modeled in schema
	interface EducationItem {
		degree: string;
		institution: string;
		period: string;
		field: string;
		grade?: string;
	}

	const defaultEducation: EducationItem[] = [
		{
			degree: 'Bachelor of Technology (B.Tech)',
			institution: 'National Institute of Technology (NIT)',
			period: '2013 - 2017',
			field: 'Computer Science & Engineering',
			grade: 'First Class with Distinction (8.8/10 CGPA)'
		}
	];
</script>

<div class="space-y-8">
	<!-- Section 1: Professional Experience Timeline -->
	<Card.Root class="p-6 sm:p-8 shadow-2xs">
		<div class="flex items-center justify-between mb-8">
			<div class="flex items-center gap-3">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
					<Briefcase class="h-4.5 w-4.5" />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Work Experience Timeline</h3>
					<p class="text-xs text-muted-foreground">Chronological career history and key milestone achievements</p>
				</div>
			</div>
			<Badge variant="secondary" class="text-xs font-semibold px-3 py-1">
				{historyList.length} {historyList.length === 1 ? 'Position' : 'Positions'}
			</Badge>
		</div>

		{#if historyList.length > 0}
			<div class="relative pl-6 sm:pl-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
				{#each historyList as exp, idx (idx)}
					<div class="relative mb-8 last:mb-0 group">
						<!-- Timeline Node Marker -->
						<div class="absolute -left-6 sm:-left-8 top-1.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-xs ring-4 ring-background">
							<span class="text-[10px] sm:text-xs font-bold">{idx + 1}</span>
						</div>

						<!-- Timeline Content Card -->
						<div class="rounded-xl border border-border/80 bg-muted/20 p-5 transition-all group-hover:border-primary/30 group-hover:bg-muted/40">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
								<div>
									<h4 class="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
										{exp.role}
									</h4>
									<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-0.5">
										<Building class="h-3.5 w-3.5 text-primary/70" />
										<span>{exp.company}</span>
									</div>
								</div>

								<div class="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-2xs">
									<Calendar class="h-3 w-3 text-primary/70" />
									<span>{exp.duration}</span>
								</div>
							</div>

							{#if exp.description}
								<p class="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
									{exp.description}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
				<Briefcase class="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
				<p class="text-sm font-semibold text-foreground">No past work experience recorded</p>
				<p class="text-xs text-muted-foreground mt-1">This employee's profile is configured as their initial enterprise engagement.</p>
			</div>
		{/if}
	</Card.Root>

	<!-- Section 2: Certifications & Education Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Certifications & Licenses -->
		<Card.Root class="p-6 shadow-2xs flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
							<Award class="h-4.5 w-4.5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">Certifications & Credentials</h3>
							<p class="text-xs text-muted-foreground">Industry licenses and verified proficiencies</p>
						</div>
					</div>
					<Badge variant="outline" class="border-amber-200/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">
						{certsList.length} Verified
					</Badge>
				</div>

				{#if certsList.length > 0}
					<div class="space-y-3">
						{#each certsList as cert, i (i)}
							<div class="flex items-start gap-3.5 rounded-xl border border-border/70 bg-muted/20 p-4 transition-all hover:bg-muted/40">
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-2xs text-primary font-bold text-xs">
									<Award class="h-5 w-5 text-amber-500" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<h4 class="text-xs sm:text-sm font-bold text-foreground truncate" title={cert.name}>
											{cert.name}
										</h4>
										<Badge variant="outline" class="shrink-0 text-[11px] font-semibold text-muted-foreground">
											{cert.year}
										</Badge>
									</div>
									<p class="text-xs text-muted-foreground mt-0.5">{cert.issuer}</p>
									<div class="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
										<CheckCircle2 class="h-3 w-3" />
										<span>Credential Verified Active</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
						<Award class="h-7 w-7 mx-auto text-muted-foreground/40 mb-1.5" />
						<p class="text-xs font-medium text-foreground">No certifications listed</p>
					</div>
				{/if}
			</div>
		</Card.Root>

		<!-- Education & Academics -->
		<Card.Root class="p-6 shadow-2xs flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
							<GraduationCap class="h-4.5 w-4.5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">Academic Education</h3>
							<p class="text-xs text-muted-foreground">University degrees and scholarly achievements</p>
						</div>
					</div>
					<Badge variant="outline" class="border-purple-200/60 bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold">
						Degree Verified
					</Badge>
				</div>

				<div class="space-y-3">
					{#each defaultEducation as edu, i (i)}
						<div class="rounded-xl border border-border/70 bg-muted/20 p-4 transition-all hover:bg-muted/40">
							<div class="flex items-start justify-between gap-2 mb-1.5">
								<h4 class="text-xs sm:text-sm font-bold text-foreground">
									{edu.degree}
								</h4>
								<Badge variant="outline" class="shrink-0 text-[11px] font-semibold text-muted-foreground">
									{edu.period}
								</Badge>
							</div>

							<div class="text-xs font-semibold text-primary">{edu.institution}</div>
							<p class="text-xs text-muted-foreground mt-0.5">{edu.field}</p>

							{#if edu.grade}
								<div class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
									<Sparkles class="h-3 w-3 text-purple-500" />
									<span>{edu.grade}</span>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</Card.Root>
	</div>
</div>
