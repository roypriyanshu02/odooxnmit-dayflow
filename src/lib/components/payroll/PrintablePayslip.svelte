<script lang="ts">
	import { Printer, Download, ArrowLeft, ShieldCheck, CheckCircle2, QrCode } from '@lucide/svelte';

	interface PayslipData {
		id: string;
		employeeId: string;
		employeeName: string;
		jobTitle: string;
		department: string;
		joinDate: string;
		panNumber?: string;
		uanNumber?: string;
		bankAccountNumber?: string;
		bankIfsc?: string;
		bankName?: string;
		month: number;
		year: number;
		totalWorkingDays: number;
		payableDays: number;
		lopDays: number;
		presentDays: number;
		paidLeaveDays: number;
		unexcusedAbsentDays: number;
		baseMonthlyWage: number;
		proRatedWage: number;
		basicSalary: number;
		hra: number;
		standardAllowance: number;
		performanceBonus: number;
		lta: number;
		fixedAllowance: number;
		grossSalary: number;
		employeePf: number;
		professionalTax: number;
		totalDeductions: number;
		netSalary: number;
		status: 'draft' | 'processed' | 'paid';
		paymentDate?: string | null;
	}

	interface Props {
		payslip: PayslipData;
		companyName?: string;
		companyCin?: string;
		companyAddress?: string;
	}

	let {
		payslip,
		companyName = 'Dayflow Technologies Private Limited',
		companyCin = 'U72900KA2026PTC184920',
		companyAddress = 'Ground Floor, Sector 3, HSR Layout, Bengaluru, Karnataka - 560102'
	}: Props = $props();

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	function numberToWords(num: number): string {
		const a = [
			'',
			'One',
			'Two',
			'Three',
			'Four',
			'Five',
			'Six',
			'Seven',
			'Eight',
			'Nine',
			'Ten',
			'Eleven',
			'Twelve',
			'Thirteen',
			'Fourteen',
			'Fifteen',
			'Sixteen',
			'Seventeen',
			'Eighteen',
			'Nineteen'
		];
		const b = [
			'',
			'',
			'Twenty',
			'Thirty',
			'Forty',
			'Fifty',
			'Sixty',
			'Seventy',
			'Eighty',
			'Ninety'
		];

		const intVal = Math.floor(num);
		if (intVal === 0) return 'Zero Rupees Only';

		function inWords(n: number): string {
			if (n < 20) return a[n];
			if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
			if (n < 1000)
				return (
					a[Math.floor(n / 100)] +
					' Hundred' +
					(n % 100 !== 0 ? ' and ' + inWords(n % 100) : '')
				);
			if (n < 100000)
				return (
					inWords(Math.floor(n / 1000)) +
					' Thousand' +
					(n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '')
				);
			if (n < 10000000)
				return (
					inWords(Math.floor(n / 100000)) +
					' Lakh' +
					(n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '')
				);
			return (
				inWords(Math.floor(n / 10000000)) +
				' Crore' +
				(n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '')
			);
		}

		return `Rupees ${inWords(intVal)} Only`;
	}

	function handlePrint() {
		window.print();
	}
</script>

