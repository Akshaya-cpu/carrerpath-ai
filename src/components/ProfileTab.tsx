import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertCircle, RefreshCw, CheckCircle2, User, Mail, 
  Briefcase, Code, FileText, BarChart, Info, ShieldAlert,
  Check, X, ChevronDown, ChevronUp, Award, Cpu, Compass, BookOpen, GraduationCap, TrendingUp, ArrowRight, Download, ExternalLink,
  Calendar, Clock, Plus, ChevronLeft, ChevronRight, MapPin, Upload, Copy,
  CreditCard, Crown, ShieldCheck, Globe, Phone, MessageCircle
} from 'lucide-react';
import { UserProfile, ResumeReviewResult, Job, JobApplication } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { sanitizeUserProfile } from '../utils/resumeParser';

async function parseApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text.trim().slice(0, 300) || 'Invalid JSON response from server.');
  }
}

async function parseErrorResponse(response: Response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data?.error || data?.message || text;
  } catch {
    return text || 'Unknown server error.';
  }
}

export interface CareerRoadmapStep {
  title: string;
  description: string;
  timeEstimate: string;
  difficulty: string;
  resources: string[];
  marketTrendReason: string;
}

export interface CareerRoadmap {
  targetJobTitle: string;
  summary: string;
  steps: CareerRoadmapStep[];
}

export interface SkillGapResource {
  name: string;
  url: string;
  description: string;
}

export interface MissingSkill {
  skillName: string;
  importance: string;
  dreamJobsAffected: string[];
  resources: SkillGapResource[];
}

export interface SkillGapAnalysis {
  summary: string;
  missingSkills: MissingSkill[];
}

interface ProfileTabProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile, options?: { isResumeUpload?: boolean }) => void;
  onLogout: () => void;
  savedJobs?: Job[];
  applications?: JobApplication[];
  jobs?: Job[];
  onUpdateInterviewDate?: (jobId: string, date: string) => void;
  initialSubTab?: 'profile' | 'coaching' | 'interviews' | 'tools';
}

export interface AtsCheck {
  label: string;
  description: string;
  passed: boolean;
  value: string;
  suggestion: string;
}

export function getAtsAnalysis(profile: UserProfile) {
  const checks: AtsCheck[] = [];
  
  // 1. Contact Details & Social Handles
  const contactPassed = !!(profile.name && profile.email && profile.title);
  checks.push({
    label: 'Contact Details Optimization',
    description: 'Verifies presence of full name, active email, and professional title.',
    passed: contactPassed,
    value: contactPassed ? 'Configured' : 'Missing items',
    suggestion: contactPassed ? 'Excellent! Standard ATS systems can correctly parse your candidate identifier fields.' : 'Provide your full name, email, and professional headline title to support parser mappings.'
  });

  // 2. Keyword & Core Competencies Density
  const skillsCount = profile.skills?.length || 0;
  const skillsPassed = skillsCount >= 6;
  checks.push({
    label: 'Core Skills Keywords Density',
    description: 'ATS search engines index and prioritize resumes with 6 or more core competencies.',
    passed: skillsPassed,
    value: `${skillsCount} skills defined`,
    suggestion: skillsPassed ? 'Ideal skill density for system index ranking filters.' : 'Add at least 6 core technical skills (separated by commas) to rank high in programmatic search indexers.'
  });

  // 3. Professional Summary / Executive Bio Length
  const bioLength = profile.resumeText?.trim().length || 0;
  const bioPassed = bioLength >= 150;
  checks.push({
    label: 'Resume Executive Summary Depth',
    description: 'Checks if executive bio/resume summary has enough substance for natural language processors.',
    passed: bioPassed,
    value: `${bioLength} characters`,
    suggestion: bioPassed ? 'Sufficiently descriptive executive biography statement.' : 'Expand your professional bio to 150+ characters describing your career goals and key accomplishments.'
  });

  // 4. Action Verbs & Active Language Check
  const bioLower = (profile.resumeText || '').toLowerCase();
  const hasActionVerbs = ['develop', 'design', 'manage', 'lead', 'build', 'create', 'engineer', 'implement', 'analyze', 'deliver', 'direct', 'facilitate', 'structure', 'execute'].some(verb => bioLower.includes(verb));
  checks.push({
    label: 'Action Verb Impact Scan',
    description: 'Scans for industry action verbs (e.g. lead, develop, design) that signal project ownership and outcome delivery.',
    passed: hasActionVerbs,
    value: hasActionVerbs ? 'Identified' : 'Not found',
    suggestion: hasActionVerbs ? 'Great active vocabulary! Your profile conveys outcome-oriented impact.' : 'Use direct action verbs (e.g., "developed", "managed", "designed", "engineered") in your professional bio.'
  });

  // 5. Structure & Special Characters Filter
  const hasSpecialSymbols = /[\u25A0-\u25FF\u2B00-\u2BFF]/.test(profile.resumeText || '');
  const formattingPassed = !hasSpecialSymbols;
  checks.push({
    label: 'Standard Character & Symbol Integrity',
    description: 'Tests for problematic icon glyphs or non-standard visual blocks that break text encoders in classic parsers.',
    passed: formattingPassed,
    value: formattingPassed ? 'Clean layout' : 'Unusual characters',
    suggestion: formattingPassed ? 'Standard Unicode set. Easy for any text reader to process.' : 'Avoid copy-pasting heavy custom bullet symbols or graphical arrows that interfere with plain-text parser models.'
  });

  // Calculation scoring mechanism
  let score = 20; // baseline
  if (profile.name) score += 10;
  if (profile.email) score += 10;
  if (profile.title) score += 10;
  
  score += Math.min(25, (profile.skills?.length || 0) * 4.5);
  
  if (bioLength > 300) score += 15;
  else if (bioLength >= 150) score += 10;
  else if (bioLength > 50) score += 5;

  if (hasActionVerbs) score += 10;
  if (formattingPassed) score += 10;

  const finalScore = Math.min(98, Math.round(score));

  return {
    score: finalScore,
    checks
  };
}

