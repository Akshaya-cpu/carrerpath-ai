import React, { useState, useEffect } from 'react';
import { Home, Search, Bookmark, User, Bell, Briefcase, Zap, ChevronUp, ChevronDown, Sparkles, Upload, FileText, Settings } from 'lucide-react';
import Header from './components/Header';
import HomeTab from './components/HomeTab';
import SearchTab from './components/SearchTab';
import SavedTab from './components/SavedTab';
import ProfileTab from './components/ProfileTab';
import AppliedTab from './components/AppliedTab';
import AuthScreen from './components/AuthScreen';
import JobDetailsModal from './components/JobDetailsModal';
import AICoachBubble from './components/AICoachBubble';
import ResumeParseModal from './components/ResumeParseModal';
import CoverLetterModal from './components/CoverLetterModal';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import ContactPage from './components/ContactPage';
import AboutPage from './components/AboutPage';
import { mockJobs } from './data/jobs';
import { Job, UserProfile, JobApplication, Notification, SearchAlert } from './types';
import { calculateMatchScore, validateJobRequirements } from './utils/matchScore';
import { sanitizeUserProfile } from './utils/resumeParser';


export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('career_path_ai_active_tab') || 'home';
  });
  const [profileSubTab, setProfileSubTab] = useState<'profile' | 'coaching' | 'interviews' | 'tools' | undefined>(() => {
    return (localStorage.getItem('career_path_ai_profile_sub_tab') as any) || undefined;
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Quick Actions and Modals States
  const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState<boolean>(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('career_path_ai_logged_in') === 'true';
  });

  // Initialize profile with user's specific mockup matching details
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('career_pulse_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force migration if the saved profile is the old "Sunkara Sampath Kumar" profile,
        // or contains the old school / degree / title from the senior template
        const isOldProfile = 
          parsed.name === 'Sunkara Sampath Kumar' || 
          parsed.email === 'sunkarasampath@gmail.com' ||
          parsed.title === 'Senior frontend engineer' ||
          parsed.title === 'Senior Tech Specialist' ||
          parsed.title === 'B.Tech Graduate & Software Engineer Intern' ||
          parsed.title === 'Senior Product Designer & Frontend Developer' ||
          (parsed.education && parsed.education.some((e: any) => {
            const schoolName = typeof e === 'object' && e !== null ? (e.school || '') : (e || '');
            return schoolName.includes('State Technical University') || schoolName.includes('Interactive Media') || schoolName.includes('Sphoorthy Engineering College');
          }));

        if (!isOldProfile) {
          return parsed;
        }
      } catch (e) {
        // Fallback to default below
      }
    }
    const defaultProfile = {
      name: 'Sunkara Akshaya',
      email: 'sunkaraakshaya11@gmail.com',
      title: 'Senior Software Engineer & Full-Stack Developer',
      skills: ['Python', 'Java', 'SQL', 'React', 'HTML5', 'CSS3', 'Git', 'Data Structures', 'Algorithms', 'TypeScript', 'Node.js', 'AWS'],
      resumeText: 'Experienced Senior Full-Stack Software Engineer with 8+ years of expertise in designing and building scalable web applications. Proficient in Python, Java, JavaScript/TypeScript, React.js, Node.js, and cloud technologies (AWS). Proven track record of leading cross-functional teams, optimizing system performance by 40%, and delivering enterprise-grade solutions. Strong background in database design (SQL), microservices architecture, RESTful APIs, and CI/CD pipelines. Passionate about mentoring junior developers and implementing clean coding practices. Seeking to leverage expertise in a leadership or principal engineer role.',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbAWwMpbTuAXNkpIJt-rJA58sDRLHcrMnIbEVrakGD1qSQoBZ-GbMLc_0S9egMlnx1yz20wzRi2SuaaDfVLoU-t5jX7QIsfingYDVp1m7lxfiFZPlOD-laLGB9Ej5MSaJOe1ZD0V5k9AsQqN4FPLZoc1MzlYI_70mvWtYWMzqWxppr6AyuFC9NAY6M56DUU7RBfQsEyXBxqgy8G4wxi_277d7eplRep1_v8fS7rWkbCDRdXlmwMy2e',
      experienceLevel: 'Senior',
      education: [
        {
          degree: 'Master of Science in Computer Science',
          school: 'University of Technology',
          year: '2020'
        },
        {
          degree: 'B.Tech in Computer Science & Engineering',
          school: 'Sphoorthy Engineering College',
          year: '2018'
        }
      ],
      experience: [
        {
          role: 'Senior Software Engineer',
          company: 'Nebula Systems',
          duration: 'Jan 2022 - Present',
          description: 'Led development of microservices architecture for enterprise platform handling 10M+ daily transactions. Mentored team of 5 junior developers, implementing best practices in code quality and testing. Architected React + Node.js full-stack solutions improving system performance by 40%.'
        },
        {
          role: 'Full-Stack Developer',
          company: 'TechVision Labs',
          duration: 'Jun 2019 - Dec 2021',
          description: 'Developed scalable web applications using React, Node.js, and PostgreSQL. Implemented CI/CD pipelines using GitHub Actions, reducing deployment time by 60%. Optimized database queries resulting in 3x performance improvement.'
        },
        {
          role: 'Junior Developer',
          company: 'StartupHub',
          duration: 'May 2018 - May 2019',
          description: 'Built responsive user interfaces and integrated RESTful APIs. Collaborated with product team to translate requirements into technical solutions.'
        }
      ],
      projects: [
        {
          name: 'AI-Powered Career Matcher',
          description: 'A React-based web application that parses user resume transcripts to dynamically calculate skill synergy metrics against active job opportunities using vector embedding logic.',
          technologies: ['React', 'Python', 'Tailwind CSS', 'SQL']
        }
      ],
      certifications: ['AWS Certified Solutions Architect - Professional', 'Kubernetes Certified Developer', 'Google Cloud Professional Data Engineer', 'AWS Certified Cloud Practitioner']
    };
    
    // Save the default profile into local storage so any subsequent reads or refreshes are clean
    localStorage.setItem('career_pulse_profile', JSON.stringify(defaultProfile));
    return defaultProfile;
  });

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setProfile(userProfile);
    localStorage.setItem('career_path_ai_logged_in', 'true');
    setIsLoggedIn(true);
    
    // Add a welcome notification
    const welcomeNotif: Notification = {
      id: `welcome-${Date.now()}`,
      title: 'Welcome to CareerPath AI',
      body: `Successfully signed in as ${userProfile.name}. Discover personalized career opportunities tailored for you!`,
      time: 'Just now',
      read: false
    };
    setNotifications((curr: Notification[]) => [welcomeNotif, ...curr]);
  };

  const handleLogout = () => {
    localStorage.removeItem('career_path_ai_logged_in');
    localStorage.removeItem('career_path_ai_token');
    setIsLoggedIn(false);
    setActiveTab('home');
    setSelectedJob(null);
  };

  // Saved job IDs list
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('career_pulse_saved');
    return saved ? JSON.parse(saved) : [];
  });

  // Applied job IDs list
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(() => {
    const applied = localStorage.getItem('career_pulse_applied');
    if (applied) return JSON.parse(applied);
    return ['job-1', 'job-2'];
  });

  // Track application details (jobId to application metadata)
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const apps = localStorage.getItem('career_pulse_applications');
    if (apps) return JSON.parse(apps);
    return [
      {
        id: 'app-seed-1',
        jobId: 'job-1',
        appliedAt: '2026-06-25',
        status: 'Interviewing',
        interviewDate: '2026-07-08',
        coverLetter: 'I am extremely excited to apply for the Senior Product Designer role...'
      },
      {
        id: 'app-seed-2',
        jobId: 'job-2',
        appliedAt: '2026-06-28',
        status: 'Applied',
        coverLetter: 'I am highly interested in the Lead Backend position...'
      }
    ];
  });

  // Notifications Feed
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const notifs = localStorage.getItem('career_pulse_notifications');
    if (notifs) {
      try {
        const parsed = JSON.parse(notifs);
        if (parsed.length > 5) return parsed;
      } catch(e) {}
    }

    return [
      {
        id: 'notif-1',
        title: 'High AI Synergy Match!',
        body: 'Nebula Systems posted "Senior Product Designer" matching 92% of your Figma and React skillset.',
        time: '2h ago',
        read: false
      },
      {
        id: 'notif-2',
        title: 'Application Received',
        body: 'Cognito AI confirmed receipt of your Machine Learning profile application.',
        time: '1d ago',
        read: false
      },
      {
        id: 'notif-3',
        title: 'Trending Role',
        body: 'Lead Backend Engineer position at FinTrust Global is experiencing high candidate activity.',
        time: '3d ago',
        read: false
      },
      {
        id: 'notif-4',
        title: 'Resume Parse Completed',
        body: 'Your uploaded PDF resume text has been successfully structured and mapped into key skills.',
        time: '4d ago',
        read: false
      },
      {
        id: 'notif-5',
        title: 'Interview Scheduled',
        body: 'Your interview with ReadmeDocs has been scheduled for next Wednesday.',
        time: '5d ago',
        read: false
      },
      {
        id: 'notif-6',
        title: 'Alert: Remote Design Roles',
        body: '3 new remote design positions matching your Figma criteria are available.',
        time: '5d ago',
        read: false
      },
      {
        id: 'notif-7',
        title: 'Profile Strengths Checked',
        body: 'Your profile strengths checked out at 84% career readiness.',
        time: '6d ago',
        read: false
      },
      {
        id: 'notif-8',
        title: 'Cover Letter Generated',
        body: 'A tailored cover letter for Nebula Systems is ready in your Profile sub-tab.',
        time: '1w ago',
        read: false
      },
      {
        id: 'notif-9',
        title: 'New Match: Technical Copywriter',
        body: 'ReadmeDocs posted "Technical Copywriter & Docs Editor" matching 98% of your resume.',
        time: '1w ago',
        read: false
      },
      {
        id: 'notif-10',
        title: 'Welcome to CareerPath AI',
        body: 'Start by uploading your resume or searching for active market listings.',
        time: '2w ago',
        read: false
      }
    ];
  });

  // Search Alerts State (Persisted in localStorage)
  const [searchAlerts, setSearchAlerts] = useState<SearchAlert[]>(() => {
    const saved = localStorage.getItem('career_pulse_search_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic Jobs State (Fetches real data from the backend database/API)
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);

  // Dark/Light Mode Theme State (Persisted in localStorage)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('career_path_ai_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const response = await fetch('/api/jobs');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        } else {
          setJobs(mockJobs);
        }
      } catch (error) {
        console.error('Error fetching dynamic jobs:', error);
        setJobs(mockJobs);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    localStorage.setItem('career_path_ai_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev: 'dark' | 'light') => prev === 'dark' ? 'light' : 'dark');
  };

  // Persist States to LocalStorage
  useEffect(() => {
    localStorage.setItem('career_pulse_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('career_path_ai_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (profileSubTab) {
      localStorage.setItem('career_path_ai_profile_sub_tab', profileSubTab);
    } else {
      localStorage.removeItem('career_path_ai_profile_sub_tab');
    }
  }, [profileSubTab]);

  useEffect(() => {
    localStorage.setItem('career_pulse_saved', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  useEffect(() => {
    localStorage.setItem('career_pulse_applied', JSON.stringify(appliedJobIds));
  }, [appliedJobIds]);

  useEffect(() => {
    localStorage.setItem('career_pulse_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('career_pulse_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('career_pulse_search_alerts', JSON.stringify(searchAlerts));
  }, [searchAlerts]);

  // Handle Online/Offline Status Tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic search alert checker & simulator connected to the backend
  useEffect(() => {
    const checkAlerts = async () => {
      const activeAlerts = searchAlerts.filter((a: SearchAlert) => a.active);
      if (activeAlerts.length === 0) return;

      // Select a random active alert
      const randomAlert = activeAlerts[Math.floor(Math.random() * activeAlerts.length)];
      const queryLower = randomAlert.query.toLowerCase();

      // Ensure we haven't already checked too recently for this specific alert id
      const keySuffix = `alert_last_checked_${randomAlert.id}`;
      const lastCheck = localStorage.getItem(keySuffix);
      if (lastCheck && Date.now() - parseInt(lastCheck) < 30000) {
        // Debounce alert check to avoid triggering too quickly
        return;
      }
      localStorage.setItem(keySuffix, Date.now().toString());

      try {
        const res = await fetch('/api/gemini/search-alerts/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: randomAlert.query,
            profile: {
              title: profile.title,
              skills: profile.skills,
              summary: profile.resumeText
            }
          })
        });

        if (!res.ok) {
          throw new Error('Backend alert check failed');
        }

        const data = await res.json();
        if (data && data.hasMatch) {
          const newNotif: Notification = {
            id: `notif-backend-${Date.now()}`,
            title: data.notificationTitle || `New Match for "${randomAlert.query}"`,
            body: data.notificationBody,
            time: 'Just now',
            read: false
          };
          setNotifications((curr: Notification[]) => [newNotif, ...curr]);
        }
      } catch (err) {
        console.warn('Backend search alert check failed or bypassed, using local matching fallback:', err);
        // Find jobs in our directory that match
        const matchingJobs = mockJobs.filter((job: Job) => 
          job.title.toLowerCase().includes(queryLower) ||
          job.company.toLowerCase().includes(queryLower) ||
          job.description.toLowerCase().includes(queryLower) ||
          job.requirements.some((req: string) => req.toLowerCase().includes(queryLower))
        );

        if (matchingJobs.length > 0) {
          // Find one matching job that we haven't notified about yet
          const unnotifiedJob = matchingJobs.find((job: Job) => 
            !notifications.some((notif: Notification) => 
              notif.title.includes(randomAlert.query) && 
              notif.body.includes(job.title) &&
              notif.body.includes(job.company)
            )
          );

          if (unnotifiedJob) {
            const newNotif: Notification = {
              id: `notif-alert-${Date.now()}`,
              title: `New Alert Match: "${randomAlert.query}"`,
              body: `We found a new match for your alert criteria! ${unnotifiedJob.company} has a position for "${unnotifiedJob.title}" in ${unnotifiedJob.location} offering ${unnotifiedJob.salary}.`,
              time: 'Just now',
              read: false
            };
            setNotifications((curr: Notification[]) => [newNotif, ...curr]);
          }
        } else {
          // Simulate a new matching job posting dynamically if nothing matches the current directory
          const simulatedCompanies = ['Apex Labs', 'Vortex AI', 'Synthetix Solutions', 'Starlight Media', 'Fintech Labs'];
          const randomCompany = simulatedCompanies[Math.floor(Math.random() * simulatedCompanies.length)];
          const simulatedTitle = randomAlert.query.charAt(0).toUpperCase() + randomAlert.query.slice(1) + " Specialist";
          
          // Ensure we haven't already posted this simulated matching notification
          const alreadySimulated = notifications.some((notif: Notification) => 
            notif.title.includes(randomAlert.query) && 
            notif.body.includes(randomCompany) && 
            notif.body.includes(simulatedTitle)
          );

          if (!alreadySimulated) {
            const newNotif: Notification = {
              id: `notif-sim-${Date.now()}`,
              title: `New Alert Match: "${randomAlert.query}"`,
              body: `Dynamic Listing Match: ${randomCompany} just posted a brand new role matching your criteria: "${simulatedTitle}" (Remote, competitive salary).`,
              time: 'Just now',
              read: false
            };
            setNotifications((curr: Notification[]) => [newNotif, ...curr]);
          }
        }
      }
    };

    const interval = setInterval(checkAlerts, 15000); // Check every 15 seconds to produce responsive alert simulation
    return () => clearInterval(interval);
  }, [searchAlerts, notifications, profile]);

  // Action Handlers
  const handleToggleSearchAlert = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    
    setSearchAlerts((prev: SearchAlert[]) => {
      const exists = prev.find((a: SearchAlert) => a.query.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        // Remove alert
        return prev.filter((a: SearchAlert) => a.query.toLowerCase() !== trimmed.toLowerCase());
      } else {
        // Add alert
        const newAlert: SearchAlert = {
          id: `alert-${Date.now()}`,
          query: trimmed,
          createdAt: new Date().toISOString(),
          active: true
        };
        
        // Add a friendly notification immediately to confirm
        const introNotif: Notification = {
          id: `notif-intro-${Date.now()}`,
          title: 'Search Alert Activated',
          body: `Live search alerts are now active for "${trimmed}". We'll periodically scan the market and notify you here as new roles appear.`,
          time: 'Just now',
          read: false
        };
        setNotifications((curr: Notification[]) => [introNotif, ...curr]);

        return [...prev, newAlert];
      }
    });
  };

  const handleRemoveSearchAlert = (id: string) => {
    setSearchAlerts((prev: SearchAlert[]) => prev.filter((a: SearchAlert) => a.id !== id));
  };
  const handleToggleSaveJob = (jobId: string) => {
    setSavedJobIds((prev: string[]) => {
      const isSaved = prev.includes(jobId);
      if (isSaved) {
        return prev.filter((id: string) => id !== jobId);
      } else {
        // Create an alert notification
        const matchedJob = jobs.find((j: Job) => j.id === jobId) || mockJobs.find((j: Job) => j.id === jobId);
        if (matchedJob) {
          const newNotif: Notification = {
            id: `notif-${Date.now()}`,
            title: 'Job Saved',
            body: `You saved the ${matchedJob.title} position at ${matchedJob.company}.`,
            time: 'Just now',
            read: false
          };
          setNotifications((curr: Notification[]) => [newNotif, ...curr]);
        }
        return [...prev, jobId];
      }
    });
  };

  const handleApplyJob = (jobId: string, coverLetter: string, additionalData?: Partial<JobApplication>) => {
    if (appliedJobIds.includes(jobId)) return;

    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      jobId,
      appliedAt: new Date().toLocaleDateString(),
      status: 'Applied',
      coverLetter,
      ...additionalData
    };

    setApplications((prev: JobApplication[]) => [...prev, newApp]);
    setAppliedJobIds((prev: string[]) => [...prev, jobId]);

    // Create a notification
    const matchedJob = jobs.find((j: Job) => j.id === jobId) || mockJobs.find((j: Job) => j.id === jobId);
    if (matchedJob) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        title: 'Applied Successfully!',
        body: `Your application has been submitted to ${matchedJob.company} for the ${matchedJob.title} role.`,
        time: 'Just now',
        read: false
      };
      setNotifications((curr: Notification[]) => [newNotif, ...curr]);
    }
  };

  const handleWithdrawApplication = (jobId: string) => {
    setApplications((prev: JobApplication[]) => prev.filter((app: JobApplication) => app.jobId !== jobId));
    setAppliedJobIds((prev: string[]) => prev.filter((id: string) => id !== jobId));

    const matchedJob = jobs.find((j: Job) => j.id === jobId) || mockJobs.find((j: Job) => j.id === jobId);
    if (matchedJob) {
      const newNotif: Notification = {
        id: `notif-withdrawn-${Date.now()}`,
        title: 'Application Withdrawn',
        body: `You withdrew your application for the ${matchedJob.title} position at ${matchedJob.company}.`,
        time: 'Just now',
        read: false
      };
      setNotifications((curr: Notification[]) => [newNotif, ...curr]);
    }
  };

  const handleUpdateApplicationStatus = (jobId: string, status: JobApplication['status']) => {
    setApplications((prev: JobApplication[]) => prev.map((app: JobApplication) => app.jobId === jobId ? { ...app, status } : app));

    // Create a notification for status change
    const matchedJob = jobs.find((j: Job) => j.id === jobId) || mockJobs.find((j: Job) => j.id === jobId);
    if (matchedJob) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        title: 'Application Status Updated',
        body: `Your application status for ${matchedJob.title} at ${matchedJob.company} is now "${status}".`,
        time: 'Just now',
        read: false
      };
      setNotifications((curr: Notification[]) => [newNotif, ...curr]);
    }
  };

  const handleUpdateApplicationInterviewDate = (jobId: string, interviewDate: string) => {
    setApplications((prev: JobApplication[]) => prev.map((app: JobApplication) => app.jobId === jobId ? { ...app, status: 'Interviewing', interviewDate } : app));

    // Create a notification for interview scheduled
    const matchedJob = jobs.find((j: Job) => j.id === jobId) || mockJobs.find((j: Job) => j.id === jobId);
    if (matchedJob) {
      const newNotif: Notification = {
        id: `notif-int-${Date.now()}`,
        title: 'Interview Scheduled',
        body: `Your interview for ${matchedJob.title} at ${matchedJob.company} has been scheduled for ${interviewDate}.`,
        time: 'Just now',
        read: false
      };
      setNotifications((curr: Notification[]) => [newNotif, ...curr]);
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev: Notification[]) => prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const runAutoApply = async (updatedProfile: UserProfile, options?: { showNoMatchesNotif?: boolean }) => {
    // 1. Get eligible jobs (not already applied to)
    const eligibleJobs = jobs.filter((job: Job) => !appliedJobIds.includes(job.id));
    if (eligibleJobs.length === 0) return;

    // 2. Score and explicitly validate jobs against the uploaded resume content (seniority, experience, role fit)
    const validationResults: { job: Job; reason: string }[] = [];

    const matches = eligibleJobs.map((job: Job) => {
      const score = calculateMatchScore(job, updatedProfile.skills, updatedProfile.title, updatedProfile.resumeText);
      const validation = validateJobRequirements(job, updatedProfile);
      
      if (!validation.isValid && score >= 60) {
        validationResults.push({ job, reason: validation.reason || '' });
      }

      return {
        job,
        score,
        isValid: validation.isValid,
        validationReason: validation.reason
      };
    })
    .filter((item: any) => item.score >= 60 && item.isValid)
    .sort((a: any, b: any) => b.score - a.score);

    // Notify the user about high-matching jobs that were safely skipped due to explicit criteria
    if (validationResults.length > 0) {
      const skippedNotif: Notification = {
        id: `notif-auto-apply-skipped-${Date.now()}`,
        title: 'Auto-Apply Protection Active 🛡️',
        body: `Protected your application flow by skipping ${validationResults.length} position(s) (including ${validationResults.map((r: any) => r.job.title).join(', ')}) due to seniority/experience mismatch with your resume.`,
        time: 'Just now',
        read: false
      };
      setNotifications((curr: Notification[]) => [skippedNotif, ...curr]);
    }

    if (matches.length === 0) {
      if (options?.showNoMatchesNotif) {
        const infoNotif: Notification = {
          id: `notif-auto-apply-none-${Date.now()}`,
          title: 'Auto-Apply Scan Completed',
          body: 'No available jobs met the 60% high-match threshold and passed all strict experience/role-fit validation checks for automatic application.',
          time: 'Just now',
          read: false
        };
        setNotifications((curr: Notification[]) => [infoNotif, ...curr]);
      }
      return;
    }

    // Limit to top 3 auto-apply positions to avoid overwhelming the user
    const topMatches = matches.slice(0, 3);

    // Let the user know the auto-apply engine has started
    const startNotif: Notification = {
      id: `notif-auto-apply-start-${Date.now()}`,
      title: 'Auto-Apply Engine Running 🚀',
      body: `Identified ${topMatches.length} validated high-match positions aligned with your resume. Tailoring custom cover letters and submitting applications...`,
      time: 'Just now',
      read: false
    };
    setNotifications((curr: Notification[]) => [startNotif, ...curr]);

    // Apply to matches instantly in the local state, so the user sees them "Applied" immediately!
    const newApps: JobApplication[] = [];
    const newJobIds: string[] = [];

    topMatches.forEach((match: any) => {
      const { job, score } = match;
      const defaultCoverLetter = `Dear Hiring Team at ${job.company},\n\nI am thrilled to submit my automatic application for the ${job.title} role. Having reviewed your requirements (including ${job.requirements.slice(0, 3).join(', ')}), I am confident that my experience with ${updatedProfile.skills.slice(0, 4).join(', ')} matches perfectly, earning an ATS compatibility rating of ${score}%.\n\nThank you for considering my application.\n\nBest regards,\n${updatedProfile.name}`;

      const newApp: JobApplication = {
        id: `app-auto-${Date.now()}-${job.id}`,
        jobId: job.id,
        appliedAt: new Date().toLocaleDateString(),
        status: 'Applied',
        coverLetter: defaultCoverLetter
      };

      newApps.push(newApp);
      newJobIds.push(job.id);
    });

    // Batch update applications and appliedJobIds state instantly!
    setApplications((prev: JobApplication[]) => {
      const filtered = prev.filter((app: JobApplication) => !newJobIds.includes(app.jobId));
      return [...filtered, ...newApps];
    });

    setAppliedJobIds((prev: string[]) => {
      const filtered = prev.filter(id => !newJobIds.includes(id));
      return [...filtered, ...newJobIds];
    });

    // Create success notifications and trigger background cover letter generation
    topMatches.forEach((match: any) => {
      const { job, score } = match;

      const successNotif: Notification = {
        id: `notif-auto-success-${Date.now()}-${job.id}`,
        title: `Auto-Applied: ${job.title} @ ${job.company}`,
        body: `Successfully applied automatically with a high ATS Match score of ${score}%! A tailored cover letter was drafted.`,
        time: 'Just now',
        read: false
      };
      setNotifications((curr: Notification[]) => [successNotif, ...curr]);

      // Fire-and-forget async fetch to generate beautiful custom cover letter via Gemini
      fetch('/api/gemini/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedProfile.name,
          skills: updatedProfile.skills,
          resumeText: updatedProfile.resumeText,
          jobTitle: job.title,
          company: job.company,
          requirements: job.requirements
        })
      })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (data.coverLetter) {
            setApplications((prev: JobApplication[]) => prev.map((app: JobApplication) => 
              app.jobId === job.id ? { ...app, coverLetter: data.coverLetter } : app
            ));
          }
        }
      })
      .catch(err => {
        console.warn('Cover letter tailoring background call failed/timed out, using standard template.', err);
      });
    });
  };

  const handleUpdateProfile = (updatedProfile: UserProfile, options?: { isResumeUpload?: boolean; isVersionChange?: boolean }) => {
    // Sanitize profile to ensure absolute distinction between hard tech skills and summaries
    const sanitizedProfile = sanitizeUserProfile(updatedProfile, updatedProfile.resumeText || '');
    setProfile(sanitizedProfile);
    
    // Explicitly write to localStorage to guarantee it is saved before any potential reload/unload
    localStorage.setItem('career_pulse_profile', JSON.stringify(sanitizedProfile));
    
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      title: 'Profile Updated',
      body: 'Your professional credentials and resume summary were updated.',
      time: 'Just now',
      read: false
    };
    setNotifications((curr: Notification[]) => {
      const updated = [newNotif, ...curr];
      localStorage.setItem('career_pulse_notifications', JSON.stringify(updated));
      return updated;
    });

    // Save notification update but do not reload the page automatically, keeping the transition seamless and responsive.
  };

  // Mobile Swipe Gesture Event Handlers
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const difference = touchStartX - touchEndX;
    const minSwipeDistance = 65; // pixels

    const tabs = ['home', 'search', 'saved', 'applied', 'profile'];
    const currentIndex = tabs.indexOf(activeTab);

    if (difference > minSwipeDistance) {
      // Swiped Left -> Navigate forward (Next Tab)
      const nextIndex = Math.min(tabs.length - 1, currentIndex + 1);
      setActiveTab(tabs[nextIndex]);
      setSelectedJob(null);
    } else if (difference < -minSwipeDistance) {
      // Swiped Right -> Navigate backward (Prev Tab)
      const prevIndex = Math.max(0, currentIndex - 1);
      setActiveTab(tabs[prevIndex]);
      setSelectedJob(null);
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (!isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen text-white flex flex-col font-sans pb-24 md:pb-12 relative">
      {/* Mesh Background */}
      <div className="mesh-bg" />

      {/* Left Sidebar for Desktop Web Layout */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-[#0E1628]/95 backdrop-blur-[30px] border-r border-[#293548] z-40 p-6">
        {/* Sidebar Brand Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6] fill-[#8B5CF6]/20 animate-pulse" />
          </div>
          <span 
            onClick={() => setActiveTab('home')}
            className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent cursor-pointer flex items-center gap-1.5"
            id="sidebar-title"
          >
            CareerPath AI
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 uppercase tracking-widest scale-90 origin-left">
              Beta
            </span>
          </span>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 space-y-1.5 text-left">
          <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest px-4 mb-3.5 mt-1">
            MAIN MENU
          </p>

          <button
            onClick={() => { setActiveTab('home'); setSelectedJob(null); }}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-250 font-semibold text-sm ${
              activeTab === 'home'
                ? 'text-white bg-[#6366F1] border-l-4 border-l-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.35)] font-bold pl-3'
                : 'text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1.5 font-semibold pl-4'
            }`}
            id="sidebar-home-btn"
          >
            <Home className="w-4 h-4 text-indigo-400" />
            <span>Home Feed</span>
          </button>

          <button
            onClick={() => { setActiveTab('search'); setSelectedJob(null); }}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-250 font-semibold text-sm ${
              activeTab === 'search'
                ? 'text-white bg-[#6366F1] border-l-4 border-l-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.35)] font-bold pl-3'
                : 'text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1.5 font-semibold pl-4'
            }`}
            id="sidebar-search-btn"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>AI Search & Market</span>
          </button>

          <button
            onClick={() => { setActiveTab('saved'); setSelectedJob(null); }}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-250 font-semibold text-sm ${
              activeTab === 'saved'
                ? 'text-white bg-[#6366F1] border-l-4 border-l-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.35)] font-bold pl-3'
                : 'text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1.5 font-semibold pl-4'
            }`}
            id="sidebar-saved-btn"
          >
            <div className="flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <span>Saved Jobs</span>
            </div>
            {savedJobIds.length > 0 && (
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30">
                {savedJobIds.length}
              </span>
            )}
          </button>
 
          <button
            onClick={() => { setActiveTab('applied'); setSelectedJob(null); }}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-250 font-semibold text-sm ${
              activeTab === 'applied'
                ? 'text-white bg-[#6366F1] border-l-4 border-l-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.35)] font-bold pl-3'
                : 'text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1.5 font-semibold pl-4'
            }`}
            id="sidebar-applied-btn"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Applications</span>
            </div>
            {applications.length > 0 && (
              <span className="bg-[#8B5CF6]/20 text-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#8B5CF6]/30">
                {applications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setSelectedJob(null); setProfileSubTab('profile'); }}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-250 font-semibold text-sm ${
              activeTab === 'profile'
                ? 'text-white bg-[#6366F1] border-l-4 border-l-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.35)] font-bold pl-3'
                : 'text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1.5 font-semibold pl-4'
            }`}
            id="sidebar-profile-btn"
          >
            <User className="w-4 h-4 text-indigo-400" />
            <span>Profile & Tools</span>
          </button>
        </div>

        {/* Quick Actions Component */}
        <div className="relative mb-6 mt-4 z-30 text-left">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
            id="sidebar-quick-actions-btn"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span className="uppercase tracking-wider font-extrabold text-[11px]">Quick Actions</span>
            </span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickActions ? 'rotate-180' : ''}`} />
          </button>

          {showQuickActions && (
            <div className="absolute bottom-full left-0 mb-2.5 w-full bg-slate-950/95 border border-white/10 rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest px-3.5 py-1.5 border-b border-white/5 mb-1.5">
                AI Accelerators
              </p>
              
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  setIsResumeModalOpen(true);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
                id="qa-resume-parse-btn"
              >
                <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Trigger AI Resume Parse</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActions(false);
                  setIsCoverLetterModalOpen(true);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
                id="qa-cover-letter-btn"
              >
                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Cover Letter Generator</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActions(false);
                  setActiveTab('profile');
                  setProfileSubTab('profile');
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
                id="qa-profile-settings-btn"
              >
                <Settings className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Jump to Profile Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* User Account Vertical Profile Card at Sidebar Bottom */}
        <div className="mt-auto pt-5 border-t border-white/10 flex flex-col items-center text-center space-y-3.5">
          {/* Photo */}
          <div className="relative group">
            <img
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-xl shadow-indigo-500/10 hover:scale-[1.03] transform transition-transform"
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-md animate-pulse" />
          </div>

          {/* Name & Role */}
          <div className="w-full">
            <p className="text-xs font-extrabold text-white tracking-wide font-sora truncate">{profile.name}</p>
            <p className="text-[10px] text-indigo-300 font-bold truncate mt-0.5">{profile.title || "Tech Professional"}</p>
          </div>

          {/* Availability Status */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-extrabold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Available for Roles</span>
          </div>

          {/* ATS Strength Score */}
          <div className="w-full flex items-center justify-between px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px]">
            <span className="text-white/40 font-bold uppercase tracking-wider text-[8px]">ATS Strength</span>
            <span className="font-extrabold text-emerald-400 text-[11px] font-space">98% Match</span>
          </div>

          {/* Profile Completion Progress */}
          <div className="w-full space-y-1.5 text-left">
            <div className="flex justify-between items-center text-[8px] uppercase tracking-wider font-bold text-white/45">
              <span>Profile Completion</span>
              <span className="text-indigo-400 font-space font-extrabold">85%</span>
            </div>
            <div className="progress-bar w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[85%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Top App Header */}
      <Header
        profile={profile}
        activeTab={activeTab}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Tab Screen Area with Touch Gesture Bindings */}
      <main 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 pt-24 px-6 md:px-10 max-w-[1440px] w-full mx-auto md:pl-72 animate-in fade-in duration-150 relative z-10 touch-pan-y"
      >
        {/* Offline Connection Status Banner */}
        {!isOnline && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3 mb-6 animate-in slide-in-from-top duration-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 mt-1.5" />
            <div className="text-left text-xs">
              <p className="font-bold text-amber-300">Offline Mode Active</p>
              <p className="text-amber-400/80 mt-1 leading-relaxed">Your saved jobs, application status, and multiple resume histories are fully accessible offline. Any profile edits are securely persisted in local storage.</p>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <HomeTab
            jobs={jobs}
            isLoading={isLoadingJobs}
            profile={profile}
            savedJobIds={savedJobIds}
            appliedJobIds={appliedJobIds}
            onSelectJob={setSelectedJob}
            onToggleSaveJob={handleToggleSaveJob}
            onApplyJob={(id) => handleApplyJob(id, '')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab
            jobs={jobs}
            profile={profile}
            onSelectJob={setSelectedJob}
            searchAlerts={searchAlerts}
            onToggleSearchAlert={handleToggleSearchAlert}
            onRemoveSearchAlert={handleRemoveSearchAlert}
            savedJobIds={savedJobIds}
          />
        )}

        {activeTab === 'saved' && (
          <SavedTab
            jobs={jobs}
            savedJobIds={savedJobIds}
            appliedJobIds={appliedJobIds}
            onSelectJob={setSelectedJob}
            onRemoveSave={handleToggleSaveJob}
            profile={profile}
          />
        )}

        {activeTab === 'applied' && (
          <AppliedTab
            jobs={jobs}
            applications={applications}
            onSelectJob={setSelectedJob}
            onUpdateStatus={handleUpdateApplicationStatus}
            onUpdateInterviewDate={handleUpdateApplicationInterviewDate}
            onWithdrawApplication={handleWithdrawApplication}
            profile={profile}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            savedJobs={jobs.filter(job => savedJobIds.includes(job.id))}
            applications={applications}
            jobs={jobs}
            onUpdateInterviewDate={handleUpdateApplicationInterviewDate}
            initialSubTab={profileSubTab}
          />
        )}

        {activeTab === 'privacy' && <PrivacyPage />}
        {activeTab === 'terms' && <TermsPage />}
        {activeTab === 'contact' && <ContactPage />}
        {activeTab === 'about' && <AboutPage />}
      </main>

      <footer className="border-t border-white/10 bg-[#070B17]/95 py-4 px-6 md:px-10 text-sm text-white/70">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-[12px] text-white/50">CareerPath AI © 2026. Crafted for smarter career growth.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[12px]">
            <button onClick={() => setActiveTab('privacy')} className="text-white/70 hover:text-white transition-colors">Privacy</button>
            <button onClick={() => setActiveTab('terms')} className="text-white/70 hover:text-white transition-colors">Terms</button>
            <button onClick={() => setActiveTab('contact')} className="text-white/70 hover:text-white transition-colors">Contact</button>
            <button onClick={() => setActiveTab('about')} className="text-white/70 hover:text-white transition-colors">About</button>
          </div>
        </div>
      </footer>

      {/* Slide-Up Bottom Navigation Bar matching user mockup - visible on mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/45 backdrop-blur-xl border-t border-white/10 z-40 flex items-center justify-around px-4">
        <button
          onClick={() => { setActiveTab('home'); setSelectedJob(null); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-indigo-300 bg-white/10 border border-white/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          id="nav-home-btn"
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Home</span>
        </button>

        <button
          onClick={() => { setActiveTab('search'); setSelectedJob(null); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
            activeTab === 'search'
              ? 'text-indigo-300 bg-white/10 border border-white/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          id="nav-search-btn"
        >
          <Search className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Search</span>
        </button>

        <button
          onClick={() => { setActiveTab('saved'); setSelectedJob(null); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
            activeTab === 'saved'
              ? 'text-indigo-300 bg-white/10 border border-white/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          id="nav-saved-btn"
        >
          <Bookmark className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Saved</span>
        </button>

        <button
          onClick={() => { setActiveTab('applied'); setSelectedJob(null); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
            activeTab === 'applied'
              ? 'text-indigo-300 bg-white/10 border border-white/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          id="nav-applied-btn"
        >
          <Briefcase className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Applied</span>
        </button>

        <button
          onClick={() => { setActiveTab('profile'); setSelectedJob(null); setProfileSubTab('profile'); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'text-indigo-300 bg-white/10 border border-white/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          id="nav-profile-btn"
        >
          <User className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Profile</span>
        </button>
      </nav>

      {/* Mobile Quick Actions Floating Trigger Button */}
      <div className="md:hidden fixed bottom-20 left-4 z-40">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-[0.93] transition-all cursor-pointer"
          id="mobile-quick-actions-fab"
        >
          <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
        </button>

        {showQuickActions && (
          <div className="absolute bottom-14 right-0 w-56 bg-slate-950/95 border border-white/10 rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest px-3.5 py-1.5 border-b border-white/5 mb-1.5 text-left">
              AI Accelerators
            </p>
            
            <button
              onClick={() => {
                setShowQuickActions(false);
                setIsResumeModalOpen(true);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-white/75 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold text-left"
              id="mobile-qa-resume-parse-btn"
            >
              <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Trigger AI Resume Parse</span>
            </button>

            <button
              onClick={() => {
                setShowQuickActions(false);
                setIsCoverLetterModalOpen(true);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-white/75 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold text-left"
              id="mobile-qa-cover-letter-btn"
            >
              <FileText className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Cover Letter Generator</span>
            </button>

            <button
              onClick={() => {
                setShowQuickActions(false);
                setActiveTab('profile');
                setProfileSubTab('profile');
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-white/75 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold text-left"
              id="mobile-qa-profile-settings-btn"
            >
              <Settings className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Jump to Profile Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Slid Sheet / Modal Detail View */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          profile={profile}
          isApplied={appliedJobIds.includes(selectedJob.id)}
          isSaved={savedJobIds.includes(selectedJob.id)}
          onToggleSave={handleToggleSaveJob}
          application={applications.find(app => app.jobId === selectedJob.id)}
          onUpdateStatus={handleUpdateApplicationStatus}
          onApply={handleApplyJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Quick AI Resume Parser Modal */}
      {isResumeModalOpen && (
        <ResumeParseModal
          onClose={() => setIsResumeModalOpen(false)}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Quick AI Cover Letter Generator Modal */}
      {isCoverLetterModalOpen && (
        <CoverLetterModal
          onClose={() => setIsCoverLetterModalOpen(false)}
          profile={profile}
          jobs={mockJobs}
          applications={applications}
          onApply={handleApplyJob}
          onUpdateStatus={handleUpdateApplicationStatus}
        />
      )}

      {/* Floating AI Career Coach Bubble */}
      <AICoachBubble profile={profile} />
    </div>
  );
}
