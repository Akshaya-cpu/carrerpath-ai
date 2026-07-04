import { UserProfile } from '../types';

// Broad category of hard technical and domain-specific skills to match against
export const TECHNICAL_SKILLS_KEYWORDS = [
  // Languages
  'javascript', 'typescript', 'python', 'go', 'golang', 'rust', 'java', 'c\\++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala', 'r', 'html5', 'css3', 'sql', 'nosql', 'bash', 'shell',
  // Frontend
  'react', 'next\\.js', 'nextjs', 'vue', 'nuxt', 'angular', 'svelte', 'remix', 'tailwind', 'tailwindcss', 'bootstrap', 'sass', 'redux', 'mobx', 'zustand', 'webpack', 'vite', 'npm', 'yarn', 'pnpm',
  // Backend & APIs
  'node\\.js', 'nodejs', 'express', 'nestjs', 'fastapi', 'django', 'flask', 'spring boot', 'graphql', 'rest api', 'restful apis', 'grpc', 'websockets', 'socket\\.io',
  // Databases & Caching
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'cassandra', 'sqlite', 'mariadb', 'elasticsearch', 'dynamodb', 'firebase', 'firestore', 'supabase', 'prisma', 'mongoose', 'sequelize',
  // Cloud & DevOps
  'aws', 'amazon web services', 'gcp', 'google cloud', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci', 'circleci', 'nginx', 'apache', 'linux', 'unix', 'serverless', 'lambda',
  // Testing & QA
  'jest', 'cypress', 'playwright', 'selenium', 'mocha', 'chai', 'puppeteer', 'testing library', 'postman', 'junit', 'pytest',
  // Design & Product
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'after effects', 'indesign', 'zeplin', 'invision', 'framer', 'canva', 'ui design', 'ux design', 'product design', 'wireframing', 'prototyping', 'user research', 'design systems',
  // Management & Methodologies
  'agile', 'scrum', 'jira', 'confluence', 'trello', 'asana', 'git', 'github', 'gitlab', 'bitbucket', 'ci/cd', 'devops', 'product strategy', 'roadmapping', 'project management', 'product management',
  // Data Science & AI/ML
  'machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'natural language processing', 'computer vision', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'scipy', 'matplotlib', 'seaborn', 'tableau', 'power bi', 'data analysis', 'data engineering', 'spark', 'hadoop'
];

// List of phrases to identify non-technical or generic soft skills
export const SOFT_SKILLS_OR_DESCRIPTIVE_PHRASES = [
  'communication', 'team player', 'problem solving', 'critical thinking', 'leadership', 'adaptability', 
  'time management', 'work ethic', 'attention to detail', 'interpersonal skills', 'collaboration', 
  'creativity', 'organization', 'conflict resolution', 'decision making', 'self-motivation', 
  'quick learner', 'highly motivated', 'years of experience', 'proven track record', 'strong knowledge',
  'hands-on experience', 'ability to', 'passionate about', 'focused on', 'expert in', 'proficient with'
];

/**
 * Normalizes a skill string to make it clean, removing bullet points, formatting artifacts, 
 * and generic leading phrases.
 */
export function normalizeSkillString(skill: string): string {
  let clean = skill.trim()
    .replace(/^[\s\-\*•✓▪▫➢]+/, '') // Remove leading bullets or list icons
    .replace(/[\.\,]+$/, '')       // Remove trailing punctuation
    .trim();

  // Strip common verbose wrapper phrases like "Proficient in React" -> "React"
  const stripPrefixes = [
    /^proficient\s+(?:in|with)\s+/i,
    /^experienced\s+(?:in|with)\s+/i,
    /^knowledge\s+of\s+/i,
    /^expert\s+in\s+/i,
    /^skills?\s+in\s+/i,
    /^working\s+knowledge\s+of\s+/i,
    /^hands-on\s+(?:experience\s+)?with\s+/i,
    /^familiar\s+with\s+/i,
    /^understanding\s+of\s+/i,
    /^strong\s+understanding\s+of\s+/i,
    /^developing\s+(?:in|with)\s+/i,
  ];

  for (const regex of stripPrefixes) {
    if (regex.test(clean)) {
      clean = clean.replace(regex, '').trim();
      break;
    }
  }

  // Capitalize properly if it is a single-word skill and was lowered
  if (clean.length > 1 && clean === clean.toLowerCase()) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean;
}