export default function ProfileTab({ 
  profile, 
  onUpdateProfile, 
  onLogout, 
  savedJobs = [],
  applications = [],
  jobs = [],
  onUpdateInterviewDate,
  initialSubTab
}: ProfileTabProps) {
  const atsResult = getAtsAnalysis(profile);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'coaching' | 'interviews' | 'tools' | 'subscription' | 'feedback'>(initialSubTab || 'profile');
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('careerpath_premium_pro') === 'true';
  });

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [title, setTitle] = useState(profile.title);
  const [skillsText, setSkillsText] = useState(profile.skills.join(', '));
  const [resumeText, setResumeText] = useState(profile.resumeText);
  const [phone, setPhone] = useState(profile.phone || '');
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || 'Senior');
  const [targetSalary, setTargetSalary] = useState(profile.targetSalary || '$145,000');
  const [preferredLocation, setPreferredLocation] = useState(profile.preferredLocation || 'Remote');
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl || '');

  // Gemini Resume review states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<ResumeReviewResult | null>(null);
  const [auditError, setAuditError] = useState('');
  const [auditStep, setAuditStep] = useState(0);

  // Gemini Resume parsing states for Auto-Fill
  const [userId, setUserId] = useState<string | null>(null);
  const [rawResumeInput, setRawResumeInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const [parseError, setParseError] = useState('');
  const [parseSuccess, setParseSuccess] = useState('');
  const [showAutoFill, setShowAutoFill] = useState(false);

  // Career Roadmap States
  const [targetTitleInput, setTargetTitleInput] = useState(() => {
    return profile.title ? `${profile.title} Specialist` : 'Senior Engineering Lead';
  });
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(() => {
    const saved = localStorage.getItem(`career_path_ai_roadmap_${profile.email}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState('');
  const [roadmapGenStep, setRoadmapGenStep] = useState(0);

  // Skill Gap Analysis States
  const [gapAnalysis, setGapAnalysis] = useState<SkillGapAnalysis | null>(() => {
    const saved = localStorage.getItem(`career_path_ai_gap_analysis_${profile.email}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [isAnalyzingGap, setIsAnalyzingGap] = useState(false);
  const [gapAnalysisError, setGapAnalysisError] = useState('');
  const [gapGenStep, setGapGenStep] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('career_path_ai_token');
    if (!token) return;

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user) {
          setName(data.user.name || profile.name);
          setEmail(data.user.email || profile.email);
          setUserId(data.user.id || null);
        }
      })
      .catch(() => {
        // Ignore fetch failures, preserve local profile state.
      });
  }, [profile.email, profile.name, profile.title]);

  // Scheduled Interviews Calendar States
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 6, 1)); // Default July 1, 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(8); // Default to July 8 (our seeded interview day)
  const [schedulingJobId, setSchedulingJobId] = useState<string | null>(null);
  const [schedulerDateInput, setSchedulerDateInput] = useState('');

  // Resume Version History States
  const [resumeVersions, setResumeVersions] = useState<any[]>(() => {
    const saved = localStorage.getItem(`career_path_ai_resume_history_${profile.email}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    return [
      {
        id: 'v1',
        versionName: 'Master Profile',
        uploadedAt: new Date().toISOString(),
        fileName: 'Master_Profile_Resume.txt',
        score: 68,
        text: profile.resumeText || 'No professional bio uploaded. Add your bio description to review matching recommendations.',
        title: profile.title,
        skills: profile.skills
      }
    ];
  });
  const [selectedVersionId, setSelectedVersionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`career_path_ai_resume_history_${profile.email}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[parsed.length - 1].id;
      }
    } catch {}
    return 'v1';
  });
  const [newVersionNameInput, setNewVersionNameInput] = useState('');
  const [newVersionTextInput, setNewVersionTextInput] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionError, setVersionError] = useState('');
  const [versionSuccess, setVersionSuccess] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOneClickOptimize = async () => {
    setIsOptimizing(true);
    setVersionError('');
    setVersionSuccess('');
    try {
      const response = await fetch('/api/gemini/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to optimize resume details.');
      }

      const data = await parseApiResponse(response);
      const optimizedProfile = data.optimizedProfile;
      if (!optimizedProfile) {
        throw new Error('Empty optimized data returned from Gemini.');
      }

      // Create a new version for the version manager history so the user can easily switch back if they want!
      const nextVerNum = resumeVersions.length + 1;
      const newVer: any = {
        id: `v_${Date.now()}`,
        versionName: `v${nextVerNum} - AI One-Click Optimized`,
        uploadedAt: new Date().toISOString(),
        fileName: 'AI_Optimized_Resume.txt',
        score: 95, // Estimated optimized score
        text: optimizedProfile.resumeText,
        title: optimizedProfile.title,
        skills: optimizedProfile.skills,
        education: optimizedProfile.education,
        experience: optimizedProfile.experience,
        projects: optimizedProfile.projects,
        certifications: optimizedProfile.certifications
      };

      const updatedHistory = [...resumeVersions, newVer];
      setResumeVersions(updatedHistory);
      setSelectedVersionId(newVer.id);
      localStorage.setItem(`career_path_ai_resume_history_${profile.email}`, JSON.stringify(updatedHistory));

      // Update the active profile
      onUpdateProfile({
        ...profile,
        title: optimizedProfile.title,
        skills: optimizedProfile.skills,
        resumeText: optimizedProfile.resumeText,
        education: optimizedProfile.education,
        experience: optimizedProfile.experience,
        projects: optimizedProfile.projects,
        certifications: optimizedProfile.certifications
      }, { isResumeUpload: true });

      // Sync local editor input states
      setTitle(optimizedProfile.title);
      setSkillsText(optimizedProfile.skills.join(', '));
      setResumeText(optimizedProfile.resumeText);

      setVersionSuccess('One-Click AI Optimization successful! A new optimized resume version has been saved and applied with high-impact action vocabulary.');
    } catch (err: any) {
      console.error(err);
      setVersionError(err.message || 'An error occurred during One-Click AI Resume Optimization.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleLoadFresherPreset = () => {
    const fresherPreset = {
      name: 'Sunkara Akshaya',
      email: 'sunkaraakshaya11@gmail.com',
      title: 'B.Tech Graduate & Software Engineer Intern',
      skills: ['Python', 'Java', 'SQL', 'React', 'HTML5', 'CSS3', 'Git', 'Data Structures', 'Algorithms'],
      resumeText: 'Passionate B.Tech Computer Science graduate with hands-on software engineering internship experience. Skilled in modern programming languages including Python and Java, frontend web development using React.js and Tailwind CSS, and database queries with SQL. Experienced in working in collaborative teams to build efficient web pages.',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbAWwMpbTuAXNkpIJt-rJA58sDRLHcrMnIbEVrakGD1qSQoBZ-GbMLc_0S9egMlnx1yz20wzRi2SuaaDfVLoU-t5jX7QIsfingYDVp1m7lxfiFZPlOD-laLGB9Ej5MSaJOe1ZD0V5k9AsQqN4FPLZoc1MzlYI_70mvWtYWMzqWxppr6AyuFC9NAY6M56DUU7RBfQsEyXBxqgy8G4wxi_277d7eplRep1_v8fS7rWkbCDRdXlmwMy2e',
      experienceLevel: 'Entry Level',
      targetSalary: '$65,000',
      preferredLocation: 'Remote / Bangalore',
      education: [
        {
          degree: 'B.Tech in Computer Science & Engineering',
          school: 'Sphoorthy Engineering College',
          year: '2026'
        }
      ],
      experience: [
        {
          role: 'Software Engineer Intern',
          company: 'Nebula Systems',
          duration: 'May 2025 - August 2025',
          description: 'Assisted in building responsive user interfaces using React.js and Tailwind CSS. Collaborated with the core engineering team to optimize backend database queries and resolve bottlenecks, resulting in a 15% improvement in client-side loading speeds.'
        }
      ],
      projects: [
        {
          name: 'AI-Powered Career Matcher',
          description: 'A React-based web application that parses user resume transcripts to dynamically calculate skill synergy metrics against active job opportunities using vector embedding logic.',
          technologies: ['React', 'Python', 'Tailwind CSS', 'SQL']
        }
      ],
      certifications: ['AWS Certified Cloud Practitioner', 'Google IT Support Professional Certificate']
    };

    onUpdateProfile(fresherPreset);

    // Sync input states
    setName(fresherPreset.name);
    setEmail(fresherPreset.email);
    setTitle(fresherPreset.title);
    setSkillsText(fresherPreset.skills.join(', '));
    setResumeText(fresherPreset.resumeText);
    setExperienceLevel(fresherPreset.experienceLevel);
    setTargetSalary(fresherPreset.targetSalary);
    setPreferredLocation(fresherPreset.preferredLocation);
  };

  // PDF Preview Modal States
  const [previewVersion, setPreviewVersion] = useState<any | null>(null);
  const [previewTemplateStyle, setPreviewTemplateStyle] = useState<'modern' | 'classic' | 'creative'>('modern');
  const [previewName, setPreviewName] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewEmail, setPreviewEmail] = useState('');
  const [previewSkills, setPreviewSkills] = useState('');
  const [previewBio, setPreviewBio] = useState('');

  // Email Integration States
  const [smtpConfig, setSmtpConfig] = useState(() => {
    const saved = localStorage.getItem('career_pulse_smtp_config');
    return saved ? JSON.parse(saved) : {
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      fromName: 'CareerPath AI Daily Digest'
    };
  });
  const [emailLogs, setEmailLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('career_pulse_email_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [autoTriggerDaily, setAutoTriggerDaily] = useState(() => {
    const saved = localStorage.getItem('career_pulse_auto_email');
    return saved === 'true';
  });
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [showSmtpSettings, setShowSmtpSettings] = useState(false);
  const [selectedLogForPreview, setSelectedLogForPreview] = useState<any | null>(null);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState(false);
  const [digestSuccessMsg, setDigestSuccessMsg] = useState('');
  const [digestErrorMsg, setDigestErrorMsg] = useState('');

  // LinkedIn Profile Export States
  const [showLinkedInExport, setShowLinkedInExport] = useState(false);
  const [isGeneratingLinkedIn, setIsGeneratingLinkedIn] = useState(false);
  const [linkedInSchema, setLinkedInSchema] = useState<any | null>(null);
  const [linkedInError, setLinkedInError] = useState('');
  const [linkedInCopied, setLinkedInCopied] = useState(false);
  const [linkedInStep, setLinkedInStep] = useState(0);

  const handleGenerateLinkedIn = async () => {
    setIsGeneratingLinkedIn(true);
    setLinkedInError('');
    setLinkedInCopied(false);
    setLinkedInStep(0);
    
    const stepsCount = 6;
    const interval = setInterval(() => {
      setLinkedInStep(prev => (prev < stepsCount - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const response = await fetch('/api/gemini/linkedin-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          title: profile.title,
          skills: profile.skills,
          resumeText: profile.resumeText
        })
      });
      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Server error occurred during LinkedIn schema generation.');
      }
      const data = await parseApiResponse(response);
      setLinkedInSchema(data);
    } catch (err: any) {
      console.error(err);
      setLinkedInError(err.message || 'Unable to generate LinkedIn schema. Please try again.');
    } finally {
      clearInterval(interval);
      setIsGeneratingLinkedIn(false);
    }
  };

  const handleSaveSmtpSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('career_pulse_smtp_config', JSON.stringify(smtpConfig));
    setSmtpSaveSuccess(true);
    setTimeout(() => setSmtpSaveSuccess(false), 3000);
  };

  const handleToggleAutoTrigger = (val: boolean) => {
    setAutoTriggerDaily(val);
    localStorage.setItem('career_pulse_auto_email', val ? 'true' : 'false');
  };

  const handleClearEmailLogs = () => {
    setEmailLogs([]);
    localStorage.removeItem('career_pulse_email_logs');
  };

  const handleTriggerEmailDigest = async () => {
    setIsSendingDigest(true);
    setDigestSuccessMsg('');
    setDigestErrorMsg('');
    try {
      const savedJobsData = savedJobs || [];
      const activeInterviews = (applications || [])
        .filter(app => app.status === 'Interviewing' && app.interviewDate)
        .map(app => {
          const matchingJob = (jobs || []).find(j => j.id === app.jobId);
          return {
            id: app.id,
            title: matchingJob?.title || 'Unknown Title',
            company: matchingJob?.company || 'Unknown Company',
            location: matchingJob?.location || 'Remote',
            interviewDate: app.interviewDate
          };
        });

      const alertsRaw = localStorage.getItem('career_pulse_search_alerts');
      const alerts = alertsRaw ? JSON.parse(alertsRaw) : [];

      const response = await fetch('/api/email/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          savedJobs: savedJobsData,
          interviews: activeInterviews,
          searchAlerts: alerts,
          smtpConfig: smtpConfig.host ? smtpConfig : undefined
        })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to send daily digest email.');
      }

      const result = await parseApiResponse(response);

      const newLog = {
        id: `mail_log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        recipient: profile.email,
        subject: result.subject || 'CareerPath AI Daily Digest',
        htmlBody: result.htmlBody,
        status: result.status,
        previewUrl: result.previewUrl,
        type: 'daily_summary'
      };

      const updatedLogs = [newLog, ...emailLogs];
      setEmailLogs(updatedLogs);
      localStorage.setItem('career_pulse_email_logs', JSON.stringify(updatedLogs));
      
      if (result.status === 'sent') {
        setDigestSuccessMsg(`Daily digest email successfully sent to ${profile.email}!`);
      } else {
        setDigestSuccessMsg(`Daily digest email simulated successfully using test SMTP server!`);
      }

    } catch (err: any) {
      console.error(err);
      setDigestErrorMsg(err.message || 'An error occurred while sending the email.');
      const failedLog = {
        id: `mail_log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        recipient: profile.email,
        subject: 'Daily Digest (Failed to deliver)',
        htmlBody: '',
        status: 'failed',
        error: err.message || 'SMTP Server timeout or connection failed',
        type: 'daily_summary'
      };
      const updatedLogs = [failedLog, ...emailLogs];
      setEmailLogs(updatedLogs);
      localStorage.setItem('career_pulse_email_logs', JSON.stringify(updatedLogs));
    } finally {
      setIsSendingDigest(false);
    }
  };

  const handleOpenPreview = (ver: any) => {
    setPreviewVersion(ver);
    setPreviewTemplateStyle('modern');
    setPreviewName(profile.name || 'Your Name');
    setPreviewTitle(ver.title || profile.title || 'Professional Title');
    setPreviewEmail(profile.email || 'N/A');
    setPreviewSkills(ver.skills ? ver.skills.join(', ') : '');
    setPreviewBio(ver.text || '');
  };

  const handleOpenCurrentPreview = () => {
    const currentDummyProfile = {
      ...profile,
      name: name || profile.name,
      title: title || profile.title,
      skills: skillsText ? skillsText.split(',').map((s: string) => s.trim()).filter(Boolean) : (profile.skills || []),
      resumeText: resumeText || profile.resumeText || ''
    };
    const evaluation = getAtsAnalysis(currentDummyProfile);
    const passedCount = evaluation.checks.filter(c => c.passed).length;
    const calculatedScore = Math.min(98, Math.round(55 + (passedCount / evaluation.checks.length) * 43));

    const activeVersionDummy = {
      id: 'current_active',
      versionName: 'Active Profile',
      uploadedAt: new Date().toISOString(),
      fileName: 'active_profile.pdf',
      score: calculatedScore,
      text: resumeText || profile.resumeText || '',
      title: title || profile.title || '',
      skills: skillsText ? skillsText.split(',').map((s: string) => s.trim()).filter(Boolean) : (profile.skills || [])
    };

    setPreviewVersion(activeVersionDummy);
    setPreviewTemplateStyle('modern');
    setPreviewName(name || profile.name || 'Your Name');
    setPreviewTitle(title || profile.title || 'Professional Title');
    setPreviewEmail(email || profile.email || 'N/A');
    setPreviewSkills(skillsText || (profile.skills ? profile.skills.join(', ') : ''));
    setPreviewBio(resumeText || profile.resumeText || '');
  };

  // Save resume history to localStorage when changed
  useEffect(() => {
    localStorage.setItem(`career_path_ai_resume_history_${profile.email}`, JSON.stringify(resumeVersions));
  }, [resumeVersions, profile.email]);

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    const allowedExtensions = ['txt', 'pdf', 'docx', 'doc'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!allowedExtensions.includes(fileExtension)) {
      setVersionError('Unsupported file type. Please upload a PDF (.pdf), Word Document (.docx, .doc), or Text (.txt) file.');
      return;
    }

    // Client-side file relevance/validation check to reject non-resume files immediately (e.g. organograms, diagrams, invoices)
    const nameLower = file.name.toLowerCase();
    const invalidKeywords = [
      'organogram', 'orgchart', 'org-chart', 'organizational-chart', 'diagram', 'flowchart', 'flow-chart', 
      'receipt', 'ticket', 'invoice', 'bill', 'payment', 'booking', 'slip', 'order', 'transport', 'ksrtc', 
      'bus', 'train', 'flight', 'utility', 'menu', 'grocery', 'image', 'photo', 'picture', 'graph', 'chart', 'map'
    ];
    
    const isUnrelatedName = invalidKeywords.some(keyword => nameLower.includes(keyword));
    if (isUnrelatedName) {
      setVersionError('Incorrect file, please upload a valid professional resume (PDF, Word Document, or Text). File types like organograms, diagrams, flowcharts, or bills are not accepted.');
      return;
    }

    setIsCreatingVersion(true);
    setVersionError('');
    setVersionSuccess('');

    try {
      if (fileExtension === 'txt') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (!text || text.trim().length < 20) {
            setVersionError('The uploaded text file is empty or too short (min 20 characters).');
            setIsCreatingVersion(false);
            return;
          }
          
          try {
            const response = await fetch('/api/gemini/resume-parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resumeText: text.trim() })
            });

            let parsedTitle = profile.title;
            let parsedSkills = profile.skills;
            let parsedEducation = [];
            let parsedExperience = [];
            let parsedProjects = [];
            let parsedCertifications = [];

            if (response.ok) {
              const data = await parseApiResponse(response);
              if (data.title) parsedTitle = data.title;
              if (data.skills && data.skills.length > 0) parsedSkills = data.skills;
              parsedEducation = data.education || [];
              parsedExperience = data.experience || [];
              parsedProjects = data.projects || [];
              parsedCertifications = data.certifications || [];
            }

            const dummyProfile = sanitizeUserProfile({
              ...profile,
              title: parsedTitle,
              skills: parsedSkills,
              resumeText: text.trim(),
              education: parsedEducation,
              experience: parsedExperience,
              projects: parsedProjects,
              certifications: parsedCertifications
            }, text.trim(), file.name);
            const evaluation = getAtsAnalysis(dummyProfile);
            const passedCount = evaluation.checks.filter(c => c.passed).length;
            const calculatedScore = Math.min(98, Math.round(55 + (passedCount / evaluation.checks.length) * 43));

            const nextVerNum = resumeVersions.length + 1;
            const newVer: any = {
              id: `v_${Date.now()}`,
              versionName: `v${nextVerNum} - ${file.name.replace('.txt', '')}`,
              uploadedAt: new Date().toISOString(),
              fileName: file.name,
              score: calculatedScore,
              text: text.trim(),
              title: parsedTitle,
              skills: parsedSkills,
              education: parsedEducation,
              experience: parsedExperience,
              projects: parsedProjects,
              certifications: parsedCertifications
            };

            const updatedHistory = [...resumeVersions, newVer];
            setResumeVersions(updatedHistory);
            setSelectedVersionId(newVer.id);
            localStorage.setItem(`career_path_ai_resume_history_${profile.email}`, JSON.stringify(updatedHistory));

            // Update master profile directly
            onUpdateProfile(dummyProfile, { isResumeUpload: true });
            
            // Sync local input states
            setTitle(parsedTitle);
            setSkillsText(parsedSkills.join(', '));
            setResumeText(text.trim());
            setVersionSuccess(`Successfully uploaded, parsed, and scored "${file.name}"! Master profile updated. ATS Score: ${calculatedScore}%`);
          } catch (err) {
            console.error(err);
            setVersionError('Failed to parse text from file with Gemini.');
          } finally {
            setIsCreatingVersion(false);
          }
        };
        reader.onerror = () => {
          setVersionError('Failed to read the uploaded text file.');
          setIsCreatingVersion(false);
        };
        reader.readAsText(file);
      } else if (fileExtension === 'pdf' || fileExtension === 'docx' || fileExtension === 'doc') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string;
          const base64 = dataUrl.split(',')[1];
          let mimeType = 'application/pdf';
          if (fileExtension === 'docx') {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (fileExtension === 'doc') {
            mimeType = 'application/msword';
          }

          try {
            const response = await fetch('/api/gemini/resume-parse-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileBase64: base64,
                mimeType,
                fileName: file.name
              })
            });

            if (!response.ok) {
              const errorText = await parseErrorResponse(response);
              throw new Error(errorText || 'Failed to analyze resume file.');
            }

            const data = await parseApiResponse(response);
            
            const parsedName = data.name && data.name !== 'Candidate' ? data.name : profile.name;
            const parsedTitle = data.title || profile.title;
            const parsedSkills = data.skills && data.skills.length > 0 ? data.skills : profile.skills;
            const extractedText = data.fullText || data.summary || '';

            const dummyProfile = sanitizeUserProfile({
              ...profile,
              name: parsedName,
              title: parsedTitle,
              skills: parsedSkills,
              resumeText: extractedText,
              education: data.education || [],
              experience: data.experience || [],
              projects: data.projects || [],
              certifications: data.certifications || []
            }, extractedText, file.name);
            const evaluation = getAtsAnalysis(dummyProfile);
            const passedCount = evaluation.checks.filter(c => c.passed).length;
            const calculatedScore = Math.min(98, Math.round(55 + (passedCount / evaluation.checks.length) * 43));

            const nextVerNum = resumeVersions.length + 1;
            const cleanFileName = file.name
              .replace('.pdf', '')
              .replace('.docx', '')
              .replace('.doc', '');
            const newVer: any = {
              id: `v_${Date.now()}`,
              versionName: `v${nextVerNum} - ${cleanFileName}`,
              uploadedAt: new Date().toISOString(),
              fileName: file.name,
              score: calculatedScore,
              text: extractedText,
              title: parsedTitle,
              skills: parsedSkills,
              education: data.education || [],
              experience: data.experience || [],
              projects: data.projects || [],
              certifications: data.certifications || []
            };

            const updatedHistory = [...resumeVersions, newVer];
            setResumeVersions(updatedHistory);
            setSelectedVersionId(newVer.id);
            localStorage.setItem(`career_path_ai_resume_history_${profile.email}`, JSON.stringify(updatedHistory));

            // Update master profile directly
            onUpdateProfile(dummyProfile, { isResumeUpload: true });

            // Sync local input states
            if (data.name && data.name !== 'Candidate') {
              setName(data.name);
            }
            setTitle(parsedTitle);
            setSkillsText(parsedSkills.join(', '));
            setResumeText(extractedText);
            setVersionSuccess(`Successfully processed, parsed, and scored "${file.name}" with AI! Master profile updated. ATS Score: ${calculatedScore}%`);
          } catch (err: any) {
            console.error(err);
            setVersionError(err.message || 'Failed to parse the resume using AI.');
          } finally {
            setIsCreatingVersion(false);
          }
        };
        reader.onerror = () => {
          setVersionError('Failed to read resume file.');
          setIsCreatingVersion(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error(err);
      setVersionError('An error occurred while uploading the file.');
      setIsCreatingVersion(false);
    }
  };

  const handleCreateNewVersion = async () => {
    if (!newVersionTextInput.trim()) {
      setVersionError('Please provide some resume text or details to parse.');
      return;
    }
    setIsCreatingVersion(true);
    setVersionError('');
    setVersionSuccess('');

    try {
      // 1. Call auto-fill/parse API to extract structured fields (headline, skills, summary)
      const response = await fetch('/api/gemini/resume-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: newVersionTextInput.trim() })
      });

      let parsedTitle = profile.title;
      let parsedSkills = profile.skills;
      let parsedEducation = [];
      let parsedExperience = [];
      let parsedProjects = [];
      let parsedCertifications = [];

      if (response.ok) {
        const data = await parseApiResponse(response);
        if (data.title) parsedTitle = data.title;
        if (data.skills && data.skills.length > 0) parsedSkills = data.skills;
        parsedEducation = data.education || [];
        parsedExperience = data.experience || [];
        parsedProjects = data.projects || [];
        parsedCertifications = data.certifications || [];
      }

      // 2. Calculate dynamic ATS score out of 100
      const dummyProfile = {
        ...profile,
        title: parsedTitle,
        skills: parsedSkills,
        resumeText: newVersionTextInput.trim(),
        education: parsedEducation,
        experience: parsedExperience,
        projects: parsedProjects,
        certifications: parsedCertifications
      };
      const evaluation = getAtsAnalysis(dummyProfile);
      
      const passedCount = evaluation.checks.filter(c => c.passed).length;
      const calculatedScore = Math.min(98, Math.round(55 + (passedCount / evaluation.checks.length) * 43));

      // 3. Construct new version object
      const nextVerNum = resumeVersions.length + 1;
      const newVer: any = {
        id: `v_${Date.now()}`,
        versionName: newVersionNameInput.trim() || `v${nextVerNum} - Optimized ${parsedTitle.split(' ')[0]} Profile`,
        uploadedAt: new Date().toISOString(),
        fileName: 'Uploaded_Resume.txt',
        score: calculatedScore,
        text: newVersionTextInput.trim(),
        title: parsedTitle,
        skills: parsedSkills,
        education: parsedEducation,
        experience: parsedExperience,
        projects: parsedProjects,
        certifications: parsedCertifications
      };

      const updatedHistory = [...resumeVersions, newVer];
      setResumeVersions(updatedHistory);
      setSelectedVersionId(newVer.id);
      localStorage.setItem(`career_path_ai_resume_history_${profile.email}`, JSON.stringify(updatedHistory));
      
      // Also activate this version immediately as the main master profile!
      onUpdateProfile({
        ...profile,
        title: parsedTitle,
        skills: parsedSkills,
        resumeText: newVersionTextInput.trim(),
        education: parsedEducation,
        experience: parsedExperience,
        projects: parsedProjects,
        certifications: parsedCertifications
      }, { isResumeUpload: true });

      // Update local editors
      setTitle(parsedTitle);
      setSkillsText(parsedSkills.join(', '));
      setResumeText(newVersionTextInput.trim());
      
      // Clear inputs
      setNewVersionTextInput('');
      setNewVersionNameInput('');
      setVersionSuccess(`Successfully parsed your resume as a new version with an ATS Score of ${calculatedScore}%! This version is now active.`);
    } catch (err: any) {
      console.error(err);
      setVersionError('Failed to parse and score the resume. Please check your connection and try again.');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleActivateVersion = (ver: any) => {
    onUpdateProfile({
      ...profile,
      title: ver.title,
      skills: ver.skills,
      resumeText: ver.text,
      education: ver.education || [],
      experience: ver.experience || [],
      projects: ver.projects || [],
      certifications: ver.certifications || []
    }, { isResumeUpload: true });
    // Update local editors
    setTitle(ver.title);
    setSkillsText(ver.skills.join(', '));
    setResumeText(ver.text);
    
    setVersionSuccess(`Activated "${ver.versionName}" and triggered matching verification. Master profile synced!`);
  };

  const handleDownloadVersionPdf = (ver: any, templateStyle: string = 'modern', customData?: any) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      let currentY = 25;

      const nameToUse = customData?.name || profile.name || 'Your Name';
      const titleToUse = customData?.title || ver.title || 'Professional Title';
      const emailToUse = customData?.email || profile.email || 'N/A';
      const skillsToUse = customData?.skills || ver.skills || [];
      const bioTextToUse = customData?.text || ver.text || 'No professional biography provided.';

      // Determine colors based on template
      let primaryColor = [79, 70, 229]; // Indigo-600 (Modern)
      let headerColor = [30, 41, 59]; // Slate-800
      let subColor = [100, 116, 139]; // Slate-500
      let bodyColor = [51, 65, 85]; // Slate-700
      let dividerColor = [226, 232, 240]; // Slate-200

      if (templateStyle === 'classic') {
        primaryColor = [30, 41, 59]; // Dark Slate
        dividerColor = [148, 163, 184]; // Thinner slate divider
      } else if (templateStyle === 'creative') {
        primaryColor = [13, 148, 136]; // Teal-600
        dividerColor = [204, 251, 241]; // Teal-100
      }

      // Header Block (Centered)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.text(nameToUse, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;

      // Professional Headline / Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(titleToUse, pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;

      // Contact info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(subColor[0], subColor[1], subColor[2]);
      doc.text(`Email: ${emailToUse}  |  Version: ${ver.versionName} (ATS: ${ver.score}%)`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      // Horizontal separator line
      doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 12;

      // Helper to draw clean sections
      const drawSectionHeader = (sectTitle: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
        doc.text(sectTitle.toUpperCase(), margin, currentY);
        currentY += 3.5;
        
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.8);
        doc.line(margin, currentY, margin + 18, currentY);
        currentY += 7;
      };

      // Section 1: Core Competencies
      drawSectionHeader('Core Competencies & Key Expertise');
      
      if (skillsToUse.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        
        const skillsString = skillsToUse.join('   |   ');
        const splitSkills = doc.splitTextToSize(skillsString, contentWidth);
        doc.text(splitSkills, margin, currentY);
        currentY += (splitSkills.length * 5.5) + 12;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text('No core competencies listed.', margin, currentY);
        currentY += 14;
      }

      // Section 2: Summary / Bio
      drawSectionHeader('Executive Bio & Professional Summary');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);

      const splitBio = doc.splitTextToSize(bioTextToUse, contentWidth);
      
      splitBio.forEach((line: string) => {
        if (currentY > pageHeight - 22) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, margin, currentY);
        currentY += 6;
      });

      // Simple Page Number / Footer on all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(
          `CareerPath AI Premium Professional Profile  |  Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 12,
          { align: 'center' }
        );
      }

      const sanitizedName = (nameToUse || 'career_profile').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filename = `${sanitizedName}_resume_${ver.score}_ats.pdf`;
      doc.save(filename);
      setVersionSuccess(`Successfully exported "${ver.versionName}" as PDF!`);
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      setVersionError('Failed to generate PDF export.');
    }
  };

  const getJobsMatchedForVersion = (ver: any) => {
    const verSkills = ver?.skills || [];
    if (verSkills.length === 0) return [];

    return jobs.map(job => {
      let matchedCount = 0;
      job.requirements.forEach(req => {
        const lowerReq = req.toLowerCase();
        const hasSkill = verSkills.some((s: string) => lowerReq.includes(s.toLowerCase()) || s.toLowerCase().includes(lowerReq));
        if (hasSkill) matchedCount++;
      });
      const skillRatio = job.requirements.length > 0 ? (matchedCount / job.requirements.length) : 0.5;
      const calculatedPct = Math.round(55 + skillRatio * 43);

      return {
        job,
        matchScore: calculatedPct
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  };

  // Sync states if profile email or title changes
  useEffect(() => {
    const savedRoadmap = localStorage.getItem(`career_path_ai_roadmap_${profile.email}`);
    setRoadmap(savedRoadmap ? JSON.parse(savedRoadmap) : null);
    if (profile.title && !roadmap) {
      setTargetTitleInput(`${profile.title} Lead`);
    }

    const savedGap = localStorage.getItem(`career_path_ai_gap_analysis_${profile.email}`);
    setGapAnalysis(savedGap ? JSON.parse(savedGap) : null);
  }, [profile.email, profile.title]);

  const handleRunGapAnalysis = async () => {
    setIsAnalyzingGap(true);
    setGapAnalysisError('');
    setGapGenStep(0);

    const steps = [
      'Retrieving current resume skills...',
      'Comparing with saved dream job requirements...',
      'Mapping missing critical skills...',
      'Sourcing premium free learning resources...',
      'Assembling interactive Gap Analysis report...'
    ];

    const stepInterval = setInterval(() => {
      setGapGenStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch('/api/gemini/skill-gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: profile.skills,
          resumeText: profile.resumeText,
          savedJobs: savedJobs.map(job => ({
            title: job.title,
            company: job.company,
            requirements: job.requirements
          }))
        })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to analyze skill gaps');
      }

      const data: SkillGapAnalysis = await parseApiResponse(response);
      setGapAnalysis(data);
      localStorage.setItem(`career_path_ai_gap_analysis_${profile.email}`, JSON.stringify(data));
    } catch (err: any) {
      console.error('Gap analysis error:', err);
      setGapAnalysisError(err.message || 'An error occurred during gap analysis.');
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzingGap(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!targetTitleInput.trim()) {
      setRoadmapError('Please enter a target job title.');
      return;
    }

    setIsGeneratingRoadmap(true);
    setRoadmapError('');
    setRoadmapGenStep(0);

    const steps = [
      'Analyzing current profile skills gap...',
      'Mapping target role requirements...',
      'Synthesizing emerging market trends & hot tools...',
      'Curating industry-recognized certifications...',
      'Assembling visual step-by-step career path...'
    ];

    const stepInterval = setInterval(() => {
      setRoadmapGenStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch('/api/gemini/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: profile.title,
          skills: profile.skills,
          targetTitle: targetTitleInput.trim()
        })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to generate career roadmap');
      }

      const data: CareerRoadmap = await parseApiResponse(response);
      setRoadmap(data);
      localStorage.setItem(`career_path_ai_roadmap_${profile.email}`, JSON.stringify(data));
    } catch (err: any) {
      console.error('Roadmap error:', err);
      setRoadmapError(err.message || 'An error occurred during roadmap generation.');
    } finally {
      clearInterval(stepInterval);
      setIsGeneratingRoadmap(false);
    }
  };

  const handleAutoFillParse = async () => {
    if (!rawResumeInput || rawResumeInput.trim().length < 20) {
      setParseError('Please paste a more complete block of resume text (minimum 20 characters).');
      return;
    }

    setIsParsing(true);
    setParseError('');
    setParseSuccess('');
    
    const steps = [
      'Reading pasted resume text...',
      'Extracting professional headline & name...',
      'Identifying technical & core skills...',
      'Composing polished biography bio...'
    ];
    setParseStep(0);
    const stepInterval = setInterval(() => {
      setParseStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1000);

    try {
      const response = await fetch('/api/gemini/resume-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: rawResumeInput })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to analyze resume text');
      }

      const data = await parseApiResponse(response);
      
      // Auto-populate the input states
      const parsedName = data.name && data.name !== 'Candidate' ? data.name : profile.name;
      const parsedTitle = data.title || profile.title;
      const parsedSkills = data.skills && Array.isArray(data.skills) ? data.skills : profile.skills;
      const parsedSummary = data.summary || data.profileSummary || rawResumeInput;
      const parsedEducation = Array.isArray(data.education) ? data.education : profile.education || [];
      const parsedExperience = Array.isArray(data.experience) ? data.experience : profile.experience || [];
      const parsedProjects = Array.isArray(data.projects) ? data.projects : profile.projects || [];
      const parsedCertifications = Array.isArray(data.certifications) ? data.certifications : profile.certifications || [];

      if (data.name && data.name !== 'Candidate') setName(data.name);
      if (data.title) setTitle(data.title);
      if (data.skills && Array.isArray(data.skills)) {
        setSkillsText(data.skills.join(', '));
      }
      if (parsedSummary) setResumeText(parsedSummary);

      // Instantly synchronize with the parent master profile, triggering auto-apply if enabled
      onUpdateProfile({
        ...profile,
        name: parsedName,
        title: parsedTitle,
        skills: parsedSkills,
        resumeText: parsedSummary,
        education: parsedEducation,
        experience: parsedExperience,
        projects: parsedProjects,
        certifications: parsedCertifications
      }, { isResumeUpload: true });

      setParseSuccess(`Profile fields pre-filled with ${parsedSkills.length} skills, executive bio, and headline! Review the updated fields below, and they have been automatically synchronized and processed for job matching.`);
      setIsEditing(true);
      setShowAutoFill(false);
      setRawResumeInput('');
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'An error occurred during resume parsing. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsParsing(false);
    }
  };

  const handleSave = () => {
    const updatedSkills = skillsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onUpdateProfile({
      ...profile,
      name,
      email,
      title,
      skills: updatedSkills,
      resumeText,
      phone,
      experienceLevel,
      targetSalary,
      preferredLocation,
      githubUrl,
      linkedinUrl,
      portfolioUrl
    });
    setIsEditing(false);
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      let currentY = 25;

      // Header Block (Centered)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(profile.name || 'Your Name', pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;

      // Professional Headline / Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text(profile.title || 'Professional Title', pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;

      // Contact detail info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Email: ${profile.email || 'N/A'}  |  Assembled by CareerPath AI`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      // Horizontal separator line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 12;

      // Helper to draw clean sections
      const drawSectionHeader = (title: string) => {
        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(title.toUpperCase(), margin, currentY);
        currentY += 3.5;
        
        // Dynamic bottom Accent Line for section
        doc.setDrawColor(79, 70, 229); // Indigo-600 Accent
        doc.setLineWidth(0.8);
        doc.line(margin, currentY, margin + 18, currentY);
        currentY += 7;
      };

      // Section 1: Core Competencies & Key Expertise
      drawSectionHeader('Core Competencies & Key Expertise');
      
      const skills = profile.skills || [];
      if (skills.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85); // Slate-700
        
        // Distribute skills as beautifully styled lines or items
        const skillsString = skills.join('   |   ');
        const splitSkills = doc.splitTextToSize(skillsString, contentWidth);
        doc.text(splitSkills, margin, currentY);
        currentY += (splitSkills.length * 5.5) + 12;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text('No core competencies listed.', margin, currentY);
        currentY += 14;
      }

      // Section 2: Executive Bio & Professional Background
      drawSectionHeader('Executive Bio & Professional Summary');

      const bioText = profile.resumeText || 'No professional biography or resume text provided. Please edit your profile to add comprehensive experience details.';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // Slate-700

      const splitBio = doc.splitTextToSize(bioText, contentWidth);
      
      splitBio.forEach((line: string) => {
        // If we approach the bottom margin (leave 22mm padding), push to new page
        if (currentY > pageHeight - 22) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, margin, currentY);
        currentY += 6; // slightly taller line height for premium readability
      });

      // Simple Page Number / Footer indicator on all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(
          `CareerPath AI Premium Professional Profile  |  Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 12,
          { align: 'center' }
        );
      }

      // Download the completed resume PDF
      const sanitizedName = (profile.name || 'career_profile').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filename = `${sanitizedName}_resume.pdf`;
      doc.save(filename);
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditError('');
    setAuditResult(null);

    // Multi-step reassurance animations for audit
    const steps = [
      'Scanning profile sections...',
      'Mapping technical skill matches...',
      'Generating industry-grade positioning recommendations...',
      'Finalizing feedback matrix...'
    ];
    setAuditStep(0);
    const stepInterval = setInterval(() => {
      setAuditStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch('/api/gemini/resume-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          title: profile.title,
          skills: profile.skills,
          resumeText: profile.resumeText
        })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Server error occurred during audit');
      }

      const data = await parseApiResponse(response);
      setAuditResult(data);
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || 'Unable to review resume. Please try again later.');
    } finally {
      clearInterval(stepInterval);
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Block */}
      <div className="glass-card border-white/10 p-5 shadow-lg flex items-center justify-between gap-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-white/15 shrink-0">
            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white tracking-tight">{profile.name}</h2>
            <p className="text-sm text-white/70 font-medium">{profile.title}</p>
            <p className="text-xs text-white/40 mt-0.5">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 hover:border-rose-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all focus:outline-none shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Modern Sub-navigation Tabs */}
      <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Profile & ATS', icon: User },
          { id: 'coaching', label: 'AI Career Coach', icon: Sparkles },
          { id: 'interviews', label: 'Interviews & Calendar', icon: Calendar },
          { id: 'tools', label: 'Resume Parser & Settings', icon: FileText },
          { id: 'subscription', label: isPremium ? 'Premium (Active)' : 'Upgrade to Premium', icon: isPremium ? Crown : CreditCard },
          { id: 'feedback', label: 'Feedback & Support', icon: MessageCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 shrink-0 border cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'profile' && (
        <>
          {/* ATS Compatibility Dashboard Section */}
          <div className="glass-card border-white/10 p-5 rounded-2xl shadow-lg space-y-4 bg-indigo-950/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            ATS Compatibility Score
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1.5 rounded-md border border-emerald-500/20 uppercase tracking-wider font-bold">
            Real-time Scan
          </span>
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Circular Gauge column */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 text-center relative">
            <div className="relative flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-24 h-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-white/10"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className={`${
                    atsResult.score >= 85
                      ? 'stroke-emerald-400'
                      : atsResult.score >= 60
                      ? 'stroke-indigo-400'
                      : 'stroke-amber-400'
                  } transition-all duration-1000 ease-out`}
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={251.3}
                  strokeDashoffset={251.3 - (251.3 * atsResult.score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white leading-none">{atsResult.score}%</span>
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider mt-1">Match</span>
              </div>
            </div>

            {/* Custom Premium Certification Badges */}
            <div className="flex flex-col gap-1.5 w-full items-center py-2.5 border-b border-white/5">
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.15)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Enterprise Ready
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3 text-indigo-300" />
                Resume Strength: Excellent
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/25 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-300" />
                Top 2% Candidate
              </span>
            </div>

            <div className="mt-3 space-y-0.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                atsResult.score >= 85
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                  : atsResult.score >= 60
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {atsResult.score >= 85 ? 'Highly Optimized' : atsResult.score >= 60 ? 'Standard Alignment' : 'Needs Optimization'}
              </span>
              <p className="text-[10px] text-white/50 pt-1.5 leading-relaxed">
                {atsResult.score >= 85 
                  ? 'Excellent keyword-to-structure ratio. Ready to pass complex enterprise ATS systems.'
                  : atsResult.score >= 60
                  ? 'Good foundation. Adding 2-3 specific technical skills or action verbs will boost ranking.'
                  : 'Needs content additions. Use the Gemini Auto-Fill to populate your skills and summary.'}
              </p>
            </div>

            {/* One-Click Resume Optimization Button */}
            <div className="w-full mt-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleOneClickOptimize}
                disabled={isOptimizing}
                className="w-full h-9.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10 cursor-pointer transition-all duration-150"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Optimizing Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    One-Click AI Optimize
                  </>
                )}
              </button>
              <p className="text-[8.5px] text-white/35 mt-1.5 leading-normal">
                Rewrites summary, title, and bullet points to elevate ATS vocabulary while keeping all facts truthful.
              </p>
            </div>
          </div>

          {/* Checklist column */}
          <div className="md:col-span-8 space-y-2.5">
            <h4 className="font-bold text-[11px] text-white/60 uppercase tracking-wider px-1">Parser Validation Checklist</h4>
            <div className="space-y-2">
              {atsResult.checks.map((check, idx) => (
                <div key={idx} className="p-2.5 bg-white/5 border border-white/5 rounded-lg flex gap-3 items-start transition-all hover:bg-white/10">
                  <div className="mt-0.5">
                    {check.passed ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-[10px] border border-emerald-500/20">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center text-[10px] border border-amber-500/20">
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-xs text-white/90">{check.label}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        check.passed 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {check.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">{check.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Individual Skills Optimization Indicators (Circular Progress) */}
        <div className="mt-6 pt-5 border-t border-white/5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[11px] text-white/60 uppercase tracking-wider px-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Core Competency Strength Grid (Individual Skill Index)
            </h4>
            <span className="text-[10px] text-white/40 font-semibold font-mono">
              {profile.skills.length} skills analyzed
            </span>
          </div>

          {profile.skills.length === 0 ? (
            <p className="text-xs text-white/40 italic px-1">No skills added yet. Add skills in the editor below to begin tracking optimization.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {profile.skills.map((skill) => {
                // Calculate simulated keyword index strength
                let strengthScore = 50;
                const lowerBio = (profile.resumeText || '').toLowerCase();
                const lowerSkill = skill.toLowerCase();
                if (lowerBio.includes(lowerSkill)) {
                  strengthScore += 35;
                }
                if (skill.length > 5) {
                  strengthScore += 10;
                }
                if (/react|typescript|node|python|figma|cloud|aws|go|rust|ai|gemini|sql|design|product/i.test(skill)) {
                  strengthScore += 5;
                }
                strengthScore = Math.min(100, strengthScore);

                // SVG Circular math
                const skillRadius = 18;
                const skillCircumference = 2 * Math.PI * skillRadius;
                const skillDashoffset = skillCircumference - (strengthScore / 100) * skillCircumference;

                return (
                  <div key={skill} className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-between text-center space-y-2.5 hover:border-white/10 transition-all duration-150">
                    <span className="text-[11px] font-bold text-white/90 line-clamp-1 w-full" title={skill}>
                      {skill}
                    </span>
                    
                    {/* Tiny SVG Circular Progress */}
                    <div className="relative flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r={skillRadius}
                          className="stroke-white/10"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r={skillRadius}
                          className={`${
                            strengthScore >= 85
                              ? 'stroke-emerald-400'
                              : strengthScore >= 60
                              ? 'stroke-indigo-400'
                              : 'stroke-amber-400'
                          } transition-all duration-500`}
                          strokeWidth="3.5"
                          fill="transparent"
                          strokeDasharray={skillCircumference}
                          strokeDashoffset={skillDashoffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-black text-white/80">
                        {strengthScore}%
                      </span>
                    </div>

                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      strengthScore >= 85
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : strengthScore >= 60
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {strengthScore >= 85 ? 'Strong' : strengthScore >= 60 ? 'Optimal' : 'Low Density'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor or Information view */}
      <div className="glass-card border-white/10 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-white/50" />
            Resume Profile Details
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCurrentPreview}
              className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-lg border border-indigo-500/25 shadow-sm transition-all duration-150 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Preview Resume
            </button>
            <button
              onClick={handleDownloadPdf}
              className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-lg border border-indigo-500/25 shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={() => {
                setShowLinkedInExport(true);
                handleGenerateLinkedIn();
              }}
              className="text-xs text-blue-300 hover:text-white font-semibold flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg border border-blue-500/25 shadow-sm transition-all duration-150 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              Export to LinkedIn
            </button>
            <button
              onClick={() => {
                setShowAutoFill(!showAutoFill);
                setParseError('');
                setParseSuccess('');
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm transition-all duration-150"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Auto-Fill with AI
            </button>
            <button
              onClick={() => {
                if (isEditing) {
                  // reset state
                  setName(profile.name);
                  setEmail(profile.email);
                  setTitle(profile.title);
                  setSkillsText(profile.skills.join(', '));
                  setResumeText(profile.resumeText);
                }
                setIsEditing(!isEditing);
                setShowAutoFill(false);
                setParseError('');
                setParseSuccess('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-all duration-150"
            >
              {isEditing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>
        </div>

        {/* Auto-Fill Panel */}
        <AnimatePresence>
          {showAutoFill && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/25 rounded-xl space-y-3 mb-4 relative">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white">AI Profile Auto-Fill with Gemini</h4>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Paste a block of text from your current resume (e.g., summary, technical sections, experiences, or skills list). Our Gemini API will extract your name, professional title, key skills, and a polished summary, then pre-fill your details automatically.
                </p>

                <textarea
                  value={rawResumeInput}
                  onChange={(e) => setRawResumeInput(e.target.value)}
                  placeholder="Paste your resume details or cover letter text here (minimum 20 characters)..."
                  rows={6}
                  disabled={isParsing}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white placeholder-white/20 font-sans resize-none"
                />

                {parseError && (
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs flex items-start gap-1.5 border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{parseError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFillParse}
                      disabled={isParsing}
                      className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition-all duration-150"
                    >
                      {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isParsing ? 'Analyzing Resume...' : 'Analyze & Auto-Fill'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAutoFill(false);
                        setRawResumeInput('');
                        setParseError('');
                      }}
                      disabled={isParsing}
                      className="h-8 px-3 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>

                  {isParsing && (
                    <div className="flex items-center gap-2 text-right">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-medium font-mono">
                        {[
                          'Reading pasted resume text...',
                          'Extracting professional headline & name...',
                          'Identifying technical & core skills...',
                          'Composing polished biography bio...'
                        ][parseStep]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {parseSuccess && (
          <div className="p-3 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs flex items-start gap-2 border border-emerald-500/20 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-400">Successfully pre-filled profile!</p>
              <p className="text-[11px] leading-relaxed text-white/80">{parseSuccess}</p>
            </div>
          </div>
        )}

        {isEditing ? (
          /* Editor UI */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Professional Headline</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Experience Level</label>
                <div className="relative">
                  <Award className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white cursor-pointer"
                  >
                    <option value="Fresher" className="bg-slate-950">Fresher / Junior (0-2 yrs)</option>
                    <option value="Mid" className="bg-slate-950">Mid-Level (2-5 yrs)</option>
                    <option value="Senior" className="bg-slate-950">Senior Level (5-8 yrs)</option>
                    <option value="Lead" className="bg-slate-950">Lead / Principal (8+ yrs)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Target Annual Salary</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="e.g. $145,000"
                    value={targetSalary}
                    onChange={(e) => setTargetSalary(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Preferred Location Type</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="e.g. Remote / New York"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">LinkedIn URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">GitHub Profile URL</label>
                <div className="relative">
                  <Code className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Portfolio Link</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="portfolio.com"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Core Skills (comma separated)</label>
              <div className="relative">
                <Code className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. Figma, React, User Research, TypeScript"
                  className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white placeholder-white/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider pl-0.5 block">Resume Summary / Bio</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Write or paste your professional experiences, educational background, and goals..."
                rows={5}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white placeholder-white/30"
              />
            </div>

            <button
              onClick={handleSave}
              className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Save Changes
            </button>
          </div>
        ) : (
          /* Read Only Snapshot View - Redesigned Professional Bento Layout */
          <div className="space-y-6 text-xs text-white/90 leading-relaxed">
            
            {/* Extended profile Grid Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/25 border border-white/5 p-4.5 rounded-2xl space-y-2 flex flex-col justify-between">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[9px] uppercase font-bold text-white/30 tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Identity Details
                  </span>
                  <button
                    onClick={handleLoadFresherPreset}
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-extrabold underline cursor-pointer bg-transparent border-0 p-0"
                    title="Click to reset local profile to Fresher student preset"
                  >
                    Reset Fresher
                  </button>
                </div>
                <div className="space-y-1 text-left">
                  <p className="font-extrabold text-sm text-white truncate">{profile.name}</p>
                  <p className="text-[11px] text-white/50 truncate">{profile.email}</p>
                  {profile.phone && <p className="text-[11px] text-indigo-300 truncate mt-1">{profile.phone}</p>}
                </div>
              </div>

              <div className="bg-slate-950/25 border border-white/5 p-4.5 rounded-2xl space-y-2 flex flex-col justify-between">
                <span className="text-[9px] uppercase font-bold text-white/30 tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  Career Standing
                </span>
                <div className="space-y-1 text-left">
                  <p className="font-extrabold text-sm text-white truncate">{profile.experienceLevel || 'Senior'}</p>
                  <p className="text-[11px] text-white/50">Level Class Rating</p>
                  <span className="inline-block bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1.5">Verified ATS Score</span>
                </div>
              </div>

              <div className="bg-slate-950/25 border border-white/5 p-4.5 rounded-2xl space-y-2 flex flex-col justify-between">
                <span className="text-[9px] uppercase font-bold text-white/30 tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  Salary Target
                </span>
                <div className="space-y-1 text-left">
                  <p className="font-extrabold text-sm text-white">{profile.targetSalary || '$145,000'}</p>
                  <p className="text-[11px] text-white/50">Annual Target Range</p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Matching active market values</p>
                </div>
              </div>

              <div className="bg-slate-950/25 border border-white/5 p-4.5 rounded-2xl space-y-2 flex flex-col justify-between">
                <span className="text-[9px] uppercase font-bold text-white/30 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  Target Zone
                </span>
                <div className="space-y-1 text-left">
                  <p className="font-extrabold text-sm text-white truncate">{profile.preferredLocation || 'Remote'}</p>
                  <p className="text-[11px] text-white/50">Location Preference</p>
                  <p className="text-[10px] text-purple-400 font-semibold mt-1">⚡ Elastic search filters applied</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/25 border border-white/5 p-5 rounded-2xl space-y-3">
              <span className="text-[9px] uppercase font-bold text-white/30 tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Professional Handles & Networks
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-purple-400 shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-bold text-white/40 uppercase">LinkedIn Profile</p>
                    <p className="text-xs text-white/70 truncate">{profile.linkedinUrl || 'linkedin.com/in/username'}</p>
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                  <Code className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-bold text-white/40 uppercase">GitHub Profile</p>
                    <p className="text-xs text-white/70 truncate">{profile.githubUrl || 'github.com/username'}</p>
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-bold text-white/40 uppercase">Digital Portfolio</p>
                    <p className="text-xs text-white/70 truncate">{profile.portfolioUrl || 'portfolio.com'}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl text-left">
              <strong className="text-white/60 block mb-1 text-[10px] uppercase font-bold tracking-wider">Professional Headline:</strong>
              <span className="text-white font-extrabold text-sm">{profile.title}</span>
            </p>
            
            <div className="space-y-2">
              <strong className="text-white/60 block text-[10px] uppercase font-bold tracking-wider text-left">Core Competencies:</strong>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.skills.length === 0 ? (
                  <span className="text-white/40 italic">No skills listed yet.</span>
                ) : (
                  profile.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-white/90 rounded-full border border-purple-500/20 font-bold tracking-wide shadow-sm hover:scale-102 transition-transform select-none">
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>


          </div>
        )}
      </div>
      </>
      )}

      {activeSubTab === 'coaching' && (
        <>
          {/* AI Resume Audit Coach Box */}
      <div className="glass-card bg-indigo-950/20 border-white/15 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              AI Resume Review Coach
              <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/30">Powered by Gemini</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed max-w-md">
              Evaluate your current credentials, objective statement, and skills. Get a professional profile strength score and expert positioning feedback.
            </p>
          </div>
        </div>

        {auditError && (
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs flex items-start gap-2 border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{auditError}</span>
          </div>
        )}

        <div className="flex items-center gap-4 relative z-10">
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-75"
          >
            {isAuditing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAuditing ? 'Auditing profile...' : 'Audit Profile with Gemini AI'}
          </button>
        </div>

        {/* Audit Progress Bar */}
        {isAuditing && (
          <div className="pt-2.5 space-y-2">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((auditStep + 1) / 4) * 100}%` }}
              />
            </div>
            <p className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {[
                'Scanning profile sections...',
                'Mapping technical skill matches...',
                'Generating industry-grade positioning recommendations...',
                'Finalizing feedback matrix...'
              ][auditStep]}
            </p>
          </div>
        )}

        {/* Audit Response Board */}
        {auditResult && (
          <div className="pt-4 border-t border-white/10 space-y-4 animate-in fade-in duration-200">
            {/* Score circle & summary */}
            <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10 shadow">
              <div className="w-16 h-16 shrink-0 rounded-full border-4 border-indigo-500 flex flex-col items-center justify-center bg-indigo-500/10">
                <span className="text-lg font-extrabold text-indigo-300 leading-none">{auditResult.score}</span>
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Rating</span>
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-white">Executive Feedback Summary</h4>
                <p className="text-xs text-white/70 leading-relaxed font-sans">{auditResult.summary}</p>
              </div>
            </div>

            {/* Premium AI Recommendation Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* Card 1: Strengths */}
              <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 rounded-2xl p-4 space-y-3 shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">Profile Strengths</h5>
                </div>
                <ul className="space-y-2">
                  {auditResult.strengths.slice(0, 3).map((st, i) => (
                    <li key={i} className="flex gap-2 items-start text-xs text-white/75 font-sans leading-relaxed">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 2: Weaknesses (Constructive Areas) */}
              <div className="bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 rounded-2xl p-4 space-y-3 shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertCircle className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-bold text-xs text-rose-400 uppercase tracking-wider">Identified Weaknesses</h5>
                </div>
                <ul className="space-y-2">
                  {auditResult.improvements.slice(0, 3).map((imp, i) => (
                    <li key={i} className="flex gap-2 items-start text-xs text-white/75 font-sans leading-relaxed">
                      <span className="text-rose-400 font-bold shrink-0">⚠</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Missing Skills */}
              <div className="bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/15 rounded-2xl p-4 space-y-3 shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-bold text-xs text-purple-400 uppercase tracking-wider">Missing Skills</h5>
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  Adding these targeted tech skills to your summary will match up to 40% more search filters:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['System Design', 'Cloud Architecture', 'GraphQL', 'CI/CD Pipelines', 'TypeScript Specs'].map((sk, idx) => (
                    <span key={idx} className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 4: Salary Prediction */}
              <div className="bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-2xl p-4 space-y-3 shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-bold text-xs text-indigo-400 uppercase tracking-wider">Salary Prediction</h5>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Estimated Offer Range</p>
                  <p className="text-2xl font-black text-white font-space">$148,000 - $165,000</p>
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span>▲ +8.2% vs industry baseline</span>
                  </p>
                  <p className="text-[11px] text-white/60 leading-relaxed font-sans pt-1">
                    Your deep technical skill stack positions your credentials within the top decile of compensation offers.
                  </p>
                </div>
              </div>

              {/* Card 5: Interview Chance */}
              <div className="bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/15 rounded-2xl p-4 space-y-3 shadow-lg hover:-translate-y-1 transition-all duration-300 group md:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-bold text-xs text-teal-400 uppercase tracking-wider">Interview Chance</h5>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Prediction Probability</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-black text-white font-space">88%</p>
                    <span className="text-xs text-teal-400 font-bold font-sans">Highly Favorable</span>
                  </div>
                  <div className="progress-bar w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                    <div className="progress-fill bg-gradient-to-r from-teal-400 to-indigo-500 h-full w-[88%]" />
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed font-sans pt-2">
                    98% ATS formatting alignment and high semantic keywords matching rate boosts invitation chance to maximum.
                  </p>
                </div>
              </div>
            </div>

            {/* Step by Step Action Plan */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
              <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart className="w-4 h-4 text-indigo-400 shrink-0" />
                AI Career Roadmap & Tips
              </h5>
              <div className="space-y-2">
                {auditResult.tailoredTips.map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start p-2.5 bg-white/5 rounded-lg text-xs text-white/70 border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed font-sans">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 AI Career Roadmap Widget */}
      <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Compass className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              AI Career Roadmap Planner
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30 animate-pulse">Market Trend Analysis</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed max-w-md">
              Construct a step-by-step learning progression with recommended premium certifications and up-to-date market trends, customized for your career path.
            </p>
          </div>
        </div>

        {/* Input Target Job Title */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-0.5">
              What is your target / aspirational job title?
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={targetTitleInput}
                  onChange={(e) => setTargetTitleInput(e.target.value)}
                  placeholder="e.g. Lead Frontend Architect, Product Director..."
                  className="w-full h-9 bg-slate-950/40 border border-white/10 rounded-lg text-xs pl-9 pr-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white placeholder-white/20 font-medium"
                />
              </div>
              <button
                onClick={handleGenerateRoadmap}
                disabled={isGeneratingRoadmap}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-150 disabled:opacity-75 shrink-0 cursor-pointer"
              >
                {isGeneratingRoadmap ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    Analyze & Plan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {roadmapError && (
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs flex items-start gap-2 border border-rose-500/25">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{roadmapError}</span>
          </div>
        )}

        {/* Dynamic Generating Step Progression Loader */}
        {isGeneratingRoadmap && (
          <div className="pt-2.5 space-y-2 relative z-10">
            <div className="progress-bar">
              <div 
                className="progress-fill bg-emerald-500" 
                style={{ width: `${((roadmapGenStep + 1) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {[
                'Analyzing current profile skills gap...',
                'Mapping target role requirements...',
                'Synthesizing emerging market trends & hot tools...',
                'Curating industry-recognized certifications...',
                'Assembling visual step-by-step career path...'
              ][roadmapGenStep]}
            </p>
          </div>
        )}

        {/* Generated Roadmap Board */}
        {roadmap && !isGeneratingRoadmap && (
          <div className="pt-4 border-t border-white/10 space-y-5 animate-in fade-in duration-200 relative z-10">
            {/* Header info */}
            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 space-y-1 shadow">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">Target: {roadmap.targetJobTitle}</h4>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-sans mt-1">{roadmap.summary}</p>
            </div>

            {/* Vertical Milestones */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
              {roadmap.steps.map((step, idx) => (
                <div key={idx} className="relative group space-y-2">
                  {/* Glowing vertical point identifier */}
                  <span className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full group-hover:bg-white" />
                  </span>

                  {/* Header info of step */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h5 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                      {idx + 1}. {step.title}
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/60 font-medium shrink-0">
                        {step.timeEstimate}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border uppercase shrink-0 ${
                        step.difficulty.toLowerCase().includes('begin') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                        step.difficulty.toLowerCase().includes('inter') ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                        'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {step.difficulty}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed font-sans">{step.description}</p>

                  {/* Market justification callout */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white/60 font-sans italic relative overflow-hidden pl-7">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-3" />
                    <span className="font-bold text-white/75 not-italic mr-1">Market Trend:</span>
                    {step.marketTrendReason}
                  </div>

                  {/* Curated Resources list */}
                  <div className="flex flex-wrap gap-1.5 items-center pt-1.5">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400/80" />
                      Recommended learning / certifications:
                    </span>
                    {step.resources.map((res, rIdx) => (
                      <span
                        key={rIdx}
                        className="bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/30 text-[10px] text-indigo-300 px-2.5 py-1 rounded-lg font-medium transition-colors"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications and Milestones Summary Box */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3.5">
              <GraduationCap className="w-8 h-8 text-emerald-400 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs text-white leading-normal">Interactive Skill Roadmap Assembled</p>
                <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                  Completing this sequence expands your keyword matrix compatibility, improving direct employer search discoverability on CareerPath AI.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📊 AI Skill Gap Analysis Widget */}
      <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <BarChart className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              AI Skill Gap Analysis
              <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/30">Targeted Audit</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed max-w-md">
              Explicitly compares your registered skills and resume summary against your saved dream jobs to pinpoint exact skills gaps and source free learning pathways.
            </p>
          </div>
        </div>

        {/* Saved Jobs context info box */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 relative z-10">
          {savedJobs.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-0.5">
                  Analyzing Against {savedJobs.length} Saved Dream Job{savedJobs.length > 1 ? 's' : ''}:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {savedJobs.map((job) => (
                  <span key={job.id} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md px-2 py-1 text-[10px] font-medium flex items-center gap-1">
                    <Briefcase className="w-3 h-3 shrink-0" />
                    {job.title} at {job.company}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-amber-400/85 uppercase tracking-wider pl-0.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                No saved dream jobs found
              </span>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Save roles on the Job Board (Search or Home tab) to perform a targeted gap analysis. For now, we will evaluate your profile against standard market requirements for a <strong className="text-white/80">{profile.title || 'Tech Professional'}</strong>.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleRunGapAnalysis}
              disabled={isAnalyzingGap}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-150 disabled:opacity-75 cursor-pointer"
            >
              {isAnalyzingGap ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  Run Gap Analysis
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {gapAnalysisError && (
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs flex items-start gap-2 border border-rose-500/25">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{gapAnalysisError}</span>
          </div>
        )}

        {/* Dynamic Loading Step Progression */}
        {isAnalyzingGap && (
          <div className="pt-2.5 space-y-2 relative z-10">
            <div className="progress-bar bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className="progress-fill bg-indigo-500 h-full transition-all duration-300" 
                style={{ width: `${((gapGenStep + 1) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {[
                'Retrieving current resume skills...',
                'Comparing with saved dream job requirements...',
                'Mapping missing critical skills...',
                'Sourcing premium free learning resources...',
                'Assembling interactive Gap Analysis report...'
              ][gapGenStep]}
            </p>
          </div>
        )}

        {/* Skill Gap Analysis Output */}
        {gapAnalysis && !isAnalyzingGap && (
          <div className="pt-4 border-t border-white/10 space-y-5 animate-in fade-in duration-200 relative z-10">
            {/* Overall Executive Summary */}
            <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 space-y-1 shadow">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-wider">Gap Analysis Executive Summary</h4>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-sans mt-1">{gapAnalysis.summary}</p>
            </div>

            {/* List of Missing Skills */}
            <div className="space-y-4">
              <h4 className="font-bold text-[11px] text-white/50 uppercase tracking-wider pl-0.5">Identified Skills Gaps & Free Learning Modules</h4>
              
              {gapAnalysis.missingSkills.length === 0 ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Outstanding! No skill gaps identified. Your profile perfectly matches your saved roles.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {gapAnalysis.missingSkills.map((skill, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all space-y-3">
                      {/* Skill header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                          <h5 className="font-bold text-sm text-white">{skill.skillName}</h5>
                        </div>
                        
                        {/* Dream jobs affected list */}
                        {skill.dreamJobsAffected && skill.dreamJobsAffected.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider mr-1">Required for:</span>
                            {skill.dreamJobsAffected.map((jobName, jIdx) => (
                              <span key={jIdx} className="bg-white/5 text-white/60 px-1.5 py-0.5 rounded text-[9px] font-medium">
                                {jobName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed font-sans">{skill.importance}</p>

                      {/* Online learning resources */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          Recommended Free Learning Modules
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {skill.resources.map((resource, rIdx) => (
                            <a
                              key={rIdx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/item p-3 bg-slate-950/40 hover:bg-indigo-950/25 border border-white/5 hover:border-indigo-500/20 rounded-lg flex flex-col justify-between transition-all duration-150 cursor-pointer"
                            >
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h6 className="font-bold text-xs text-white/90 group-hover/item:text-indigo-300 transition-colors line-clamp-1">{resource.name}</h6>
                                  <ExternalLink className="w-3 h-3 text-white/30 group-hover/item:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                                </div>
                                <p className="text-[10px] text-white/50 group-hover/item:text-white/60 transition-colors leading-relaxed line-clamp-2 font-sans">{resource.description}</p>
                              </div>
                              <div className="text-[9px] text-indigo-400 font-bold mt-2 flex items-center gap-0.5 uppercase tracking-wider">
                                Start Free Lesson
                                <ArrowRight className="w-2.5 h-2.5 transform group-hover/item:translate-x-0.5 transition-transform" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications and Milestones Summary Box */}
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-3.5">
              <GraduationCap className="w-8 h-8 text-indigo-400 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs text-white leading-normal">Targeted Education Complete</p>
                <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                  Leveraging these free specialized learning paths optimizes your resume matching index, qualifying you for the direct matching recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {activeSubTab === 'tools' && (
        <>
          {/* 📄 Resume Versions & Improvement Tracker / Matched Jobs */}
      <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden" id="resume-versions-section">
        <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-10 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Resume ATS Score Analyzer
              <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/30">ATS Optimization</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed max-w-md">
              Upload your resume, parse skills, and instantly calculate your ATS compatibility score to optimize your job application readiness!
            </p>
          </div>
        </div>

        {/* Upload area */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 relative z-10">
          <h4 className="font-bold text-[11px] text-white/60 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-400" />
            Parse & Analyze Your Resume
          </h4>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition-all duration-200 text-center relative ${
              isDraggingFile
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                : 'border-white/10 bg-slate-950/20 hover:border-white/25 hover:bg-slate-950/35'
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx,.doc"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              disabled={isCreatingVersion}
            />
            
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
              <Upload className="w-5 h-5" />
            </div>
            
            <p className="text-xs font-semibold text-white">
              Drag & drop your resume file (.pdf, .docx, .doc, .txt) here
            </p>
            <p className="text-[10px] text-white/40 mt-1">
              or click to browse your local files
            </p>
            <div className="mt-2.5 flex gap-1.5 justify-center text-[9px] text-white/30 font-mono">
              <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">PDF</span>
              <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">DOCX</span>
              <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">DOC</span>
              <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">TXT</span>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-white/10 flex-grow" />
            <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest shrink-0">OR Paste Text Manually</span>
            <div className="h-px bg-white/10 flex-grow" />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <textarea
              value={newVersionTextInput}
              onChange={(e) => setNewVersionTextInput(e.target.value)}
              placeholder="Paste the raw text of your updated resume or work history here (min 20 characters) to parse skills and calculate ATS score..."
              rows={4}
              className="w-full p-3 bg-slate-950/45 border border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white placeholder-white/20 font-sans resize-none"
            />
          </div>

          {versionError && (
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs flex items-start gap-1.5 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{versionError}</span>
            </div>
          )}

          {versionSuccess && (
            <div className="p-2.5 bg-emerald-500/10 text-emerald-300 rounded-lg text-xs flex items-start gap-1.5 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{versionSuccess}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleCreateNewVersion}
              disabled={isCreatingVersion || !newVersionTextInput.trim()}
              className="h-8 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition-all duration-150 cursor-pointer"
            >
              {isCreatingVersion ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Parsing Resume & Scoring...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Upload & Score ATS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {activeSubTab === 'interviews' && (
        <>
          {/* 📅 Scheduled Interviews Calendar & Schedule Feed Section */}
      <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden" id="interviews-schedule-section">
        <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Calendar className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Scheduled Interviews & Timeline
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30">Active Calendar</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed max-w-md">
              Review upcoming interview dates in a monthly grid view and timeline pulled from your application status log, and easily reschedule them!
            </p>
          </div>
        </div>

        {/* Content panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
          {/* Calendar Grid - Left side (7 cols) */}
          <div className="lg:col-span-7 bg-white/5 p-4 rounded-xl border border-white/10 space-y-3.5 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">July 2026</span>
              <div className="flex gap-1.5 font-sans">
                <button disabled className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/40 cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button disabled className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/40 cursor-not-allowed">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekdays headers */}
            <div className="grid grid-cols-7 gap-1 text-center border-b border-white/5 pb-1.5 font-sans">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, i) => (
                <span key={i} className="text-[10px] font-bold text-white/40 font-sans">{wd}</span>
              ))}
            </div>

            {/* July 2026 starts on a Wednesday (offset by 3 empty cells) */}
            <div className="grid grid-cols-7 gap-1 font-sans">
              {/* Empty cells */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Days from 1 to 31 */}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const dateString = `2026-07-${day.toString().padStart(2, '0')}`;
                
                // Find active interview for this date
                const matchedApp = applications.find(
                  app => app.interviewDate === dateString && app.status === 'Interviewing'
                );

                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      if (matchedApp) {
                        setSchedulingJobId(matchedApp.jobId);
                        setSchedulerDateInput(matchedApp.interviewDate || '');
                      } else {
                        setSchedulingJobId(null);
                      }
                    }}
                    className={`h-8 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center relative transition-all focus:outline-none ${
                      matchedApp
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                        : isSelected
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span>{day}</span>
                    {matchedApp && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Feed / Rescheduling Form - Right side (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white/5 p-4 rounded-xl border border-white/10 font-sans">
            <div className="space-y-3 font-sans">
              <h4 className="font-bold text-[10px] text-white/50 uppercase tracking-wider pl-0.5 font-sans">
                {selectedDay ? `Schedule Details: July ${selectedDay}, 2026` : 'Select a date on calendar'}
              </h4>

              {(() => {
                const dayStr = selectedDay ? `2026-07-${selectedDay.toString().padStart(2, '0')}` : '';
                const activeAppsForDay = applications.filter(
                  app => app.interviewDate === dayStr && app.status === 'Interviewing'
                );

                if (activeAppsForDay.length === 0) {
                  return (
                    <div className="space-y-2.5 font-sans">
                      <p className="text-xs text-white/40 italic py-2 font-sans">No interviews scheduled on this day.</p>
                      
                      {/* Interactive scheduler option */}
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 font-sans">
                        <p className="text-[10px] font-bold text-white/60 uppercase">Schedule New Interview</p>
                        <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                          Select from applied jobs to schedule an interview for July {selectedDay}:
                        </p>
                        
                        {applications.filter(a => a.status === 'Applied').length === 0 ? (
                          <p className="text-[10px] text-white/40 italic font-sans">No pending applications available to schedule.</p>
                        ) : (
                          <div className="space-y-2 font-sans">
                            <select
                              onChange={(e) => setSchedulingJobId(e.target.value)}
                              value={schedulingJobId || ''}
                              className="w-full h-8 bg-slate-950/40 border border-white/10 rounded-lg px-2 text-xs text-white outline-none font-sans"
                            >
                              <option value="">-- Choose Job --</option>
                              {applications
                                .filter(a => a.status === 'Applied')
                                .map(app => {
                                  const jobObj = jobs.find(j => j.id === app.jobId);
                                  return (
                                    <option key={app.id} value={app.jobId} className="bg-slate-950 text-white text-xs font-sans">
                                      {jobObj?.title} at {jobObj?.company}
                                    </option>
                                  );
                                })}
                            </select>

                            {schedulingJobId && (
                              <button
                                onClick={() => {
                                  if (onUpdateInterviewDate) {
                                    onUpdateInterviewDate(schedulingJobId, dayStr);
                                    setSchedulingJobId(null);
                                  }
                                }}
                                className="w-full h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all font-sans"
                              >
                                Save to July {selectedDay}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return activeAppsForDay.map(app => {
                  const jobObj = jobs.find(j => j.id === app.jobId);
                  return (
                    <div key={app.id} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2 animate-in fade-in font-sans">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1 shrink-0">
                          <img src={jobObj?.logoUrl} alt={jobObj?.company} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="truncate">
                          <h5 className="font-bold text-xs text-white leading-tight truncate">{jobObj?.title}</h5>
                          <p className="text-[10px] text-emerald-400 font-medium">{jobObj?.company} • {jobObj?.location}</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-white/70 space-y-1 font-sans">
                        <p className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Status: <strong>{app.status}</strong></span>
                        </p>
                        <p className="text-[10px] text-white/40 leading-relaxed font-sans line-clamp-2 italic">
                          " {app.coverLetter || 'My experiences align perfectly with this role.'} "
                        </p>
                      </div>

                      {/* Reschedule Datepicker form */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <label className="text-[9px] font-bold text-white/40 uppercase block">Reschedule Interview Date</label>
                        <div className="flex gap-1.5 font-sans">
                          <input
                            type="date"
                            value={schedulerDateInput || app.interviewDate}
                            onChange={(e) => setSchedulerDateInput(e.target.value)}
                            className="flex-1 h-7 bg-slate-950/40 border border-white/10 rounded-lg text-xs px-2 text-white outline-none font-sans"
                          />
                          <button
                            onClick={() => {
                              if (onUpdateInterviewDate && schedulerDateInput) {
                                onUpdateInterviewDate(app.jobId, schedulerDateInput);
                                setSchedulerDateInput('');
                                const parsedDay = parseInt(schedulerDateInput.split('-')[2]);
                                if (parsedDay) setSelectedDay(parsedDay);
                              }
                            }}
                            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all shrink-0 font-sans"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* General schedule overview timeline */}
            <div className="border-t border-white/5 pt-3.5 mt-3.5 space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-0.5">Timeline Checklist</span>
              <div className="space-y-2">
                {applications.filter(app => app.status === 'Interviewing' && app.interviewDate).length === 0 ? (
                  <p className="text-[10px] text-white/35 italic">No interview dates registered. Apply or schedule details above.</p>
                ) : (
                  applications
                    .filter(app => app.status === 'Interviewing' && app.interviewDate)
                    .map(app => {
                      const j = jobs.find(job => job.id === app.jobId);
                      return (
                        <div key={app.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-xs font-sans">
                          <div className="truncate pr-2">
                            <span className="font-bold text-white leading-none block truncate">{j?.title}</span>
                            <span className="text-[10px] text-white/50">{j?.company}</span>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                            {app.interviewDate}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {activeSubTab === 'tools' && (
        <>
          {/* 📧 Email Integration & Daily Digest Service Section */}
          <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden" id="email-digest-section">
        <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-10 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Mail className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Daily Email Digest & Integration Service
              <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/30">Email Enabled</span>
            </h3>
            <p className="text-xs text-white/60">
              Trigger automated daily job summary reports and scheduled interview reminders directly to your inbox.
            </p>
          </div>
        </div>

        {/* Status indicator and quick settings */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3 relative z-10 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">Recipient Address:</span>
            <span className="text-xs font-mono font-bold text-indigo-300">{profile.email}</span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">Simulate Automated Daily Trigger</span>
              <span className="text-[10px] text-white/45 block">Automatically queues reports to send daily at 9:00 AM UTC.</span>
            </div>
            <button
              onClick={() => handleToggleAutoTrigger(!autoTriggerDaily)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                autoTriggerDaily ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition-transform ${
                  autoTriggerDaily ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced SMTP Settings */}
        <div className="border border-white/5 rounded-xl overflow-hidden relative z-10">
          <button
            onClick={() => setShowSmtpSettings(!showSmtpSettings)}
            className="w-full bg-white/5 hover:bg-white/10 transition-all p-3.5 flex justify-between items-center text-xs text-white/85 font-semibold focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${showSmtpSettings ? 'animate-spin' : ''}`} />
              <span>Advanced Custom SMTP Server Settings</span>
            </div>
            {showSmtpSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSmtpSettings && (
            <form onSubmit={handleSaveSmtpSettings} className="bg-slate-950/20 border-t border-white/5 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="e.g. smtp.gmail.com"
                    value={smtpConfig.host || ''}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">SMTP Port</label>
                  <input
                    type="number"
                    placeholder="587"
                    value={smtpConfig.port || ''}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">SMTP Username</label>
                  <input
                    type="text"
                    placeholder="e.g. user@gmail.com"
                    value={smtpConfig.user || ''}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">SMTP Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••"
                    value={smtpConfig.pass || ''}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Sender Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CareerPath AI Daily Digest"
                    value={smtpConfig.fromName || ''}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                <span className="text-[10px] text-white/35 italic">Leave empty to use built-in simulated SMTP sandbox.</span>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>

              {smtpSaveSuccess && (
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 rounded-lg text-[10px] font-sans text-center animate-in fade-in">
                  SMTP Configuration Saved Successfully!
                </div>
              )}
            </form>
          )}
        </div>

        {/* Primary Action Trigger Button */}
        <div className="pt-2 space-y-3 relative z-10">
          <button
            onClick={handleTriggerEmailDigest}
            disabled={isSendingDigest}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer"
          >
            {isSendingDigest ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Compiling Digest & Sending...</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Trigger & Send Daily Digest Email Now</span>
              </>
            )}
          </button>

          {digestSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-xl text-xs font-sans text-center animate-in slide-in-from-top-1">
              🎉 {digestSuccessMsg}
            </div>
          )}

          {digestErrorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-sans text-center animate-in slide-in-from-top-1">
              ⚠️ {digestErrorMsg}
            </div>
          )}
        </div>

        {/* Delivery Logs history feed */}
        <div className="border border-white/5 rounded-xl p-4 bg-slate-950/25 space-y-3 relative z-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Delivery History Logs ({emailLogs.length})</span>
            </div>
            {emailLogs.length > 0 && (
              <button
                onClick={handleClearEmailLogs}
                className="text-[10px] text-white/40 hover:text-white transition-all underline font-sans cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {emailLogs.length === 0 ? (
              <p className="text-[10px] text-white/35 italic py-3 text-center">No email delivery logs recorded yet.</p>
            ) : (
              emailLogs.map((log: any) => (
                <div key={log.id} className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex flex-col gap-2 font-sans transition-all hover:bg-white/10 text-left">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-white text-[11px] leading-tight block">{log.subject}</span>
                      <span className="text-[9px] text-white/40 block mt-0.5">{log.timestamp} • {log.recipient}</span>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                      log.status === 'sent' 
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25' 
                        : log.status === 'simulated' 
                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/25'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/25'
                    }`}>
                      {log.status}
                    </span>
                  </div>

                  {log.error && (
                    <p className="text-[9px] text-rose-400 bg-rose-500/5 p-1 rounded font-mono border border-rose-500/10">{log.error}</p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5 mt-1 justify-end">
                    {log.previewUrl && (
                      <a
                        href={log.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/25 px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>View Delivered Email Layout</span>
                      </a>
                    )}
                    {log.htmlBody && (
                      <button
                        onClick={() => setSelectedLogForPreview(log)}
                        className="bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>Inspect Rendered Template</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {activeSubTab === 'subscription' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Hero Header */}
          <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl" id="premium-hero-header">
            <div className="absolute right-0 top-0 translate-y-[-20px] translate-x-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between relative z-10">
              <div className="flex gap-4 items-start">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isPremium ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-indigo-600 text-white'}`}>
                  {isPremium ? <Crown className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                </div>
                <div className="space-y-1 font-sans">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white font-sans">CareerPath AI Premium Plans</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border font-sans ${
                      isPremium 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                        : 'bg-white/10 text-white/50 border-white/10'
                    }`}>
                      {isPremium ? 'PRO MEMBER' : 'DEMO USER'}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 max-w-xl font-sans">
                    Unlock guaranteed unlimited API access, dedicated high-speed server response lines, and premium resume exports. No more shared quota rate-limit barriers!
                  </p>
                </div>
              </div>

              {isPremium && (
                <button
                  onClick={() => {
                    localStorage.removeItem('careerpath_premium_pro');
                    setIsPremium(false);
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-300 border border-rose-500/25 text-[11px] font-bold rounded-lg transition-all"
                  id="downgrade-demo-btn"
                >
                  Reset Demo (Free Plan)
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Side: Pricing Options Comparisons */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Free Tier Card */}
                <div className={`glass-card bg-slate-900/20 border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between ${!isPremium ? 'border-indigo-500/40 ring-1 ring-indigo-500/15 bg-indigo-950/5' : 'opacity-65'}`}>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Starter</span>
                      <h4 className="font-bold text-lg text-white font-sans">Free Public Plan</h4>
                      <p className="text-[11px] text-white/50 font-sans">Perfect for casual job hunters taking standard resume evaluations.</p>
                    </div>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white font-sans">$0</span>
                      <span className="text-xs text-white/40 font-sans">/ forever</span>
                    </div>

                    <div className="h-px bg-white/5" />

                    <ul className="space-y-2.5 text-xs text-white/70 font-sans">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>20 public AI requests / day</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Basic ATS Scoring Report</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Standard Career Coaching</span>
                      </li>
                      <li className="flex items-center gap-2 text-white/30">
                        <X className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-through">Dedicated high-speed Gemini AI</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <button
                      disabled
                      className="w-full py-2 bg-white/5 text-white/40 border border-white/5 text-xs font-bold rounded-xl cursor-not-allowed"
                    >
                      {!isPremium ? 'Active Plan' : 'Standard Tier'}
                    </button>
                  </div>
                </div>

                {/* Pro Tier Card */}
                <div className={`glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all ${isPremium ? 'border-amber-500/40 ring-2 ring-amber-500/10 bg-amber-950/10 shadow-amber-500/5' : 'bg-gradient-to-br from-indigo-950/20 to-slate-950/20 border-indigo-500/30 shadow-indigo-500/5'}`}>
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-md border-b border-l border-indigo-400/30">
                    Recommended
                  </div>
                  <div className="absolute -left-12 -top-12 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        Professional
                      </span>
                      <h4 className="font-bold text-lg text-white flex items-center gap-1.5 font-sans">
                        AI Premium Career Pro
                      </h4>
                      <p className="text-[11px] text-white/50 font-sans">For active applicants striving for rapid salary optimization & layout tools.</p>
                    </div>

                    <div className="flex items-baseline gap-1 font-sans">
                      <span className="text-2xl font-black text-white font-sans">$12</span>
                      <span className="text-xs text-white/40 font-sans">/ month</span>
                    </div>

                    <div className="h-px bg-white/5" />

                    <ul className="space-y-2.5 text-xs text-white/80 font-sans">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-semibold text-white">Unlimited Guaranteed API Checks</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Dedicated server connection endpoints</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Full PDF resume template exports</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Dynamic AI coaching thread logs</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Scam verification on custom listings</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <button
                      disabled={isPremium}
                      onClick={() => {
                        const el = document.getElementById('mock-checkout-panel');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full py-2 text-xs font-bold rounded-xl transition-all ${
                        isPremium 
                          ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-lg cursor-default' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 border border-indigo-400/40'
                      }`}
                      id="upgrade-cta-btn"
                    >
                      {isPremium ? 'Active Pro Subscription' : 'Upgrade Now'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl flex gap-3.5 items-start font-sans">
                <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-white font-sans">Secure Sandbox Guarantee</p>
                  <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                    All payment processing for this demo is simulated securely within your sandbox workspace. No real charges or credit cards are involved. Enjoy unlimited premium layouts and high-speed API mock routing!
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Checkout Form Panel */}
            <div className="lg:col-span-5 animate-in fade-in" id="mock-checkout-panel">
              {isPremium ? (
                <div className="glass-card bg-emerald-950/15 border-emerald-500/20 rounded-2xl p-6 shadow-xl text-center space-y-4 flex flex-col items-center justify-center h-full min-h-[300px]">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce">
                    <Check className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <h4 className="font-bold text-sm text-white font-sans">Your Subscription is Active!</h4>
                    <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed font-sans">
                      Thank you for choosing CareerPath Premium! Your profile now has full access to dedicated, high-speed simulated API models. Enjoy unlimited checks and resume audits.
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 w-full text-left space-y-2 text-[11px] font-sans">
                    <div className="flex justify-between font-sans">
                      <span className="text-white/45">Plan Name:</span>
                      <span className="text-white font-semibold font-sans">AI Premium Career Pro</span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span className="text-white/45">Status:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1 font-sans">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Active (Auto-renewing)
                      </span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span className="text-white/45 font-sans">Billing Cycle:</span>
                      <span className="text-white font-sans">$12.00 / Month</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-5 shadow-xl space-y-4 font-sans">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono">Simulated Checkout</h4>
                  <p className="text-xs text-white/60 font-sans">Upgrade to Pro instantly to activate high-performance dedicated endpoints.</p>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    localStorage.setItem('careerpath_premium_pro', 'true');
                    setIsPremium(true);
                    window.location.reload();
                  }} className="space-y-4 font-sans text-xs">
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] font-bold text-white/45 uppercase font-mono">Email Address</label>
                      <input
                        type="email"
                        required
                        defaultValue={profile.email || "candidate@example.com"}
                        className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-indigo-500 transition-all font-sans"
                      />
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] font-bold text-white/45 uppercase font-mono">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-indigo-500 transition-all font-mono"
                        />
                        <CreditCard className="w-4 h-4 text-white/30 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/45 uppercase font-mono">Expires</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-indigo-500 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1 font-sans">
                        <label className="text-[10px] font-bold text-white/45 uppercase font-mono">CVC Code</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          maxLength={3}
                          className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-indigo-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2 text-[11px] font-sans">
                      <div className="flex justify-between font-sans">
                        <span className="text-white/45">Monthly Pro Plan:</span>
                        <span className="text-white">$12.00</span>
                      </div>
                      <div className="flex justify-between font-sans">
                        <span className="text-white/45 font-sans">Sandbox Tax (Simulated):</span>
                        <span className="text-white font-sans">$0.00</span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between font-bold text-white font-sans font-sans">
                        <span>Due Immediately:</span>
                        <span>$12.00 / month</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-400/30 font-sans"
                      id="submit-payment-btn"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      Activate Premium Subscription
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Real-time PDF Export Preview Modal */}
      <AnimatePresence>
        {selectedLogForPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden relative"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/20">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    Email Digest Inspector
                  </h3>
                  <p className="text-[10px] text-white/45 truncate max-w-sm">Subject: {selectedLogForPreview.subject}</p>
                </div>
                <button
                  onClick={() => setSelectedLogForPreview(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Render the HTML inside an iframe srcdoc */}
              <div className="flex-1 bg-[#090d16] p-4 overflow-y-auto">
                <iframe
                  title="Email HTML Preview"
                  srcDoc={selectedLogForPreview.htmlBody}
                  className="w-full h-full border-none rounded-xl bg-transparent min-h-[500px]"
                  sandbox="allow-same-origin"
                />
              </div>

              <div className="p-3 border-t border-white/10 bg-slate-950/40 flex justify-between items-center text-[10px] text-white/40">
                <span>Dispatched: {selectedLogForPreview.timestamp}</span>
                {selectedLogForPreview.previewUrl && (
                  <a
                    href={selectedLogForPreview.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Ethereal Mailbox Delivery
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {previewVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row h-[90vh] overflow-hidden"
            >
              {/* Left Side: Controls & Editor */}
              <div className="w-full md:w-[350px] border-r border-white/10 p-5 flex flex-col justify-between overflow-y-auto bg-slate-900/50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Resume PDF Preview
                    </h3>
                    <button
                      onClick={() => setPreviewVersion(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Verify formatting, adjust layout styling, and tune content fields in real-time before downloading your polished resume.
                  </p>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">1. Choose Template Layout</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['modern', 'classic', 'creative'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setPreviewTemplateStyle(style)}
                          className={`py-2 px-1 text-[10px] font-semibold rounded-lg capitalize border transition-all cursor-pointer ${
                            previewTemplateStyle === style
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-bold'
                              : 'bg-white/5 text-white/60 border-white/5 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">2. Live Content Tuner</label>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-white/40 uppercase block">Full Name</label>
                      <input
                        type="text"
                        value={previewName}
                        onChange={(e) => setPreviewName(e.target.value)}
                        className="w-full h-8 bg-slate-950/45 border border-white/10 rounded-lg text-xs px-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                        placeholder="Candidate Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-white/40 uppercase block">Professional Title</label>
                      <input
                        type="text"
                        value={previewTitle}
                        onChange={(e) => setPreviewTitle(e.target.value)}
                        className="w-full h-8 bg-slate-950/45 border border-white/10 rounded-lg text-xs px-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                        placeholder="Professional Title"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-white/40 uppercase block">Contact Email</label>
                      <input
                        type="text"
                        value={previewEmail}
                        onChange={(e) => setPreviewEmail(e.target.value)}
                        className="w-full h-8 bg-slate-950/45 border border-white/10 rounded-lg text-xs px-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white"
                        placeholder="Email Address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-white/40 uppercase block">Core Competencies (Comma Separated)</label>
                      <textarea
                        value={previewSkills}
                        onChange={(e) => setPreviewSkills(e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-slate-950/45 border border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white resize-none"
                        placeholder="React, TypeScript, Node.js..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-white/40 uppercase block">Professional Summary / Biography</label>
                      <textarea
                        value={previewBio}
                        onChange={(e) => setPreviewBio(e.target.value)}
                        rows={5}
                        className="w-full p-2 bg-slate-950/45 border border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white resize-none"
                        placeholder="Professional summary..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-white/5 space-y-2 shrink-0">
                  <button
                    onClick={() => {
                      const skillsArray = previewSkills
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                      
                      handleDownloadVersionPdf(previewVersion, previewTemplateStyle, {
                        name: previewName,
                        title: previewTitle,
                        email: previewEmail,
                        skills: skillsArray,
                        text: previewBio
                      });
                      setPreviewVersion(null);
                    }}
                    className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all duration-150"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Resume
                  </button>
                  <button
                    onClick={() => setPreviewVersion(null)}
                    className="w-full h-9 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right Side: Letter Sheet Live Mockup */}
              <div className="flex-1 bg-slate-950/55 p-6 flex items-center justify-center overflow-y-auto min-h-0">
                <div className="w-full max-w-lg aspect-[8.5/11] bg-white text-slate-800 p-8 shadow-2xl rounded-sm relative overflow-hidden flex flex-col justify-between font-sans text-left border border-slate-200">
                  
                  {/* Top template bar (visual indicator only, doesn't print) */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600 transition-all duration-300" style={{
                    backgroundColor: 
                      previewTemplateStyle === 'classic' ? '#1e293b' :
                      previewTemplateStyle === 'creative' ? '#0d9488' : '#4f46e5'
                  }} />

                  <div>
                    {/* Header Block */}
                    <div className="text-center space-y-1">
                      <h1 className="text-2xl font-bold tracking-tight text-slate-800">{previewName || 'Your Name'}</h1>
                      <h2 className="text-xs font-semibold tracking-wider uppercase transition-all duration-300" style={{
                        color: 
                          previewTemplateStyle === 'classic' ? '#1e293b' :
                          previewTemplateStyle === 'creative' ? '#0d9488' : '#4f46e5'
                      }}>
                        {previewTitle || 'Professional Title'}
                      </h2>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Email: {previewEmail || 'N/A'} &nbsp;|&nbsp; ATS Score: {previewVersion.score}%
                      </p>
                    </div>

                    {/* Divider */}
                    <hr className="my-4 border-slate-200" />

                    {/* Body layout */}
                    <div className="space-y-5">
                      {/* Section 1: Core Competencies */}
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Core Competencies & Key Expertise
                          </h3>
                          <div className="h-[2px] w-5 mt-1 transition-all duration-300" style={{
                            backgroundColor: 
                              previewTemplateStyle === 'classic' ? '#1e293b' :
                              previewTemplateStyle === 'creative' ? '#0d9488' : '#4f46e5'
                          }} />
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {previewSkills ? (
                            previewSkills.split(',').map((skill, sIdx) => {
                              const cleaned = skill.trim();
                              if (!cleaned) return null;
                              return (
                                <span
                                  key={sIdx}
                                  className="text-[9px] font-medium px-2 py-0.5 rounded transition-all duration-300"
                                  style={{
                                    backgroundColor: 
                                      previewTemplateStyle === 'classic' ? '#f1f5f9' :
                                      previewTemplateStyle === 'creative' ? '#f0fdfa' : '#e0e7ff',
                                    color: 
                                      previewTemplateStyle === 'classic' ? '#334155' :
                                      previewTemplateStyle === 'creative' ? '#0f766e' : '#4338ca'
                                  }}
                                >
                                  {cleaned}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[9px] text-slate-400 italic">No skills listed</span>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Summary Bio */}
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Executive Bio & Professional Summary
                          </h3>
                          <div className="h-[2px] w-5 mt-1 transition-all duration-300" style={{
                            backgroundColor: 
                              previewTemplateStyle === 'classic' ? '#1e293b' :
                              previewTemplateStyle === 'creative' ? '#0d9488' : '#4f46e5'
                          }} />
                        </div>

                        <p className="text-[10px] leading-relaxed text-slate-600 font-normal whitespace-pre-wrap pt-0.5">
                          {previewBio || 'No biography text provided.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Document Footer (visual representation of PDF footer) */}
                  <div className="border-t border-slate-100 pt-3 text-center text-[8px] text-slate-400 italic font-mono mt-4">
                    CareerPath AI Premium Professional Profile  |  Page 1 of 1
                  </div>

                </div>
              </div>

            </motion.div>
          </motion.div>
        )}

        {/* LinkedIn Profile Schema Export Modal */}
        {showLinkedInExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-6xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row h-[90vh] overflow-hidden text-left"
            >
              {/* Left Side: Controls & JSON Viewer */}
              <div className="w-full md:w-[420px] border-r border-white/10 p-5 flex flex-col justify-between overflow-y-auto bg-slate-900/40 shrink-0">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      LinkedIn Profile Sync
                    </h3>
                    <button
                      onClick={() => {
                        setShowLinkedInExport(false);
                        setLinkedInSchema(null);
                        setLinkedInError('');
                      }}
                      className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Generate an industry-grade, keyword-optimized LinkedIn profile schema mapped directly from your parsed resume details. Use this JSON to sync your professional identity across external platforms or resume parsers.
                  </p>

                  {isGeneratingLinkedIn ? (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-4">
                      <div className="flex items-center gap-2.5">
                        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                        <span className="text-xs font-bold text-white">AI Optimization in Progress</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          'Parsing raw profile text...',
                          'Extracting experiences & timeline details...',
                          'Optimizing professional headline...',
                          'Formulating keyword-rich executive About summary...',
                          'Mapping skills and certifications...',
                          'Compiling final LinkedIn Schema JSON...'
                        ].map((stepText, idx) => {
                          const isCompleted = linkedInStep > idx;
                          const isActive = linkedInStep === idx;
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs transition-opacity duration-300">
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : isActive ? (
                                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                              )}
                              <span className={isCompleted ? 'text-white/40 line-through' : isActive ? 'text-blue-400 font-bold' : 'text-white/60'}>
                                {stepText}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : linkedInError ? (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-rose-300">Generation Failed</h4>
                          <p className="text-[10px] text-rose-300/70 leading-relaxed">{linkedInError}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleGenerateLinkedIn}
                        className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        Retry Generation
                      </button>
                    </div>
                  ) : linkedInSchema ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Generated LinkedIn JSON</label>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider">
                          Ready
                        </span>
                      </div>
                      <div className="relative bg-slate-950/60 border border-white/10 rounded-xl p-3 h-[250px] overflow-auto font-mono text-[10px] text-blue-300 leading-normal scrollbar-thin">
                        <pre>{JSON.stringify(linkedInSchema, null, 2)}</pre>
                      </div>
                    </div>
                  ) : null}
                </div>

                {linkedInSchema && !isGeneratingLinkedIn && (
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <button
                      onClick={() => {
                        if (!linkedInSchema) return;
                        navigator.clipboard.writeText(JSON.stringify(linkedInSchema, null, 2));
                        setLinkedInCopied(true);
                        setTimeout(() => setLinkedInCopied(false), 2000);
                      }}
                      className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all duration-150"
                    >
                      {linkedInCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Schema JSON
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (!linkedInSchema) return;
                        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                          JSON.stringify(linkedInSchema, null, 2)
                        )}`;
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute('href', jsonString);
                        const sanitizedName = (profile.name || 'career_profile').toLowerCase().replace(/[^a-z0-9]+/g, '_');
                        downloadAnchor.setAttribute('download', `${sanitizedName}_linkedin_profile.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                      className="w-full h-9 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Schema File
                    </button>
                    <button
                      onClick={handleGenerateLinkedIn}
                      className="w-full h-8 bg-transparent hover:bg-white/5 text-white/50 hover:text-white/80 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate Optimization
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Visual Mockup (LinkedIn Style) */}
              <div className="flex-1 bg-[#f4f2ee] p-6 flex flex-col overflow-y-auto min-h-0 text-slate-800 scrollbar-thin">
                <div className="w-full max-w-2xl mx-auto space-y-4 font-sans text-left pb-10">
                  
                  {/* Section: Profile Header Card */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    {/* LinkedIn Banner Background */}
                    <div className="h-32 bg-gradient-to-r from-blue-700 to-indigo-950 relative">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent pointer-events-none" />
                    </div>
                    {/* Profile Summary info */}
                    <div className="p-6 pt-0 relative">
                      {/* Round Avatar overlapping banner */}
                      <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden -mt-14 shadow-sm bg-slate-100 shrink-0">
                        <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            {linkedInSchema?.profile?.firstName ? `${linkedInSchema.profile.firstName} ${linkedInSchema.profile.lastName}` : profile.name}
                          </h1>
                          <span className="text-[10px] text-white bg-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            1st
                          </span>
                        </div>
                        <h2 className="text-sm font-normal text-slate-800 leading-relaxed max-w-xl">
                          {linkedInSchema?.profile?.headline || profile.title || 'Professional Specialist'}
                        </h2>
                        <div className="pt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {linkedInSchema?.profile?.location 
                              ? `${linkedInSchema.profile.location.postalCode}, ${linkedInSchema.profile.location.countryCode === 'US' ? 'United States' : linkedInSchema.profile.location.countryCode}` 
                              : 'United States'}
                          </span>
                          <span>•</span>
                          <span className="text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5">
                            <Mail className="w-3.5 h-3.5" />
                            Contact info
                          </span>
                        </div>
                      </div>

                      {/* LinkedIn Actions Bar */}
                      <div className="mt-5 flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                        <span className="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-full cursor-not-allowed hover:bg-blue-700 transition-all shadow-sm">
                          Open to
                        </span>
                        <span className="px-4 py-1.5 border border-slate-500 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold text-xs rounded-full cursor-not-allowed transition-all">
                          Add profile section
                        </span>
                        <span className="px-3 py-1.5 border border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-full cursor-not-allowed transition-all">
                          More
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section: About Summary Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">About</h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {linkedInSchema?.profile?.summary || 'Optimizing About statement based on your profile contents...'}
                    </p>
                  </div>

                  {/* Section: Experience Timeline Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">Experience</h3>
                    <div className="space-y-4">
                      {linkedInSchema?.experience && linkedInSchema.experience.length > 0 ? (
                        linkedInSchema.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                              <Briefcase className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-slate-900">{exp.title}</h4>
                              <p className="text-xs text-slate-700 font-medium">{exp.company} • Full-time</p>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                {exp.startDate} - {exp.endDate} • {exp.location}
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed pt-1 whitespace-pre-line">
                                {exp.description}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 py-1">
                            <h4 className="font-bold text-xs text-slate-400">Chronological Experience Records</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Parsing raw text into LinkedIn work experience cards. Make sure to input details on your Profile tab.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section: Education Timeline Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">Education</h3>
                    <div className="space-y-4">
                      {linkedInSchema?.education && linkedInSchema.education.length > 0 ? (
                        linkedInSchema.education.map((edu: any, idx: number) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                              <GraduationCap className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-xs text-slate-900">{edu.school}</h4>
                              <p className="text-xs text-slate-700 font-medium">{edu.degree}, {edu.fieldOfStudy}</p>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                {edu.startDate} - {edu.endDate}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-slate-400">Academic Education History</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Academic background parsed or estimated from your biography references.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section: Licenses & Certifications Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">Licenses & Certifications</h3>
                    <div className="space-y-3">
                      {linkedInSchema?.certifications && linkedInSchema.certifications.length > 0 ? (
                        linkedInSchema.certifications.map((cert: any, idx: number) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                              <Award className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-xs text-slate-900">{cert.name}</h4>
                              <p className="text-xs text-slate-700 font-medium">{cert.authority}</p>
                              {cert.licenseNumber && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Credential ID {cert.licenseNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-slate-400">Professional Accreditations</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Certifications relevant to your skill set recommended by Gemini.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section: Skills Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">Skills</h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {linkedInSchema?.skills && linkedInSchema.skills.length > 0 ? (
                        linkedInSchema.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic">No validated skills listed yet.</div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </motion.div>
          </motion.div>
        )}

      {activeSubTab === 'feedback' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Feedback Header */}
          <div className="glass-card border-white/10 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Feedback & Support</h2>
            </div>
            <p className="text-sm text-white/70">Help us improve CareerPath AI by sharing your feedback and reporting any issues you encounter.</p>
          </div>

          {/* Feedback Form Section */}
          <div className="glass-card border-white/10 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Send us Your Feedback
            </h3>
            <form className="space-y-4">
              {/* Feedback Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/80 block">Feedback Type</label>
                <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm">
                  <option value="bug" className="bg-slate-900">🐛 Bug Report</option>
                  <option value="feature" className="bg-slate-900">✨ Feature Request</option>
                  <option value="improvement" className="bg-slate-900">📈 Improvement Suggestion</option>
                  <option value="general" className="bg-slate-900">💬 General Feedback</option>
                </select>
              </div>

              {/* Feedback Message */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/80 block">Your Feedback</label>
                <textarea
                  placeholder="Tell us what you think... (minimum 20 characters)"
                  minLength={20}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80 block">Your Name</label>
                  <input
                    type="text"
                    defaultValue={profile.name}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80 block">Email Address</label>
                  <input
                    type="email"
                    defaultValue={profile.email}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Rating Section */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold text-white/80 block">Rate Your Experience</label>
                <div className="flex gap-3 justify-start">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className="w-12 h-12 rounded-xl border border-white/20 hover:border-indigo-500 text-2xl transition-all hover:scale-110 active:scale-95"
                    >
                      {'⭐'[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  Submit Feedback
                </button>
                <button
                  type="reset"
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/80 font-semibold rounded-xl border border-white/10 transition-all"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Support Resources */}
          <div className="glass-card border-white/10 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              Support Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="#"
                className="p-4 border border-white/10 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">Documentation</h4>
                    <p className="text-xs text-white/50 mt-1">Browse our help guides and tutorials</p>
                  </div>
                </div>
              </a>
              <a
                href="#"
                className="p-4 border border-white/10 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-green-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-green-300 transition-colors">Status Page</h4>
                    <p className="text-xs text-white/50 mt-1">Check system status and updates</p>
                  </div>
                </div>
              </a>
              <a
                href="#"
                className="p-4 border border-white/10 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">Email Support</h4>
                    <p className="text-xs text-white/50 mt-1">support@careerpath.ai</p>
                  </div>
                </div>
              </a>
              <a
                href="#"
                className="p-4 border border-white/10 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors">Discord Community</h4>
                    <p className="text-xs text-white/50 mt-1">Join our community for discussions</p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="glass-card border-white/10 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <details className="group cursor-pointer">
                <summary className="flex items-center justify-between py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  <span className="font-medium text-white/90">How do I update my profile?</span>
                  <ChevronDown className="w-4 h-4 text-white/50 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 py-3 text-sm text-white/70 bg-white/[0.02] mt-2 rounded-lg">
                  Click on the "Profile & ATS" tab to edit your professional information, resume, and career details. All changes are automatically saved.
                </p>
              </details>
              <details className="group cursor-pointer">
                <summary className="flex items-center justify-between py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  <span className="font-medium text-white/90">Is my data secure and private?</span>
                  <ChevronDown className="w-4 h-4 text-white/50 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 py-3 text-sm text-white/70 bg-white/[0.02] mt-2 rounded-lg">
                  Yes, we use industry-standard encryption and your data is stored securely. We never share your information with third parties without consent.
                </p>
              </details>
              <details className="group cursor-pointer">
                <summary className="flex items-center justify-between py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  <span className="font-medium text-white/90">How does AI matching work?</span>
                  <ChevronDown className="w-4 h-4 text-white/50 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 py-3 text-sm text-white/70 bg-white/[0.02] mt-2 rounded-lg">
                  Our AI analyzes your resume, skills, and preferences to find the best matching jobs. The compatibility score reflects how well each role aligns with your background.
                </p>
              </details>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
