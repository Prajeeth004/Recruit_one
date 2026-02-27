
export interface Candidate {
    id: string
    $id?: string
    name?: string
    firstName?: string
    lastName?: string
    title?: string
    current_organization?: string
    email: string
    gender: string
    phone: string
    resume: string
    profileUpdatedByCandidateOn: string
    profileRequestSentOn: string
    skills: string
    fullAddress: string
    city: string
    state: string
    country: string
    owner: string
    lastEmailSentOn: string
    lastCommunication: string
    lastLinkedInMessageSentOn: string
    postalCode: string
    workHistory: string
    educationHistory: string
    hotlist: boolean
    status?: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected' // Added for job-candidates-table
    ranking?: number // Added for job-candidates-table
    appliedDate?: string // Added for job-candidates-table
    callLog?: string[] // Added for call features
    candidateResponse?: string // Added for call features
}

export interface Job {
    id: string
    title: string
    status: string
    company: string
    noteForCandidates: string
    fullAddress: string
    city: string
    locality: string
    jobDescription: string
    minExperience: number
    billRate: number
    maxExperience: number
    minSalary: number
    maxSalary: number
    openings: number
    contactName: string
    contactEmail: string
    contactNumber: string
    owner: string
    hiringPipeline: string
    jobCategory: string
    jobLocationType: string
    payRate: number
    postalCode: string
    hotlist: boolean
    targetCompanies: string
    state: string
    country: string
    collaborator: string
    enableJobApplicationForm: boolean
    postedDate: string
    keywords: string
}

export interface Company {
    id: string
    name: string
    industry: string
    fullAddress: string
    website: string
    openJobs: number
    closedJobs: number
    onHoldJobs: number
    cancelledJobs: number
    owner: string
    hotlist: boolean
}