/**
 * Post-processes an array of skill strings to ensure they are high-quality technical skills,
 * filtering out sentences, soft skills, and descriptions, and split combined skills.
 */
export function cleanTechnicalSkills(parsedSkills: string[], rawResumeText: string = ''): string[] {
  const result: string[] = [];
  const textLower = rawResumeText.toLowerCase();

  // 1. Process existing parsed skills
  for (const skill of parsedSkills) {
    if (!skill) continue;
    
    // Split combined strings like "React, Node.js and Python"
    const splitParts = skill.split(/[\,\;\&]|\band\b/i).map(s => s.trim()).filter(Boolean);
    
    for (const part of splitParts) {
      const cleanPart = normalizeSkillString(part);
      if (cleanPart.length < 2 || cleanPart.length > 40) continue; // Skip extremely short or long sentences

      // Reject if it's too sentence-like (more than 4 words)
      if (cleanPart.split(/\s+/).length > 4) continue;

      // Check if it's a known soft skill or descriptive phrase
      const lowerPart = cleanPart.toLowerCase();
      const isSoftSkill = SOFT_SKILLS_OR_DESCRIPTIVE_PHRASES.some(phrase => lowerPart.includes(phrase));
      if (isSoftSkill) continue;

      // If it meets the filter, add it
      if (!result.some(existing => existing.toLowerCase() === lowerPart)) {
        result.push(cleanPart);
      }
    }
  }

  // 2. Keyword-driven matching booster
  // If the parsed list is low, scan the raw text for matches from our technical keyword list
  if (result.length < 6 && textLower) {
    for (const keyword of TECHNICAL_SKILLS_KEYWORDS) {
      // Create word boundary regex, handling special chars (like c++, .js, etc.)
      const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      
      if (regex.test(textLower)) {
        // Find the matching word in raw text to preserve its original case
        const index = textLower.indexOf(keyword.replace('\\', ''));
        let properCaseName = keyword.replace('\\', '');
        
        // Proper capitalization mapping for common keywords
        const capitalizationMap: { [key: string]: string } = {
          'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'golang': 'Go', 'rust': 'Rust', 'java': 'Java', 'c++': 'C++', 'c#': 'C#', 'ruby': 'Ruby', 'php': 'PHP', 'html5': 'HTML5', 'css3': 'CSS3', 'sql': 'SQL', 'nosql': 'NoSQL',
          'react': 'React', 'next.js': 'Next.js', 'nextjs': 'Next.js', 'vue': 'Vue', 'nuxt': 'Nuxt', 'angular': 'Angular', 'svelte': 'Svelte', 'tailwind': 'Tailwind CSS', 'tailwindcss': 'Tailwind CSS', 'bootstrap': 'Bootstrap', 'redux': 'Redux', 'vite': 'Vite',
          'node.js': 'Node.js', 'nodejs': 'Node.js', 'express': 'Express', 'nestjs': 'NestJS', 'fastapi': 'FastAPI', 'django': 'Django', 'spring boot': 'Spring Boot', 'graphql': 'GraphQL', 'rest api': 'REST API', 'restful apis': 'REST APIs',
          'postgresql': 'PostgreSQL', 'mysql': 'MySQL', 'mongodb': 'MongoDB', 'redis': 'Redis', 'sqlite': 'SQLite', 'elasticsearch': 'Elasticsearch', 'firebase': 'Firebase', 'firestore': 'Firestore', 'supabase': 'Supabase', 'prisma': 'Prisma',
          'aws': 'AWS', 'gcp': 'GCP', 'azure': 'Azure', 'docker': 'Docker', 'kubernetes': 'Kubernetes', 'k8s': 'Kubernetes', 'terraform': 'Terraform', 'github actions': 'GitHub Actions', 'nginx': 'Nginx', 'linux': 'Linux',
          'jest': 'Jest', 'cypress': 'Cypress', 'playwright': 'Playwright', 'selenium': 'Selenium', 'postman': 'Postman',
          'figma': 'Figma', 'sketch': 'Sketch', 'framer': 'Framer', 'ui design': 'UI Design', 'ux design': 'UX Design', 'product design': 'Product Design', 'design systems': 'Design Systems',
          'agile': 'Agile', 'scrum': 'Scrum', 'jira': 'Jira', 'git': 'Git', 'github': 'GitHub', 'ci/cd': 'CI/CD', 'devops': 'DevOps',
          'machine learning': 'Machine Learning', 'deep learning': 'Deep Learning', 'pytorch': 'PyTorch', 'tensorflow': 'TensorFlow', 'data analysis': 'Data Analysis', 'nlp': 'NLP'
        };

        const cleanedKeyword = keyword.replace('\\', '').toLowerCase();
        if (capitalizationMap[cleanedKeyword]) {
          properCaseName = capitalizationMap[cleanedKeyword];
        } else if (index >= 0) {
          properCaseName = rawResumeText.slice(index, index + properCaseName.length).trim();
          if (properCaseName) {
            properCaseName = properCaseName.charAt(0).toUpperCase() + properCaseName.slice(1);
          }
        }

        if (properCaseName && !result.some(existing => existing.toLowerCase() === properCaseName.toLowerCase())) {
          result.push(properCaseName);
        }
      }
    }
  }

  return result.slice(0, 15); // Cap to 15 high-quality technical skills
}

