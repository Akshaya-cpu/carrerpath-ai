import { Job, UserProfile } from '../types';

export const jobRequiredSkillsMap: { [key: string]: string[] } = {
  'job-copywriter': ['React', 'Git'],
  'job-1': ['Figma', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Product Design'],
  'job-2': ['Node.js', 'Go', 'Python', 'PostgreSQL', 'MySQL', 'SQL', 'Microservices', 'APIs', 'Kafka', 'RabbitMQ', 'OAuth', 'Encryption'],
  'job-3': ['Growth Marketing', 'User Acquisition', 'Meta Ads', 'Google Search', 'TikTok', 'Google Analytics', 'SQL', 'Excel', 'Sustainability'],
  'job-4': ['Machine Learning', 'NLP', 'Generative Modeling', 'Python', 'PyTorch', 'HuggingFace', 'Transformers', 'Vector Stores', 'TensorRT', 'vLLM'],
  'job-5': ['React', 'TypeScript', 'Tailwind CSS', 'CSS', 'State Management', 'RESTful APIs', 'GraphQL APIs', 'WCAG', 'Accessibility', 'Animations'],
  'job-6': ['Product Management', 'SaaS', 'Agile', 'Scrum', 'SQL', 'Amplitude', 'User Testing', 'Communication'],
  'job-7': ['Product Management', 'RESTful APIs', 'GraphQL APIs', 'gRPC', 'API Gateway', 'Agile', 'Scrum', 'Jira', 'Roadmap Planning'],
  'job-8': ['DevOps', 'Cloud Engineering', 'AWS', 'GCP', 'Kubernetes', 'Docker', 'Helm', 'Istio', 'Terraform', 'Pulumi', 'Python', 'Go', 'Bash'],
  'job-9': ['HR', 'Recruiting', 'Talent Partner', 'Legal Compliance', 'HRIS', 'ATS', 'Lever', 'Greenhouse', 'Rippling', 'BambooHR'],
  'job-10': ['Enterprise Sales', 'B2B Sales', 'SaaS', 'Salesforce', 'Sales Outreach', 'LinkedIn Sales Navigator', 'Negotiation', 'Relationship Management'],
  'job-11': ['UX Research', 'Qualitative Interviews', 'Card Sorting', 'Accessibility', 'WCAG', 'UserTesting', 'Hotjar', 'Dovetail'],
  'job-12': ['Security Operations', 'Network Auditing', 'Threat Response', 'CompTIA Security+', 'CEH', 'CISSP', 'SIEM', 'Splunk', 'Sentinel', 'Linux', 'TCP/IP', 'Encryption'],
  'job-13': ['Corporate Finance', 'Investment Banking', 'Accounting', 'Excel Modeling', 'Cash Flow Projections', 'Corporate Valuations', 'GAAP', 'IFRS', 'QuickBooks'],
  'job-14': ['Customer Success', 'Account Management', 'Technical Support', 'CRM', 'Zendesk', 'Intercom', 'Salesforce', 'APIs', 'HTML', 'Browser Debugging'],
  'job-15': ['Visual Design', 'Motion Design', 'Adobe After Effects', 'Adobe Premiere', 'Adobe Illustrator', 'Adobe Photoshop', 'Storytelling', 'Typography'],
  'job-16': ['QA Automation', 'Testing', 'JavaScript', 'TypeScript', 'Python', 'Cypress', 'Playwright', 'Selenium', 'CI/CD', 'GitHub Actions', 'Jenkins'],
  'job-17': ['Technical Writing', 'Developer Documentation', 'API Manuals', 'JavaScript', 'Python', 'Go', 'Markdown', 'Static Site Generators', 'Git'],
  'job-18': ['Corporate Law', 'Contracts', 'IP Patents', 'SaaS Licenses', 'GDPR Privacy', 'Intellectual Property', 'Document Drafting']
};

export function getMatchedAndMissingSkills(job: Job, candidateSkills: string[]): { matched: string[]; missing: string[] } {
  const jobSkills = jobRequiredSkillsMap[job.id] || [];
  if (jobSkills.length === 0) {
    const matched: string[] = [];
    if (job.requirements) {
      job.requirements.forEach(req => {
        const reqLower = req.toLowerCase();
        const found = (candidateSkills || []).find(skill => {
          const skillLower = skill.toLowerCase().trim();
          return reqLower.includes(skillLower) || skillLower.includes(reqLower);
        });
        if (found && !matched.includes(found)) {
          matched.push(found);
        }
      });
    }
    return { matched, missing: [] };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  jobSkills.forEach(reqSkill => {
    const reqSkillClean = reqSkill.toLowerCase().trim().replace(/[.\s-]/g, '');
    
    const isMatched = (candidateSkills || []).some(candSkill => {
      const candClean = candSkill.toLowerCase().trim().replace(/[.\s-]/g, '');
      if (candClean === reqSkillClean) return true;
      if (candClean.includes(reqSkillClean) && reqSkillClean.length >= 3) return true;
      if (reqSkillClean.includes(candClean) && candClean.length >= 3) return true;
      
      // Handle variations like "ReactJS" and "React" or "TailwindCSS" and "Tailwind CSS"
      if (candClean.replace('js', '') === reqSkillClean.replace('js', '')) return true;
      if (candClean.replace('css', '') === reqSkillClean.replace('css', '')) return true;

      // Semantic alias matching for design and user experience roles
      if ((candClean.includes('ui') || candClean.includes('ux')) && (reqSkillClean.includes('ui') || reqSkillClean.includes('ux'))) return true;
      if (candClean.includes('design') && reqSkillClean.includes('design')) return true;

      return false;
    });

    if (isMatched) {
      matched.push(reqSkill);
    } else {
      missing.push(reqSkill);
    }
  });

  return { matched, missing };
}

export function isFresherOrJunior(profileTitle: string = '', resumeText: string = ''): boolean {
  const titleLower = profileTitle.toLowerCase();
  const textLower = resumeText.toLowerCase();

  // Primary indicators in the headline title
  const juniorTitleKeywords = [
    'fresher', 'intern', 'entry level', 'entry-level', 'graduate', 
    'trainee', 'associate', 'beginner', 'student', 'junior'
  ];
  if (juniorTitleKeywords.some(keyword => titleLower.includes(keyword))) {
    return true;
  }

  // Strong indicators in the resume body/text
  const juniorResumeKeywords = [
    'fresher', 'internship', 'no experience', 'no prior experience', 
    'pursuing b.tech', 'pursuing btech', 'student at', 'entry level developer', 
    'class of 2026', 'class of 2025', 'class of 2024', 'new grad', 'new graduate', 
    'graduate software engineer', 'junior frontend', 'junior software', 'junior developer',
    'zero years of experience', '0 years of experience', 'fresh graduate', 'fresh grad'
  ];
  if (juniorResumeKeywords.some(keyword => textLower.includes(keyword))) {
    return true;
  }

  return false;
}

export function isSeniorJob(jobTitle: string = '', jobRequirements: string[] = []): boolean {
  const titleLower = jobTitle.toLowerCase();
  
  // Strong senior keywords in the job title
  const seniorTitleKeywords = [
    'senior', 'sr', 'sr.', 'lead', 'principal', 'staff', 
    'architect', 'manager', 'director', 'vp', 'head'
  ];
  if (seniorTitleKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(titleLower);
  })) {
    return true;
  }

  // Check requirements for years of experience (e.g., "5+ years", "8+ years")
  const experienceRegex = /(\b[5-9]\b|10|11|12|15)\+?\s*years?/i;
  for (const req of jobRequirements) {
    if (experienceRegex.test(req)) {
      return true;
    }
  }

  return false;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateJobRequirements(job: Job, profile: UserProfile): ValidationResult {
  const profileTitle = (profile.title || '').toLowerCase();
  const resumeText = (profile.resumeText || '').toLowerCase();
  const jobTitle = (job.title || '').toLowerCase();
  const requirements = (job.requirements || []).map(r => r.toLowerCase());

  // 1. Seniority Level validation
  const isJunior = isFresherOrJunior(profile.title, profile.resumeText);
  const isSenior = isSeniorJob(job.title, job.requirements);

  if (isJunior && isSenior) {
    return {
      isValid: false,
      reason: `Seniority Mismatch: Profile indicates a junior/fresher level, but the role "${job.title}" is a Senior/Lead position.`
    };
  }

  // 2. Explicit Years of Experience validation
  let maxRequiredExperience = 0;
  for (const req of requirements) {
    const match = req.match(/(\d+)\+?\s*years?\s+of\s+experience/i) || 
                  req.match(/(\d+)\+?\s*(?:yr|year)s?\b/i) ||
                  req.match(/experience\s*:\s*(\d+)\+?\s*years?/i);
    if (match) {
      const yrs = parseInt(match[1], 10);
      if (yrs > maxRequiredExperience) {
        maxRequiredExperience = yrs;
      }
    }
  }

  // Fallback to title indicators if no explicit years of experience are mentioned in requirements
  if (maxRequiredExperience === 0) {
    if (isSenior) {
      maxRequiredExperience = 5; // Default assumption for Senior roles
    } else if (jobTitle.includes('lead') || jobTitle.includes('principal') || jobTitle.includes('staff')) {
      maxRequiredExperience = 7;
    } else if (jobTitle.includes('junior') || jobTitle.includes('entry') || jobTitle.includes('intern') || jobTitle.includes('associate')) {
      maxRequiredExperience = 0;
    } else {
      maxRequiredExperience = 2; // Default for mid-level
    }
  }

  // Estimate candidate's years of experience from profile and resume
  let candidateExperience = 0;
  const candidateExpMatch = resumeText.match(/(\d+)\+?\s*years?\s+of\s+experience/i) || 
                            resumeText.match(/(\d+)\+?\s*(?:yr|year)s?\s+exp\b/i) ||
                            resumeText.match(/experience\s*:\s*(\d+)\+?\s*years?/i) ||
                            profileTitle.match(/(\d+)\+?\s*years?/i);
  
  if (candidateExpMatch) {
    candidateExperience = parseInt(candidateExpMatch[1], 10);
  } else {
    // Inference based on titles/keywords
    if (isJunior) {
      candidateExperience = 1; // Cap at 1 year for fresher/junior indicators
    } else if (profileTitle.includes('senior') || profileTitle.includes('sr.')) {
      candidateExperience = 5;
    } else if (profileTitle.includes('lead') || profileTitle.includes('principal')) {
      candidateExperience = 8;
    } else {
      candidateExperience = 3; // Default mid-level
    }
  }

  if (candidateExperience < maxRequiredExperience) {
    return {
      isValid: false,
      reason: `Experience Fit: Role "${job.title}" requires ${maxRequiredExperience}+ years of experience, but your profile/resume indicates approximately ${candidateExperience} year(s).`
    };
  }

  // 3. Specific Role/Domain Fit validation
  const isFrontendJob = jobTitle.includes('frontend') || jobTitle.includes('react') || jobTitle.includes('ui') || jobTitle.includes('css') || jobTitle.includes('web developer');
  const isBackendJob = jobTitle.includes('backend') || jobTitle.includes('node') || jobTitle.includes('database') || jobTitle.includes('system') || jobTitle.includes('api') || jobTitle.includes('python dev') || jobTitle.includes('java dev');
  const isDevOpsJob = jobTitle.includes('devops') || jobTitle.includes('cloud') || jobTitle.includes('aws') || jobTitle.includes('infrastructure') || jobTitle.includes('kubernetes');
  const isDataJob = jobTitle.includes('data') || jobTitle.includes('ai') || jobTitle.includes('ml') || jobTitle.includes('machine learning') || jobTitle.includes('python developer') || jobTitle.includes('analytics');

  const isFrontendResume = profileTitle.includes('frontend') || profileTitle.includes('react') || profileTitle.includes('ui') || resumeText.includes('frontend') || resumeText.includes('react developer') || resumeText.includes('ui/ux');
  const isBackendResume = profileTitle.includes('backend') || profileTitle.includes('node') || profileTitle.includes('database') || resumeText.includes('backend') || resumeText.includes('node.js') || resumeText.includes('database');
  const isDevOpsResume = profileTitle.includes('devops') || profileTitle.includes('cloud') || resumeText.includes('devops') || resumeText.includes('aws') || resumeText.includes('kubernetes');
  const isDataResume = profileTitle.includes('data') || profileTitle.includes('ai') || profileTitle.includes('ml') || resumeText.includes('data engineer') || resumeText.includes('machine learning') || resumeText.includes('data scientist');

  if (isDevOpsJob && !isDevOpsResume && !isBackendResume) {
    return {
      isValid: false,
      reason: `Role Mismatch: The position "${job.title}" is focused on DevOps/Infrastructure, which does not match your Software Engineering domain.`
    };
  }
  if (isDataJob && !isDataResume && !isBackendResume && !resumeText.includes('python') && !resumeText.includes('sql')) {
    return {
      isValid: false,
      reason: `Role Mismatch: The position "${job.title}" is focused on Data/AI/ML, which requires specialized experience not highlighted in your profile.`
    };
  }
  if (isBackendJob && isFrontendResume && !isBackendResume && !profile.skills.some(s => s.toLowerCase().includes('backend') || s.toLowerCase().includes('node') || s.toLowerCase().includes('sql') || s.toLowerCase().includes('python') || s.toLowerCase().includes('java') || s.toLowerCase().includes('express') || s.toLowerCase().includes('mongodb') || s.toLowerCase().includes('postgresql'))) {
    return {
      isValid: false,
      reason: `Role Mismatch: The position "${job.title}" is focused on Backend engineering, but your profile/resume is primarily tailored for Frontend/Design.`
    };
  }
  if (isFrontendJob && isBackendResume && !isFrontendResume && !profile.skills.some(s => s.toLowerCase().includes('frontend') || s.toLowerCase().includes('react') || s.toLowerCase().includes('javascript') || s.toLowerCase().includes('css') || s.toLowerCase().includes('html') || s.toLowerCase().includes('typescript') || s.toLowerCase().includes('next.js'))) {
    return {
      isValid: false,
      reason: `Role Mismatch: The position "${job.title}" is focused on Frontend engineering, but your profile/resume is primarily tailored for Backend development.`
    };
  }

  return { isValid: true };
}

/**
 * Calculates a match score percentage (15% to 98%) based on how well the
 * user's skills intersect with the job details, adjusting for seniority/experience matching.
 */
export function calculateMatchScore(job: Job, skills: string[], profileTitle?: string, resumeText?: string): number {
  if (!skills || skills.length === 0) return 15;

  const { matched, missing } = getMatchedAndMissingSkills(job, skills);
  const total = matched.length + missing.length;
  if (total === 0) return 15;

  const ratio = matched.length / total;
  // Map ratio smoothly from 15% to 98%
  let score = Math.round(15 + ratio * 83);

  // Check for seniority mismatch
  if (profileTitle || resumeText) {
    const isJunior = isFresherOrJunior(profileTitle || '', resumeText || '');
    const isSenior = isSeniorJob(job.title, job.requirements || []);
    
    if (isJunior && isSenior) {
      // Seniority mismatch: limit match score to 45% max so it doesn't auto-apply (requires 60%)
      score = Math.max(15, Math.min(45, score - 40));
    }
  }

  return Math.min(98, Math.max(15, score));
}

/**
 * Returns color style classes based on match score
 */
export function getScoreStyle(score: number): { text: string; bg: string; border: string; glow: string } {
  if (score >= 85) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      glow: 'shadow-[0_0_12px_rgba(99,102,241,0.15)]',
    };
  }
  return {
    text: 'text-white/50',
    bg: 'bg-white/5',
    border: 'border-white/10',
    glow: '',
  };
}

