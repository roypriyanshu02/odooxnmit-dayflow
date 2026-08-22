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
		ChevronRight,
		Eye,
		X,
		ArrowUpDown,
		Building2,
		Briefcase,
		ShieldAlert
	} from '@lucide/svelte';

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
	<div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
			<!-- Search Bar -->
			<div class="relative flex-1 min-w-[240px] max-w-lg">
				<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search employee name, ID, department, title..."
					class="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded"
						title="Clear search"
					>
						<X class="w-3.5 h-3.5" />
					</button>
				{/if}
			</div>

			<!-- Quick Actions: Department, Date Picker, Export CSV -->
			<div class="flex flex-wrap items-center gap-2.5">
				<!-- Department Dropdown -->
				<div class="relative">
					<Building2 class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
					<select
						bind:value={selectedDepartment}
						class="pl-8 pr-8 py-2 text-xs md:text-sm font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer appearance-none"
					>
						<option value="all">All Departments</option>
						{#each derivedDepartments as dept}
							<option value={dept}>{dept}</option>
						{/each}
					</select>
					<ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
				</div>

				<!-- Date Filter -->
				<div class="relative">
					<input
						type="date"
						bind:value={selectedDate}
						class="pl-3 pr-3 py-2 text-xs md:text-sm font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
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
				<button
					type="button"
					onclick={handleExportCsv}
					disabled={isExporting || filteredRecords.length === 0}
					class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					title="Export filtered records to UTF-8 BOM CSV"
				>
					<Download class={cn('w-4 h-4', isExporting && 'animate-bounce')} />
					<span>{isExporting ? 'Exporting...' : 'Export to CSV'}</span>
				</button>
			</div>
		</div>

		<!-- Status Filter Pills -->
		<div class="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
			<span class="text-slate-400 dark:text-slate-500 font-medium mr-1 flex items-center gap-1">
				<Filter class="w-3 h-3" /> Status:
			</span>
			{#each statusPills as pill}
				<button
					type="button"
					onclick={() => (selectedStatus = pill.id)}
					class={cn(
						'px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap',
						selectedStatus === pill.id
							? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
							: 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
					)}
				>
					{pill.label}
				</button>
			{/each}

			{#if searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all' || selectedDate}
				<button
					type="button"
					onclick={resetFilters}
					class="ml-auto text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
				>
					<X class="w-3 h-3" /> Clear Filters
				</button>
			{/if}
		</div>
	</div>

	<!-- Records Table -->
	<div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
		{#if isLoading}
			<div class="p-12 text-center space-y-3">
				<div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
				<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Loading attendance records...</p>
			</div>
		{:else if filteredRecords.length === 0}
			<div class="p-12 text-center space-y-3">
				<div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
					<Users class="w-6 h-6" />
				</div>
				<h3 class="text-base font-semibold text-slate-800 dark:text-slate-200">No attendance records found</h3>
				<p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
					No matching attendance records were found for the selected search filters.
				</p>
				{#if searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all' || selectedDate}
					<button
						type="button"
						onclick={resetFilters}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
					>
						Reset All Filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse text-sm">
					<thead>
						<tr class="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
							{#if showEmployeeColumns}
								<th class="py-3 px-4 font-semibold">
									<button
										type="button"
										onclick={() => handleSort('name')}
										class="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
									>
										<span>Employee</span>
										<ArrowUpDown class="w-3 h-3 text-slate-400" />
									</button>
								</th>
							{/if}
							<th class="py-3 px-4 font-semibold">
								<button
									type="button"
									onclick={() => handleSort('date')}
									class="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
								>
									<span>Date</span>
									<ArrowUpDown class="w-3 h-3 text-slate-400" />
								</button>
							</th>
							<th class="py-3 px-4 font-semibold">
								<button
									type="button"
									onclick={() => handleSort('checkIn')}
									class="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
								>
									<span>Check In / Out</span>
									<ArrowUpDown class="w-3 h-3 text-slate-400" />
								</button>
							</th>
							<th class="py-3 px-4 font-semibold">
								<button
									type="button"
									onclick={() => handleSort('workMinutes')}
									class="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
								>
									<span>Work Duration</span>
									<ArrowUpDown class="w-3 h-3 text-slate-400" />
								</button>
							</th>
							<th class="py-3 px-4 font-semibold">Break Duration</th>
							<th class="py-3 px-4 font-semibold">
								<button
									type="button"
									onclick={() => handleSort('status')}
									class="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
								>
									<span>Status</span>
									<ArrowUpDown class="w-3 h-3 text-slate-400" />
								</button>
							</th>
							<th class="py-3 px-4 font-semibold text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
						{#each filteredRecords as record (record.id)}
							{@const isOt = (record.overtimeMinutes && record.overtimeMinutes > 0) || (record.totalWorkMinutes && record.totalWorkMinutes > 480)}
							{@const otMins = record.overtimeMinutes || Math.max(0, (record.totalWorkMinutes || 0) - 480)}
							{@const hasActiveBreak = record.breaks?.some((b) => !b.endTime)}
							
							<tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
								{#if showEmployeeColumns}
									<!-- Employee Profile Column -->
									<td class="py-3 px-4">
										<div class="flex items-center gap-3">
											{#if record.employee?.avatarUrl}
												<img
													src={record.employee.avatarUrl}
													alt="{record.employee.firstName} avatar"
													class="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
												/>
											{:else}
												<div class="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-xs shadow-xs">
													{getInitials(record.employee?.firstName, record.employee?.lastName)}
												</div>
											{/if}
											<div>
												<div class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
													<span>
														{record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Unknown Employee'}
													</span>
													<span class="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
														{record.employee?.id || record.employeeId}
													</span>
												</div>
												<div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
													{#if record.employee?.department}
														<span class="flex items-center gap-1 font-medium">
															<Building2 class="w-3 h-3 text-slate-400" />
															{record.employee.department}
														</span>
													{/if}
													{#if record.employee?.jobTitle}
														<span class="text-slate-300 dark:text-slate-600">•</span>
														<span>{record.employee.jobTitle}</span>
													{/if}
												</div>
											</div>
										</div>
									</td>
								{/if}

								<!-- Date Column -->
								<td class="py-3 px-4 whitespace-nowrap">
									<div class="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 text-xs">
										<Calendar class="w-3.5 h-3.5 text-slate-400" />
										{formatDateClean(record.date)}
									</div>
								</td>

								<!-- Check In / Check Out Column -->
								<td class="py-3 px-4 whitespace-nowrap">
									<div class="flex flex-col gap-0.5 text-xs">
										<div class="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
											<span>In: {formatTime(record.checkIn)}</span>
										</div>
										<div class="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
											<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
											<span>Out: {formatTime(record.checkOut)}</span>
										</div>
									</div>
								</td>

								<!-- Work Duration Column -->
								<td class="py-3 px-4 whitespace-nowrap">
									<div class="flex items-center gap-2">
										<div>
											<div class="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
												<Clock class="w-3.5 h-3.5 text-slate-400" />
												{formatDurationHuman(record.totalWorkMinutes || 0)}
											</div>
											<!-- Shift progress indicator bar (8h = 480 mins) -->
											<div class="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
												<div
													class={cn(
														'h-full rounded-full transition-all',
														isOt ? 'bg-amber-500' : 'bg-emerald-500'
													)}
													style="width: {Math.min(100, Math.round(((record.totalWorkMinutes || 0) / 480) * 100))}%"
												></div>
											</div>
										</div>

										<!-- Overtime Badge -->
										{#if isOt}
											<span
												class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs"
												title="Overtime: {formatDurationHuman(otMins)}"
											>
												<Flame class="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
												+{formatDurationHuman(otMins)} OT
											</span>
										{/if}
									</div>
								</td>

								<!-- Break Duration Column -->
								<td class="py-3 px-4 whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<button
											type="button"
											onclick={() => openBreaksModal(record)}
											class={cn(
												'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
												(record.totalBreakMinutes || 0) > 0 || hasActiveBreak
													? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
													: 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
											)}
										>
											<Coffee class="w-3 h-3" />
											<span>{formatDurationHuman(record.totalBreakMinutes || 0)}</span>
											{#if record.breaks && record.breaks.length > 0}
												<span class="text-[10px] opacity-75 font-mono">({record.breaks.length})</span>
											{/if}
										</button>
										{#if hasActiveBreak}
											<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
												Active
											</span>
										{/if}
									</div>
								</td>

								<!-- Status Column -->
								<td class="py-3 px-4 whitespace-nowrap">
									{#if hasActiveBreak}
										<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
											On Break
										</span>
									{:else if record.status === 'present'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
											<CheckCircle2 class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
											Present
										</span>
									{:else if record.status === 'absent'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
											<XCircle class="w-3 h-3 text-rose-600 dark:text-rose-400" />
											Absent
										</span>
									{:else if record.status === 'half_day'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
											<AlertCircle class="w-3 h-3 text-blue-600 dark:text-blue-400" />
											Half Day
										</span>
									{:else if record.status === 'on_leave'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
											<Sparkles class="w-3 h-3 text-purple-600 dark:text-purple-400" />
											On Leave
										</span>
									{:else}
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
											{record.status}
										</span>
									{/if}
								</td>

								<!-- Actions Column -->
								<td class="py-3 px-4 whitespace-nowrap text-right">
									<button
										type="button"
										onclick={() => openBreaksModal(record)}
										class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
										title="View Breaks & Details"
									>
										<Eye class="w-3.5 h-3.5" />
										<span>Breaks</span>
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Footer Summary Bar -->
			<div class="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
				<div>
					Showing <span class="font-bold text-slate-800 dark:text-slate-200">{filteredRecords.length}</span> of{' '}
					<span class="font-bold text-slate-800 dark:text-slate-200">{records.length}</span> records
				</div>
				<div class="flex items-center gap-4 text-xs">
					<span>Standard Shift: <strong class="text-slate-700 dark:text-slate-300">8h 00m</strong></span>
					<span>•</span>
					<span>Overtime Threshold: <strong class="text-slate-700 dark:text-slate-300">&gt; 8h</strong></span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Breaks Detail Modal -->
	{#if activeBreakRecord}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
			<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
					<div class="flex items-center gap-2.5">
						<div class="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg">
							<Coffee class="w-5 h-5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
								Break Details — {activeBreakRecord.employee?.firstName || 'Employee'}
							</h3>
							<p class="text-xs text-slate-500 dark:text-slate-400">
								{formatDateClean(activeBreakRecord.date)} • Total: {formatDurationHuman(activeBreakRecord.totalBreakMinutes || 0)}
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (activeBreakRecord = null)}
						class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
					>
						<X class="w-5 h-5" />
					</button>
				</div>

				<div class="p-5 max-h-96 overflow-y-auto space-y-3">
					{#if !activeBreakRecord.breaks || activeBreakRecord.breaks.length === 0}
						<div class="text-center py-6 text-slate-400 text-xs">
							<Coffee class="w-8 h-8 mx-auto mb-2 opacity-40" />
							No break intervals recorded for this session.
						</div>
					{:else}
						{#each activeBreakRecord.breaks as brk, idx}
							<div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
								<div class="flex items-center gap-3">
									<span class="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px]">
										{idx + 1}
									</span>
									<div>
										<div class="font-semibold text-slate-800 dark:text-slate-200">
											{brk.reason || 'General Break'}
										</div>
										<div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
											{formatTime(brk.startTime)} → {brk.endTime ? formatTime(brk.endTime) : 'In Progress...'}
										</div>
									</div>
								</div>
								<div class="font-bold text-slate-700 dark:text-slate-300 text-right">
									{#if brk.endTime}
										{formatDurationHuman(brk.durationMinutes || 0)}
									{:else}
										<span class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
											Active
										</span>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
					<button
						type="button"
						onclick={() => (activeBreakRecord = null)}
						class="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
