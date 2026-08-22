import { sqlite, db } from './client';
import * as schema from './schema';
import type { Certification, WorkHistory } from '$lib/types';
import crypto from 'crypto';

// Dynamic Employee ID Generator: OI + 2 letters firstName + 2 letters lastName + year + 4-digit serial
export function generateEmployeeId(firstName: string, lastName: string, year: number = 2026, serial: number = 1): string {
	const fn = firstName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, 'X');
	const ln = lastName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, 'X');
	const seq = serial.toString().padStart(4, '0');
	return `OI${fn}${ln}${year}${seq}`;
}

// Salary Component Breakdown Engine
export function calculateSalaryBreakdown(monthlyWage: number) {
	const basicSalary = Math.round(monthlyWage * 0.5);
	const hra = Math.round(basicSalary * 0.5);
	const standardAllowance = 4167;
	const performanceBonus = Math.round(basicSalary * 0.0833);
	const lta = Math.round(basicSalary * 0.0833);
	const fixedAllowance = Math.max(
		0,
		monthlyWage - (basicSalary + hra + standardAllowance + performanceBonus + lta)
	);
	const grossSalary = basicSalary + hra + standardAllowance + performanceBonus + lta + fixedAllowance;
	const employeePf = Math.round(basicSalary * 0.12);
	const employerPf = Math.round(basicSalary * 0.12);
	const professionalTax = 200;
	const totalDeductions = employeePf + professionalTax;
	const netSalary = grossSalary - totalDeductions;

	return {
		monthlyWage,
		basicSalary,
		hra,
		standardAllowance,
		performanceBonus,
		lta,
		fixedAllowance,
		grossSalary,
		employeePf,
		employerPf,
		professionalTax,
		totalDeductions,
		netSalary
	};
}

interface RawEmployeeSeed {
	email: string;
	role: 'admin' | 'hr' | 'employee';
	firstName: string;
	lastName: string;
	phone: string;
	jobTitle: string;
	department: string;
	managerIndex?: number;
	avatarUrl: string;
	status: 'active' | 'on_leave' | 'inactive';
	joinDate: string;
	aboutBio: string;
	aboutPassions: string;
	aboutHobbies: string;
	skills: string[];
	certifications: Certification[];
	workHistory: WorkHistory[];
	panNumber: string;
	uanNumber: string;
	dob: string;
	gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
	maritalStatus: 'single' | 'married' | 'other';
	address: string;
	bankAccountNumber: string;
	bankIfsc: string;
	bankName: string;
	monthlyWage: number;
}