/**
 * Refines the professional summary to ensure it contains only cohesive narrative prose sentences.
 * If the summary looks like a list or contains bulleted list items, it converts or strips them.
 */
export function cleanProfessionalSummary(summary: string = '', rawResumeText: string = ''): string {
  if (!summary) summary = '';
  
  let cleanSummary = summary.trim();

  // If the summary is empty or too short, try to extract a paragraph from raw text
  if (cleanSummary.length < 30 && rawResumeText) {
    const textLines = rawResumeText.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Look for Summary / Profile / About me sections
    let summaryIndex = -1;
    for (let i = 0; i < textLines.length; i++) {
      const lineLower = textLines[i].toLowerCase();
      if (lineLower === 'summary' || 
          lineLower === 'professional summary' || 
          lineLower === 'executive summary' || 
          lineLower === 'about me' || 
          lineLower === 'profile' || 
          lineLower === 'career objective') {
        summaryIndex = i;
        break;
      }
    }

    if (summaryIndex !== -1 && summaryIndex < textLines.length - 1) {
      // Gather lines below the summary heading until the next major section header or an empty block
      const lines: string[] = [];
      for (let i = summaryIndex + 1; i < Math.min(summaryIndex + 4, textLines.length); i++) {
        const line = textLines[i];
        if (line.match(/^[A-Z][A-Za-z\s]+:$/) || line.toLowerCase().includes('experience') || line.toLowerCase().includes('skills') || line.toLowerCase().includes('education')) {
          break; // Stop if another header is detected
        }
        lines.push(line);
      }
      if (lines.length > 0) {
        cleanSummary = lines.join(' ');
      }
    }

    // Fallback: use first multi-sentence paragraph that has length > 60 chars and doesn't look like an header list
    if (cleanSummary.length < 30) {
      for (const line of textLines) {
        if (line.length > 60 && line.includes('.') && !line.includes('•') && !line.includes('|')) {
          cleanSummary = line;
          break;
        }
      }
    }

    // Ultimate fallback
    if (cleanSummary.length < 30) {
      cleanSummary = 'An ambitious professional dedicated to technical excellence, continuous skill development, and cross-functional team collaboration.';
    }
  }

  // Refine prose text: strip bullets or bullet lists that ended up here
  cleanSummary = cleanSummary
    .split('\n')
    .map(line => line.trim())
    // Remove individual lines that look like list items
    .filter(line => !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('•') && !line.startsWith('✓'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract up to 3 sentences
  const sentences = cleanSummary.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (sentences && sentences.length > 3) {
    cleanSummary = sentences.slice(0, 3).map(s => s.trim()).join(' ');
  }

  return cleanSummary;
}

/**
 * Extracts candidate's potential professional title from raw text and file name
 */
export function extractProfessionalTitle(title: string = '', rawResumeText: string = '', fileName: string = ''): string {
  const nameLower = fileName.toLowerCase();
  const textLower = rawResumeText.toLowerCase();

  let cleanTitle = normalizeSkillString(title);
  if (cleanTitle && cleanTitle.length > 4 && cleanTitle.length < 40 && !cleanTitle.includes('@') && !cleanTitle.includes('.')) {
    return cleanTitle;
  }

  // Search for typical software titles in raw content or file name
  if (nameLower.includes('design') || nameLower.includes('ux') || nameLower.includes('ui') || textLower.includes('ui/ux designer') || textLower.includes('product designer')) {
    return 'Product Designer';
  } else if (nameLower.includes('qa') || nameLower.includes('test') || textLower.includes('qa engineer') || textLower.includes('qa automation')) {
    return 'QA Automation Engineer';
  } else if (nameLower.includes('devops') || textLower.includes('devops engineer') || textLower.includes('cloud engineer')) {
    return 'DevOps Engineer';
  } else if (nameLower.includes('data') || textLower.includes('data scientist') || textLower.includes('data analyst') || textLower.includes('machine learning')) {
    return 'Data Scientist / ML Engineer';
  } else if (nameLower.includes('frontend') || textLower.includes('frontend developer') || textLower.includes('frontend engineer')) {
    return 'Frontend Engineer';
  } else if (nameLower.includes('backend') || textLower.includes('backend developer') || textLower.includes('backend engineer')) {
    return 'Backend Engineer';
  } else if (nameLower.includes('hardware') || textLower.includes('hardware engineer') || textLower.includes('embedded') || textLower.includes('firmware') || textLower.includes('electrical engineer')) {
    return 'Hardware / Embedded Engineer';
  } else if (nameLower.includes('pm') || nameLower.includes('product') || textLower.includes('product manager')) {
    return 'Product Manager';
  } else if (textLower.includes('full stack developer') || textLower.includes('fullstack') || textLower.includes('software engineer') || textLower.includes('software developer')) {
    return 'Software Engineer';
  }

  // Fallback to general specialist
  return 'Technical Specialist';
}

const MONTH_TO_NUMBER: { [key: string]: number } = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

export interface ResumeExperienceClassification {
  employmentType: 'Fresher' | 'Experienced';
  experienceYears: number;
  experienceMonths: number;
  workExperience: Array<{ role: string; company: string; duration: string; description: string }>;
  internships: Array<{ role: string; company: string; duration: string; description: string }>;
}

function estimateYearsFromDuration(duration: string): number {
  if (!duration) return 0;
  const normalized = duration.toLowerCase().replace(/–/g, '-').replace(/\band\b/g, '-').replace(/\s+/g, ' ').trim();
  const currentYear = new Date().getFullYear();

  const monthRange = normalized.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*(\d{4})\s*[-–]\s*(present|now|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*(\d{4}))/i);
  if (monthRange) {
    const startMonth = MONTH_TO_NUMBER[monthRange[1].slice(0, 3)] || 1;
    const startYear = parseInt(monthRange[2], 10);
    let endMonth = 12;
    let endYear = currentYear;
    if (monthRange[3] && monthRange[3].toLowerCase() !== 'present' && monthRange[3].toLowerCase() !== 'now') {
      endMonth = MONTH_TO_NUMBER[monthRange[4].slice(0, 3)] || 12;
      endYear = parseInt(monthRange[5], 10);
    }
    const years = (endYear - startYear) + ((endMonth - startMonth) / 12);
    return Math.max(0, parseFloat(years.toFixed(2)));
  }

  const yearRange = normalized.match(/(\d{4})\s*[-–]\s*(present|now|\d{4})/i);
  if (yearRange) {
    const startYear = parseInt(yearRange[1], 10);
    const endYear = yearRange[2].toLowerCase().startsWith('present') || yearRange[2].toLowerCase().startsWith('now')
      ? currentYear
      : parseInt(yearRange[2], 10);
    return Math.max(0, endYear - startYear);
  }

  const yearsMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years|yrs|year|yr)\b/);
  if (yearsMatch) {
    return parseFloat(yearsMatch[1]);
  }

  const monthsMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:months|mos|month|mo)\b/);
  if (monthsMatch) {
    return parseFloat(monthsMatch[1]) / 12;
  }

  return 0;
}