export const CANDIDATES: Candidate[] = [
    {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        gender: 'Female',
        phone: '415-555-0123',
        resume: 'sarah_chen_resume.pdf',
        profileUpdatedByCandidateOn: '2025-01-15',
        profileRequestSentOn: '2025-01-10',
        skills: 'React, TypeScript, Node.js, AWS',
        fullAddress: '123 Market St, San Francisco, CA',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        owner: 'Alex Thompson',
        lastEmailSentOn: '2025-01-18',
        lastCommunication: 'Phone Screen',
        lastLinkedInMessageSentOn: '2025-01-05',
        postalCode: '94105',
        workHistory: 'Senior Frontend Dev at TechFlow (2020-Present)',
        educationHistory: 'BS CS, UC Berkeley',
        hotlist: true,
        status: 'Interview',
        ranking: 95,
        appliedDate: '2025-01-15',
        callLog: ['Initial screening - Positive', 'Technical round scheduled'],
        candidateResponse: 'Interested',
    },
    {
        id: '2',
        name: 'Michael Rodriguez',
        email: 'm.rodriguez@example.com',
        gender: 'Male',
        phone: '646-555-0456',
        resume: 'michael_r_cv.pdf',
        profileUpdatedByCandidateOn: '2025-01-14',
        profileRequestSentOn: '2025-01-08',
        skills: 'Python, Django, PostgreSQL, Docker',
        fullAddress: '456 Broadway, New York, NY',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        owner: 'Sarah Miller',
        lastEmailSentOn: '2025-01-16',
        lastCommunication: 'Email',
        lastLinkedInMessageSentOn: '2025-01-02',
        postalCode: '10012',
        workHistory: 'Backend Lead at DataCorp (2019-2024)',
        educationHistory: 'MS Data Science, NYU',
        hotlist: false,
        status: 'Screening',
        ranking: 88,
        appliedDate: '2025-01-18',
        callLog: ['Voicemail left'],
        candidateResponse: 'No Answer',
    },
    {
        id: '3',
        name: 'Emily Chang',
        email: 'emily.chang@example.com',
        gender: 'Female',
        phone: '206-555-0789',
        resume: 'echang_portfolio.pdf',
        profileUpdatedByCandidateOn: '2025-01-16',
        profileRequestSentOn: '2025-01-12',
        skills: 'UI/UX Design, Figma, Adobe XD, Prototyping',
        fullAddress: '789 Pine St, Seattle, WA',
        city: 'Seattle',
        state: 'WA',
        country: 'USA',
        owner: 'Alex Thompson',
        lastEmailSentOn: '2025-01-19',
        lastCommunication: 'Portfolio Review',
        lastLinkedInMessageSentOn: '2025-01-10',
        postalCode: '98101',
        workHistory: 'Product Designer at CreativeStudio (2021-Present)',
        educationHistory: 'BFA Design, RISD',
        hotlist: true,
        status: 'Applied',
        ranking: 72,
        appliedDate: '2025-01-20',
        callLog: ['Spoke about portfolio', 'Salary expectations discussed'],
        candidateResponse: 'Negotiating',
    },
    {
        id: '4',
        name: 'David Kim',
        email: 'david.kim@example.com',
        gender: 'Male',
        phone: '512-555-0321',
        resume: 'dkim_resume_v2.pdf',
        profileUpdatedByCandidateOn: '2025-01-12',
        profileRequestSentOn: '2025-01-05',
        skills: 'Java, Spring Boot, Microservices, Kubernetes',
        fullAddress: '321 Congress Ave, Austin, TX',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        owner: 'Sarah Miller',
        lastEmailSentOn: '2025-01-15',
        lastCommunication: 'Technical Interview',
        lastLinkedInMessageSentOn: '2024-12-28',
        postalCode: '78701',
        workHistory: 'Software Engineer at EnterpriseSol (2018-2023)',
        educationHistory: 'BS CS, UT Austin',
        hotlist: false,
        status: 'Offer',
        ranking: 98,
        appliedDate: '2025-01-10'
    },
    {
        id: '5',
        name: 'Jessica Patel',
        email: 'j.patel@example.com',
        gender: 'Female',
        phone: '312-555-0654',
        resume: 'jessica_p_resume.pdf',
        profileUpdatedByCandidateOn: '2025-01-18',
        profileRequestSentOn: '2025-01-15',
        skills: 'Product Management, Agile, Jira, SQL',
        fullAddress: '654 Michigan Ave, Chicago, IL',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        owner: 'Alex Thompson',
        lastEmailSentOn: '2025-01-19',
        lastCommunication: 'Initial Screen',
        lastLinkedInMessageSentOn: '2025-01-14',
        postalCode: '60611',
        workHistory: 'Product Manager at FinTech Inc (2020-Present)',
        educationHistory: 'MBA, Kellogg',
        hotlist: true,
        status: 'Rejected',
        ranking: 45,
        appliedDate: '2025-01-05'
    },
    {
        id: '6',
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        gender: 'Male',
        phone: '720-555-0987',
        resume: 'jwilson_cv.pdf',
        profileUpdatedByCandidateOn: '2025-01-10',
        profileRequestSentOn: '2025-01-01',
        skills: 'DevOps, Terraform, Ansible, Azure',
        fullAddress: '987 Walnut St, Denver, CO',
        city: 'Denver',
        state: 'CO',
        country: 'USA',
        owner: 'Sarah Miller',
        lastEmailSentOn: '2025-01-12',
        lastCommunication: 'Offer Discussion',
        lastLinkedInMessageSentOn: '2024-12-20',
        postalCode: '80202',
        workHistory: 'DevOps Engineer at CloudSystems (2019-2024)',
        educationHistory: 'BS IT, Colorado State',
        hotlist: true,
        status: 'Hired',
        ranking: 92,
        appliedDate: '2025-01-01'
    },
    {
        id: '7',
        name: 'Olivia Brown',
        email: 'olivia.b@example.com',
        gender: 'Female',
        phone: '617-555-0147',
        resume: 'obrown_resume.pdf',
        profileUpdatedByCandidateOn: '2025-01-17',
        profileRequestSentOn: '2025-01-13',
        skills: 'Marketing, SEO, Content Strategy, Google Analytics',
        fullAddress: '147 Newbury St, Boston, MA',
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        owner: 'Alex Thompson',
        lastEmailSentOn: '2025-01-18',
        lastCommunication: 'Email',
        lastLinkedInMessageSentOn: '2025-01-11',
        postalCode: '02116',
        workHistory: 'Marketing Manager at BrandCo (2021-Present)',
        educationHistory: 'BA Communications, Boston University',
        hotlist: false,
        status: 'Applied',
        ranking: 65,
        appliedDate: '2025-01-13'
    },
    {
        id: '8',
        name: 'Robert Taylor',
        email: 'robert.taylor@example.com',
        gender: 'Male',
        phone: '404-555-0258',
        resume: 'rtaylor_cv.pdf',
        profileUpdatedByCandidateOn: '2025-01-13',
        profileRequestSentOn: '2025-01-08',
        skills: 'Sales, CRM, Negotiation, B2B',
        fullAddress: '258 Peachtree St, Atlanta, GA',
        city: 'Atlanta',
        state: 'GA',
        country: 'USA',
        owner: 'Sarah Miller',
        lastEmailSentOn: '2025-01-14',
        lastCommunication: 'Phone Call',
        lastLinkedInMessageSentOn: '2025-01-06',
        postalCode: '30303',
        workHistory: 'Sales Director at GlobalSales (2018-2023)',
        educationHistory: 'BA Business, Georgia Tech',
        hotlist: true,
        status: 'Screening',
        ranking: 80,
        appliedDate: '2025-01-08'
    },
]

