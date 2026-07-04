import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Bookmark, BookmarkCheck, Briefcase, 
  MapPin, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, 
  RefreshCw, Check, X, ArrowUpDown, FileCheck
} from 'lucide-react';
import { Job, UserProfile } from '../types';
import { calculateMatchScore, getScoreStyle, getMatchedAndMissingSkills } from '../utils/matchScore';
import { sanitizeUserProfile, cleanTechnicalSkills, cleanProfessionalSummary, extractProfessionalTitle } from '../utils/resumeParser';
import { parseApiResponse, parseErrorResponse } from '../utils/apiResponse';
import { motion, AnimatePresence } from 'motion/react';

interface HomeTabProps {
  jobs: Job[];
  profile: UserProfile;
  savedJobIds: string[];
  appliedJobIds: string[];
  onSelectJob: (job: Job) => void;
  onToggleSaveJob: (jobId: string) => void;
  onApplyJob: (jobId: string) => void;
  onUpdateProfile: (profile: UserProfile, options?: { isResumeUpload?: boolean; isVersionChange?: boolean }) => void;
  isLoading?: boolean;
}

interface AtsCheck {
  label: string;
  description: string;
  passed: boolean;
  value: string;
  suggestion: string;
}

// ATS analysis calculator matching ProfileTab
function getAtsAnalysis(profile: UserProfile) {
  const checks: AtsCheck[] = [];
  
  const contactPassed = !!(profile.name && profile.email && profile.title);
  checks.push({
    label: 'Contact Details Optimization',
    description: 'Verifies presence of full name, active email, and professional title.',
    passed: contactPassed,
    value: contactPassed ? 'Configured' : 'Missing items',
    suggestion: contactPassed ? 'Excellent! Standard ATS systems can correctly parse your candidate identifier fields.' : 'Provide your full name, email, and professional headline title to support parser mappings.'
  });

  const skillsCount = profile.skills?.length || 0;
  const skillsPassed = skillsCount >= 6;
  checks.push({
    label: 'Core Skills Keywords Density',
    description: 'ATS search engines index and prioritize resumes with 6 or more core competencies.',
    passed: skillsPassed,
    value: `${skillsCount} skills defined`,
    suggestion: skillsPassed ? 'Ideal skill density for system index ranking filters.' : 'Add at least 6 core technical skills to rank high in programmatic search indexers.'
  });

  const bioLength = profile.resumeText?.trim().length || 0;
  const bioPassed = bioLength >= 150;
  checks.push({
    label: 'Resume Executive Summary Depth',
    description: 'Checks if executive bio/resume summary has enough substance for natural language processors.',
    passed: bioPassed,
    value: `${bioLength} characters`,
    suggestion: bioPassed ? 'Sufficiently descriptive executive biography statement.' : 'Expand your professional bio to 150+ characters describing your career goals and key accomplishments.'
  });

  const bioLower = (profile.resumeText || '').toLowerCase();
  const hasActionVerbs = ['develop', 'design', 'manage', 'lead', 'build', 'create', 'engineer', 'implement', 'analyze', 'deliver', 'direct', 'facilitate', 'structure', 'execute'].some(verb => bioLower.includes(verb));
  checks.push({
    label: 'Action Verb Impact Scan',
    description: 'Scans for industry action verbs (e.g. lead, develop, design) that signal project ownership and outcome delivery.',
    passed: hasActionVerbs,
    value: hasActionVerbs ? 'Identified' : 'Not found',
    suggestion: hasActionVerbs ? 'Great active vocabulary! Your profile conveys outcome-oriented impact.' : 'Use direct action verbs in your professional bio.'
  });

  const hasSpecialSymbols = /[\u25A0-\u25FF\u2B00-\u2BFF]/.test(profile.resumeText || '');
  checks.push({
    label: 'Uncommon Layout Symbol Scan',
    description: 'Scans for non-standard glyphs or complex layout indicators.',
    passed: !hasSpecialSymbols,
    value: hasSpecialSymbols ? 'Symbols found' : 'Standard structures verified',
    suggestion: hasSpecialSymbols ? 'Replace heavy geometric bullets or graphic icons with standard characters (e.g., "-", "•") to prevent parsing errors.' : 'No problematic geometric formatting shapes found.'
  });

  return {
    score: Math.min(98, Math.round(55 + (checks.filter(c => c.passed).length / checks.length) * 43)),
    checks
  };
}

// Beautiful Glowing Shimmer Loading Skeleton
const JobCardSkeleton = () => (
  <div className="glass-card p-5 space-y-4 animate-pulse relative overflow-hidden border border-white/5 bg-slate-900/35">
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]" />
    
    <div className="flex items-start justify-between">
      <div className="space-y-2.5 flex-1">
        <div className="h-5 bg-white/10 rounded-lg w-2/3" />
        <div className="h-3.5 bg-white/5 rounded-md w-1/3" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
    </div>
    
    <div className="flex gap-4">
      <div className="h-4.5 bg-white/10 rounded-md w-24" />
      <div className="h-4.5 bg-white/10 rounded-md w-32" />
    </div>

    <div className="flex flex-wrap gap-1.5 pt-1">
      <div className="h-5 bg-white/5 rounded-full w-16" />
      <div className="h-5 bg-white/5 rounded-full w-20" />
      <div className="h-5 bg-white/5 rounded-full w-14" />
    </div>
  </div>
);