function isProfessionalExperienceItem(experienceItem: any): boolean {
  if (!experienceItem) return false;
  const isObj = typeof experienceItem === 'object' && experienceItem !== null;
  const role = (isObj ? experienceItem.role : experienceItem).toString().toLowerCase();
  const company = isObj && experienceItem.company ? experienceItem.company.toString().toLowerCase() : '';
  const description = isObj && experienceItem.description ? experienceItem.description.toString().toLowerCase() : '';
  const duration = isObj && experienceItem.duration ? experienceItem.duration.toString().toLowerCase() : '';

  const internshipAndProjectTerms = [
    'intern', 'internship', 'trainee', 'co-op', 'apprentice', 'volunteer', 'student',
    'training', 'bootcamp', 'course', 'coursework', 'academic', 'research', 'project',
    'capstone', 'hackathon', 'portfolio', 'university', 'college', 'school', 'academy',
    'campus', 'summer', 'part-time', 'freelance'
  ];

  if (internshipAndProjectTerms.some(term => role.includes(term) || company.includes(term) || description.includes(term) || duration.includes(term))) {
    return false;
  }

  if (/\b(university|college|institute|school|academy|bootcamp|training|coursework|internship|student|research|academic)\b/.test(company)) {
    return false;
  }

  return true;
}