export const JOBS: Job[] = [
    {
        id: '1',
        title: 'Senior React Developer',
        status: 'Open',
        company: 'TechFlow',
        noteForCandidates: 'Looking for strong architectural skills',
        fullAddress: '123 Market St, San Francisco, CA',
        city: 'San Francisco',
        locality: 'Financial District',
        jobDescription: 'We are seeking a Senior React Developer to lead our frontend team. You will be responsible for...',
        minExperience: 5,
        billRate: 120,
        maxExperience: 8,
        minSalary: 140000,
        maxSalary: 180000,
        openings: 2,
        contactName: 'Alex Thompson',
        contactEmail: 'alex@techflow.com',
        contactNumber: '415-555-0100',
        owner: 'Alex Thompson',
        hiringPipeline: 'Engineering Pipeline',
        jobCategory: 'Engineering',
        jobLocationType: 'Hybrid',
        payRate: 90,
        postalCode: '94105',
        hotlist: true,
        targetCompanies: 'Google, Meta, Airbnb',
        state: 'CA',
        country: 'USA',
        collaborator: 'Sarah Miller',
        enableJobApplicationForm: true,
        postedDate: '2025-01-15',
        keywords: 'React, TypeScript, Redux, AWS',
    },
    {
        id: '2',
        title: 'Product Manager',
        status: 'Open',
        company: 'FinTech Inc',
        noteForCandidates: 'Experience in payments required',
        fullAddress: '654 Michigan Ave, Chicago, IL',
        city: 'Chicago',
        locality: 'The Loop',
        jobDescription: 'Join our fast-growing fintech startup as a Product Manager. You will drive the roadmap for...',
        minExperience: 4,
        billRate: 100,
        maxExperience: 7,
        minSalary: 130000,
        maxSalary: 160000,
        openings: 1,
        contactName: 'Jessica Patel',
        contactEmail: 'jessica@fintechinc.com',
        contactNumber: '312-555-0200',
        owner: 'Sarah Miller',
        hiringPipeline: 'Product Pipeline',
        jobCategory: 'Product',
        jobLocationType: 'On-site',
        payRate: 75,
        postalCode: '60611',
        hotlist: true,
        targetCompanies: 'Stripe, PayPal, Square',
        state: 'IL',
        country: 'USA',
        collaborator: 'Alex Thompson',
        enableJobApplicationForm: true,
        postedDate: '2025-01-18',
        keywords: 'Product Management, Agile, Payments, SQL',
    },
    {
        id: '3',
        title: 'DevOps Engineer',
        status: 'Interviewing',
        company: 'CloudSystems',
        noteForCandidates: 'Must have Azure certification',
        fullAddress: '987 Walnut St, Denver, CO',
        city: 'Denver',
        locality: 'LoDo',
        jobDescription: 'We are looking for a DevOps Engineer to manage our cloud infrastructure. Key responsibilities...',
        minExperience: 3,
        billRate: 110,
        maxExperience: 6,
        minSalary: 120000,
        maxSalary: 150000,
        openings: 1,
        contactName: 'James Wilson',
        contactEmail: 'james@cloudsystems.com',
        contactNumber: '720-555-0300',
        owner: 'Sarah Miller',
        hiringPipeline: 'Engineering Pipeline',
        jobCategory: 'DevOps',
        jobLocationType: 'Remote',
        payRate: 85,
        postalCode: '80202',
        hotlist: false,
        targetCompanies: 'Microsoft, AWS, Oracle',
        state: 'CO',
        country: 'USA',
        collaborator: 'Alex Thompson',
        enableJobApplicationForm: false,
        postedDate: '2025-01-10',
        keywords: 'Azure, Terraform, Kubernetes, CI/CD',
    },
    {
        id: '4',
        title: 'UX Designer',
        status: 'Open',
        company: 'CreativeStudio',
        noteForCandidates: 'Portfolio required',
        fullAddress: '789 Pine St, Seattle, WA',
        city: 'Seattle',
        locality: 'Downtown',
        jobDescription: 'CreativeStudio is hiring a UX Designer to create intuitive and beautiful user experiences...',
        minExperience: 2,
        billRate: 90,
        maxExperience: 5,
        minSalary: 100000,
        maxSalary: 130000,
        openings: 2,
        contactName: 'Emily Chang',
        contactEmail: 'emily@creativestudio.com',
        contactNumber: '206-555-0400',
        owner: 'Alex Thompson',
        hiringPipeline: 'Design Pipeline',
        jobCategory: 'Design',
        jobLocationType: 'Hybrid',
        payRate: 65,
        postalCode: '98101',
        hotlist: false,
        targetCompanies: 'Adobe, Figma, Apple',
        state: 'WA',
        country: 'USA',
        collaborator: 'Sarah Miller',
        enableJobApplicationForm: true,
        postedDate: '2025-01-19',
        keywords: 'Figma, UX Research, Prototyping, UI Design',
    },
    {
        id: '5',
        title: 'Backend Developer',
        status: 'Closed',
        company: 'DataCorp',
        noteForCandidates: 'Python expert needed',
        fullAddress: '456 Broadway, New York, NY',
        city: 'New York',
        locality: 'SoHo',
        jobDescription: 'DataCorp is seeking a Backend Developer to build scalable data pipelines...',
        minExperience: 6,
        billRate: 130,
        maxExperience: 10,
        minSalary: 150000,
        maxSalary: 190000,
        openings: 0,
        contactName: 'Michael Rodriguez',
        contactEmail: 'michael@datacorp.com',
        contactNumber: '646-555-0500',
        owner: 'Sarah Miller',
        hiringPipeline: 'Engineering Pipeline',
        jobCategory: 'Engineering',
        jobLocationType: 'On-site',
        payRate: 100,
        postalCode: '10012',
        hotlist: false,
        targetCompanies: 'Google, Bloomberg, Goldman Sachs',
        state: 'NY',
        country: 'USA',
        collaborator: 'Alex Thompson',
        enableJobApplicationForm: false,
        postedDate: '2024-12-15',
        keywords: 'Python, Django, PostgreSQL, Redis',
    },
]