const employeeSeedData: RawEmployeeSeed[] = [
	{
		email: 'admin@dayflow.internal',
		role: 'admin',
		firstName: 'Aarav',
		lastName: 'Sharma',
		phone: '+91 98201 11001',
		jobTitle: 'Chief Executive Officer & Admin',
		department: 'Executive',
		avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-01-15',
		aboutBio: 'Visionary technology leader with 15+ years scaling enterprise SaaS, operations, and distributed engineering organizations.',
		aboutPassions: 'Building high-impact software ecosystems, organizational design, and empowering cross-functional product teams.',
		aboutHobbies: 'Long-distance running, playing chess, and exploring specialty coffee roasters.',
		skills: ['Executive Leadership', 'Product Strategy', 'System Architecture', 'Financial Planning', 'M&A', 'Enterprise Sales'],
		certifications: [
			{ name: 'Executive Leadership Program', issuer: 'Stanford GSB', year: 2022 },
			{ name: 'Certified Scrum Product Owner (CSPO)', issuer: 'Scrum Alliance', year: 2020 }
		],
		workHistory: [
			{ company: 'HyperScale Technologies', role: 'VP of Engineering', duration: '2019 - 2022', description: 'Grew engineering team from 20 to 140 engineers across 4 hubs.' },
			{ company: 'NovaCloud Global', role: 'Principal Architect', duration: '2015 - 2019', description: 'Architected multi-tenant cloud storage processing 10B+ daily events.' }
		],
		panNumber: 'ABCPS1234F',
		uanNumber: '100984729102',
		dob: '1987-04-12',
		gender: 'male',
		maritalStatus: 'married',
		address: '402 Skylark Heights, Indiranagar, Bengaluru, Karnataka 560038',
		bankAccountNumber: '918273645012',
		bankIfsc: 'HDFC0001234',
		bankName: 'HDFC Bank',
		monthlyWage: 250000
	},
	{
		email: 'hr@dayflow.internal',
		role: 'hr',
		firstName: 'Priya',
		lastName: 'Nair',
		phone: '+91 98201 11002',
		jobTitle: 'Head of People & HR Operations',
		department: 'Human Resources',
		managerIndex: 0,
		avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-03-01',
		aboutBio: 'Strategic HR leader specialized in talent acquisition, performance management, empathetic culture, and total rewards optimization.',
		aboutPassions: 'Inclusive workplace culture, employee well-being frameworks, and modern automated HR operations.',
		aboutHobbies: 'Contemporary classical piano, pottery, and reading behavioral economics.',
		skills: ['Talent Strategy', 'Payroll Compliance', 'Performance Management', 'Conflict Resolution', 'HR Analytics', 'Culture Building'],
		certifications: [
			{ name: 'SHRM Senior Certified Professional (SHRM-SCP)', issuer: 'SHRM', year: 2021 },
			{ name: 'Certified Compensation Professional (CCP)', issuer: 'WorldatWork', year: 2023 }
		],
		workHistory: [
			{ company: 'Apex Human Capital', role: 'Lead HR Business Partner', duration: '2020 - 2023', description: 'Led strategic HR initiatives across APAC technology verticals.' },
			{ company: 'Zeta Software Labs', role: 'Talent Acquisition Specialist', duration: '2017 - 2020', description: 'Managed technical recruitment cycles for AI & backend infrastructure.' }
		],
		panNumber: 'PRNPS5678G',
		uanNumber: '100874628190',
		dob: '1991-09-24',
		gender: 'female',
		maritalStatus: 'single',
		address: '12B Palm Meadows, Whitefield, Bengaluru, Karnataka 560066',
		bankAccountNumber: '827364519203',
		bankIfsc: 'ICIC0002345',
		bankName: 'ICICI Bank',
		monthlyWage: 140000
	},
	{
		email: 'employee@dayflow.internal',
		role: 'employee',
		firstName: 'Rohan',
		lastName: 'Verma',
		phone: '+91 98201 11003',
		jobTitle: 'Senior Full Stack Engineer',
		department: 'Engineering',
		managerIndex: 0,
		avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-06-10',
		aboutBio: 'Full-stack software engineer passionate about reactive user interfaces, clean architecture, and blazing-fast web runtimes.',
		aboutPassions: 'Building reactive web applications with SvelteKit, SQLite edge architectures, and developer tooling.',
		aboutHobbies: 'Road cycling, mechanical keyboards building, and indie video game development.',
		skills: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Node.js', 'SQLite', 'PostgreSQL', 'Docker', 'Redis'],
		certifications: [
			{ name: 'AWS Certified Developer Associate', issuer: 'Amazon Web Services', year: 2023 },
			{ name: 'Meta Front-End Developer Professional Certificate', issuer: 'Coursera / Meta', year: 2022 }
		],
		workHistory: [
			{ company: 'PixelCraft Systems', role: 'Full Stack Engineer', duration: '2021 - 2023', description: 'Built real-time collaboration dashboards using WebSockets and TypeScript.' },
			{ company: 'Starlight Media', role: 'Junior Frontend Developer', duration: '2019 - 2021', description: 'Developed high-conversion UI landing pages and design system components.' }
		],
		panNumber: 'ROHPS9182H',
		uanNumber: '100763529182',
		dob: '1995-11-18',
		gender: 'male',
		maritalStatus: 'single',
		address: '74 Koramangala 4th Block, Bengaluru, Karnataka 560034',
		bankAccountNumber: '736452819034',
		bankIfsc: 'SBIN0003456',
		bankName: 'State Bank of India',
		monthlyWage: 110000
	},
	{
		email: 'vikram.malhotra@dayflow.internal',
		role: 'employee',
		firstName: 'Vikram',
		lastName: 'Malhotra',
		phone: '+91 98201 11004',
		jobTitle: 'Lead Systems Architect',
		department: 'Engineering',
		managerIndex: 0,
		avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-02-01',
		aboutBio: 'Distributed systems engineer focused on high-throughput event processing, database internals, and zero-downtime reliability.',
		aboutPassions: 'Rust, Raft consensus protocols, Linux kernel performance tuning, and low-latency storage engines.',
		aboutHobbies: 'Amateur astronomy, astrophotography, and trekking in the Western Ghats.',
		skills: ['Go', 'Rust', 'Distributed Systems', 'Kubernetes', 'SQLite/LibSQL', 'gRPC', 'Database Internals'],
		certifications: [
			{ name: 'Certified Kubernetes Administrator (CKA)', issuer: 'Linux Foundation', year: 2023 },
			{ name: 'AWS Certified Solutions Architect Professional', issuer: 'Amazon Web Services', year: 2022 }
		],
		workHistory: [
			{ company: 'CloudGrid Data Systems', role: 'Senior Infrastructure Engineer', duration: '2020 - 2023', description: 'Maintained zero-downtime Kubernetes clusters handling 50k RPS.' },
			{ company: 'InfraScale Networks', role: 'Systems Engineer', duration: '2017 - 2020', description: 'Engineered high-speed packet filtering and SDN telemetry tools.' }
		],
		panNumber: 'VIKPS3829K',
		uanNumber: '100652418293',
		dob: '1989-08-05',
		gender: 'male',
		maritalStatus: 'married',
		address: '301 Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
		bankAccountNumber: '645281903475',
		bankIfsc: 'HDFC0005678',
		bankName: 'HDFC Bank',
		monthlyWage: 175000
	},
	{
		email: 'ananya.iyer@dayflow.internal',
		role: 'employee',
		firstName: 'Ananya',
		lastName: 'Iyer',
		phone: '+91 98201 11005',
		jobTitle: 'Frontend Engineer',
		department: 'Engineering',
		managerIndex: 3,
		avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2024-01-10',
		aboutBio: 'Craftsman of delightful web animations, accessible interfaces, and ergonomic design systems.',
		aboutPassions: 'Web accessibility (WCAG AAA), CSS Houdini, Svelte 5 runes, and micro-interactions.',
		aboutHobbies: 'Urban sketching, watercolor painting, and collecting vinyl records.',
		skills: ['Svelte 5', 'TypeScript', 'Tailwind CSS', 'CSS Architecture', 'Framer Motion', 'Web Accessibility (a11y)'],
		certifications: [
			{ name: 'Certified Web Accessibility Specialist (WAS)', issuer: 'IAAP', year: 2023 },
			{ name: 'Advanced UI Engineering', issuer: 'Frontend Masters', year: 2024 }
		],
		workHistory: [
			{ company: 'BrightStudio Digital', role: 'Frontend Developer', duration: '2022 - 2023', description: 'Built headless e-commerce store with sub-second page loads.' }
		],
		panNumber: 'ANIYS4920L',
		uanNumber: '100541307184',
		dob: '1998-03-14',
		gender: 'female',
		maritalStatus: 'single',
		address: '204 HSR Layout Sector 1, Bengaluru, Karnataka 560102',
		bankAccountNumber: '534182904756',
		bankIfsc: 'UTIB0001890',
		bankName: 'Axis Bank',
		monthlyWage: 85000
	},
	{
		email: 'dev.patel@dayflow.internal',
		role: 'employee',
		firstName: 'Dev',
		lastName: 'Patel',
		phone: '+91 98201 11006',
		jobTitle: 'Backend Engineer',
		department: 'Engineering',
		managerIndex: 3,
		avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2024-02-15',
		aboutBio: 'Backend artisan focused on robust APIs, transactional consistency, and SQLite optimization.',
		aboutPassions: 'Type-safe SQL query engines, database migrations, and microservice orchestration.',
		aboutHobbies: 'Specialty pour-over coffee, chess, and bouldering.',
		skills: ['Node.js', 'Bun', 'Drizzle ORM', 'SQLite', 'PostgreSQL', 'RESTful APIs', 'JWT & OAuth2'],
		certifications: [
			{ name: 'Certified OpenJS Node.js Application Developer', issuer: 'OpenJS Foundation', year: 2023 }
		],
		workHistory: [
			{ company: 'FinTech Pulse', role: 'Software Developer', duration: '2022 - 2024', description: 'Implemented PCI-DSS compliant payment processing integrations.' }
		],
		panNumber: 'DEVPK6821M',
		uanNumber: '100430296075',
		dob: '1997-07-29',
		gender: 'male',
		maritalStatus: 'single',
		address: '15 Sarjapur Main Road, Bengaluru, Karnataka 560035',
		bankAccountNumber: '423071829564',
		bankIfsc: 'KKBK0004567',
		bankName: 'Kotak Mahindra Bank',
		monthlyWage: 90000
	},
	{
		email: 'sneha.kulkarni@dayflow.internal',
		role: 'employee',
		firstName: 'Sneha',
		lastName: 'Kulkarni',
		phone: '+91 98201 11007',
		jobTitle: 'Principal Product Manager',
		department: 'Product',
		managerIndex: 0,
		avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-04-15',
		aboutBio: 'Customer-obsessed product strategist bridging user empathy, data analytics, and high-velocity product shipping.',
		aboutPassions: 'Product discovery frameworks, user retention loops, and frictionless onboarding experiences.',
		aboutHobbies: 'Hiking, baking sourdough bread, and hosting book clubs.',
		skills: ['Product Discovery', 'Roadmapping', 'User Journey Mapping', 'A/B Testing', 'SQL Analytics', 'Figma'],
		certifications: [
			{ name: 'Product Management Certificate', issuer: 'Product School', year: 2021 },
			{ name: 'Advanced User Research Specialist', issuer: 'Nielsen Norman Group', year: 2023 }
		],
		workHistory: [
			{ company: 'GrowthLoop SaaS', role: 'Senior PM', duration: '2020 - 2023', description: 'Increased product activation rate by 34% through redesigned wizard.' },
			{ company: 'OmniDesk Tech', role: 'Associate PM', duration: '2018 - 2020', description: 'Owned mobile workflow experiences with 4.8-star app store ratings.' }
		],
		panNumber: 'SNEPK8934N',
		uanNumber: '100329185964',
		dob: '1992-12-08',
		gender: 'female',
		maritalStatus: 'married',
		address: '58 Defence Colony, Indiranagar, Bengaluru, Karnataka 560038',
		bankAccountNumber: '312960718453',
		bankIfsc: 'HDFC0006789',
		bankName: 'HDFC Bank',
		monthlyWage: 155000
	},
	{
		email: 'arjun.mehta@dayflow.internal',
		role: 'employee',
		firstName: 'Arjun',
		lastName: 'Mehta',
		phone: '+91 98201 11008',
		jobTitle: 'Senior UI/UX Designer',
		department: 'Design',
		managerIndex: 6,
		avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-08-01',
		aboutBio: 'Crafting pixel-perfect design systems, intuitive user workflows, and cohesive brand experiences.',
		aboutPassions: 'Design tokens, dark-mode ergonomics, micro-interactions, and typography hierarchy.',
		aboutHobbies: 'Photography, typography collecting, and cycling.',
		skills: ['Figma Mastery', 'Design Systems', 'Prototyping', 'User Research', 'Information Architecture', 'Tailwind CSS'],
		certifications: [
			{ name: 'Interaction Design Specialization', issuer: 'UC San Diego / Coursera', year: 2022 }
		],
		workHistory: [
			{ company: 'Studio Craft Interactive', role: 'UI/UX Designer', duration: '2021 - 2023', description: 'Designed end-to-end design systems adopted by 50+ enterprise apps.' }
		],
		panNumber: 'ARJPM2049P',
		uanNumber: '100218074853',
		dob: '1994-06-22',
		gender: 'male',
		maritalStatus: 'single',
		address: '89 Lavelle Road, Shanthala Nagar, Bengaluru, Karnataka 560001',
		bankAccountNumber: '201859607342',
		bankIfsc: 'ICIC0007890',
		bankName: 'ICICI Bank',
		monthlyWage: 105000
	},
	{
		email: 'kavita.desai@dayflow.internal',
		role: 'employee',
		firstName: 'Kavita',
		lastName: 'Desai',
		phone: '+91 98201 11009',
		jobTitle: 'Head of Growth & Marketing',
		department: 'Marketing',
		managerIndex: 0,
		avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-05-20',
		aboutBio: 'Data-driven growth marketer experienced in omnichannel B2B acquisition, SEO, and content engines.',
		aboutPassions: 'PLG growth mechanics, viral expansion loops, and performance branding.',
		aboutHobbies: 'Running half-marathons, reading memoirs, and culinary experiments.',
		skills: ['Growth Marketing', 'B2B Demand Gen', 'SEO & Content Strategy', 'HubSpot & CRM', 'Performance Paid Ads'],
		certifications: [
			{ name: 'Reforge Growth Series Certificate', issuer: 'Reforge', year: 2023 },
			{ name: 'Google Ads Search & Measurement Certified', issuer: 'Google', year: 2022 }
		],
		workHistory: [
			{ company: 'ScaleUp Ventures', role: 'Senior Marketing Lead', duration: '2020 - 2023', description: 'Drove 4.5x pipeline growth in B2B enterprise tier over 24 months.' }
		],
		panNumber: 'KAVDK7193Q',
		uanNumber: '100107963742',
		dob: '1993-02-17',
		gender: 'female',
		maritalStatus: 'single',
		address: '103 Richmond Town, Bengaluru, Karnataka 560025',
		bankAccountNumber: '190748596231',
		bankIfsc: 'SBIN0008901',
		bankName: 'State Bank of India',
		monthlyWage: 125000
	},
	{
		email: 'rahul.singhania@dayflow.internal',
		role: 'employee',
		firstName: 'Rahul',
		lastName: 'Singhania',
		phone: '+91 98201 11010',
		jobTitle: 'Enterprise Sales Director',
		department: 'Sales',
		managerIndex: 0,
		avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2023-07-01',
		aboutBio: 'High-performing enterprise dealmaker specialized in closing multi-year contracts with Fortune 500 accounts.',
		aboutPassions: 'Consultative enterprise sales, complex contract negotiations, and client success.',
		aboutHobbies: 'Golf, squash, and tasting single-origin coffees.',
		skills: ['Enterprise Account Executive', 'MEDDPICC', 'Sales Leadership', 'Contract Negotiation', 'Executive Presentations'],
		certifications: [
			{ name: 'MEDDPICC Certified Sales Specialist', issuer: 'Force Management', year: 2022 }
		],
		workHistory: [
			{ company: 'Global Solutions Inc.', role: 'Senior Enterprise AE', duration: '2019 - 2023', description: 'Generated $3.8M ARR consistently exceeding 120% quota.' }
		],
		panNumber: 'RAHSK9382R',
		uanNumber: '100096852631',
		dob: '1990-10-30',
		gender: 'male',
		maritalStatus: 'married',
		address: '704 Prestige Falcon City, Kanakapura Road, Bengaluru, Karnataka 560062',
		bankAccountNumber: '089637485120',
		bankIfsc: 'HDFC0009012',
		bankName: 'HDFC Bank',
		monthlyWage: 145000
	},
	{
		email: 'neha.gupta@dayflow.internal',
		role: 'employee',
		firstName: 'Neha',
		lastName: 'Gupta',
		phone: '+91 98201 11011',
		jobTitle: 'Senior Account Executive',
		department: 'Sales',
		managerIndex: 9,
		avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2024-03-01',
		aboutBio: 'Dynamic SaaS sales specialist focused on Mid-Market expansions and customer lifecycle growth.',
		aboutPassions: 'Solution discovery, CRM analytics, and relationship building.',
		aboutHobbies: 'Badminton, baking, and travel vlogging.',
		skills: ['B2B SaaS Sales', 'Pipeline Management', 'Customer Success', 'Salesforce CRM', 'Cold Outreach'],
		certifications: [
			{ name: 'Inbound Sales Certified', issuer: 'HubSpot Academy', year: 2023 }
		],
		workHistory: [
			{ company: 'NexGen Cloud', role: 'Account Executive', duration: '2022 - 2024', description: 'Closed 40+ mid-market contracts with 98% retention.' }
		],
		panNumber: 'NEHGK4829S',
		uanNumber: '100985741520',
		dob: '1996-05-19',
		gender: 'female',
		maritalStatus: 'single',
		address: '32 80 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560008',
		bankAccountNumber: '978526374019',
		bankIfsc: 'UTIB0002123',
		bankName: 'Axis Bank',
		monthlyWage: 80000
	},
	{
		email: 'tanvi.joshi@dayflow.internal',
		role: 'hr',
		firstName: 'Tanvi',
		lastName: 'Joshi',
		phone: '+91 98201 11012',
		jobTitle: 'HR Talent & Payroll Specialist',
		department: 'Human Resources',
		managerIndex: 1,
		avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
		status: 'active',
		joinDate: '2024-01-15',
		aboutBio: 'Diligent HR operations specialist managing payroll compliance, onboarding experiences, and employee queries.',
		aboutPassions: 'Error-free payroll execution, seamless onboarding, and employee happiness initiatives.',
		aboutHobbies: 'Yoga, journaling, and indoor gardening.',
		skills: ['Payroll Administration', 'Statutory Compliance', 'Employee Onboarding', 'Leave Management', 'HRIS Systems'],
		certifications: [
			{ name: 'Payroll & Statutory Compliance Specialist', issuer: 'NIPM India', year: 2023 }
		],
		workHistory: [
			{ company: 'HR First Consulting', role: 'HR Operations Associate', duration: '2022 - 2024', description: 'Managed monthly payroll cycles for 300+ employees.' }
		],
		panNumber: 'TANJK5938T',
		uanNumber: '100874630419',
		dob: '1997-09-02',
		gender: 'female',
		maritalStatus: 'single',
		address: '401 Casa Greens, JP Nagar 7th Phase, Bengaluru, Karnataka 560078',
		bankAccountNumber: '867415293028',
		bankIfsc: 'ICIC0003456',
		bankName: 'ICICI Bank',
		monthlyWage: 75000
	}
];