function toExperienceEntry(item: any): { role: string; company: string; duration: string; description: string } | null {
  if (!item) return null;
  if (typeof item === 'object' && item !== null) {
    return {
      role: String(item.role || ''),
      company: String(item.company || ''),
      duration: String(item.duration || ''),
      description: String(item.description || '')
    };
  }

  return { role: String(item), company: '', duration: '', description: '' };
}

function looksLikeInternship(entry: { role: string; company: string; duration: string; description: string }): boolean {
  const text = `${entry.role} ${entry.company} ${entry.duration} ${entry.description}`.toLowerCase();
  const internshipTerms = [
    'intern', 'internship', 'trainee', 'co-op', 'apprentice', 'training', 'bootcamp', 'course', 'coursework',
    'academic project', 'capstone', 'college project', 'final year project', 'project', 'hackathon', 'summer', 'volunteer'
  ];

  return internshipTerms.some(term => text.includes(term));
}

function extractDurationFromText(text: string): string {
  const durationPatterns = [
    /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*\d{4}\s*[-–]\s*(?:present|now|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*\d{4}\b))/i,
    /(\b\d{4}\s*[-–]\s*(?:present|now|\d{4})\b)/i,
    /(\b\d+(?:\.\d+)?\s*(?:years|yrs|year|yr|months|mos|month|mo)\b)/i
  ];

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return '';
}

function parseDurationToMonths(duration: string): number {
  if (!duration) return 0;
  const normalized = duration.toLowerCase().replace(/–/g, '-').replace(/\band\b/g, '-').replace(/\s+/g, ' ').trim();

  const monthRange = normalized.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.??\s*(\d{4})\s*[-–]\s*(present|now|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.??\s*(\d{4}))/i);
  if (monthRange) {
    const startMonth = MONTH_TO_NUMBER[monthRange[1].slice(0, 3)] || 1;
    const startYear = parseInt(monthRange[2], 10);
    const currentDate = new Date();
    let endMonth = currentDate.getMonth() + 1;
    let endYear = currentDate.getFullYear();
    if (monthRange[3] && monthRange[3].toLowerCase() !== 'present' && monthRange[3].toLowerCase() !== 'now') {
      endMonth = MONTH_TO_NUMBER[monthRange[4].slice(0, 3)] || 12;
      endYear = parseInt(monthRange[5], 10);
    }
    const months = (endYear - startYear) * 12 + (endMonth - startMonth);
    return Math.max(0, months);
  }

  const yearRange = normalized.match(/(\d{4})\s*[-–]\s*(present|now|\d{4})/i);
  if (yearRange) {
    const startYear = parseInt(yearRange[1], 10);
    const endYear = yearRange[2].toLowerCase().startsWith('present') || yearRange[2].toLowerCase().startsWith('now')
      ? new Date().getFullYear()
      : parseInt(yearRange[2], 10);
    return Math.max(0, (endYear - startYear) * 12);
  }

  const explicitYears = normalized.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years|yrs|year|yr)\b/);
  if (explicitYears) {
    return Math.round(parseFloat(explicitYears[1]) * 12);
  }

  const explicitMonths = normalized.match(/(\d+(?:\.\d+)?)\s*(?:months|mos|month|mo)\b/);
  if (explicitMonths) {
    return Math.round(parseFloat(explicitMonths[1]));
  }

  return Math.round(estimateYearsFromDuration(duration) * 12);
}