export const COMPANIES: Company[] = [
    {
        id: '1',
        name: 'TechFlow',
        industry: 'Technology',
        fullAddress: '123 Market St, San Francisco, CA',
        website: 'https://techflow.example.com',
        openJobs: 5,
        closedJobs: 12,
        onHoldJobs: 1,
        cancelledJobs: 0,
        owner: 'Alex Thompson',
        hotlist: true,
    },
    {
        id: '2',
        name: 'FinTech Inc',
        industry: 'Finance',
        fullAddress: '654 Michigan Ave, Chicago, IL',
        website: 'https://fintechinc.example.com',
        openJobs: 3,
        closedJobs: 8,
        onHoldJobs: 0,
        cancelledJobs: 1,
        owner: 'Sarah Miller',
        hotlist: true,
    },
    {
        id: '3',
        name: 'CloudSystems',
        industry: 'Cloud Computing',
        fullAddress: '987 Walnut St, Denver, CO',
        website: 'https://cloudsystems.example.com',
        openJobs: 2,
        closedJobs: 15,
        onHoldJobs: 2,
        cancelledJobs: 0,
        owner: 'Sarah Miller',
        hotlist: false,
    },
    {
        id: '4',
        name: 'CreativeStudio',
        industry: 'Design Agency',
        fullAddress: '789 Pine St, Seattle, WA',
        website: 'https://creativestudio.example.com',
        openJobs: 4,
        closedJobs: 6,
        onHoldJobs: 0,
        cancelledJobs: 0,
        owner: 'Alex Thompson',
        hotlist: true,
    },
    {
        id: '5',
        name: 'DataCorp',
        industry: 'Data Analytics',
        fullAddress: '456 Broadway, New York, NY',
        website: 'https://datacorp.example.com',
        openJobs: 1,
        closedJobs: 20,
        onHoldJobs: 3,
        cancelledJobs: 2,
        owner: 'Sarah Miller',
        hotlist: false,
    },
    {
        id: '6',
        name: 'HealthPlus',
        industry: 'Healthcare',
        fullAddress: '321 Medical Center Dr, Houston, TX',
        website: 'https://healthplus.example.com',
        openJobs: 6,
        closedJobs: 10,
        onHoldJobs: 0,
        cancelledJobs: 0,
        owner: 'Alex Thompson',
        hotlist: true,
    },
    {
        id: '7',
        name: 'GreenEnergy',
        industry: 'Renewable Energy',
        fullAddress: '159 Solar Way, Austin, TX',
        website: 'https://greenenergy.example.com',
        openJobs: 2,
        closedJobs: 4,
        onHoldJobs: 1,
        cancelledJobs: 0,
        owner: 'Sarah Miller',
        hotlist: false,
    },
    {
        id: '8',
        name: 'GlobalLogistics',
        industry: 'Logistics',
        fullAddress: '753 Port Rd, Miami, FL',
        website: 'https://globallogistics.example.com',
        openJobs: 3,
        closedJobs: 18,
        onHoldJobs: 0,
        cancelledJobs: 1,
        owner: 'Alex Thompson',
        hotlist: true,
    },
]
