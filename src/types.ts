export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  category: 'Design' | 'Technical' | 'Engineering' | 'Marketing' | 'Remote' | 'Product' | 'Operations' | 'Sales';
  description: string;
  requirements: string[];
  logoUrl: string;
  badge?: 'New' | 'Hot' | 'Entry Level' | 'Internship' | 'Fresher';
  benefits?: string[];
  postedTime: string;
  experienceLevel?: 'Fresher' | 'Mid' | 'Senior';
}

export interface UserProfile {
  name: string;
  email: string;
  title: string;
  skills: string[];
  resumeText: string;
  avatarUrl: string;
  autoApply?: boolean;
  phone?: string;
  experienceLevel?: string;
  targetSalary?: string;
  preferredLocation?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  education?: any[];
  experience?: any[];
  projects?: any[];
  certifications?: string[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  appliedAt: string;
  status: 'Applied' | 'Reviewing' | 'Interviewing' | 'Offered' | 'Declined';
  coverLetter?: string;
  interviewDate?: string; // YYYY-MM-DD
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resumeName?: string;
  country?: string;
  portfolioUrl?: string;
}

export interface SavedJob {
  jobId: string;
  savedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface SearchAlert {
  id: string;
  query: string;
  createdAt: string;
  active: boolean;
}

export interface ResumeReviewResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  tailoredTips: string[];
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  explanation: string;
}

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  fromName?: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  htmlBody: string;
  status: 'sent' | 'failed' | 'simulated';
  previewUrl?: string;
  error?: string;
  type: 'daily_summary' | 'interview_reminder' | 'test';
}