export function classifyResumeExperience(rawText: string = '', experienceList: any[] = []): ResumeExperienceClassification {
  const entries = (Array.isArray(experienceList) ? experienceList : [])
    .map(toExperienceEntry)
    .filter((entry): entry is { role: string; company: string; duration: string; description: string } => Boolean(entry));

  const rawTextLines = (rawText || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b(?:20|19)\d{2}\b|present|now|\b(?:years|yrs|year|yr|months|mos|month|mo)\b|\binternship\b|\btraining\b|\bintern\b)/i.test(line));

  const textEntries = rawTextLines.map(line => ({
    role: line,
    company: '',
    duration: extractDurationFromText(line),
    description: ''
  }));

  const allEntries = [...entries, ...textEntries];
  const fullTimeEntries = allEntries.filter(entry => isProfessionalExperienceItem(entry) && !looksLikeInternship(entry));
  const internshipEntries = allEntries.filter(entry => looksLikeInternship(entry));
  const totalMonths = fullTimeEntries.reduce((sum, entry) => sum + parseDurationToMonths(entry.duration), 0);
  const experienceYears = Math.floor(totalMonths / 12);
  const experienceMonths = totalMonths % 12;

  return {
    employmentType: fullTimeEntries.length > 0 ? 'Experienced' : 'Fresher',
    experienceYears,
    experienceMonths,
    workExperience: fullTimeEntries,
    internships: internshipEntries
  };
}

export function normalizeExperienceLevel(experienceLevel?: string, rawText: string = '', experienceList: any[] = []): 'Fresher' | 'Mid' | 'Senior' {
  const level = experienceLevel?.trim().toLowerCase() || '';
  const fresherPattern = /\b(?:fresher|entry[\s-]*level|junior|graduate|recent graduate|new graduate|student|intern|internship|trainee|co-op|b\.?tech|bachelor|bsc|b\.sc|mca|m\.ca|m\.tech|msc|m\.sc|final year|final-year|0(?:\.\d+)?\s*(?:years|yrs|year|yr)|1(?:\.\d+)?\s*(?:years|yrs|year|yr))\b/i;
  const seniorPattern = /\b(?:senior|sr\.?|lead|principal|staff|architect|manager|director|vp|head|experienced|seasoned|[5-9]\+?\s*(?:years|yrs|year|yr)|10\+|8\+)\b/i;

  if (fresherPattern.test(level) && !seniorPattern.test(level)) return 'Fresher';
  if (seniorPattern.test(level) && !fresherPattern.test(level)) return 'Senior';

  const text = rawText.toLowerCase();
  const isFresherText = fresherPattern.test(text);
  const isSeniorText = seniorPattern.test(text);
  if (isFresherText && !isSeniorText) return 'Fresher';
  if (isSeniorText && !isFresherText) return 'Senior';

  const classification = classifyResumeExperience(rawText, experienceList);
  if (classification.employmentType === 'Fresher') return 'Fresher';
  const totalYears = classification.experienceYears + classification.experienceMonths / 12;
  if (totalYears >= 5) return 'Senior';
  return 'Mid';
}

/**
 * Runs a highly robust client-side validation and sanitization over any parsed profile.
 * Separates technical skills from summaries, cleans titles, and validates content.
 */
