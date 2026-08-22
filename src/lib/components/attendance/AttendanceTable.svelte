<script lang="ts">
	import { cn } from '$lib/utils';
	import type { AttendanceRecord, AttendanceWithEmployee, AttendanceStatus } from '$lib/types/attendance';
	import { exportAttendanceToCsv } from '$lib/utils/csv-export';
	import { formatDurationHuman } from '$lib/utils/break';
	import {
		Search,
		Filter,
		Download,
		Calendar,
		Clock,
		Coffee,
		Flame,
		CheckCircle2,
		XCircle,
		AlertCircle,
		Users,
		Sparkles,
		ChevronDown,
		Eye,
		X,
		ArrowUpDown,
		Building2
	} from '@lucide/svelte';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Progress } from '$lib/components/ui/progress';

	interface Props {
		records: AttendanceWithEmployee[];
		isLoading?: boolean;
		showEmployeeColumns?: boolean;
		isAdminView?: boolean;
		departments?: string[];
		onViewBreaks?: (record: AttendanceRecord) => void;
		onEditRecord?: (record: AttendanceRecord) => void;
		class?: string;
	}

	let {
		records = [],
		isLoading = false,
		showEmployeeColumns = true,
		isAdminView = true,
		departments = [],
		onViewBreaks,
		onEditRecord,
		class: className = ''
	}: Props = $props();

	// Local Filter and Sorting States
	let searchQuery = $state('');
	let selectedDepartment = $state('all');
	let selectedStatus = $state<string>('all');
	let selectedDate = $state<string>('');
	let sortColumn = $state<'name' | 'date' | 'checkIn' | 'workMinutes' | 'status'>('name');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let isExporting = $state(false);

	// Active modal state for break details inspection
	let activeBreakRecord = $state<AttendanceWithEmployee | null>(null);

	// Extract unique departments dynamically if not provided
	const derivedDepartments = $derived.by(() => {
		if (departments && departments.length > 0) return departments;
		const deptSet = new Set<string>();
		for (const r of records) {
			if (r.employee?.department) {
				deptSet.add(r.employee.department);
			}
		}
		return Array.from(deptSet).sort();
	});

	// Status filter pill options
	const statusPills = [
		{ id: 'all', label: 'All Status' },
		{ id: 'present', label: 'Present' },
		{ id: 'on_break', label: 'On Break' },
		{ id: 'absent', label: 'Absent' },
		{ id: 'half_day', label: 'Half Day' },
		{ id: 'on_leave', label: 'On Leave' }
	];

	// Filtered & Sorted Attendance Records
	const filteredRecords = $derived.by(() => {
		return records
			.filter((rec) => {
				// Search query match
				if (searchQuery.trim()) {
					const q = searchQuery.toLowerCase().trim();
					const name = `${rec.employee?.firstName || ''} ${rec.employee?.lastName || ''}`.toLowerCase();
					const empId = (rec.employee?.id || rec.employeeId || '').toLowerCase();
					const dept = (rec.employee?.department || '').toLowerCase();
					const title = (rec.employee?.jobTitle || '').toLowerCase();
					const email = (rec.employee?.email || '').toLowerCase();

					const matchesSearch =
						name.includes(q) ||
						empId.includes(q) ||
						dept.includes(q) ||
						title.includes(q) ||
						email.includes(q);

					if (!matchesSearch) return false;
				}

				// Department filter
				if (selectedDepartment !== 'all') {
					if (rec.employee?.department !== selectedDepartment) {
						return false;
					}
				}

				// Date filter
				if (selectedDate) {
					if (rec.date !== selectedDate) {
						return false;
					}
				}

				// Status filter
				if (selectedStatus !== 'all') {
					if (selectedStatus === 'on_break') {
						const hasActiveBreak = rec.breaks?.some((b) => !b.endTime);
						if (!hasActiveBreak && rec.status !== 'present') return false;
						if (!hasActiveBreak) return false;
					} else if (rec.status !== selectedStatus) {
						return false;
					}
				}

				return true;
			})
			.sort((a, b) => {
				let cmp = 0;
				if (sortColumn === 'name') {
					const nameA = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.toLowerCase();
					const nameB = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.toLowerCase();
					cmp = nameA.localeCompare(nameB);
				} else if (sortColumn === 'date') {
					cmp = (a.date || '').localeCompare(b.date || '');
				} else if (sortColumn === 'checkIn') {
					cmp = (a.checkIn || '').localeCompare(b.checkIn || '');
				} else if (sortColumn === 'workMinutes') {
					cmp = (a.totalWorkMinutes || 0) - (b.totalWorkMinutes || 0);
				} else if (sortColumn === 'status') {
					cmp = (a.status || '').localeCompare(b.status || '');
				}
				return sortDirection === 'asc' ? cmp : -cmp;
			});
	});

	function handleSort(col: typeof sortColumn) {
		if (sortColumn === col) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = col;
			sortDirection = 'asc';
		}
	}

	function handleExportCsv() {
		try {
			isExporting = true;
			const filename = `dayflow_attendance_${selectedDate || 'records'}_${Date.now()}.csv`;
			exportAttendanceToCsv(filteredRecords, filename);
		} finally {
			setTimeout(() => {
				isExporting = false;
			}, 600);
		}
	}

	function resetFilters() {
		searchQuery = '';
		selectedDepartment = 'all';
		selectedStatus = 'all';
		selectedDate = '';
	}

	function formatTime(isoOrTime?: string | null): string {
		if (!isoOrTime) return '--:--';
		if (/^\d{1,2}:\d{2}(:\d{2})?(\s?[AP]M)?$/i.test(isoOrTime)) {
			return isoOrTime;
		}
		try {
			const d = new Date(isoOrTime);
			if (isNaN(d.getTime())) return isoOrTime;
			return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} catch {
			return isoOrTime;
		}
	}

	function formatDateClean(dateStr?: string): string {
		if (!dateStr) return '—';
		try {
			const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00Z'));
			if (isNaN(d.getTime())) return dateStr;
			return new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			}).format(d);
		} catch {
			return dateStr;
		}
	}

	function getInitials(firstName?: string, lastName?: string): string {
		const f = firstName?.[0]?.toUpperCase() || '';
		const l = lastName?.[0]?.toUpperCase() || '';
		return f + l || 'EM';
	}

	function openBreaksModal(rec: AttendanceWithEmployee) {
		if (onViewBreaks) {
			onViewBreaks(rec);
		} else {
			activeBreakRecord = rec;
		}
	}