export async function seedDatabase() {
	console.log('🚀 Starting Dayflow HRMS database seed...');

	// 1. Clear existing records in cascade order
	sqlite.run('PRAGMA foreign_keys = OFF;');
	sqlite.run('DELETE FROM chatter;');
	sqlite.run('DELETE FROM payslips;');
	sqlite.run('DELETE FROM leave_requests;');
	sqlite.run('DELETE FROM leave_balances;');
	sqlite.run('DELETE FROM attendance_breaks;');
	sqlite.run('DELETE FROM attendance;');
	sqlite.run('DELETE FROM employees;');
	sqlite.run('DELETE FROM users;');
	sqlite.run('PRAGMA foreign_keys = ON;');

	console.log('🧹 Cleaned existing database records.');

	// 2. Hash standard demo password
	const defaultPasswordHash = await Bun.password.hash('Dayflow@2026');
	const now = new Date().toISOString();

	// 3. Insert Users and Employees
	const createdUsers: (typeof schema.users.$inferInsert)[] = [];
	const createdEmployees: (typeof schema.employees.$inferInsert)[] = [];

	for (let i = 0; i < employeeSeedData.length; i++) {
		const raw = employeeSeedData[i];
		const userId = crypto.randomUUID();
		const employeeId = generateEmployeeId(raw.firstName, raw.lastName, 2026, i + 1);

		const userRecord: typeof schema.users.$inferInsert = {
			id: userId,
			email: raw.email,
			passwordHash: defaultPasswordHash,
			name: `${raw.firstName} ${raw.lastName}`,
			role: raw.role,
			createdAt: now,
			updatedAt: now
		};
		createdUsers.push(userRecord);

		const employeeRecord: typeof schema.employees.$inferInsert = {
			id: employeeId,
			userId: userId,
			firstName: raw.firstName,
			lastName: raw.lastName,
			email: raw.email,
			phone: raw.phone,
			jobTitle: raw.jobTitle,
			department: raw.department,
			managerId: null, // assigned in next pass
			avatarUrl: raw.avatarUrl,
			status: raw.status,
			joinDate: raw.joinDate,
			aboutBio: raw.aboutBio,
			aboutPassions: raw.aboutPassions,
			aboutHobbies: raw.aboutHobbies,
			skills: raw.skills,
			certifications: raw.certifications,
			workHistory: raw.workHistory,
			panNumber: raw.panNumber,
			uanNumber: raw.uanNumber,
			dob: raw.dob,
			gender: raw.gender,
			maritalStatus: raw.maritalStatus,
			address: raw.address,
			bankAccountNumber: raw.bankAccountNumber,
			bankIfsc: raw.bankIfsc,
			bankName: raw.bankName,
			monthlyWage: raw.monthlyWage,
			createdAt: now,
			updatedAt: now
		};
		createdEmployees.push(employeeRecord);
	}

	// Link manager IDs
	for (let i = 0; i < employeeSeedData.length; i++) {
		const mIdx = employeeSeedData[i].managerIndex;
		if (mIdx !== undefined && createdEmployees[mIdx]) {
			createdEmployees[i].managerId = createdEmployees[mIdx].id;
		}
	}

	// Batch insert Users
	for (const user of createdUsers) {
		await db.insert(schema.users).values(user);
	}

	// Batch insert Employees
	for (const emp of createdEmployees) {
		await db.insert(schema.employees).values(emp);
	}

	console.log(`👤 Inserted ${createdUsers.length} users and ${createdEmployees.length} employee profiles.`);

	// 4. Generate Leave Balances (Year 2026)
	const leaveBalancesData: (typeof schema.leaveBalances.$inferInsert)[] = [];
	for (let i = 0; i < createdEmployees.length; i++) {
		const emp = createdEmployees[i];
		// Give some varied PTO / sick leave usage
		const ptoUsed = i === 2 ? 3 : i === 4 ? 2 : i === 7 ? 4 : i === 10 ? 1 : 0;
		const sickUsed = i === 5 ? 2 : i === 3 ? 1 : 0;

		leaveBalancesData.push({
			id: crypto.randomUUID(),
			employeeId: emp.id,
			year: 2026,
			paidTimeOffTotal: 24,
			paidTimeOffUsed: ptoUsed,
			sickLeaveTotal: 7,
			sickLeaveUsed: sickUsed,
			unpaidLeaveUsed: 0,
			updatedAt: now
		});
	}

	for (const lb of leaveBalancesData) {
		await db.insert(schema.leaveBalances).values(lb);
	}
	console.log(`📅 Inserted 2026 leave quotas for all ${leaveBalancesData.length} employees.`);

	// 5. Generate Leave Requests
	const adminUserId = createdUsers[0].id;
	const hrUserId = createdUsers[1].id;

	const sampleLeaveRequests: (typeof schema.leaveRequests.$inferInsert)[] = [
		{
			id: crypto.randomUUID(),
			employeeId: createdEmployees[2].id, // Rohan Verma (Demo Employee)
			leaveType: 'paid_time_off',
			startDate: '2026-07-14',
			endDate: '2026-07-16',
			totalDays: 3,
			reason: 'Family gathering and travel to hometown.',
			status: 'approved',
			approvedBy: hrUserId,
			rejectionReason: null,
			attachmentUrl: null,
			createdAt: '2026-07-10T10:00:00.000Z',
			updatedAt: '2026-07-11T14:30:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			employeeId: createdEmployees[4].id, // Ananya Iyer
			leaveType: 'paid_time_off',
			startDate: '2026-08-04',
			endDate: '2026-08-05',
			totalDays: 2,
			reason: 'Attending web accessibility symposium.',
			status: 'approved',
			approvedBy: hrUserId,
			rejectionReason: null,
			attachmentUrl: null,
			createdAt: '2026-07-28T09:15:00.000Z',
			updatedAt: '2026-07-29T11:20:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			employeeId: createdEmployees[5].id, // Dev Patel
			leaveType: 'sick_leave',
			startDate: '2026-08-18',
			endDate: '2026-08-19',
			totalDays: 2,
			reason: 'Viral fever and doctor-prescribed recovery rest.',
			status: 'approved',
			approvedBy: hrUserId,
			rejectionReason: null,
			attachmentUrl: null,
			createdAt: '2026-08-18T08:00:00.000Z',
			updatedAt: '2026-08-18T09:30:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			employeeId: createdEmployees[7].id, // Arjun Mehta
			leaveType: 'paid_time_off',
			startDate: '2026-08-27',
			endDate: '2026-08-29',
			totalDays: 3,
			reason: 'Annual personal leave for photography expedition.',
			status: 'pending',
			approvedBy: null,
			rejectionReason: null,
			attachmentUrl: null,
			createdAt: '2026-08-21T16:45:00.000Z',
			updatedAt: '2026-08-21T16:45:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			employeeId: createdEmployees[10].id, // Neha Gupta
			leaveType: 'paid_time_off',
			startDate: '2026-08-30',
			endDate: '2026-08-31',
			totalDays: 2,
			reason: 'Weekend extension trip.',
			status: 'pending',
			approvedBy: null,
			rejectionReason: null,
			attachmentUrl: null,
			createdAt: '2026-08-22T09:10:00.000Z',
			updatedAt: '2026-08-22T09:10:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			employeeId: createdEmployees[3].id, // Vikram Malhotra
			leaveType: 'paid_time_off',
			startDate: '2026-08-14',
			endDate: '2026-08-14',
			totalDays: 1,
			reason: 'Personal emergency leave before holiday.',
			status: 'rejected',
			approvedBy: adminUserId,
			rejectionReason: 'Critical database infrastructure maintenance scheduled for this window. Please reschedule.',
			attachmentUrl: null,
			createdAt: '2026-08-12T11:00:00.000Z',
			updatedAt: '2026-08-12T15:00:00.000Z'
		}
	];

	for (const req of sampleLeaveRequests) {
		await db.insert(schema.leaveRequests).values(req);
	}
	console.log(`📝 Inserted ${sampleLeaveRequests.length} leave requests (approved, pending, rejected).`);

	// 6. Generate Attendance records for the last 14 days and today
	// Today is 2026-08-22 (Saturday)
	// Dates: 2026-08-08 through 2026-08-22 (15 total days)
	const dates: string[] = [];
	const baseDate = new Date('2026-08-08T00:00:00Z');
	for (let i = 0; i <= 14; i++) {
		const d = new Date(baseDate.getTime() + i * 86400000);
		dates.push(d.toISOString().slice(0, 10));
	}

	const attendanceRecords: (typeof schema.attendance.$inferInsert)[] = [];
	const breakRecords: (typeof schema.attendanceBreaks.$inferInsert)[] = [];

	for (const dateStr of dates) {
		const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0 = Sun, 6 = Sat
		const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
		const isToday = dateStr === '2026-08-22';

		for (let empIdx = 0; empIdx < createdEmployees.length; empIdx++) {
			const emp = createdEmployees[empIdx];
			const attId = crypto.randomUUID();

			// For weekends (except today if active)
			if (isWeekend && !isToday) {
				// Weekend: Most employees don't have attendance or have overtime on occasion
				if (empIdx === 0 || empIdx === 3) {
					// Leadership occasionally checks in on Saturday
					if (dateStr === '2026-08-08' || dateStr === '2026-08-15') {
						const checkIn = `${dateStr}T10:00:00.000Z`;
						const checkOut = `${dateStr}T14:30:00.000Z`;
						const workMin = 270;
						attendanceRecords.push({
							id: attId,
							employeeId: emp.id,
							date: dateStr,
							checkIn,
							checkOut,
							totalWorkMinutes: workMin,
							totalBreakMinutes: 0,
							overtimeMinutes: workMin,
							status: 'present',
							createdAt: `${dateStr}T10:00:00.000Z`,
							updatedAt: `${dateStr}T14:30:00.000Z`
						});
					}
				}
				continue;
			}

			// Special condition: Dev Patel was on approved sick leave on 2026-08-18 and 2026-08-19
			if (empIdx === 5 && (dateStr === '2026-08-18' || dateStr === '2026-08-19')) {
				attendanceRecords.push({
					id: attId,
					employeeId: emp.id,
					date: dateStr,
					checkIn: null,
					checkOut: null,
					totalWorkMinutes: 0,
					totalBreakMinutes: 0,
					overtimeMinutes: 0,
					status: 'on_leave',
					createdAt: `${dateStr}T09:00:00.000Z`,
					updatedAt: `${dateStr}T09:00:00.000Z`
				});
				continue;
			}

			// Special condition: Ananya Iyer on PTO 2026-08-04, 2026-08-05 (outside 14d window)

			// Today's attendance simulation (2026-08-22)
			if (isToday) {
				if (empIdx < 8) {
					// Checked in today and currently active
					const checkIn = `${dateStr}T09:15:00.000Z`;
					const breakId = crypto.randomUUID();

					// Add a lunch break currently logged
					breakRecords.push({
						id: breakId,
						attendanceId: attId,
						employeeId: emp.id,
						startTime: `${dateStr}T13:00:00.000Z`,
						endTime: `${dateStr}T13:40:00.000Z`,
						durationMinutes: 40,
						reason: 'Lunch & team sync',
						createdAt: `${dateStr}T13:00:00.000Z`
					});

					attendanceRecords.push({
						id: attId,
						employeeId: emp.id,
						date: dateStr,
						checkIn,
						checkOut: null, // Active session
						totalWorkMinutes: 240, // 4 hours so far
						totalBreakMinutes: 40,
						overtimeMinutes: 0,
						status: 'present',
						createdAt: `${dateStr}T09:15:00.000Z`,
						updatedAt: `${dateStr}T13:45:00.000Z`
					});
				} else if (empIdx === 8) {
					// Kavita Desai on approved half day
					attendanceRecords.push({
						id: attId,
						employeeId: emp.id,
						date: dateStr,
						checkIn: `${dateStr}T09:00:00.000Z`,
						checkOut: `${dateStr}T13:00:00.000Z`,
						totalWorkMinutes: 240,
						totalBreakMinutes: 0,
						overtimeMinutes: 0,
						status: 'half_day',
						createdAt: `${dateStr}T09:00:00.000Z`,
						updatedAt: `${dateStr}T13:00:00.000Z`
					});
				}
				continue;
			}

			// Regular Weekdays (Mon-Fri)
			const checkInMinutes = 540 + (empIdx % 5) * 5; // 09:00 - 09:25
			const checkOutMinutes = 1080 + ((empIdx * 7) % 45); // 18:00 - 18:45
			const breakMins = 45 + (empIdx % 3) * 5; // 45-55 mins total break
			const totalElapsed = checkOutMinutes - checkInMinutes;
			const totalWorkMins = totalElapsed - breakMins;
			const overtimeMins = Math.max(0, totalWorkMins - 480);

			const inH = Math.floor(checkInMinutes / 60).toString().padStart(2, '0');
			const inM = (checkInMinutes % 60).toString().padStart(2, '0');
			const outH = Math.floor(checkOutMinutes / 60).toString().padStart(2, '0');
			const outM = (checkOutMinutes % 60).toString().padStart(2, '0');

			const checkIn = `${dateStr}T${inH}:${inM}:00.000Z`;
			const checkOut = `${dateStr}T${outH}:${outM}:00.000Z`;

			// Breaks
			const lunchBreakId = crypto.randomUUID();
			breakRecords.push({
				id: lunchBreakId,
				attendanceId: attId,
				employeeId: emp.id,
				startTime: `${dateStr}T13:00:00.000Z`,
				endTime: `${dateStr}T13:45:00.000Z`,
				durationMinutes: 45,
				reason: 'Lunch break',
				createdAt: `${dateStr}T13:00:00.000Z`
			});

			if (breakMins > 45) {
				const teaBreakId = crypto.randomUUID();
				breakRecords.push({
					id: teaBreakId,
					attendanceId: attId,
					employeeId: emp.id,
					startTime: `${dateStr}T16:00:00.000Z`,
					endTime: `${dateStr}T16:${(breakMins - 45).toString().padStart(2, '0')}:00.000Z`,
					durationMinutes: breakMins - 45,
					reason: 'Tea break',
					createdAt: `${dateStr}T16:00:00.000Z`
				});
			}

			attendanceRecords.push({
				id: attId,
				employeeId: emp.id,
				date: dateStr,
				checkIn,
				checkOut,
				totalWorkMinutes: totalWorkMins,
				totalBreakMinutes: breakMins,
				overtimeMinutes: overtimeMins,
				status: 'present',
				createdAt: checkIn,
				updatedAt: checkOut
			});
		}
	}

	for (const att of attendanceRecords) {
		await db.insert(schema.attendance).values(att);
	}
	for (const brk of breakRecords) {
		await db.insert(schema.attendanceBreaks).values(brk);
	}
	console.log(`⏱️ Inserted ${attendanceRecords.length} attendance records and ${breakRecords.length} break intervals.`);

	// 7. Generate Calculated Payslips
	// July 2026 (Month 7, Year 2026) -> Status: 'paid'
	// August 2026 (Month 8, Year 2026) -> Status: 'draft'
	const payslipsData: (typeof schema.payslips.$inferInsert)[] = [];

	for (const emp of createdEmployees) {
		const wage = emp.monthlyWage ?? 50000;
		const breakdown = calculateSalaryBreakdown(wage);

		// July 2026 (Paid)
		payslipsData.push({
			id: crypto.randomUUID(),
			employeeId: emp.id,
			month: 7,
			year: 2026,
			monthlyWage: breakdown.monthlyWage,
			basicSalary: breakdown.basicSalary,
			hra: breakdown.hra,
			standardAllowance: breakdown.standardAllowance,
			performanceBonus: breakdown.performanceBonus,
			lta: breakdown.lta,
			fixedAllowance: breakdown.fixedAllowance,
			grossSalary: breakdown.grossSalary,
			employeePf: breakdown.employeePf,
			employerPf: breakdown.employerPf,
			professionalTax: breakdown.professionalTax,
			totalDeductions: breakdown.totalDeductions,
			netSalary: breakdown.netSalary,
			payableDays: 22,
			totalWorkingDays: 22,
			status: 'paid',
			paymentDate: '2026-08-01',
			createdAt: '2026-07-31T18:00:00.000Z',
			updatedAt: '2026-08-01T10:30:00.000Z'
		});

		// August 2026 (Draft/Processed)
		payslipsData.push({
			id: crypto.randomUUID(),
			employeeId: emp.id,
			month: 8,
			year: 2026,
			monthlyWage: breakdown.monthlyWage,
			basicSalary: breakdown.basicSalary,
			hra: breakdown.hra,
			standardAllowance: breakdown.standardAllowance,
			performanceBonus: breakdown.performanceBonus,
			lta: breakdown.lta,
			fixedAllowance: breakdown.fixedAllowance,
			grossSalary: breakdown.grossSalary,
			employeePf: breakdown.employeePf,
			employerPf: breakdown.employerPf,
			professionalTax: breakdown.professionalTax,
			totalDeductions: breakdown.totalDeductions,
			netSalary: breakdown.netSalary,
			payableDays: 21,
			totalWorkingDays: 21,
			status: 'draft',
			paymentDate: null,
			createdAt: '2026-08-22T08:00:00.000Z',
			updatedAt: '2026-08-22T08:00:00.000Z'
		});
	}

	for (const ps of payslipsData) {
		await db.insert(schema.payslips).values(ps);
	}
	console.log(`💰 Inserted ${payslipsData.length} payslips across July and August 2026 with formula calculations.`);

	// 8. Generate Chatter Logs
	const chatterData: (typeof schema.chatter.$inferInsert)[] = [
		{
			id: crypto.randomUUID(),
			entityType: 'employee',
			entityId: createdEmployees[2].id, // Rohan Verma
			authorId: adminUserId,
			authorName: createdUsers[0].name,
			authorAvatar: createdEmployees[0].avatarUrl,
			message: 'Welcome to Dayflow HRMS! Onboarded to Engineering team as Senior Full Stack Engineer.',
			type: 'note',
			metadata: { event: 'onboarding', department: 'Engineering' },
			createdAt: '2023-06-10T09:30:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			entityType: 'employee',
			entityId: createdEmployees[2].id, // Rohan Verma
			authorId: hrUserId,
			authorName: createdUsers[1].name,
			authorAvatar: createdEmployees[1].avatarUrl,
			message: 'Verified tax documentation, PAN ABCPS1234F, and bank account credentials.',
			type: 'field_update',
			metadata: { field: 'privateInfo', status: 'verified' },
			createdAt: '2023-06-12T14:00:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			entityType: 'employee',
			entityId: createdEmployees[4].id, // Ananya Iyer
			authorId: adminUserId,
			authorName: createdUsers[0].name,
			authorAvatar: createdEmployees[0].avatarUrl,
			message: 'Performance appraisal completed: Commended for excellent Svelte 5 component architecture delivery.',
			type: 'note',
			metadata: { reviewScore: 4.9, cycle: 'Q2-2026' },
			createdAt: '2026-07-02T11:00:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			entityType: 'leave',
			entityId: sampleLeaveRequests[0].id, // Approved leave
			authorId: hrUserId,
			authorName: createdUsers[1].name,
			authorAvatar: createdEmployees[1].avatarUrl,
			message: 'Leave request approved for 3 days (Paid Time Off). Balanced quota updated.',
			type: 'status_change',
			metadata: { prevStatus: 'pending', newStatus: 'approved' },
			createdAt: '2026-07-11T14:30:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			entityType: 'leave',
			entityId: sampleLeaveRequests[5].id, // Rejected leave
			authorId: adminUserId,
			authorName: createdUsers[0].name,
			authorAvatar: createdEmployees[0].avatarUrl,
			message: 'Leave request rejected: Critical database infrastructure maintenance window scheduled.',
			type: 'status_change',
			metadata: { prevStatus: 'pending', newStatus: 'rejected' },
			createdAt: '2026-08-12T15:00:00.000Z'
		},
		{
			id: crypto.randomUUID(),
			entityType: 'payroll',
			entityId: payslipsData[0].id,
			authorId: hrUserId,
			authorName: createdUsers[1].name,
			authorAvatar: createdEmployees[1].avatarUrl,
			message: 'July 2026 payroll batch completed and direct deposits credited successfully.',
			type: 'status_change',
			metadata: { batchMonth: 7, batchYear: 2026, totalDisbursed: 1490000 },
			createdAt: '2026-08-01T10:30:00.000Z'
		}
	];

	for (const ch of chatterData) {
		await db.insert(schema.chatter).values(ch);
	}
	console.log(`💬 Inserted ${chatterData.length} chatter feed log entries.`);

	console.log('----------------------------------------------------');
	console.log('🎉 Dayflow HRMS Database seeded successfully!');
	console.log('Default Credentials:');
	console.log('  • Admin:    admin@dayflow.internal    / Dayflow@2026');
	console.log('  • HR:       hr@dayflow.internal       / Dayflow@2026');
	console.log('  • Employee: employee@dayflow.internal / Dayflow@2026');
	console.log('----------------------------------------------------');
}

// Auto-run if executed directly
if (import.meta.main) {
	seedDatabase()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error('❌ Error during seeding:', err);
			process.exit(1);
		});
}