export function sanitizeUserProfile(profile: UserProfile, rawText: string, fileName: string = ''): UserProfile {
  const sanitizedTitle = extractProfessionalTitle(profile.title, rawText, fileName);
  const sanitizedSkills = cleanTechnicalSkills(profile.skills, rawText);

  // Initialize arrays to clean up and avoid undefined issues
  const educationList = Array.isArray(profile.education) ? [...profile.education] : [];
  const experienceList = Array.isArray(profile.experience) ? [...profile.experience] : [];
  const projectList = Array.isArray(profile.projects) ? [...profile.projects] : [];
  const certificationsList = Array.isArray(profile.certifications) ? [...profile.certifications] : [];

  const textLower = (rawText + ' ' + (profile.resumeText || '') + ' ' + (profile.title || '') + ' ' + fileName).toLowerCase();
  const preliminaryClassification = classifyResumeExperience(rawText, experienceList);
  const experienceLevel = normalizeExperienceLevel(profile.experienceLevel, textLower, experienceList);
  const isFresher = preliminaryClassification.employmentType === 'Fresher';

  // 2. Adjust professional title if fresher
  let finalTitle = sanitizedTitle;
  if (isFresher) {
    const lowerTitle = finalTitle.toLowerCase();
    // If the title contains senior or lead keywords, map it down to fresher-friendly graduate title
    if (lowerTitle.includes('senior') || lowerTitle.includes('lead') || lowerTitle.includes('principal') || lowerTitle.includes('manager') || lowerTitle.includes('architect')) {
      if (lowerTitle.includes('design') || lowerTitle.includes('ux') || lowerTitle.includes('ui')) {
        finalTitle = 'B.Tech Graduate & Product Designer Intern';
      } else if (lowerTitle.includes('frontend')) {
        finalTitle = 'B.Tech Graduate & Frontend Engineer Intern';
      } else if (lowerTitle.includes('backend')) {
        finalTitle = 'B.Tech Graduate & Backend Engineer Intern';
      } else {
        finalTitle = 'B.Tech Graduate & Software Engineer Intern';
      }
    } else {
      // If title is just a general specialist or empty, give it a nice fresher touch
      if (finalTitle === 'Technical Specialist' || !finalTitle) {
        finalTitle = 'B.Tech Graduate & Software Engineer Intern';
      } else if (!finalTitle.toLowerCase().includes('intern') && !finalTitle.toLowerCase().includes('fresher') && !finalTitle.toLowerCase().includes('graduate')) {
        finalTitle = `${finalTitle} (Graduate/Intern)`;
      }
    }
  }

  // 3. Process experiences list to separate academic projects and correctly label internships vs full-time
  const refinedExperiences: any[] = [];
  const extractedProjectsFromExp: any[] = [];

  for (const exp of experienceList) {
    if (!exp) continue;

    // Handle case where exp is a simple string instead of an object
    const isObj = typeof exp === 'object' && exp !== null;
    const role = isObj ? (exp.role || '') : exp;
    const company = isObj ? (exp.company || '') : '';
    const duration = isObj ? (exp.duration || '') : '';
    const description = isObj ? (exp.description || '') : '';

    const roleLower = role.toLowerCase();
    const companyLower = company.toLowerCase();
    const descLower = description.toLowerCase();

    // Check if this experience item is actually an academic project / personal project
    const isAcademicProject = 
      roleLower.includes('academic project') || 
      roleLower.includes('course project') || 
      roleLower.includes('capstone') || 
      roleLower.includes('personal project') || 
      roleLower.includes('mini project') || 
      roleLower.includes('major project') || 
      roleLower.includes('final year project') || 
      roleLower.includes('independent project') || 
      roleLower.includes('hackathon') || 
      roleLower.includes('btech project') || 
      roleLower.includes('b.tech project') || 
      roleLower.includes('self-made') || 
      roleLower.includes('side project') || 
      roleLower.includes('b.tech final year') ||
      companyLower.includes('self-employed') || 
      companyLower.includes('academic') || 
      companyLower.includes('university') || 
      companyLower.includes('college') || 
      companyLower.includes('personal') || 
      companyLower.includes('individual') || 
      companyLower.includes('coursework') || 
      companyLower === 'none' || 
      companyLower === 'na' || 
      companyLower === 'n/a' || 
      // Or if it lacks any commercial company name and is named like an application/system
      ((roleLower.includes('system') || roleLower.includes('app') || roleLower.includes('application') || roleLower.includes('website') || roleLower.includes('platform') || roleLower.includes('clone') || roleLower.includes('bot') || roleLower.includes('tracker')) && 
       !roleLower.includes('engineer') && !roleLower.includes('developer') && !roleLower.includes('designer') && !roleLower.includes('intern') && !roleLower.includes('analyst') && !roleLower.includes('lead') && !roleLower.includes('specialist'));

    if (isAcademicProject) {
      // Re-route to projects
      // Extract technologies used in project
      const detectedTech: string[] = [];
      const combinedText = (role + ' ' + company + ' ' + description).toLowerCase();
      TECHNICAL_SKILLS_KEYWORDS.forEach(keyword => {
        const cleanKW = keyword.replace('\\', '');
        if (combinedText.includes(cleanKW.toLowerCase())) {
          // Capitalize nicely
          const map: { [key: string]: string } = {
            'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'react': 'React', 'sql': 'SQL', 'java': 'Java', 'html5': 'HTML5', 'css3': 'CSS3', 'git': 'Git', 'tailwind': 'Tailwind CSS', 'tailwindcss': 'Tailwind CSS'
          };
          detectedTech.push(map[cleanKW.toLowerCase()] || (cleanKW.charAt(0).toUpperCase() + cleanKW.slice(1)));
        }
      });

      extractedProjectsFromExp.push({
        name: roleLower.includes('project') ? role : `${role} Project`,
        description: description || `Academic project exploring modern software architectures and technologies. Developed at ${company || 'College'}.`,
        technologies: detectedTech.slice(0, 4)
      });
    } else {
      // It is a real professional/work experience. Let's make sure it's correctly labeled as internship vs full-time
      let refinedRole = role;
      const refinedDuration = duration;

      const isInternship = 
        roleLower.includes('intern') || 
        roleLower.includes('trainee') || 
        roleLower.includes('co-op') || 
        roleLower.includes('apprentice') || 
        roleLower.includes('vocational') ||
        companyLower.includes('intern') ||
        descLower.includes('internship') ||
        descLower.includes('assisted') ||
        // or short duration for fresher (e.g., May to August, 2-6 months)
        (isFresher && (
          duration.toLowerCase().includes('month') || 
          duration.toLowerCase().includes('intern') || 
          /^(may|jun|jul|aug|sep|oct|nov|dec|jan|feb|mar|apr)\s+\d{4}\s*-\s*(may|jun|jul|aug|sep|oct|nov|dec|jan|feb|mar|apr)?\s*\d{4}/i.test(duration)
        ));

      if (isInternship) {
        // Ensure "Intern" or "Internship" is in the role title if it isn't already
        if (!roleLower.includes('intern') && !roleLower.includes('trainee') && !roleLower.includes('co-op')) {
          // Keep title realistic and factual, but explicitly append 'Intern'
          // E.g., "Software Developer" -> "Software Developer Intern"
          // Make sure we don't say "Senior"
          let baseRole = role.replace(/\b(senior|lead|principal|sr\.)\b/gi, '').trim();
          if (baseRole.length === 0) baseRole = 'Software Engineer';
          refinedRole = `${baseRole} Intern`;
        } else {
          // If role already has "intern", strip any senior titles from it
          refinedRole = role.replace(/\b(senior|lead|principal|sr\.)\b/gi, '').trim();
        }
      } else {
        // It's a full-time position. If the user is a fresher, we should double check if it is really a full-time role or if it's an internship that wasn't caught.
        // Also ensure no 'Senior' tags exist for freshers.
        if (isFresher) {
          refinedRole = role.replace(/\b(senior|lead|principal|sr\.)\b/gi, '').trim();
        }
      }

      refinedExperiences.push({
        role: refinedRole,
        company: company || 'Organization',
        duration: refinedDuration || 'Summer 2025',
        description: description || 'Contributed to software engineering objectives, participated in design reviews, and learned core production development processes.'
      });
    }
  }

  // Combine original projects with newly extracted academic projects, avoiding duplicates
  const finalProjects = [...projectList];
  for (const newProj of extractedProjectsFromExp) {
    const isDuplicate = finalProjects.some(p => p.name.toLowerCase() === newProj.name.toLowerCase());
    if (!isDuplicate) {
      finalProjects.push(newProj);
    }
  }

  const finalClassification = classifyResumeExperience(rawText, refinedExperiences);

  // 4. Also double-check education degrees
  const refinedEducation = educationList.map(edu => {
    const isObj = typeof edu === 'object' && edu !== null;
    const degree = isObj ? (edu.degree || '') : edu;
    const school = isObj ? (edu.school || '') : '';
    const year = isObj ? (edu.year || '') : '';

    return {
      degree: degree || 'B.Tech in Computer Science & Engineering',
      school: school || 'Sphoorthy Engineering College',
      year: year || '2026'
    };
  });

    return {
    ...profile,
    title: finalTitle,
    skills: sanitizedSkills,
    resumeText: rawText || profile.resumeText,
    experienceLevel: experienceLevel,
      yearsOfExperience: finalClassification.experienceYears > 0 || finalClassification.experienceMonths > 0 ? `${finalClassification.experienceYears + (finalClassification.experienceMonths / 12)}`.replace(/\.0$/, '') + ' years' : undefined,
    experience: refinedExperiences,
    projects: finalProjects,
    education: refinedEducation,
    certifications: certificationsList
  };
}