<div class="space-y-6">
	<!-- Actions Bar (Hidden in Print) -->
	<div class="print:hidden flex items-center justify-between">
		<a
			href="/payroll"
			class="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeft class="h-4 w-4" /> Back to Payroll Hub
		</a>
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={handlePrint}
				class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
			>
				<Printer class="h-3.5 w-3.5" /> Print Payslip / PDF
			</button>
		</div>
	</div>

	<!-- Printable Official Salary Voucher Container -->
	<div
		id="printable-slip"
		class="mx-auto max-w-3xl rounded-xl border border-border/80 bg-card p-8 shadow-sm text-foreground print:border-none print:shadow-none print:p-0"
	>
		<!-- Corporate Header -->
		<div class="border-b border-border/80 pb-5 mb-5 flex items-start justify-between">
			<div>
				<div class="flex items-center gap-2">
					<span class="text-xl font-bold tracking-tight text-foreground font-sans">{companyName}</span>
				</div>
				<p class="text-[11px] text-muted-foreground mt-0.5 max-w-md leading-relaxed">{companyAddress}</p>
				<div class="flex items-center gap-3 text-[10px] text-muted-foreground font-mono mt-1.5">
					<span>CIN: {companyCin}</span>
					<span>•</span>
					<span>Tax Reg: 29AABCU9603R1ZM</span>
				</div>
			</div>
			<div class="text-right">
				<span class="rounded bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary border border-primary/20">
					Salary Slip
				</span>
				<div class="text-sm font-bold text-foreground font-sans mt-2">
					{monthNames[payslip.month - 1]} {payslip.year}
				</div>
				<div class="text-[10px] font-mono text-muted-foreground">ID: {payslip.id}</div>
			</div>
		</div>

		<!-- Employee & Work Details Table -->
		<div class="grid grid-cols-2 gap-4 rounded-lg border border-border/80 bg-muted/20 p-4 mb-5 text-xs">
			<div class="space-y-1.5">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Employee Name:</span>
					<span class="font-bold text-foreground">{payslip.employeeName}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Employee ID:</span>
					<span class="font-mono font-bold text-primary">{payslip.employeeId}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Designation:</span>
					<span class="font-medium text-foreground">{payslip.jobTitle}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Department:</span>
					<span class="font-medium text-foreground">{payslip.department}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Date of Joining:</span>
					<span class="font-mono text-foreground">{payslip.joinDate || '2026-01-15'}</span>
				</div>
			</div>

			<div class="space-y-1.5">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Total Working Days:</span>
					<span class="font-mono font-semibold text-foreground">{payslip.totalWorkingDays}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Payable Days:</span>
					<span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{payslip.payableDays}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Loss of Pay (LOP):</span>
					<span class="font-mono font-semibold {payslip.lopDays > 0 ? 'text-destructive' : 'text-foreground'}">{payslip.lopDays}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">PAN / UAN:</span>
					<span class="font-mono text-foreground">{payslip.panNumber || 'ABCDE1234F'} / {payslip.uanNumber || '100900200300'}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Bank A/C:</span>
					<span class="font-mono text-foreground">{payslip.bankAccountNumber || '••••4820'} ({payslip.bankIfsc || 'HDFC0001234'})</span>
				</div>
			</div>
		</div>

		<!-- Earnings vs Deductions Split Table -->
		<div class="grid grid-cols-2 border border-border/80 rounded-lg overflow-hidden mb-5 text-xs">
			<!-- Earnings Column -->
			<div class="border-r border-border/80">
				<div class="bg-muted/50 px-4 py-2 font-bold text-foreground border-b border-border/80 flex justify-between">
					<span>Earnings</span>
					<span>Amount (₹)</span>
				</div>
				<div class="p-4 space-y-2">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Basic Salary</span>
						<span class="font-mono text-foreground">₹{payslip.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">House Rent Allowance (HRA)</span>
						<span class="font-mono text-foreground">₹{payslip.hra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Standard Allowance</span>
						<span class="font-mono text-foreground">₹{payslip.standardAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Performance Bonus</span>
						<span class="font-mono text-foreground">₹{payslip.performanceBonus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Leave Travel Allowance (LTA)</span>
						<span class="font-mono text-foreground">₹{payslip.lta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Fixed Special Allowance</span>
						<span class="font-mono text-foreground">₹{payslip.fixedAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
				</div>
				<div class="bg-muted/30 px-4 py-2.5 font-bold border-t border-border/80 flex justify-between">
					<span class="text-foreground">Total Gross Salary</span>
					<span class="font-mono text-foreground">₹{payslip.grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
				</div>
			</div>

			<!-- Deductions Column -->
			<div>
				<div class="bg-muted/50 px-4 py-2 font-bold text-foreground border-b border-border/80 flex justify-between">
					<span>Deductions</span>
					<span>Amount (₹)</span>
				</div>
				<div class="p-4 space-y-2">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Provident Fund (Employee PF 12%)</span>
						<span class="font-mono text-destructive">₹{payslip.employeePf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Professional Tax (PT)</span>
						<span class="font-mono text-destructive">₹{payslip.professionalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
					</div>
				</div>
				<div class="bg-muted/30 px-4 py-2.5 font-bold border-t border-border/80 flex justify-between mt-auto">
					<span class="text-foreground">Total Deductions</span>
					<span class="font-mono text-destructive">₹{payslip.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
				</div>
			</div>
		</div>

		<!-- Net Take Home Callout Banner -->
		<div class="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 flex items-center justify-between">
			<div>
				<span class="text-[10px] uppercase font-bold text-primary tracking-wider">Net Take-Home Salary</span>
				<div class="text-2xl font-black font-mono text-primary mt-0.5">
					₹{payslip.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
				</div>
				<p class="text-[11px] text-muted-foreground italic mt-0.5">
					{numberToWords(payslip.netSalary)}
				</p>
			</div>
			<div class="text-right">
				<div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
					<CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" />
					<span>Direct Bank Transfer</span>
				</div>
			</div>
		</div>

		<!-- Verification Stamp & Signatures -->
		<div class="pt-4 border-t border-border/80 flex items-center justify-between text-xs">
			<div class="flex items-center gap-3">
				<!-- Verification QR Code representation -->
				<div class="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-white p-1 shadow-2xs">
					<QrCode class="h-12 w-12 text-foreground" />
				</div>
				<div class="text-[10px] text-muted-foreground leading-tight">
					<span class="font-bold text-foreground block">Digitally Signed & Verified</span>
					<span>Hash: {payslip.id.slice(0, 16)}</span><br />
					<span>Dayflow Payroll Automation V1</span>
				</div>
			</div>

			<div class="text-right">
				<div class="h-10 border-b border-dashed border-muted-foreground/40 w-44 mb-1"></div>
				<span class="text-[10px] font-semibold text-muted-foreground block">Authorized Signatory</span>
				<span class="text-[9px] text-muted-foreground">Dayflow Technologies Pvt Ltd</span>
			</div>
		</div>
	</div>
</div>

<style>
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}
		:global(header),
		:global(nav) {
			display: none !important;
		}
	}
</style>
