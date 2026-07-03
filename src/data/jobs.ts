import { Job } from '../types';

export const mockJobs: Job[] = [
  {
    id: 'job-copywriter',
    title: 'Technical Copywriter & Docs Editor',
    company: 'ReadmeDocs',
    location: 'Remote',
    salary: '$110k - $140k',
    category: 'Technical',
    badge: 'New',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '1 hour ago',
    experienceLevel: 'Mid',
    description: 'We are seeking a Technical Copywriter and Docs Editor to take ownership of our developer documentation hub. You will coordinate with our engineering teams to write clean, interactive API manuals and custom guides.',
    requirements: [
      '3+ years of technical copywriting, developer documentation, or API writing experience.',
      'Proficiency writing documentation for React, TypeScript, and modern JS ecosystems.',
      'Strong version control practices with Git and GitHub documentation workflows.',
      'Ability to translate complex backend APIs into clean, accessible guides.'
    ],
    benefits: [
      'Top-tier health, dental, and vision insurance coverage',
      'Flexible PTO and asynchronous remote work days',
      'Home office stipend and annual learning budget'
    ]
  },
  {
    id: 'job-1',
    title: 'Senior Product Designer',
    company: 'Nebula Systems',
    location: 'San Francisco, CA',
    salary: '$140k - $180k',
    category: 'Design',
    badge: 'New',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '2 hours ago',
    experienceLevel: 'Senior',
    description: 'We are seeking an outstanding Senior Product Designer to craft the future of enterprise cloud platforms. You will design elegant user interfaces and robust interactive experiences, collaborating closely with engineering and product management teams.',
    requirements: [
      '5+ years of experience designing complex web and mobile SaaS applications.',
      'Strong portfolio demonstrating high fidelity interface designs, systems thinking, and interactive prototypes.',
      'Expert proficiency in Figma, design systems creation, and responsive design layouts.',
      'Experience working closely with frontend developers and understanding React / CSS frameworks.'
    ],
    benefits: [
      'Top-tier health, dental, and vision insurance coverage',
      'Flexible PTO and asynchronous remote work days',
      'Home office stipend and annual learning budget'
    ]
  },
  {
    id: 'job-2',
    title: 'Lead Backend Engineer',
    company: 'FinTrust Global',
    location: 'Remote',
    salary: '$160k - $210k',
    category: 'Remote',
    badge: 'Hot',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '1 day ago',
    experienceLevel: 'Senior',
    description: 'Join our world-class financial infrastructure team. As Lead Backend Engineer, you will architect secure, scalable, and resilient transactional databases and real-time APIs that power global monetary transfers.',
    requirements: [
      '8+ years of backend software development experience using Node.js, Go, or Python.',
      'Expert knowledge of relational SQL databases (PostgreSQL, MySQL) and database scaling.',
      'Deep understanding of microservice architectures, high-performance APIs, and message queues (Kafka, RabbitMQ).',
      'Strong security fundamentals including OAuth, encryption, and fintech safety standards.'
    ],
    benefits: [
      'Competitive equity package with fast-paced growth track',
      'Fully remote setting with core collaboration hours',
      'Premium health, retirement matches, and health-and-wellness stipend'
    ]
  },
  {
    id: 'job-3',
    title: 'Growth Marketing Manager',
    company: 'EcoLife Inc.',
    location: 'New York, NY',
    salary: '$110k - $145k',
    category: 'Marketing',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '3 days ago',
    experienceLevel: 'Mid',
    description: 'EcoLife is on a mission to build a sustainable planet. We are looking for a Growth Marketing Manager to design high-impact paid social, content, and retention campaigns that drive consumer acquisition and long-term retention.',
    requirements: [
      '4+ years of growth marketing or user acquisition experience for consumer brands or DTC products.',
      'Hands-on expertise managing multi-channel ad spend budgets (Meta Ads, Google Search, TikTok).',
      'Strong quantitative analytical skills with Google Analytics, SQL, and Excel.',
      'Passion for sustainability, environmental advocacy, and community-driven brand building.'
    ],
    benefits: [
      'Generous employee discounts on eco-conscious lifestyle goods',
      'Co-working office access in central Manhattan with modern amenities',
      'Paid volunteer leave to support ecological charities'
    ]
  },
  {
    id: 'job-4',
    title: 'Machine Learning Engineer',
    company: 'Cognito AI',
    location: 'Austin, TX',
    salary: '$170k - $230k',
    category: 'Engineering',
    badge: 'New',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '4 hours ago',
    experienceLevel: 'Mid',
    description: 'Help us build state-of-the-art multi-agent generative systems. As a Machine Learning Engineer at Cognito AI, you will train, evaluate, and scale fine-tuned Large Language Models for automated professional and creative workflows.',
    requirements: [
      '3+ years of ML engineering experience focusing on NLP or generative modeling.',
      'Expert proficiency in Python, PyTorch, HuggingFace transformers, and vector stores.',
      'Experience building pipelines to fine-tune open-weights models and optimize latency (TensorRT, vLLM).',
      'Strong math background and publications in top ML conferences are a huge plus.'
    ],
    benefits: [
      'Unlimited computing credits and high-end hardware budget',
      'On-site gourmet meals, gym memberships, and daily wellness classes',
      'Comprehensive medical/dental/vision coverage + 401(k) matching'
    ]
  },
  {
    id: 'job-5',
    title: 'Senior Frontend Engineer',
    company: 'Nebula Systems',
    location: 'San Francisco, CA',
    salary: '$150k - $190k',
    category: 'Engineering',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '5 hours ago',
    experienceLevel: 'Senior',
    description: 'We are expanding our core application team. You will build rapid, accessible, and interactive frontend interfaces for complex analytical dashboards using React, TypeScript, and modern state containers.',
    requirements: [
      '5+ years building production-grade single-page applications with React and TypeScript.',
      'Deep expertise in performance profiling, bundle size optimization, and modern CSS frameworks (Tailwind, PostCSS).',
      'Familiarity with state-management stores, client caching, and RESTful/GraphQL APIs.',
      'Strong voice for accessibility (WCAG), interactive animations, and structural pixel-precision.'
    ],
    benefits: [
      'Top-tier health, dental, and vision insurance coverage',
      'Flexible PTO and asynchronous remote work days',
      'Home office stipend and annual learning budget'
    ]
  },
  {
    id: 'job-6',
    title: 'Senior Product Manager',
    company: 'Productive Labs',
    location: 'Seattle, WA',
    salary: '$145k - $185k',
    category: 'Product',
    badge: 'New',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '3 hours ago',
    experienceLevel: 'Senior',
    description: 'We are seeking a Senior Product Manager to lead development for our flagship AI productivity suite. You will define product vision, build roadmap strategies, and partner with design and engineering teams to ship outstanding user experiences.',
    requirements: [
      '4+ years of product management experience shipping SaaS products.',
      'Demonstrated success coordinating cross-functional teams (Engineering, Design, Growth).',
      'Exceptional analytical skills using SQL, Amplitude, and user testing platforms.',
      'Excellent verbal and written communication skills with business-technical translation ability.'
    ],
    benefits: [
      'Equity options in a highly funded Series B startup',
      'Comprehensive healthcare and family support coverage',
      'Annual learning budget and wellness credits'
    ]
  },
  {
    id: 'job-7',
    title: 'Technical Product Manager (API & Platforms)',
    company: 'DevStack Engine',
    location: 'Austin, TX',
    salary: '$155k - $195k',
    category: 'Product',
    badge: 'Hot',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '1 day ago',
    experienceLevel: 'Senior',
    description: 'DevStack Engine provides developers with secure hosting structures. As a Technical Product Manager, you will define API schemas, developer portals, and integration plugins that support high-volume transaction architectures.',
    requirements: [
      '3+ years as a Software Developer followed by 3+ years in Product Management.',
      'Deep understanding of RESTful, GraphQL, gRPC API structures, and gateway patterns.',
      'Comfortable reviewing technical documentations, system designs, and database structures.',
      'Familiarity with Agile Scrum practices and JIRA roadmap planning.'
    ],
    benefits: [
      'Flexible, asynchronous remote culture',
      '401(k) retirement matching up to 5%',
      'Premium hardware configuration of your choice'
    ]
  },
  {
    id: 'job-8',
    title: 'Lead DevOps & Cloud Architect',
    company: 'CloudScale Networks',
    location: 'Remote',
    salary: '$150k - $190k',
    category: 'Remote',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '2 days ago',
    experienceLevel: 'Senior',
    description: 'Manage our multi-cloud kubernetes distribution systems. You will orchestrate Terraform environments, secure pipeline automations, and support high-availability failover architectures to guarantee 99.99% system uptime.',
    requirements: [
      '6+ years of DevOps or Cloud Engineering experience with AWS or GCP.',
      'Expertise with Kubernetes, Docker, Helm, and Service Mesh tools (Istio).',
      'Advanced knowledge of Infrastructure as Code (IaC) with Terraform or Pulumi.',
      'Strong scripting skills in Python, Go, or Bash for active automation pipelines.'
    ],
    benefits: [
      'Generous salary and performance bonuses',
      'Home high-speed internet and coworking allowance',
      'Bi-annual company retreats in scenic locations'
    ]
  },
  {
    id: 'job-9',
    title: 'Human Resources & Talent Partner',
    company: 'PeopleFirst Org',
    location: 'Austin, TX',
    salary: '$85k - $115k',
    category: 'Operations',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '3 days ago',
    experienceLevel: 'Mid',
    description: 'We believe that great companies are built on happy talent. As HR & Talent Partner, you will manage employee onboarding, professional compliance, wellness program coordination, and full-lifecycle recruiting across departments.',
    requirements: [
      '3+ years of HR, recruiting, or talent partner experience in tech companies.',
      'Strong empathy, interpersonal communication, and legal compliance knowledge.',
      'Experience using HRIS and ATS systems (Lever, Greenhouse, Rippling, BambooHR).',
      'Incredible organizational skill with multiple calendar schedules.'
    ],
    benefits: [
      'Full comprehensive medical, dental, and therapy benefits',
      'Generous parental leave and family support stipends',
      'Warm office environment with pet-friendly spaces'
    ]
  },
  {
    id: 'job-10',
    title: 'Enterprise Account Executive',
    company: 'ApexSaaS Corp',
    location: 'Dallas, TX',
    salary: '$120k - $160k',
    category: 'Sales',
    badge: 'Hot',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '12 hours ago',
    experienceLevel: 'Senior',
    description: 'ApexSaaS helps Fortune 500 companies streamline operations. We are looking for an experienced Account Executive to cultivate high-value corporate relationships, deliver technical software demos, and negotiate key contract renewals.',
    requirements: [
      '5+ years of enterprise B2B sales experience in SaaS structures.',
      'Consistent record of hitting and exceeding quota targets.',
      'Proficiency with Salesforce, sales outreach sequences, and LinkedIn Sales Navigator.',
      'Strong negotiation, consultative selling, and relationship-management skills.'
    ],
    benefits: [
      'Uncapped commission structure with double OTE targets',
      'Travel expenses fully covered for executive client dinners',
      'Corporate cell phone and laptop package'
    ]
  },
  {
    id: 'job-11',
    title: 'UX Researcher & Accessibility Specialist',
    company: 'InsightFlow',
    location: 'San Jose, CA',
    salary: '$110k - $145k',
    category: 'Design',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '5 days ago',
    experienceLevel: 'Mid',
    description: 'Lead research studies that discover how diverse audiences interact with software. As a UX Researcher, you will structure usability interviews, analyze journey friction, and ensure WCAG compliant accessibility across client interfaces.',
    requirements: [
      '4+ years of user experience research, qualitative interviews, and card sorting.',
      'Strong knowledge of digital accessibility standards (WCAG 2.1 AA, section 508).',
      'Ability to translate raw qualitative interviews into actionable developer bug-tickets.',
      'Mastery of research tools like UserTesting, Hotjar, and Dovetail.'
    ],
    benefits: [
      'Generous vision, dental, and medical packages',
      'Learning budget for UX certifications and conferences',
      'Collaborative testing lab environment'
    ]
  },
  {
    id: 'job-12',
    title: 'Cybersecurity Analyst & Threat Hunter',
    company: 'ShieldSec Solutions',
    location: 'Boston, MA',
    salary: '$115k - $150k',
    category: 'Engineering',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '1 day ago',
    experienceLevel: 'Mid',
    description: 'Join our proactive security operations center (SOC). You will inspect firewall logs, run vulnerability scans, coordinate penetration testing runs, and formulate safety patches to prevent data breaches.',
    requirements: [
      '3+ years of experience in security operations, network auditing, or threat response.',
      'Relevant security certifications such as CompTIA Security+, CEH, or CISSP.',
      'Proficiency with SIEM systems (Splunk, Sentinel) and Linux shell environments.',
      'Deep knowledge of TCP/IP, common web attack vectors, and encryption layers.'
    ],
    benefits: [
      'Annual training allowance to support security certifications',
      'Standard 401(k) matching and gym access support',
      'On-call hazard stipends and generous overtime rates'
    ]
  },
  {
    id: 'job-13',
    title: 'Senior Financial Analyst',
    company: 'WealthLedger Ltd',
    location: 'New York, NY',
    salary: '$95k - $130k',
    category: 'Operations',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '4 days ago',
    experienceLevel: 'Senior',
    description: 'We are seeking an experienced Financial Analyst to lead budget forecasting, model financial runway scenarios, and analyze business operations to increase capital efficiency across global branches.',
    requirements: [
      '4+ years of experience in corporate finance, investment banking, or accounting.',
      'Advanced mastery of Excel modeling, cash flow projections, and corporate valuations.',
      'Knowledge of accounting standards (GAAP/IFRS) and accounting software like QuickBooks.',
      'Strong slide presentation skill to convey quarterly analytics to executives.'
    ],
    benefits: [
      'Generous year-end financial performance bonuses',
      'Central Manhattan premium office space with fully stocked kitchen',
      'Transit pass reimbursement and robust health insurance'
    ]
  },
  {
    id: 'job-14',
    title: 'Customer Success & Solutions Lead',
    company: 'SupportSpark',
    location: 'Salt Lake City, UT',
    salary: '$80k - $105k',
    category: 'Operations',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '6 days ago',
    experienceLevel: 'Mid',
    description: 'Customer Success is the ultimate builder of brand loyalty. As a Solutions Lead, you will onboard enterprise accounts, analyze client friction trends, and write integration guides to ensure users achieve high utility value.',
    requirements: [
      '3+ years in Customer Success, Account Management, or Technical Support.',
      'Outstanding communication, conflict resolution, and client relationship skills.',
      'Familiarity with ticketing and CRM tools like Zendesk, Intercom, and Salesforce.',
      'Basic understanding of API systems, HTML, and browser debugging tools is helpful.'
    ],
    benefits: [
      'Fully paid health and mental-health counseling programs',
      'Generous team events and annual ski trips in Utah',
      'Flexible working schedules and hybrid arrangements'
    ]
  },
  {
    id: 'job-15',
    title: 'Brand & Motion Designer',
    company: 'CreativeFlow',
    location: 'Austin, TX',
    salary: '$95k - $130k',
    category: 'Design',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '2 days ago',
    experienceLevel: 'Mid',
    description: 'Bring our brand narrative to life through fluid motion graphics and bold design structures. You will craft promotional video assets, interactive UI transitions, and branded marketing collateral that stand out.',
    requirements: [
      '4+ years as a Visual or Motion Designer in design agencies or tech startups.',
      'Expertise with Adobe Creative Suite (After Effects, Premiere, Illustrator, Photoshop).',
      'Strong portfolio demonstrating storytelling, timing, pacing, and typographic styles.',
      'Experience optimizing video assets for web and diverse social platforms.'
    ],
    benefits: [
      'High-end workstation stipend (Wacom, Adobe, Cinema4D licenses)',
      'Asynchronous, creative-first weekly schedule',
      'Complete wellness, health, and dental insurance'
    ]
  },
  {
    id: 'job-16',
    title: 'QA Automation Engineer',
    company: 'QualityFirst Co.',
    location: 'Remote',
    salary: '$90k - $120k',
    category: 'Remote',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '3 days ago',
    experienceLevel: 'Mid',
    description: 'We are seeking an outstanding QA Automation Engineer to build resilient end-to-end testing frameworks. You will write robust test scripts, coordinate load testing sessions, and certify browser/device compatibility for our product suites.',
    requirements: [
      '3+ years of professional software QA automation testing experience.',
      'Strong coding skills in JavaScript, TypeScript, or Python.',
      'Expertise with automated testing libraries like Cypress, Playwright, or Selenium.',
      'Familiarity with CI/CD continuous integration pipelines (Github Actions, Jenkins).'
    ],
    benefits: [
      'Flexible home-office furniture stipend',
      'Flexible PTO with mandatory 3 weeks off per year',
      'Comprehensive health coverage and annual fitness membership'
    ]
  },
  {
    id: 'job-17',
    title: 'Technical Content Writer & Editor',
    company: 'ReadmeDocs',
    location: 'Remote',
    salary: '$75k - $100k',
    category: 'Marketing',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '1 week ago',
    experienceLevel: 'Mid',
    description: 'Bridge the gap between complex software design and developer clarity. As Technical Writer, you will write clear API manuals, setup guides, and blog articles highlighting cloud integrations.',
    requirements: [
      '3+ years of experience writing developer-facing documentation or technical blogs.',
      'Ability to read and understand code snippets in JavaScript, Python, or Go.',
      'Experience with Markdown formatting, static site generators, and Git commands.',
      'Exceptional clarity in writing and editing.'
    ],
    benefits: [
      'Fully remote work schedule',
      'Comprehensive medical/dental plans',
      'Annual book budget and writing course access'
    ]
  },
  {
    id: 'job-18',
    title: 'Corporate Attorney & Legal Counsel',
    company: 'JurisGroup Advisors',
    location: 'San Francisco, CA',
    salary: '$180k - $240k',
    category: 'Operations',
    badge: 'New',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '1 day ago',
    experienceLevel: 'Senior',
    description: 'We are expanding our legal advisory services. We are seeking a Corporate Attorney to manage commercial contracts, oversee IP patent filings, advise on data compliance standards, and guide general risk mitigations.',
    requirements: [
      'Juris Doctor (JD) degree from an accredited law school and active state Bar membership.',
      '5+ years of experience practicing corporate law, preferably representing tech companies.',
      'Deep understanding of SaaS license contracts, GDPR privacy policies, and intellectual property.',
      'Excellent analytical, advisory, and document-drafting abilities.'
    ],
    benefits: [
      'Elite health, dental, vision, and wellness coverage',
      'Significant equity options and year-end bonuses',
      'Annual Bar dues and legal education course coverage'
    ]
  },
  
  // === FRESHER & ENTRY LEVEL JOBS ===
  {
    id: 'job-19',
    title: 'Junior Frontend Developer (React)',
    company: 'ByteCraft Studio',
    location: 'Austin, TX (Hybrid)',
    salary: '$65k - $85k',
    category: 'Engineering',
    badge: 'Entry Level',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '1 day ago',
    experienceLevel: 'Fresher',
    description: 'Launch your web engineering career with our supportive design-tech crew! As a Junior Frontend Developer, you will collaborate with designers and senior engineers to build accessible, beautifully polished interactive components using React, CSS3, and Git.',
    requirements: [
      '0-2 years of software engineering experience focusing on HTML5, CSS3, modern JavaScript and React.',
      'Solid understanding of Git, branch management, and core frontend troubleshooting.',
      'Passionate about crafting pixel-perfect interfaces and studying responsive layouts.',
      'A portfolio or active GitHub repository showcasing responsive web app projects.'
    ],
    benefits: [
      'Intensive 1-on-1 career mentorship from senior engineers',
      'Annual learning stipend for web development courses and bootcamps',
      'Hybrid workflow with modern office perks and free lunches'
    ]
  },
  {
    id: 'job-20',
    title: 'Associate Software Engineer',
    company: 'Nebula Systems',
    location: 'Remote',
    salary: '$80k - $105k',
    category: 'Remote',
    badge: 'Fresher',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '2 days ago',
    experienceLevel: 'Fresher',
    description: 'We are seeking an Associate Software Engineer with an outstanding learning drive. You will work within our full-stack engineering divisions to write clean APIs, test edge cases, and deploy modular features that power our enterprise cloud SaaS dashboards.',
    requirements: [
      'Bachelor’s or Master’s in Computer Science, engineering, or equivalent web coding bootcamp graduation.',
      'Fundamental familiarity with TypeScript, Node.js, or basic Python.',
      'Familiarity with relational database structures (SQL, PostgreSQL) and RESTful API methods.',
      'Highly structured analytical mindset and eagerness to actively study production architectures.'
    ],
    benefits: [
      'Comprehensive health coverage, 401(k) matching, and home-office equipment stipend',
      'Mandatory asynchronous remote learning days',
      'Access to premium engineering tutorials and standard boot camp programs'
    ]
  },
  {
    id: 'job-21',
    title: 'Software Engineering Intern',
    company: 'Cognito AI',
    location: 'Austin, TX',
    salary: '$40 - $55 / hour',
    category: 'Engineering',
    badge: 'Internship',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '3 hours ago',
    experienceLevel: 'Fresher',
    description: 'Get real-world experience building future intelligence agents. As a Software Engineering Intern, you will participate in daily standups, write scalable test modules, and implement production features alongside our core generative AI engineering team.',
    requirements: [
      'Currently pursuing a BS/MS in Computer Science or self-taught with robust, complex personal code projects.',
      'Excellent fundamentals in algorithms, database design, and object-oriented programming.',
      'Basic experience with Python, Git, and Linux terminal command lines.',
      'Active curiosity and high-energy collaborative communication.'
    ],
    benefits: [
      'Direct pathway to full-time post-graduate software engineering return offers',
      'Free premium gourmet meals, snacks, and corporate gym access',
      'Onsite corporate mentors and networking opportunities'
    ]
  },
  {
    id: 'job-22',
    title: 'Junior UX/UI Designer',
    company: 'FinTrust Global',
    location: 'New York, NY',
    salary: '$70k - $90k',
    category: 'Design',
    badge: 'Entry Level',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '12 hours ago',
    experienceLevel: 'Fresher',
    description: 'We are expanding our product design squad. As a Junior UX/UI Designer, you will assist in drafting responsive design mockups, wireframing user flow diagrams, and updating our Figma component design system.',
    requirements: [
      '0-2 years of product, graphic, or UI/UX design experience.',
      'High proficiency in Figma, layout constraints, interactive component states, and auto-layouts.',
      'Clean visual aesthetic with precise eye for spacing, font pairing, and color accessibility rules.',
      'Portfolio presenting 2-3 structured case studies showing wireframes, user journeys, and final mockups.'
    ],
    benefits: [
      'Professional Adobe Suite + Figma premium memberships covered',
      'Generous transit subsidies and dental/vision coverage',
      'Weekly collaborative design critique workshops'
    ]
  },
  {
    id: 'job-23',
    title: 'Social Media & Growth Associate',
    company: 'EcoLife Inc.',
    location: 'New York, NY',
    salary: '$55k - $72k',
    category: 'Marketing',
    badge: 'Entry Level',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '2 days ago',
    experienceLevel: 'Fresher',
    description: 'Are you a creative social media enthusiast? EcoLife is looking for a Social Media & Growth Associate to craft highly viral videos, manage brand voice, and coordinate community campaigns across TikTok, Instagram, and YouTube.',
    requirements: [
      '0-2 years of experience managing social networks, community engagement, or creating digital brand assets.',
      'Strong expertise in vertical video production (Reels, Shorts, TikTok) using CapCut or Canva.',
      'Excellent, creative copywriter who loves interacting with social media communities.',
      'Basic knowledge of social media growth analytics and search trends.'
    ],
    benefits: [
      'Annual ecological travel voucher to support organic and green tourism',
      'Modern co-working office access in central Manhattan with free coffee',
      'Paid company volunteer days for environmental restoration projects'
    ]
  },
  {
    id: 'job-24',
    title: 'Sales Development Representative',
    company: 'ApexSaaS Corp',
    location: 'Remote',
    salary: '$50k - $65k',
    category: 'Sales',
    badge: 'Fresher',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '5 hours ago',
    experienceLevel: 'Fresher',
    description: 'Join our high-velocity enterprise pipeline! As a Sales Development Representative, you will discover high-value corporate clients, initiate warm outbound connections, and schedule product demo sequences for account executives.',
    requirements: [
      'Excellent written and verbal communication skills with high emotional resilience.',
      'Strong desire to study tech B2B sales strategies and software systems.',
      'Goal-driven, highly coachable, and comfortable reaching outbound lead metrics.',
      'Basic familiarity with CRM software is a nice bonus but not required.'
    ],
    benefits: [
      'Generous uncapped commission structures (double OTE targets)',
      'High-end remote work computer and home-office setups',
      'Extensive enterprise sales training programs'
    ]
  },
  {
    id: 'job-25',
    title: 'Junior QA Tester (Manual & Bug Tracking)',
    company: 'SupportSpark',
    location: 'Salt Lake City, UT',
    salary: '$60k - $78k',
    category: 'Technical',
    badge: 'Entry Level',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '1 day ago',
    experienceLevel: 'Fresher',
    description: 'Help us bulletproof our customer platforms! As a Junior QA Tester, you will perform functional manual testing, run compatibility checks across devices, and write pristine bug reports that help engineers ship stable code.',
    requirements: [
      '0-1 year of experience in manual software testing, customer support, or digital platforms.',
      'Meticulous eye for detail to identify UI inconsistencies, broken links, and functional flaws.',
      'Eagerness to grow your tech skills and learn QA automation tools (Cypress, Selenium).',
      'Excellent writing skills to draft clear, reproducible step-by-step bug tickets.'
    ],
    benefits: [
      'Full technical QA certifications training budget',
      'Mandatory wellness allowances and health plans',
      'Flexible, friendly team culture with local social events'
    ]
  },
  {
    id: 'job-26',
    title: 'IT Helpdesk & Support Specialist',
    company: 'DevStack Engine',
    location: 'Austin, TX',
    salary: '$55k - $70k',
    category: 'Technical',
    badge: 'Fresher',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39mTGyar7VtMR2yNquVG3RjZuPKTUZc6XenjWjiNNxRe4xsHbhzDUUaldwVYAXXN7-xf-TAqdlzMEp49P91a_QGwnThih6U990WE0RuSw19sspQ11kepdlrdaruDs_-UTCgeSfAwGkp2OabV44evc6x8sBCQ7-Ncmrj8JvHflJ4y3WfkeD6Z1o-0pLE_TlMNnn7oMFbLMzsZKZF7n8YnzplT8m1bmNyK9RbfdE-cw9Te4MB07hPfE',
    postedTime: '4 days ago',
    experienceLevel: 'Fresher',
    description: 'We are seeking a customer-focused IT Support Specialist. You will provision workstation profiles, troubleshoot network access configs, and support corporate hardware infrastructure under the guidance of our system admins.',
    requirements: [
      'Degree, IT certification (CompTIA A+, Network+), or equivalent hands-on support experience.',
      'Familiarity with macOS, Windows Server, basic terminal commands, and network topology.',
      'Ability to clearly guide users through IT troubleshooting with patience and empathy.',
      'Strong diagnostic skills to solve tech infrastructure issues.'
    ],
    benefits: [
      'Full support and reimbursement for IT certifications exam fees',
      'Comprehensive dental, health, and vision plans',
      'Top-tier Apple hardware workspace configurations'
    ]
  },
  {
    id: 'job-27',
    title: 'Human Resources Coordinator',
    company: 'PeopleFirst Org',
    location: 'Austin, TX (Hybrid)',
    salary: '$60k - $75k',
    category: 'Operations',
    badge: 'Entry Level',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '1 day ago',
    experienceLevel: 'Fresher',
    description: 'Help us support the happier work teams of tomorrow. As an HR Coordinator, you will organize applicant interview schedules, prepare onboarding kits, audit personnel logs, and facilitate internal communication events.',
    requirements: [
      '0-2 years of office administration, recruiting coordination, or general HR experience.',
      'Exceptional coordination skills with high attention to scheduling conflicts.',
      'Utmost integrity and absolute discretion in managing sensitive personnel records.',
      'Superb interpersonal communication and warm, professional presentation.'
    ],
    benefits: [
      'Fully paid health, therapy, and continuous mental counseling stipends',
      'Warm, welcoming pet-friendly physical offices with stocked bars',
      'Regular team team-building events and professional HR training'
    ]
  },
  {
    id: 'job-28',
    title: 'Associate Data Analyst',
    company: 'InsightFlow',
    location: 'San Jose, CA',
    salary: '$75k - $95k',
    category: 'Technical',
    badge: 'Fresher',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '3 days ago',
    experienceLevel: 'Fresher',
    description: 'Turn raw tracking logs into strategic corporate direction! As an Associate Data Analyst, you will pull SQL queries, compile business reports, and configure dashboards that guide operational decision making.',
    requirements: [
      'Bachelor’s in Mathematics, Statistics, Economics, CS, or related quantitative field.',
      'Solid command of SQL (Joins, aggregations) and Excel formulas.',
      'Basic exposure to Python (Pandas) or R for data analysis.',
      'Strong ability to summarize quantitative findings and present them visually using Tableau.'
    ],
    benefits: [
      'Comprehensive healthcare, vision, and dental plans',
      'Annual learning allowance for SQL / Big Data certifications',
      'Generous hybrid and asynchronous work arrangements'
    ]
  },

  // === DIVERSE ADDITIONAL CAREER PATHWAYS ===
  {
    id: 'job-29',
    title: 'Senior Data Scientist & Lead Modeler',
    company: 'InsightFlow',
    location: 'San Jose, CA',
    salary: '$150k - $190k',
    category: 'Technical',
    badge: 'Hot',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5p9iqE4KU_JY0ruvTK_grJh0j94_L-nEi0TLzkGSz-hUb-wiuRyU75zeTf2xMV3gQ4QopUbnCPaq3ojnW1MuEc4_aXJO0X996_qy9OXShe7pTB39mEj5Qtbz-Tb_iInoZ3XZZOCnC3gysuHkFdCSh5WESlp6G-E6heIIuIej7r7WMsemLz0QOIWXZ2c1A9KPh7WAT7pDAQ-qqY3i5cJNlSj_1RHV8D85qoUHZR_OQ0_An4YnoVQp',
    postedTime: '1 day ago',
    experienceLevel: 'Senior',
    description: 'Lead the analytical models that govern our enterprise predictive indexing. You will construct machine learning algorithms, design user retention pipelines, and deploy statistical models that scale.',
    requirements: [
      '5+ years of experience as a Data Scientist or Machine Learning Developer.',
      'Strong mastery of Python, SQL, and modeling frameworks (Scikit-Learn, PyTorch).',
      'Experience constructing advanced analytical dashboards and visual tracking charts.',
      'Ph.D. or Master’s in Statistics, Applied Math, or Computer Science is preferred.'
    ],
    benefits: [
      'Competitive equity options with fast-track growth potential',
      'Top tier health insurance + dental + visual coverage',
      'Annual travel stipend and wellness budget'
    ]
  },
  {
    id: 'job-30',
    title: 'Technical Copywriter & Docs Editor',
    company: 'ReadmeDocs',
    location: 'Remote',
    salary: '$80k - $110k',
    category: 'Marketing',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '2 days ago',
    experienceLevel: 'Mid',
    description: 'We are seeking a versatile Technical Content Writer to manage our developer communication channels. You will write high-quality technical blogs, craft engaging educational content, and edit complex developer-facing API setup documentations.',
    requirements: [
      '3+ years of professional technical writing, marketing copywriting, or docs editing.',
      'Excellent ability to read code blocks in JavaScript, React, or Python.',
      'Proficiency in Markdown syntax, Git commands, and headless static sites.',
      'Absolute mastery of narrative clarity and editing under tight publication targets.'
    ],
    benefits: [
      'Completely flexible remote and asynchronous workflow',
      'Comprehensive dental, health, and wellness support',
      'Unlimited books and education courses stipend'
    ]
  },
  {
    id: 'job-31',
    title: 'Strategic Account Manager',
    company: 'ApexSaaS Corp',
    location: 'Austin, TX',
    salary: '$100k - $130k',
    category: 'Sales',
    badge: 'New',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVfWAzGEZpNsdbF3M7JRIQaWQp5kD6ztUOlZy06_o44aFtJ5SSKM8kd5SkZYyiWBWHw3snuauPX144WvciY48hqmcze7fAS1eTZleC0XyYjLsKWBj4zLWhR5ll3GHkiXojqCRREZeby5BIqObFxvwjCOeyHc5_ivcR-j5FGTPccqki8bPf6ul4VMrw1wblK2C-tZagMN1VrNg-yyHDBOZ_M0Trm6Qc4BzeZveiRmC3PGOO3FcyulMH',
    postedTime: '1 day ago',
    experienceLevel: 'Mid',
    description: 'Manage our most valuable enterprise client partnerships! You will nurture existing SaaS accounts, analyze user satisfaction rates, consult on system upgrades, and guarantee annual subscription renewals.',
    requirements: [
      '3+ years in Account Management, Enterprise Customer Success, or Tech Sales.',
      'Outstanding relationship building, presentation, and negotiation abilities.',
      'Demonstrated history of driving client retention and securing account upsells.',
      'Familiarity with CRM tools like Salesforce and enterprise communications.'
    ],
    benefits: [
      'Uncapped client renewal commissions and annual growth bonuses',
      'Flexible hybrid workflow in modern Austin offices with parking covered',
      'Comprehensive medical, mental-health, and dental plans'
    ]
  },
  {
    id: 'job-32',
    title: 'Facilities & Workplace Coordinator',
    company: 'PeopleFirst Org',
    location: 'Dallas, TX',
    salary: '$65k - $80k',
    category: 'Operations',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF4HZhNOOYK-_UzbALg8BMy2fNj40Y0pTpg7YZW_CQIGBLWa9t4pLWgoMLJ2O7dgCfLea_B5qMOIEnppptnoSAWy2Dm0BHtRiJVrxS8qc3dQt4aJ1PgasbgF2lUUcOk0L1L38UgLqxCGCTaUxAndZqLn87UOshILHue5vgqGyUD0ZcK8WOvnfQZmO8LlURDD4pEuUxP727-p7FmfF4tGBHpZBfqacPS6Sa5hMZbB_SP52L3GyDbnkO',
    postedTime: '3 days ago',
    experienceLevel: 'Mid',
    description: 'We are seeking an energetic Facilities & Workplace Coordinator to manage our headquarters office. You will coordinate office logistics, supervise vendor relations, organize company catering, and streamline workspace planning.',
    requirements: [
      '2+ years of workplace operations, facilities coordination, or hospitality management.',
      'Extremely organized with a natural passion for details and supporting workspaces.',
      'Strong vendor negotiation and budget management capabilities.',
      'Excellent physical and written coordination skills.'
    ],
    benefits: [
      'Full health, dental, and therapy plans covered',
      'Generous gym stipend and corporate transportation discount',
      'Free daily catered office lunch and fully stocked kitchen access'
    ]
  }
];
