<script lang="ts">
	import type { PageData } from './$types';
	import PrintablePayslip from '$lib/components/payroll/PrintablePayslip.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="py-2">
	<PrintablePayslip payslip={data.payslip} />
</div>