</script>

<div class={cn('space-y-4 font-sans', className)}>
	<!-- Header Controls & Filter Bar -->
	<Card.Root class="p-4 shadow-2xs space-y-3.5">
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
			<!-- Search Bar -->
			<div class="relative flex-1 min-w-[240px] max-w-lg">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					type="text"
					bind:value={searchQuery}
					placeholder="Search employee name, ID, department, title..."
					class="pl-9 pr-8 h-9 text-xs"
				/>
				{#if searchQuery}
					<Button
						variant="ghost"
						size="icon"
						onclick={() => (searchQuery = '')}
						class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
						title="Clear search"
					>
						<X class="w-3.5 h-3.5" />
					</Button>
				{/if}
			</div>

			<!-- Quick Actions: Department, Date Picker, Export CSV -->
			<div class="flex flex-wrap items-center gap-2.5">
				<!-- Department Dropdown -->
				<div class="relative">
					<Building2 class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
					<select
						bind:value={selectedDepartment}
						class="w-full rounded-md border border-input bg-transparent pl-8 pr-8 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 appearance-none cursor-pointer"
					>
						<option value="all">All Departments</option>
						{#each derivedDepartments as dept}
							<option value={dept}>{dept}</option>
						{/each}
					</select>
					<ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
				</div>

				<!-- Date Filter -->
				<div class="relative">
					<Input
						type="date"
						bind:value={selectedDate}
						class="h-9 text-xs"
						title="Filter by specific date"
					/>
					{#if selectedDate}
						<button
							type="button"
							onclick={() => (selectedDate = '')}
							class="absolute -top-1.5 -right-1.5 bg-slate-600 text-white rounded-full p-0.5 shadow hover:bg-slate-700 text-[10px]"
							title="Clear date filter"
						>
							<X class="w-2.5 h-2.5" />
						</button>
					{/if}
				</div>

				<!-- Export CSV Button -->
				<Button
					size="sm"
					onclick={handleExportCsv}
					disabled={isExporting || filteredRecords.length === 0}
					class="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-9"
					title="Export filtered records to UTF-8 BOM CSV"
				>
					<Download class={cn('w-4 h-4', isExporting && 'animate-bounce')} />
					<span>{isExporting ? 'Exporting...' : 'Export to CSV'}</span>
				</Button>
			</div>
		</div>

		<!-- Status Filter Pills -->
		<div class="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-border text-xs">
			<span class="text-muted-foreground font-medium mr-1 flex items-center gap-1">
				<Filter class="w-3 h-3" /> Status:
			</span>
			{#each statusPills as pill}
				<Button
					variant={selectedStatus === pill.id ? 'default' : 'ghost'}
					size="xs"
					onclick={() => (selectedStatus = pill.id)}
					class="h-7 text-xs font-medium rounded-full"
				>
					{pill.label}
				</Button>
			{/each}

			{#if searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all' || selectedDate}
				<Button
					variant="link"
					size="xs"
					onclick={resetFilters}
					class="ml-auto text-xs text-destructive hover:underline flex items-center gap-1 p-0 h-auto font-medium"
				>
					<X class="w-3 h-3" /> Clear Filters
				</Button>
			{/if}
		</div>
	</Card.Root>

	<!-- Records Table -->
	<Card.Root class="p-0 overflow-hidden shadow-2xs">
		{#if isLoading}
			<div class="p-12 text-center space-y-3">
				<div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
				<p class="text-sm font-medium text-muted-foreground">Loading attendance records...</p>
			</div>
		{:else if filteredRecords.length === 0}
			<div class="p-12 text-center space-y-3">
				<div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
					<Users class="w-6 h-6" />
				</div>
				<h3 class="text-base font-semibold text-foreground">No attendance records found</h3>
				<p class="text-sm text-muted-foreground max-w-sm mx-auto">
					No matching attendance records were found for the selected search filters.
				</p>
				{#if searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all' || selectedDate}
					<Button
						variant="outline"
						size="sm"
						onclick={resetFilters}
						class="text-xs"
					>
						Reset All Filters
					</Button>
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-muted/30">
							{#if showEmployeeColumns}
								<Table.Head>
									<button
										type="button"
										onclick={() => handleSort('name')}
										class="flex items-center gap-1.5 hover:text-foreground cursor-pointer font-semibold text-xs"
									>
										<span>Employee</span>
										<ArrowUpDown class="w-3 h-3 text-muted-foreground" />
									</button>
								</Table.Head>
							{/if}
							<Table.Head>
								<button
									type="button"
									onclick={() => handleSort('date')}
									class="flex items-center gap-1.5 hover:text-foreground cursor-pointer font-semibold text-xs"
								>
									<span>Date</span>
									<ArrowUpDown class="w-3 h-3 text-muted-foreground" />
								</button>
							</Table.Head>
							<Table.Head>
								<button
									type="button"
									onclick={() => handleSort('checkIn')}
									class="flex items-center gap-1.5 hover:text-foreground cursor-pointer font-semibold text-xs"
								>
									<span>Check In / Out</span>
									<ArrowUpDown class="w-3 h-3 text-muted-foreground" />
								</button>
							</Table.Head>
							<Table.Head>
								<button
									type="button"
									onclick={() => handleSort('workMinutes')}
									class="flex items-center gap-1.5 hover:text-foreground cursor-pointer font-semibold text-xs"
								>
									<span>Work Duration</span>
									<ArrowUpDown class="w-3 h-3 text-muted-foreground" />
								</button>
							</Table.Head>
							<Table.Head class="font-semibold text-xs">Break Duration</Table.Head>
							<Table.Head>
								<button
									type="button"
									onclick={() => handleSort('status')}
									class="flex items-center gap-1.5 hover:text-foreground cursor-pointer font-semibold text-xs"
								>
									<span>Status</span>
									<ArrowUpDown class="w-3 h-3 text-muted-foreground" />
								</button>
							</Table.Head>
							<Table.Head class="font-semibold text-xs text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredRecords as record (record.id)}
							{@const isOt = (record.overtimeMinutes && record.overtimeMinutes > 0) || (record.totalWorkMinutes && record.totalWorkMinutes > 480)}
							{@const otMins = record.overtimeMinutes || Math.max(0, (record.totalWorkMinutes || 0) - 480)}
							{@const hasActiveBreak = record.breaks?.some((b) => !b.endTime)}
							
							<Table.Row class="hover:bg-muted/40 transition-colors">
								{#if showEmployeeColumns}
									<!-- Employee Profile Column -->
									<Table.Cell>
										<div class="flex items-center gap-3">
											<Avatar.Root class="h-9 w-9 ring-1 ring-border">
												{#if record.employee?.avatarUrl}
													<Avatar.Image src={record.employee.avatarUrl} alt="{record.employee.firstName} avatar" />
												{/if}
												<Avatar.Fallback class="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
													{getInitials(record.employee?.firstName, record.employee?.lastName)}
												</Avatar.Fallback>
											</Avatar.Root>
											<div>
												<div class="font-semibold text-foreground flex items-center gap-1.5">
													<span>
														{record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Unknown Employee'}
													</span>
													<Badge variant="outline" class="text-[11px] font-mono font-medium px-1.5 py-0">
														{record.employee?.id || record.employeeId}
													</Badge>
												</div>
												<div class="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
													{#if record.employee?.department}
														<span class="flex items-center gap-1 font-medium">
															<Building2 class="w-3 h-3 text-muted-foreground" />
															{record.employee.department}
														</span>
													{/if}
													{#if record.employee?.jobTitle}
														<span class="text-muted-foreground">•</span>
														<span>{record.employee.jobTitle}</span>
													{/if}
												</div>
											</div>
										</div>
									</Table.Cell>
								{/if}

								<!-- Date Column -->
								<Table.Cell class="whitespace-nowrap">
									<div class="flex items-center gap-1.5 font-medium text-foreground text-xs">
										<Calendar class="w-3.5 h-3.5 text-muted-foreground" />
										{formatDateClean(record.date)}
									</div>
								</Table.Cell>

								<!-- Check In / Check Out Column -->
								<Table.Cell class="whitespace-nowrap">
									<div class="flex flex-col gap-0.5 text-xs">
										<div class="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
											<span>In: {formatTime(record.checkIn)}</span>
										</div>
										<div class="flex items-center gap-1.5 font-medium text-muted-foreground">
											<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
											<span>Out: {formatTime(record.checkOut)}</span>
										</div>
									</div>
								</Table.Cell>

								<!-- Work Duration Column -->
								<Table.Cell class="whitespace-nowrap">
									<div class="flex items-center gap-2">
										<div>
											<div class="font-semibold text-xs text-foreground flex items-center gap-1">
												<Clock class="w-3.5 h-3.5 text-muted-foreground" />
												{formatDurationHuman(record.totalWorkMinutes || 0)}
											</div>
											<div class="w-24 mt-1.5">
												<Progress
													value={Math.min(100, Math.round(((record.totalWorkMinutes || 0) / 480) * 100))}
													class="h-1.5"
												/>
											</div>
										</div>

										{#if isOt}
											<Badge
												variant="secondary"
												class="gap-1 px-1.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
												title="Overtime: {formatDurationHuman(otMins)}"
											>
												<Flame class="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
												+{formatDurationHuman(otMins)} OT
											</Badge>
										{/if}
									</div>
								</Table.Cell>

								<!-- Break Duration Column -->
								<Table.Cell class="whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<Button
											variant="outline"
											size="xs"
											onclick={() => openBreaksModal(record)}
											class={cn(
												'gap-1 h-7 text-xs font-medium',
												(record.totalBreakMinutes || 0) > 0 || hasActiveBreak
													? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
													: ''
											)}
										>
											<Coffee class="w-3 h-3" />
											<span>{formatDurationHuman(record.totalBreakMinutes || 0)}</span>
											{#if record.breaks && record.breaks.length > 0}
												<span class="text-[10px] opacity-75 font-mono">({record.breaks.length})</span>
											{/if}
										</Button>
										{#if hasActiveBreak}
											<Badge class="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white animate-pulse">
												Active
											</Badge>
										{/if}
									</div>
								</Table.Cell>

								<!-- Status Column -->
								<Table.Cell class="whitespace-nowrap">
									{#if hasActiveBreak}
										<Badge variant="secondary" class="gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
											On Break
										</Badge>
									{:else if record.status === 'present'}
										<Badge variant="secondary" class="gap-1 px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
											<CheckCircle2 class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
											Present
										</Badge>
									{:else if record.status === 'absent'}
										<Badge variant="secondary" class="gap-1 px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
											<XCircle class="w-3 h-3 text-rose-600 dark:text-rose-400" />
											Absent
										</Badge>
									{:else if record.status === 'half_day'}
										<Badge variant="secondary" class="gap-1 px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
											<AlertCircle class="w-3 h-3 text-blue-600 dark:text-blue-400" />
											Half Day
										</Badge>
									{:else if record.status === 'on_leave'}
										<Badge variant="secondary" class="gap-1 px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
											<Sparkles class="w-3 h-3 text-purple-600 dark:text-purple-400" />
											On Leave
										</Badge>
									{:else}
										<Badge variant="secondary" class="px-2 py-0.5 text-xs font-semibold">
											{record.status}
										</Badge>
									{/if}
								</Table.Cell>

								<!-- Actions Column -->
								<Table.Cell class="whitespace-nowrap text-right">
									<Button
										variant="ghost"
										size="xs"
										onclick={() => openBreaksModal(record)}
										class="gap-1 h-7 text-xs font-semibold"
										title="View Breaks & Details"
									>
										<Eye class="w-3.5 h-3.5" />
										<span>Breaks</span>
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Footer Summary Bar -->
			<div class="px-4 py-3 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground font-medium">
				<div>
					Showing <span class="font-bold text-foreground">{filteredRecords.length}</span> of{' '}
					<span class="font-bold text-foreground">{records.length}</span> records
				</div>
				<div class="flex items-center gap-4 text-xs">
					<span>Standard Shift: <strong class="text-foreground">8h 00m</strong></span>
					<span>•</span>
					<span>Overtime Threshold: <strong class="text-foreground">&gt; 8h</strong></span>
				</div>
			</div>
		{/if}
	</Card.Root>

	<!-- Breaks Detail Modal -->
	<Dialog.Root open={!!activeBreakRecord} onOpenChange={(open) => { if (!open) activeBreakRecord = null; }}>
		{#if activeBreakRecord}
			<Dialog.Content class="sm:max-w-lg p-0 overflow-hidden gap-0">
				<Dialog.Header class="flex flex-row items-center gap-2.5 p-5 border-b border-border bg-muted/20 space-y-0">
					<div class="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
						<Coffee class="w-5 h-5" />
					</div>
					<div>
						<Dialog.Title class="text-base font-bold text-foreground">
							Break Details — {activeBreakRecord.employee?.firstName || 'Employee'}
						</Dialog.Title>
						<Dialog.Description class="text-xs text-muted-foreground">
							{formatDateClean(activeBreakRecord.date)} • Total: {formatDurationHuman(activeBreakRecord.totalBreakMinutes || 0)}
						</Dialog.Description>
					</div>
				</Dialog.Header>

				<div class="p-5 max-h-96 overflow-y-auto space-y-3">
					{#if !activeBreakRecord.breaks || activeBreakRecord.breaks.length === 0}
						<div class="text-center py-6 text-muted-foreground text-xs">
							<Coffee class="w-8 h-8 mx-auto mb-2 opacity-40" />
							No break intervals recorded for this session.
						</div>
					{:else}
						{#each activeBreakRecord.breaks as brk, idx}
							<div class="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border text-xs">
								<div class="flex items-center gap-3">
									<span class="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px]">
										{idx + 1}
									</span>
									<div>
										<div class="font-semibold text-foreground">
											{brk.reason || 'General Break'}
										</div>
										<div class="text-[11px] text-muted-foreground mt-0.5">
											{formatTime(brk.startTime)} → {brk.endTime ? formatTime(brk.endTime) : 'In Progress...'}
										</div>
									</div>
								</div>
								<div class="font-bold text-foreground text-right">
									{#if brk.endTime}
										{formatDurationHuman(brk.durationMinutes || 0)}
									{:else}
										<Badge class="bg-amber-500 text-white font-semibold animate-pulse">
											Active
										</Badge>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<Dialog.Footer class="p-4 bg-muted/20 border-t border-border">
					<Button
						size="sm"
						onclick={() => (activeBreakRecord = null)}
					>
						Close
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		{/if}
	</Dialog.Root>
</div>