export default function HomeTab({
  jobs,
  profile,
  savedJobIds,
  appliedJobIds,
  onSelectJob,
  onToggleSaveJob,
  onApplyJob,
  onUpdateProfile,
  isLoading = false
}: HomeTabProps) {
  // Small transient toast for user feedback (Coming Soon, actions, etc.)
  const [toastMessage, setToastMessage] = useState<string>('');
  const showToast = (msg: string, ms = 2500) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(''), ms);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Jobs');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [salaryFilter, setSalaryFilter] = useState('All');
  const [locationType, setLocationType] = useState('All');
  const [experienceFilter, setExperienceFilter] = useState('All');

  const normalizeJobExperienceLevel = (job: Job) => {
    if (job.experienceLevel) return job.experienceLevel;
    const title = job.title.toLowerCase();
    if (/senior|sr\b|lead|principal|staff|manager|director|vp|head/.test(title)) return 'Senior';
    if (/junior|fresher|associate|intern|graduate|entry|trainee|coordinator|assistant/.test(title)) return 'Fresher';
    return 'Mid';
  };

  const normalizeProfileExperienceLevel = (profile: UserProfile) => {
    const level = profile.experienceLevel?.trim();
    if (!level) return null;
    if (/\b(entry|entry level|fresher|junior|graduate|student|intern|internship|trainee|co-op)\b/i.test(level)) return 'Fresher';
    if (/\b(senior|sr\.?|lead|principal|staff|architect|manager|director|vp|head|experienced|seasoned)\b/i.test(level)) return 'Senior';
    return 'Mid';
  };

  const profileExperienceLevel = normalizeProfileExperienceLevel(profile);

  // Resume Upload / Search states
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'file_uploaded' | 'analyzing' | 'ready'>('ready');
  const [uploadStep, setUploadStep] = useState(0);
  const [resumeError, setResumeError] = useState('');
  const [resumeSuccess, setResumeSuccess] = useState('');
  const [sortByResumeMatch, setSortByResumeMatch] = useState(true);
  const [resumeVersions, setResumeVersions] = useState<any[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('master');

  // Load versions from localStorage (shared with ProfileTab)
  useEffect(() => {
    if (profile?.email) {
      const saved = localStorage.getItem(`career_path_ai_resume_history_${profile.email}`);
      if (saved) {
        try {
          setResumeVersions(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [profile?.email]);

  // Sync to localStorage
  const saveResumeVersionsToStorage = (updatedHistory: any[]) => {
    setResumeVersions(updatedHistory);
    if (profile?.email) {
      localStorage.setItem(`career_path_ai_resume_history_${profile.email}`, JSON.stringify(updatedHistory));
    }
  };

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
      setResumeError('Unsupported file type. Please upload a PDF (.pdf), Word Document (.docx, .doc), or Text (.txt) file.');
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
      setResumeError('Incorrect file, please upload a valid professional resume (PDF, Word Document, or Text). File types like organograms, diagrams, flowcharts, or bills are not accepted.');
      return;
    }

    setIsUploadingResume(true);
    setUploadStatus('file_uploaded');
    setUploadStep(0);
    setResumeError('');
    setResumeSuccess('');

    // Dynamic steps tick interval (faster ticks for better feedback loop speed)
    const stepInterval = setInterval(() => {
      setUploadStep(prev => prev + 1);
    }, 150);

    // Smart client-side fallback parsing function in case network or API is slow/fails
    const runFallbackParsing = (fileName: string, textContent: string = '') => {
      setUploadStatus('analyzing');
      const nameLower = fileName.toLowerCase();
      const textLower = textContent.toLowerCase();

      // Simple heuristic to reject obviously wrong non-resume files during fallback
      const invalidKeywords = [
        'receipt', 'ticket', 'invoice', 'bill', 'payment', 'booking', 'slip', 'order', 'transport', 'ksrtc', 
        'bus', 'train', 'flight', 'utility', 'menu', 'grocery', 'organogram', 'orgchart', 'org-chart', 
        'diagram', 'flowchart', 'flow-chart', 'image', 'photo', 'picture', 'graph', 'chart', 'map'
      ];
      const isUnrelated = invalidKeywords.some(keyword => nameLower.includes(keyword) || textLower.includes(keyword));
      const hasResumeKeywords = ['resume', 'cv', 'portfolio', 'profile', 'bio', 'experience', 'hire', 'apply', 'job', 'career', 'education', 'skills', 'engineer', 'developer', 'designer', 'manager', 'specialist', 'analyst', 'candidate'].some(keyword => nameLower.includes(keyword) || textLower.includes(keyword));

      if (isUnrelated && !hasResumeKeywords) {
        setResumeError('Incorrect file, please upload new file.');
        clearInterval(stepInterval);
        setIsUploadingResume(false);
        setUploadStatus('ready');
        return;
      }

      let parsedName = profile.name || 'Candidate';
      if (textContent) {
        const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0 && lines[0].length > 2 && lines[0].length < 30 && !lines[0].includes('@') && !lines[0].includes('/') && !lines[0].includes('.')) {
          parsedName = lines[0];
        }
      }

      // Extract professional headline title, hard technical skills and cohesive prose summary
      const parsedTitle = extractProfessionalTitle('', textContent, fileName);
      const parsedSkills = cleanTechnicalSkills([], textContent);
      const cleanSummary = cleanProfessionalSummary('', textContent);

      const rawText = textContent || `Resume of ${parsedName}, specialized in ${parsedTitle}.`;
      const tempProfile = {
        ...profile,
        name: parsedName,
        title: parsedTitle,
        skills: parsedSkills,
        resumeText: rawText
      };

      // Sanitize profile to ensure absolute distinction between hard tech skills and summaries
      const dummyProfile = sanitizeUserProfile(tempProfile, rawText, fileName);

      const evaluation = getAtsAnalysis(dummyProfile);
      const calculatedScore = evaluation.score;

      const nextVerNum = resumeVersions.length + 1;
      const cleanFileName = fileName
        .replace('.txt', '')
        .replace('.pdf', '')
        .replace('.docx', '')
        .replace('.doc', '');

      const newVer: any = {
        id: `v_${Date.now()}`,
        versionName: `v${nextVerNum} - ${cleanFileName} (Fast-Mapped)`,
        uploadedAt: new Date().toISOString(),
        fileName,
        score: calculatedScore,
        text: dummyProfile.resumeText,
        title: dummyProfile.title,
        skills: dummyProfile.skills
      };

      const updatedHistory = [...resumeVersions, newVer];
      saveResumeVersionsToStorage(updatedHistory);
      setActiveVersionId(newVer.id);

      onUpdateProfile(dummyProfile, { isResumeUpload: true });
      setResumeSuccess(`Successfully parsed and synchronized "${fileName}"! Your home feed matches are now updated based on this resume.`);
      setUploadStatus('ready');
    };

    // Helper to fetch with a timeout
    const fetchWithTimeout = async (url: string, options: any, timeoutMs: number) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    try {
      if (fileExtension === 'txt') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          setUploadStatus('analyzing');
          const text = event.target?.result as string || '';
          if (!text || text.trim().length < 20) {
            setResumeError('The uploaded text file is empty or too short (min 20 characters).');
            clearInterval(stepInterval);
            setIsUploadingResume(false);
            setUploadStatus('ready');
            return;
          }
          
          try {
            // Race the network parse (25s timeout)
            const response = await fetchWithTimeout('/api/gemini/resume-parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resumeText: text.trim() })
            }, 25000);

            let parsedTitle = profile.title;
            let parsedSkills = profile.skills;
            let parsedName = profile.name;

            if (response.ok) {
              const data = await parseApiResponse(response);
              if (data.isValidResume === false) {
                setResumeError('Incorrect file, please upload new file.');
                clearInterval(stepInterval);
                setIsUploadingResume(false);
                setUploadStatus('ready');
                return;
              }
              if (data.title) parsedTitle = data.title;
              if (data.skills && data.skills.length > 0) parsedSkills = data.skills;
              if (data.name && data.name !== 'Candidate') parsedName = data.name;

              const rawText = text.trim();
              const tempProfile = {
                ...profile,
                name: parsedName,
                title: parsedTitle,
                skills: parsedSkills,
                resumeText: rawText,
                education: data.education || [],
                experience: data.experience || [],
                projects: data.projects || [],
                certifications: data.certifications || []
              };
              const dummyProfile = sanitizeUserProfile(tempProfile, rawText, file.name);
              dummyProfile.education = data.education || [];
              dummyProfile.experience = data.experience || [];
              dummyProfile.projects = data.projects || [];
              dummyProfile.certifications = data.certifications || [];

              const evaluation = getAtsAnalysis(dummyProfile);
              const calculatedScore = evaluation.score;

              const nextVerNum = resumeVersions.length + 1;
              const newVer: any = {
                id: `v_${Date.now()}`,
                versionName: `v${nextVerNum} - ${file.name.replace('.txt', '')}`,
                uploadedAt: new Date().toISOString(),
                fileName: file.name,
                score: calculatedScore,
                text: rawText,
                title: dummyProfile.title,
                skills: dummyProfile.skills,
                education: dummyProfile.education,
                experience: dummyProfile.experience,
                projects: dummyProfile.projects,
                certifications: dummyProfile.certifications
              };

              const updatedHistory = [...resumeVersions, newVer];
              saveResumeVersionsToStorage(updatedHistory);
              setActiveVersionId(newVer.id);

              onUpdateProfile(dummyProfile, { isResumeUpload: true });
              setResumeSuccess(`Successfully parsed "${file.name}"! Your home feed matches are now updated based on this resume.`);
              setUploadStatus('ready');
            } else {
              throw new Error('API responded with error. Falling back to local parse.');
            }
          } catch (err) {
            console.warn('Network parse took too long or failed, using smart client-side parsing fallback.', err);
            runFallbackParsing(file.name, text.trim());
          } finally {
            clearInterval(stepInterval);
            setIsUploadingResume(false);
            setUploadStatus('ready');
          }
        };
        reader.onerror = () => {
          setResumeError('Failed to read the uploaded text file.');
          clearInterval(stepInterval);
          setIsUploadingResume(false);
          setUploadStatus('ready');
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = async (event) => {
          setUploadStatus('analyzing');
          const dataUrl = event.target?.result as string;
          const base64 = dataUrl.split(',')[1];
          let mimeType = 'application/pdf';
          if (fileExtension === 'docx') {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (fileExtension === 'doc') {
            mimeType = 'application/msword';
          }

          try {
            // Race the network parse (25s timeout)
            const response = await fetchWithTimeout('/api/gemini/resume-parse-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileBase64: base64,
                mimeType,
                fileName: file.name
              })
            }, 25000);

            if (!response.ok) {
              const errorText = await parseErrorResponse(response);
              throw new Error(errorText || 'API responded with error. Falling back to local parse.');
            }

            const data = await parseApiResponse(response);
            if (data.isValidResume === false) {
              setResumeError('Incorrect file, please upload new file.');
              clearInterval(stepInterval);
              setIsUploadingResume(false);
              setUploadStatus('ready');
              return;
            }
            
            const parsedName = data.name && data.name !== 'Candidate' ? data.name : profile.name;
            const parsedTitle = data.title || profile.title;
            const parsedSkills = data.skills && data.skills.length > 0 ? data.skills : profile.skills;
            const extractedText = data.fullText || data.summary || '';

            const tempProfile = {
              ...profile,
              name: parsedName,
              title: parsedTitle,
              skills: parsedSkills,
              resumeText: extractedText,
              education: data.education || [],
              experience: data.experience || [],
              projects: data.projects || [],
              certifications: data.certifications || []
            };
            const dummyProfile = sanitizeUserProfile(tempProfile, extractedText, file.name);
            dummyProfile.education = data.education || [];
            dummyProfile.experience = data.experience || [];
            dummyProfile.projects = data.projects || [];
            dummyProfile.certifications = data.certifications || [];
            const evaluation = getAtsAnalysis(dummyProfile);
            const calculatedScore = evaluation.score;

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
              title: dummyProfile.title,
              skills: dummyProfile.skills,
              education: dummyProfile.education,
              experience: dummyProfile.experience,
              projects: dummyProfile.projects,
              certifications: dummyProfile.certifications
            };

            const updatedHistory = [...resumeVersions, newVer];
            saveResumeVersionsToStorage(updatedHistory);
            setActiveVersionId(newVer.id);

            onUpdateProfile(dummyProfile, { isResumeUpload: true });
            setResumeSuccess(`Successfully parsed and synchronized "${file.name}"! Recommended jobs list has been matched and sorted.`);
            setUploadStatus('ready');
          } catch (err: any) {
            console.warn('Network parse took too long or failed, using smart client-side parsing fallback.', err);
            runFallbackParsing(file.name, '');
          } finally {
            clearInterval(stepInterval);
            setIsUploadingResume(false);
            setUploadStatus('ready');
          }
        };
        reader.onerror = () => {
          setResumeError('Failed to read resume file.');
          clearInterval(stepInterval);
          setIsUploadingResume(false);
          setUploadStatus('ready');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error(err);
      setResumeError('An error occurred while uploading the file.');
      clearInterval(stepInterval);
      setIsUploadingResume(false);
      setUploadStatus('ready');
    }
  };

  const handleSelectVersion = (versionId: string) => {
    setActiveVersionId(versionId);
    if (versionId === 'master') {
      // Revert to the master user profile details stored
      const savedProfile = localStorage.getItem('career_pulse_profile');
      if (savedProfile) {
        onUpdateProfile(JSON.parse(savedProfile), { isVersionChange: true });
      }
    } else {
      const selectedVer = resumeVersions.find(v => v.id === versionId);
      if (selectedVer) {
        onUpdateProfile({
          ...profile,
          title: selectedVer.title,
          skills: selectedVer.skills,
          resumeText: selectedVer.text,
          education: selectedVer.education || [],
          experience: selectedVer.experience || [],
          projects: selectedVer.projects || [],
          certifications: selectedVer.certifications || []
        }, { isVersionChange: true });
      }
    }
  };

  // Filter jobs based on search query, horizontal scroll tag selection, and advanced slide down filter parameters
  const filteredJobs = jobs.filter(job => {
    // 1. Category scroll-tag matching
    if (selectedCategory !== 'All Jobs') {
      if (selectedCategory === 'Technical') {
        if (job.category !== 'Technical' && job.category !== 'Engineering' && job.category !== 'Remote') return false;
      } else if (selectedCategory === 'Operations') {
        if (job.category !== 'Operations' && job.category !== 'Sales') return false;
      } else if (job.category !== selectedCategory) {
        return false;
      }
    }

    // 2. Search query matching (title, company, location, description, requirements)
    const normalizedQuery = searchQuery.toLowerCase();
    const matchesQuery = 
      job.title.toLowerCase().includes(normalizedQuery) ||
      job.company.toLowerCase().includes(normalizedQuery) ||
      job.location.toLowerCase().includes(normalizedQuery) ||
      job.description.toLowerCase().includes(normalizedQuery) ||
      job.requirements.some((req: string) => req.toLowerCase().includes(normalizedQuery));
    if (!matchesQuery) return false;

    // 3. Location type filter
    if (locationType !== 'All') {
      if (locationType === 'Remote' && !job.location.toLowerCase().includes('remote')) return false;
      if (locationType === 'Onsite' && job.location.toLowerCase().includes('remote')) return false;
    }

    // 4. Salary level filter
    if (salaryFilter !== 'All') {
      const minSalaryMatch = job.salary.match(/\$(\d+)k/);
      if (minSalaryMatch) {
        const minVal = parseInt(minSalaryMatch[1]);
        if (salaryFilter === '150k+' && minVal < 150) return false;
        if (salaryFilter === '<150k' && minVal >= 150) return false;
      }
    }

    // 5. Experience level filter
    const jobExp = normalizeJobExperienceLevel(job);
    if (experienceFilter !== 'All') {
      if (jobExp !== experienceFilter) return false;
    } else if (profileExperienceLevel === 'Senior' && jobExp === 'Fresher') {
      return false;
    } else if (profileExperienceLevel === 'Fresher' && jobExp === 'Senior') {
      return false;
    }

    // 6. No minimum match threshold filter; show all relevant jobs based on experience and profile.
    try {
      const candidateSkills = profile?.skills || [];
      const hasEnoughSkills = candidateSkills.length >= 3 && profileExperienceLevel !== 'Fresher';
      if (hasEnoughSkills) {
        calculateMatchScore(job, candidateSkills, profile?.title, profile?.resumeText);
      }
    } catch (e) {
      // ignore score errors and keep job
    }

    return true;
  });

  // Sort jobs by Match Score if enabled
  const processedJobs = [...filteredJobs].sort((a, b) => {
    if (sortByResumeMatch) {
      const scoreA = calculateMatchScore(a, profile?.skills || [], profile?.title, profile?.resumeText);
      const scoreB = calculateMatchScore(b, profile?.skills || [], profile?.title, profile?.resumeText);
      return scoreB - scoreA;
    }
    return 0; // Maintain default data order
  });

  // If there are no processed jobs due to filters, provide a fallback list of top-scored jobs
  const displayedJobs = (processedJobs.length > 0)
    ? processedJobs
    : [...jobs]
        .map(j => ({ j, score: calculateMatchScore(j, profile?.skills || [], profile?.title, profile?.resumeText) }))
        .sort((a, b) => b.score - a.score)
        .map(x => x.j)
        .slice(0, 10);

  const categories = ['All Jobs', 'Technical', 'Product', 'Design', 'Marketing', 'Operations'];
  const activeAtsAnalysis = getAtsAnalysis(profile);

  return (
    <div className="space-y-6">

      {/* Grid container for Web Application Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: AI Resume Upload & Status Controls */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* AI Resume Upload & Matcher Card - Core Request */}
          <section className="glass-card border-white/10 bg-slate-950/25 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="resume-upload-section">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20">
                AI MATCH ENGINE ACTIVE
              </span>
            </div>
            <h3 className="text-lg font-extrabold tracking-tight text-white leading-tight">
              Resume-Driven Job Search
            </h3>
            <p className="text-white/60 text-xs mt-0.5">
              Upload PDF, Word Doc, or Text to parse skills and instantly query corresponding matches.
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0 items-end">
            {/* Sort by Match Toggle */}
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-white/50 font-medium">Sort by Match</span>
              <button
                type="button"
                onClick={() => setSortByResumeMatch(!sortByResumeMatch)}
                className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                  sortByResumeMatch ? 'bg-indigo-600' : 'bg-white/10'
                }`}
                id="match-sorting-toggle"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    sortByResumeMatch ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Small Status Indicator */}
        <div className="flex flex-col gap-2.5 mb-4 p-3.5 bg-white/5 border border-white/10 rounded-2xl" id="resume-parser-status-bar">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider">
              Parser Engine State
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                isUploadingResume 
                  ? 'bg-indigo-400 animate-ping' 
                  : uploadStatus === 'ready' && profile?.skills && profile.skills.length > 0
                  ? 'bg-emerald-400'
                  : 'bg-white/30'
              }`} />
              <span className="text-xs font-semibold text-white/80">
                {isUploadingResume 
                  ? 'Analyzing Resume...' 
                  : uploadStatus === 'ready' && profile?.skills && profile.skills.length > 0
                  ? 'Resume Loaded'
                  : 'Awaiting Upload'}
              </span>
            </div>
          </div>

          {/* Progress Timeline for Real-Time Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {/* Stage 1: Text Extraction */}
            <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 text-center min-h-[110px] min-w-0 ${
              !isUploadingResume
                ? 'bg-white/[0.02] border-white/5 opacity-60'
                : uploadStep <= 2
                ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-200'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Stage 1</span>
                {isUploadingResume && uploadStep > 2 ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : isUploadingResume && uploadStep <= 2 ? (
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </div>
              <span className="text-sm font-bold text-white break-words whitespace-normal">Extracting text</span>
              <span className="text-[10px] text-white/40 mt-1 break-words whitespace-normal">PDF Plaintext Parse</span>
            </div>

            {/* Stage 2: Skill Analysis */}
            <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 text-center min-h-[110px] min-w-0 ${
              !isUploadingResume
                ? 'bg-white/[0.02] border-white/5 opacity-60'
                : uploadStep < 3
                ? 'bg-white/[0.02] border-white/5 opacity-40'
                : uploadStep <= 5
                ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-200'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Stage 2</span>
                {isUploadingResume && uploadStep > 5 ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : isUploadingResume && uploadStep >= 3 && uploadStep <= 5 ? (
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </div>
              <span className="text-sm font-bold text-white break-words whitespace-normal">Analyzing skills</span>
              <span className="text-[10px] text-white/40 mt-1 break-words whitespace-normal">Gemini Taxonomy</span>
            </div>

            {/* Stage 3: ATS Score Map */}
            <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 text-center min-h-[110px] min-w-0 ${
              !isUploadingResume
                ? 'bg-white/[0.02] border-white/5 opacity-60'
                : uploadStep < 6
                ? 'bg-white/[0.02] border-white/5 opacity-40'
                : uploadStep <= 8
                ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-200 animate-pulse'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Stage 3</span>
                {isUploadingResume && uploadStep > 8 ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : isUploadingResume && uploadStep >= 6 ? (
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </div>
              <span className="text-sm font-bold text-white break-words whitespace-normal">ATS Score Match</span>
              <span className="text-[10px] text-white/40 mt-1 break-words whitespace-normal">Role Calibration</span>
            </div>
          </div>
        </div>

        {/* Drag & Drop File Upload Box */}
        <div className="mb-4 lg:mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-10 text-center transition-all duration-300 relative overflow-hidden group ${
              isDraggingFile
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                : 'border-white/10 bg-slate-950/30 hover:border-indigo-500/50 hover:bg-slate-950/50'
            }`}
            id="resume-drop-zone"
          >
            <input
              type="file"
              id="home-resume-file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
            />
            
            {isUploadingResume ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-white">
                  {uploadStep === 0 && "Connecting to secure parser..."}
                  {uploadStep === 1 && "Scanning format and layout metadata..."}
                  {uploadStep === 2 && "Extracting resume plain-text structures..."}
                  {uploadStep === 3 && "Analyzing experience, education & credentials..."}
                  {uploadStep === 4 && "Extracting skills, tools, and technical competencies..."}
                  {uploadStep === 5 && "Running ATS compatibility matches against available roles..."}
                  {uploadStep === 6 && "Aligning match metrics and rating scores..."}
                  {uploadStep === 7 && "Formulating career-path optimization steps..."}
                  {uploadStep >= 8 && "Finalizing match profiling..."}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {uploadStep <= 3 ? "Gemini AI is reading and parsing your document..." : "Mapping matching coefficients to available positions..."}
                </p>
              </div>
            </div>
          ) : (
            <label htmlFor="home-resume-file" className="cursor-pointer flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-1.5 md:gap-3 mb-6 text-indigo-400 font-bold text-xs select-none bg-slate-950/40 p-3 rounded-xl border border-white/5 w-full max-w-[340px] mx-auto shadow-inner">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center shadow-sm">
                    <FileText className="w-4.5 h-4.5 text-indigo-300" />
                  </div>
                  <span className="text-[9px] text-white/50 font-bold">Resume</span>
                </div>
                <span className="text-white/20 text-xs font-mono select-none">→</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-sm">
                    <RefreshCw className="w-4.5 h-4.5 text-purple-300 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <span className="text-[9px] text-white/50 font-bold">AI Parser</span>
                </div>
                <span className="text-white/20 text-xs font-mono select-none">→</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                  </div>
                  <span className="text-[9px] text-white/50 font-bold">ATS</span>
                </div>
                <span className="text-white/20 text-xs font-mono select-none">→</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm">
                    <Briefcase className="w-4.5 h-4.5 text-emerald-300" />
                  </div>
                  <span className="text-[9px] text-white/50 font-bold">Jobs</span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 flex items-center justify-center mb-3 transition-colors">
                <Upload className="w-5 h-5 text-indigo-300" />
              </div>
              <p className="text-sm font-bold text-white leading-tight">
                Drag and drop your resume file here
              </p>
              <p className="text-xs text-indigo-300 font-semibold hover:underline mt-1.5">
                or click to browse local files
              </p>
              <p className="text-[10px] text-white/40 mt-3">
                Supports PDF, DOCX, DOC, or TXT up to 10MB
              </p>
            </label>
          )}
        </div>
        </div>
          {/* Small inline toast for quick feedback inside HomeTab */}
          {toastMessage && (
            <div className="fixed top-28 right-6 z-50">
              <div className="bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg">{toastMessage}</div>
            </div>
          )}

        {/* Feedback Messages */}
        <AnimatePresence>
          {resumeError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resumeError}</span>
            </motion.div>
          )}

          {resumeSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex flex-col gap-2"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{resumeSuccess}</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/35 active:scale-95 transition-all text-[11px] font-bold text-indigo-200 border border-indigo-500/30 rounded-lg shadow-sm"
                id="upload-another-resume-btn"
              >
                <RefreshCw className="w-3 h-3" />
                Upload Another Resume (Refresh)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Profile Info Panel */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <FileCheck className="w-4.5 h-4.5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate max-w-[180px]">
                {profile.title || "No Profile Headline"}
              </p>
              <p className="text-[10px] text-white/50 truncate">
                ATS Rating: <strong className="text-indigo-300 font-extrabold">{activeAtsAnalysis.score}%</strong> • {profile.skills?.length || 0} skills parsed
              </p>
            </div>
          </div>

          {/* Active Version Selector */}
          {resumeVersions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Active:</span>
              <select
                value={activeVersionId}
                onChange={(e) => handleSelectVersion(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg text-xs px-2.5 py-1.5 outline-none text-white focus:border-indigo-400"
              >
                <option value="master">Default Profile Resume</option>
                {resumeVersions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    {ver.versionName} ({ver.score}% ATS)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>
        </div>

      {/* Right Side: Feed & Recommended Listings Column */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        {/* Hero/Promo Section */}
        <section className="glass-card bg-indigo-950/20 border-white/10 rounded-3xl p-6 text-white relative overflow-hidden group shadow-md">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-md">
          <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-block mb-3 border border-indigo-500/20">
            {sortByResumeMatch ? "MATCHING ALGORITHM ACTIVE" : "STANDARD MODE"}
          </span>
          <h2 className="text-2xl font-bold tracking-tight leading-none mb-1.5">
            {sortByResumeMatch ? "Supercharged matching" : "Explore open listings"}
          </h2>
          <p className="text-white/60 text-xs">
            {sortByResumeMatch 
              ? "Your parsed resume is actively scoring and sorting the industry feed below in real-time."
              : "Showing the standard list of openings. Turn on the switch above to prioritize resume matches."}
          </p>
        </div>
      </section>

      {/* Quick Filters (Horizontal Scroll tags) */}
      <section className="-mx-4 px-4 overflow-x-auto custom-scrollbar flex gap-2 pt-1 pb-1 scroll-smooth">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-full font-medium text-xs shadow-sm transition-all duration-150 border ${
              selectedCategory === cat
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Recommended Jobs List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-white tracking-tight">
            {sortByResumeMatch ? "Top Matches For Your Resume" : "Recommended Jobs"}
          </h3>
          {selectedCategory !== 'All Jobs' && (
            <button 
              onClick={() => setSelectedCategory('All Jobs')}
              className="text-indigo-400 font-semibold text-xs hover:underline"
            >
              View all
            </button>
          )}
        </div>

        {/* Empty State or Job List */}
        {displayedJobs.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center glass-card border-white/10 rounded-2xl shadow-sm">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-white/30" />
            <p className="font-semibold text-white text-sm">No jobs available right now</p>
            <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
              We couldn't find suitable matches — try uploading a more detailed resume or relax filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {isLoading || isUploadingResume ? (
              <>
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
              </>
            ) : (
              displayedJobs.map((job) => {
                const isSaved = savedJobIds.includes(job.id);
                const isApplied = appliedJobIds.includes(job.id);
                const matchScore = calculateMatchScore(job, profile?.skills || [], profile?.title, profile?.resumeText);
                const scoreStyle = getScoreStyle(matchScore);
                const hasProfileData = (profile?.skills?.length || 0) > 0 || !!profile?.resumeText?.trim();
                
                // Skill match analytics based on parsed resume
                const { matched, missing } = getMatchedAndMissingSkills(job, profile?.skills || []);

                // Redesigned salary formatting
                const matchesSalary = job.salary.match(/\$(\d+)k\s*-\s*\$(\d+)k/i);
                let salaryRange = job.salary;
                let salaryMedian = "$145,000";
                if (matchesSalary && matchesSalary[1] && matchesSalary[2]) {
                  const min = parseInt(matchesSalary[1]) * 1000;
                  const max = parseInt(matchesSalary[2]) * 1000;
                  const median = Math.round((min + max) / 2);
                  salaryRange = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
                  salaryMedian = `$${median.toLocaleString()}`;
                }

                return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="glass-card glass-card-hover p-5 border-white/10 rounded-2xl shadow-lg cursor-pointer relative group flex flex-col justify-between"
                  id={`job-card-${job.id}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3.5 items-center min-w-0">
                      {/* Logo Frame */}
                      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-white/10 shrink-0">
                        <img
                          src={job.logoUrl}
                          alt={job.company}
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-base leading-snug group-hover:text-indigo-300 transition-colors truncate">
                          {job.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-white/60 text-xs mt-0.5">
                          <span className="font-medium truncate">{job.company}</span>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <span className="flex items-center gap-0.5 text-white/50 shrink-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {job.location}
                          </span>
                          {job.experienceLevel && (
                            <>
                              <span className="w-1 h-1 bg-white/20 rounded-full" />
                              <span className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-medium border border-indigo-500/20">
                                {job.experienceLevel === 'Fresher' ? 'Entry Level / Fresher' : job.experienceLevel === 'Mid' ? 'Mid Level' : 'Senior Level'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags and Bookmark Box */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Hero Match Score Badge */}
                      {hasProfileData && (
                        <span className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-md transition-all duration-200 group-hover:scale-105 ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border} ${scoreStyle.glow}`}>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          <span className="text-xs font-black tracking-wide">{matchScore}% Match</span>
                        </span>
                      )}

                      {job.badge === 'New' && (
                        <span className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                          New
                        </span>
                      )}
                      {job.badge === 'Hot' && (
                        <span className="flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                          🔥 Hot
                        </span>
                      )}
                      {job.badge && !['New', 'Hot'].includes(job.badge) && (
                        <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 animate-pulse">
                          {job.badge}
                        </span>
                      )}
                      
                      <button
                        onClick={() => onToggleSaveJob(job.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus:outline-none ${
                          isSaved 
                            ? 'text-amber-400 bg-amber-400/20 border border-amber-400/20' 
                            : 'text-white/40 hover:text-white/80 hover:bg-white/10'
                        }`}
                        aria-label={isSaved ? 'Unsave job' : 'Save job'}
                      >
                        {isSaved ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Real-time Parsed Resume Skill Verification Area */}
                  {(matched.length > 0 || missing.length > 0) && (
                    <div className="mt-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl text-[11px] space-y-2">
                      {matched.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-emerald-400 font-extrabold uppercase text-[9px] tracking-wider shrink-0 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">✓ Skill Matches:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {matched.slice(0, 4).map((s) => (
                              <span key={s} className="bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide shadow-sm">
                                {s}
                              </span>
                            ))}
                            {matched.length > 4 && (
                              <span className="text-white/40 text-[10px] pl-0.5">+{matched.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Explicit Explanations to Increase User Trust (Task #4) */}
                      <p className="text-[10px] text-indigo-200/90 leading-relaxed font-sans mt-1 p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                        <Sparkles className="w-3 h-3 text-indigo-400 inline-block mr-1 -mt-0.5 animate-pulse" />
                        {matched.length > 0 ? (
                          <>
                            Matched because your <span className="font-bold text-white">{matched.slice(0, 3).join(', ')}{matched.length > 3 ? ' and other' : ''}</span> skills align with <span className="font-extrabold text-indigo-300 font-space">{matched.length}</span> of <span className="font-bold text-white/70">{matched.length + missing.length}</span> required skills.
                          </>
                        ) : (
                          <>
                            Recommended based on role seniority profile calibration matching your <span className="font-bold text-white">{profile.title || 'career track'}</span> direction.
                          </>
                        )}
                      </p>

                      {missing.length > 0 && sortByResumeMatch && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                          <span className="text-amber-400 font-extrabold uppercase text-[9px] tracking-wider shrink-0 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">⚠ Gaps Identified:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {missing.map((s) => (
                              <span key={s} className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide shadow-sm truncate max-w-[120px]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3.5 pt-3.5 border-t border-white/10 flex justify-between items-center">
                    <div className="flex flex-col text-left">
                      <div className="text-white font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                        <span>💰</span>
                        <span>{salaryRange}</span>
                      </div>
                      <span className="text-[10px] text-white/40 font-medium">
                        Median Value: {salaryMedian}/yr
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectJob(job);
                      }}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                        isApplied
                          ? 'bg-white/5 border border-white/10 text-white/40 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg focus:ring-indigo-500'
                      }`}
                    >
                      {isApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        )}
      </section>
        </div>
      </div>
    </div>
  );
}




