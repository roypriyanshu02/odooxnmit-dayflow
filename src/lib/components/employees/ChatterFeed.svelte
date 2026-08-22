<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/state/auth.svelte';
	import type { ChatterEntry, ChatterType } from '$lib/types';
	import type { Component } from 'svelte';
	import {
		MessageSquare,
		StickyNote,
		Activity,
		Send,
		Paperclip,
		Clock,
		RefreshCw,
		IndianRupee,
		ShieldCheck,
		Plane,
		X,
		History,
		Mail
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';

	interface Props {
		entityId: string;
		entityType?: 'employee' | 'leave' | 'payroll';
		entityName?: string;
		initialEntries?: ChatterEntry[];
		canPost?: boolean;
		compact?: boolean;
	}

	let {
		entityId,
		entityType = 'employee',
		entityName = 'Record',
		initialEntries = [],
		canPost = true
	}: Props = $props();

	type ChatterTab = 'message' | 'note' | 'activity';
	let activeTab = $state<ChatterTab>('note');
	let messageText = $state('');
	let isSubmitting = $state(false);
	let isLoading = $state(false);
	let filterType = $state<'all' | 'note' | 'status_change' | 'field_update'>('all');
	let entries = $state<ChatterEntry[]>([]);
	let attachments = $state<{ name: string; size: string }[]>([]);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	// Synchronize initialEntries safely in Svelte 5
	$effect(() => {
		if (initialEntries && initialEntries.length > 0) {
			entries = initialEntries;
		}
	});

	// Activity Form fields (when on 'activity' tab)
	let activityType = $state<'todo' | 'call' | 'meeting' | 'email' | 'reminder'>('todo');
	let activityDueDate = $state('2026-08-25');
	let activitySummary = $state('');

	async function fetchChatter() {
		if (!entityId) return;
		isLoading = true;
		try {
			const res = await fetch(`/api/employees/chatter?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}&order=desc`);
			if (res.ok) {
				const data = await res.json();
				if (data.success && Array.isArray(data.entries)) {
					entries = data.entries;
				}
			}
		} catch (err) {
			console.error('Failed to load chatter feed:', err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		if (entries.length === 0) {
			fetchChatter();
		}
	});

	$effect(() => {
		if (entityId) {
			fetchChatter();
		}
	});

	// Filtered list derived
	const filteredEntries = $derived.by(() => {
		if (filterType === 'all') return entries;
		return entries.filter((e) => e.type === filterType);
	});

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			for (let i = 0; i < target.files.length; i++) {
				const file = target.files[i];
				const sizeKb = Math.round(file.size / 1024);
				const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
				attachments = [...attachments, { name: file.name, size: sizeStr }];
			}
			target.value = '';
		}
	}

	function removeAttachment(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		const trimmedMsg = messageText.trim();
		if (!trimmedMsg && activeTab !== 'activity') return;
		if (activeTab === 'activity' && !trimmedMsg && !activitySummary.trim()) return;

		isSubmitting = true;
		try {
			let finalMessage = trimmedMsg;
			let logType = 'note';
			let type: ChatterType = 'note';
			const metadata: Record<string, unknown> = {
				tab: activeTab,
				authorRole: auth.user.role,
				attachments: attachments.map((a) => a.name)
			};

			if (activeTab === 'message') {
				logType = 'message';
				type = 'note';
			} else if (activeTab === 'note') {
				logType = 'note';
				type = 'note';
			} else if (activeTab === 'activity') {
				logType = 'activity';
				type = 'note';
				const summary = activitySummary.trim() || 'Scheduled activity';
				finalMessage = `⚡ Scheduled Activity [${activityType.toUpperCase()}]: ${summary}${trimmedMsg ? ` — Note: ${trimmedMsg}` : ''} (Due: ${activityDueDate})`;
				metadata.activityType = activityType;
				metadata.dueDate = activityDueDate;
				metadata.summary = summary;
			}

			const res = await fetch('/api/employees/chatter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					entityType,
					entityId,
					message: finalMessage,
					authorId: auth.user.id,
					authorName: auth.user.name,
					authorRole: auth.user.role,
					authorAvatar: auth.user.avatar,
					logType,
					type,
					metadata
				})
			});

			if (res.ok) {
				const data = await res.json();
				if (data.success && data.entry) {
					entries = [data.entry, ...entries];
					messageText = '';
					activitySummary = '';
					attachments = [];
				}
			}
		} catch (err) {
			console.error('Failed to post chatter message:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			handleSubmit();
		}
	}

	// Humanize timestamps relative to current time or ISO date
	function formatTimestamp(isoStr: string): string {
		try {
			const d = new Date(isoStr);
			if (isNaN(d.getTime())) return isoStr;
			const now = new Date('2026-08-22T16:00:00Z');
			const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

			if (diffSec < 60) return 'Just now';
			if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
			if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
			if (diffSec < 172800) {
				const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
				return `Yesterday at ${timeStr}`;
			}
			return d.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return isoStr;
		}
	}

	// Distinct style & icon mapping for timeline entries
	function getLogVisuals(entry: ChatterEntry): {
		icon: Component<any>;
		bg: string;
		border: string;
		text: string;
		badgeBg: string;
		label: string;
	} {
		const meta = (entry.metadata || {}) as Record<string, unknown>;
		const logType = (meta.logType as string) || '';
		const msgLower = (entry.message || '').toLowerCase();

		if (
			logType === 'salary_modification' ||
			msgLower.includes('salary') ||
			msgLower.includes('wage') ||
			msgLower.includes('allowance') ||
			msgLower.includes('payroll')
		) {
			return {
				icon: IndianRupee,
				bg: 'bg-emerald-50 dark:bg-emerald-950/40',
				border: 'border-emerald-200 dark:border-emerald-800/60',
				text: 'text-emerald-700 dark:text-emerald-300',
				badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
				label: 'Compensation & Payroll'
			};
		}

		if (
			logType === 'leave_approval' ||
			msgLower.includes('leave request') ||
			msgLower.includes('paid time off') ||
			msgLower.includes('sick leave') ||
			msgLower.includes('vacation')
		) {
			return {
				icon: Plane,
				bg: 'bg-teal-50 dark:bg-teal-950/40',
				border: 'border-teal-200 dark:border-teal-800/60',
				text: 'text-teal-700 dark:text-teal-300',
				badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300',
				label: 'Leave Management'
			};
		}

		if (
			logType === 'status_transition' ||
			entry.type === 'status_change' ||
			msgLower.includes('status') ||
			msgLower.includes('onboarded') ||
			msgLower.includes('orientation')
		) {
			return {
				icon: RefreshCw,
				bg: 'bg-purple-50 dark:bg-purple-950/40',
				border: 'border-purple-200 dark:border-purple-800/60',
				text: 'text-purple-700 dark:text-purple-300',
				badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
				label: 'Status Transition'
			};
		}

		if (
			logType === 'profile_update' ||
			entry.type === 'field_update' ||
			msgLower.includes('verified') ||
			msgLower.includes('documentation') ||
			msgLower.includes('pan') ||
			msgLower.includes('bank')
		) {
			return {
				icon: ShieldCheck,
				bg: 'bg-blue-50 dark:bg-blue-950/40',
				border: 'border-blue-200 dark:border-blue-800/60',
				text: 'text-blue-700 dark:text-blue-300',
				badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
				label: 'Profile Audit'
			};
		}

		if (logType === 'activity' || msgLower.includes('scheduled activity')) {
			return {
				icon: Activity,
				bg: 'bg-sky-50 dark:bg-sky-950/40',
				border: 'border-sky-200 dark:border-sky-800/60',
				text: 'text-sky-700 dark:text-sky-300',
				badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
				label: 'Activity Scheduled'
			};
		}

		if (logType === 'message' || msgLower.includes('email') || msgLower.includes('message')) {
			return {
				icon: MessageSquare,
				bg: 'bg-indigo-50 dark:bg-indigo-950/40',
				border: 'border-indigo-200 dark:border-indigo-800/60',
				text: 'text-indigo-700 dark:text-indigo-300',
				badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
				label: 'Direct Message'
			};
		}

		// Default Note
		return {
			icon: StickyNote,
			bg: 'bg-amber-50 dark:bg-amber-950/40',
			border: 'border-amber-200 dark:border-amber-800/60',
			text: 'text-amber-700 dark:text-amber-300',
			badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
			label: 'Internal Note'
		};
	}

	function getAuthorRoleBadge(role?: string): { label: string; class: string } {
		const r = (role || 'employee').toLowerCase();
		if (r === 'admin') {
			return { label: 'Admin', class: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' };
		}
		if (r === 'hr') {
			return { label: 'HR Officer', class: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' };
		}
		return { label: 'Employee', class: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
	}

	function getInitials(name?: string): string {
		if (!name) return 'DF';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}
</script>

<Card.Root class="p-5 sm:p-6 shadow-2xs space-y-6">
	<!-- Chatter Header (Odoo Topbar Style) -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/80">
		<div class="flex items-center gap-2.5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
				<History class="h-4 w-4" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-sm sm:text-base font-bold text-foreground tracking-tight">
						Chatter & Audit Trail
					</h2>
					<Badge variant="secondary" class="text-[11px] font-bold px-2 py-0">
						{entries.length}
					</Badge>
				</div>
				<p class="text-xs text-muted-foreground">
					Immutable activity timeline and collaborative notes for {entityName}
				</p>
			</div>
		</div>

		<!-- Filter Pill Switcher -->
		<div class="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto text-xs">
			<Button
				variant={filterType === 'all' ? 'default' : 'ghost'}
				size="xs"
				onclick={() => (filterType = 'all')}
				class="h-7 text-xs font-semibold"
			>
				All
			</Button>
			<Button
				variant={filterType === 'note' ? 'default' : 'ghost'}
				size="xs"
				onclick={() => (filterType = 'note')}
				class="h-7 text-xs font-semibold"
			>
				Notes
			</Button>
			<Button
				variant={filterType === 'field_update' ? 'default' : 'ghost'}
				size="xs"
				onclick={() => (filterType = 'field_update')}
				class="h-7 text-xs font-semibold"
			>
				Updates
			</Button>
			<Button
				variant={filterType === 'status_change' ? 'default' : 'ghost'}
				size="xs"
				onclick={() => (filterType = 'status_change')}
				class="h-7 text-xs font-semibold"
			>
				Transitions
			</Button>
		</div>
	</div>

	<!-- Action Input Box (Odoo Widget: Send Message / Log Note / Activities) -->
	{#if canPost}
		<div class="rounded-2xl border border-border/80 bg-muted/20 p-4 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
			<!-- Tab Selector Row -->
			<div class="flex items-center gap-2 pb-3 border-b border-border/60">
				<Button
					variant={activeTab === 'message' ? 'default' : 'ghost'}
					size="xs"
					onclick={() => (activeTab = 'message')}
					class="gap-1.5 h-7 text-xs font-semibold"
				>
					<Mail class="h-3.5 w-3.5" />
					<span>Send Message</span>
				</Button>

				<Button
					variant={activeTab === 'note' ? 'secondary' : 'ghost'}
					size="xs"
					onclick={() => (activeTab = 'note')}
					class="gap-1.5 h-7 text-xs font-semibold {activeTab === 'note' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}"
				>
					<StickyNote class="h-3.5 w-3.5" />
					<span>Log Note</span>
				</Button>

				<Button
					variant={activeTab === 'activity' ? 'secondary' : 'ghost'}
					size="xs"
					onclick={() => (activeTab = 'activity')}
					class="gap-1.5 h-7 text-xs font-semibold {activeTab === 'activity' ? 'bg-sky-600 text-white hover:bg-sky-700' : ''}"
				>
					<Activity class="h-3.5 w-3.5" />
					<span>Activities</span>
				</Button>
			</div>

			<!-- Dynamic Tab Header Info -->
			{#if activeTab === 'activity'}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 pb-2">
					<div>
						<label for="activity-type-select" class="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
							Activity Type
						</label>
						<select
							id="activity-type-select"
							bind:value={activityType}
							class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8"
						>
							<option value="todo">To-Do Task</option>
							<option value="call">Phone Call</option>
							<option value="meeting">Meeting / Interview</option>
							<option value="email">Email Follow-Up</option>
							<option value="reminder">HR Review Reminder</option>
						</select>
					</div>

					<div>
						<label for="activity-due-date" class="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
							Due Date
						</label>
						<Input
							id="activity-due-date"
							type="date"
							bind:value={activityDueDate}
							class="h-8 text-xs"
						/>
					</div>

					<div class="sm:col-span-2">
						<Input
							type="text"
							placeholder="Summary (e.g. Schedule 1:1 Performance Check-in)"
							bind:value={activitySummary}
							class="h-8 text-xs"
						/>
					</div>
				</div>
			{/if}

			<!-- Text Area Input -->
			<div class="pt-3">
				<textarea
					rows="3"
					bind:value={messageText}
					onkeydown={handleKeyDown}
					placeholder={activeTab === 'message'
						? 'Send an email or message to this employee...'
						: activeTab === 'note'
							? 'Log an internal note (visible to HR & Admins)...'
							: 'Add additional details or notes for this scheduled activity...'}
					class="w-full rounded-md border border-input bg-transparent p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[72px]"
				></textarea>
			</div>

			<!-- Attached files pills -->
			{#if attachments.length > 0}
				<div class="flex flex-wrap gap-2 pt-2">
					{#each attachments as file, idx}
						<Badge variant="outline" class="gap-1.5 px-2.5 py-1 text-xs">
							<Paperclip class="h-3 w-3 text-primary" />
							<span class="font-medium truncate max-w-[150px]">{file.name}</span>
							<span class="text-[10px] text-muted-foreground">({file.size})</span>
							<button
								type="button"
								onclick={() => removeAttachment(idx)}
								class="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
								title="Remove attachment"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/each}
				</div>
			{/if}

			<!-- Action Controls & Author Preview Footer -->
			<div class="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-border/40">
				<!-- Author Identity Chip -->
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Avatar.Root class="h-6 w-6 ring-1 ring-border">
						{#if auth.user.avatar}
							<Avatar.Image src={auth.user.avatar} alt={auth.user.name} />
						{/if}
						<Avatar.Fallback class="bg-primary/10 text-primary font-bold text-[10px]">
							{auth.user.initials}
						</Avatar.Fallback>
					</Avatar.Root>
					<span class="font-medium text-foreground">{auth.user.name}</span>
					{#if auth.user}
						{@const roleBadge = getAuthorRoleBadge(auth.user.role)}
						<span class="rounded px-1.5 py-0.2 text-[10px] font-bold border {roleBadge.class}">
							{roleBadge.label}
						</span>
					{/if}
				</div>

				<!-- Right Action Buttons -->
				<div class="flex items-center gap-2">
					<!-- Hidden File Input & Attachment Shortcut Button -->
					<input
						type="file"
						multiple
						bind:this={fileInputRef}
						onchange={handleFileSelect}
						class="hidden"
					/>

					<Button
						variant="outline"
						size="xs"
						onclick={() => fileInputRef?.click()}
						class="gap-1.5 h-7 text-xs font-semibold"
						title="Attach documents, receipts, or notes"
					>
						<Paperclip class="h-3.5 w-3.5" />
						<span class="hidden sm:inline">Attach</span>
					</Button>

					<!-- Submit Button -->
					<Button
						size="xs"
						onclick={handleSubmit}
						disabled={isSubmitting || (!messageText.trim() && activeTab !== 'activity')}
						class="gap-1.5 h-7 text-xs font-bold"
					>
						{#if isSubmitting}
							<RefreshCw class="h-3.5 w-3.5 animate-spin" />
							<span>Saving...</span>
						{:else}
							<Send class="h-3.5 w-3.5" />
							<span>{activeTab === 'message' ? 'Send' : activeTab === 'note' ? 'Log Note' : 'Schedule'}</span>
						{/if}
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Timeline Stream -->
	<div class="space-y-4 pt-2">
		{#if isLoading && entries.length === 0}
			<!-- Loading Skeleton -->
			<div class="space-y-4 py-4 animate-pulse">
				{#each [1, 2, 3] as _}
					<div class="flex items-start gap-4">
						<div class="h-9 w-9 rounded-xl bg-muted shrink-0"></div>
						<div class="space-y-2 flex-1">
							<div class="h-3.5 bg-muted rounded w-1/3"></div>
							<div class="h-3 bg-muted rounded w-3/4"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredEntries.length === 0}
			<!-- Empty State -->
			<div class="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-muted/10 space-y-2">
				<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
					<MessageSquare class="h-5 w-5" />
				</div>
				<h3 class="text-sm font-bold text-foreground">No chatter entries recorded yet</h3>
				<p class="text-xs text-muted-foreground max-w-sm mx-auto">
					Internal notes, compensation adjustments, and status transitions for this employee will appear here in chronological order.
				</p>
			</div>
		{:else}
			<!-- Vertical Timeline Container -->
			<div class="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
				{#each filteredEntries as entry (entry.id)}
					{@const visual = getLogVisuals(entry)}
					{@const IconComponent = visual.icon}
					{@const roleBadge = getAuthorRoleBadge((entry.metadata as any)?.authorRole)}
					{@const authorInitials = getInitials(entry.authorName)}

					<div class="relative group">
						<!-- Timeline Node Icon Dot -->
						<div class="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background {visual.bg} {visual.text} ring-2 ring-border/80 shadow-2xs z-10">
							<IconComponent class="h-3 w-3" />
						</div>

						<!-- Timeline Card Body -->
						<div class="rounded-2xl border {visual.border} {visual.bg} p-4 text-xs transition-all hover:shadow-xs space-y-2.5">
							<!-- Card Header -->
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<!-- Author Avatar / Initials -->
									<Avatar.Root class="h-6 w-6 ring-1 ring-border">
										{#if entry.authorAvatar}
											<Avatar.Image src={entry.authorAvatar} alt={entry.authorName} />
										{/if}
										<Avatar.Fallback class="bg-primary/10 text-primary font-bold text-[10px]">
											{authorInitials}
										</Avatar.Fallback>
									</Avatar.Root>

									<!-- Author Name -->
									<span class="font-bold text-foreground text-xs sm:text-sm">
										{entry.authorName}
									</span>

									<!-- Role Badge -->
									<span class="rounded px-1.5 py-0.2 text-[9px] font-bold border uppercase tracking-wider {roleBadge.class}">
										{roleBadge.label}
									</span>

									<!-- Category Pill -->
									<span class="hidden sm:inline-flex items-center rounded-md px-1.5 py-0.2 text-[10px] font-semibold {visual.badgeBg}">
										{visual.label}
									</span>
								</div>

								<!-- Timestamp -->
								<div class="flex items-center gap-1 text-[11px] text-muted-foreground font-medium" title={entry.createdAt}>
									<Clock class="h-3 w-3 text-muted-foreground/70" />
									<span>{formatTimestamp(entry.createdAt)}</span>
								</div>
							</div>

							<!-- Message Content Body -->
							<div class="text-foreground/90 font-normal text-xs sm:text-[13px] leading-relaxed whitespace-pre-line break-words pl-8">
								{entry.message}
							</div>

							<!-- Metadata Highlights / Attachments -->
							{#if entry.metadata && typeof entry.metadata === 'object'}
								{@const meta = entry.metadata as Record<string, any>}
								{#if meta.attachments && Array.isArray(meta.attachments) && meta.attachments.length > 0}
									<div class="pl-8 pt-1 flex flex-wrap gap-1.5">
										{#each meta.attachments as attName}
											<Badge variant="outline" class="gap-1 px-2 py-0.5 text-[11px]">
												<Paperclip class="h-3 w-3 text-primary" />
												<span>{attName}</span>
											</Badge>
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</Card.Root>
