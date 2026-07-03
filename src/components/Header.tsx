import { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, X, Search, Briefcase, Bookmark, Code, FileText, User, Calendar, ArrowRight, Star, Sun, Moon } from 'lucide-react';
import { Notification, UserProfile, Job, JobApplication } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  profile: UserProfile;
  activeTab?: string;
  notifications: Notification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearNotifications: () => void;
  setActiveTab: (tab: string) => void;
  savedJobs: Job[];
  applications: JobApplication[];
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onSelectProfileSection: (section: 'profile' | 'coaching' | 'interviews' | 'tools') => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function Header({
  profile,
  activeTab = 'home',
  notifications,
  onMarkNotificationAsRead,
  onClearNotifications,
  setActiveTab,
  savedJobs,
  applications,
  jobs,
  onSelectJob,
  onSelectProfileSection,
  theme = 'dark',
  onToggleTheme
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = notifications.filter(n => !n.read).length;

  const tabDetails: { [key: string]: { title: string; subtitle: string } } = {
    home: { title: 'Home Feed', subtitle: 'Personalized job matches powered by your resume' },
    search: { title: 'AI Search & Market', subtitle: 'Discover open roles and establish intelligent market alerts' },
    saved: { title: 'Saved Jobs', subtitle: 'Track and organize your bookmarked opportunities' },
    applied: { title: 'Applications Tracker', subtitle: 'Monitor progress and active interviews across your submissions' },
    profile: { title: 'Profile & Tools', subtitle: 'Manage your resume taxonomy, cover letters, and career roadmaps' }
  };

  const currentTabInfo = tabDetails[activeTab] || tabDetails.home;

  // Listen to keyboard shortcut (⌘K or Ctrl+K or / key when not inside an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.hasAttribute('contenteditable')
      );

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset search query when search closes
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  // Extract a 50-character matched snippet from resumeText
  const getResumeSnippet = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return "Matched in your resume text";
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + query.length + 20);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return snippet;
  };

  // 1. Matched Saved Jobs
  const matchedSavedJobs = searchQuery.trim() === '' ? [] : savedJobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Matched Applications
  const matchedApplications = searchQuery.trim() === '' ? [] : applications.filter(app => {
    const job = jobs.find(j => j.id === app.jobId);
    if (!job) return false;
    return (
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.coverLetter && app.coverLetter.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }).map(app => {
    const job = jobs.find(j => j.id === app.jobId)!;
    return { app, job };
  });

  // 3. Matched Profile Content
  interface ProfileMatch {
    type: 'skill' | 'headline' | 'contact' | 'resume';
    title: string;
    subtitle: string;
    section: 'profile' | 'coaching' | 'interviews' | 'tools';
  }

  const getProfileMatches = (): ProfileMatch[] => {
    if (searchQuery.trim() === '') return [];
    const matches: ProfileMatch[] = [];
    const query = searchQuery.toLowerCase();

    // Name / Email Match
    if (profile.name.toLowerCase().includes(query) || profile.email.toLowerCase().includes(query)) {
      matches.push({
        type: 'contact',
        title: profile.name,
        subtitle: profile.email,
        section: 'profile'
      });
    }

    // Headline Match
    if (profile.title.toLowerCase().includes(query)) {
      matches.push({
        type: 'headline',
        title: 'Headline Match',
        subtitle: profile.title,
        section: 'profile'
      });
    }

    // Skills Match
    profile.skills.forEach(skill => {
      if (skill.toLowerCase().includes(query)) {
        matches.push({
          type: 'skill',
          title: `Skill: ${skill}`,
          subtitle: 'Matches your professional skills matrix',
          section: 'profile'
        });
      }
    });

    // Resume Text Match
    if (profile.resumeText.toLowerCase().includes(query)) {
      matches.push({
        type: 'resume',
        title: 'Resume Content Match',
        subtitle: getResumeSnippet(profile.resumeText, searchQuery),
        section: 'tools'
      });
    }

    return matches;
  };

  const matchedProfileItems = getProfileMatches();
  const totalMatchesCount = matchedSavedJobs.length + matchedApplications.length + matchedProfileItems.length;

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-[72px] bg-[#070B17]/95 backdrop-blur-[30px] border-b border-[#293548] z-40 px-6 md:px-10 flex items-center justify-between">
      {/* Left side: Avatar & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('profile')}
          className="w-9 h-9 md:hidden rounded-full overflow-hidden border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:opacity-90 transition-opacity"
          id="header-profile-btn"
        >
          <img
            className="w-full h-full object-cover"
            src={profile.avatarUrl}
            alt={profile.name}
            referrerPolicy="no-referrer"
          />
        </button>
        <span 
          onClick={() => setActiveTab('home')}
          className="font-bold text-xl text-white tracking-tight cursor-pointer hover:text-indigo-400 transition-colors flex md:hidden items-center gap-1.5"
          id="header-title"
        >
          CareerPath AI
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
        </span>

        {/* Desktop Header Title & Subtitle block */}
        <div className="hidden md:flex flex-col text-left">
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">
            {currentTabInfo.title}
          </h1>
          <p className="text-[11px] text-white/50 leading-tight mt-0.5 font-medium">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Global 'Quick Find' Search Bar */}
      <div className="flex-1 max-w-[500px] mx-4 hidden sm:block">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between text-left px-4 py-2.5 rounded-2xl border border-[#273549] bg-[#111827] hover:bg-[#1f2c45]/50 hover:border-[#2d3c52] hover:scale-[1.01] active:scale-[0.99] transition-all text-white/40 text-xs shadow-inner cursor-pointer"
          id="quick-find-trigger-btn"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Search jobs, skills, or applications...</span>
          </div>
          <kbd className="bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono text-white/50">⌘K</kbd>
        </button>
      </div>

      {/* Right side: Search Icon (Mobile) & Notifications */}
      <div className="flex items-center gap-1">
        {/* Mobile Quick Find Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-10 h-10 sm:hidden flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          aria-label="Quick find search"
          id="quick-find-mobile-btn"
        >
          <Search className="w-5 h-5 text-indigo-400" />
        </button>

        {/* Dark/Light Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          id="theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-400" />
          )}
        </button>

        <div className="relative">
          {/* Notifications Trigger */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors relative"
            id="header-notification-btn"
            aria-label="Toggle notifications"
          >
            <Bell className="w-5 h-5 text-white/80 hover:text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-950 shadow-md">
                <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-card border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-medium border border-indigo-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={onClearNotifications}
                    className="text-xs text-white/50 hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-400">
                      <Bell className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-xs font-bold text-white leading-none">No New Notifications</p>
                    <p className="text-[10px] text-white/50 max-w-[200px] mx-auto leading-normal">
                      We'll alert you here when new jobs match your profile skills or when your active applications receive status updates.
                    </p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationAsRead(notif.id)}
                      className={`p-3.5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${
                        !notif.read ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className="mt-0.5 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-indigo-300 shrink-0 border border-white/5">
                        {notif.title.includes('Match') ? (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs ${!notif.read ? 'font-semibold text-white' : 'text-white/85'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-white/40 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{notif.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-2 bg-slate-950/40 border-t border-white/10 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-indigo-300 font-medium hover:text-indigo-200 p-1 block w-full cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Command Palette Dialog Modal with blur and fade */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 overflow-hidden">
            {/* Dark translucent backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Centered search box card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg glass-card border border-white/15 bg-slate-900/95 rounded-2xl shadow-2xl flex flex-col max-h-[460px] overflow-hidden z-10"
              id="quick-find-modal"
            >
              {/* Dynamic decorative light accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Search Bar Input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10 relative z-10">
                <Search className="w-5 h-5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved jobs, applications, skills, resume..."
                  className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-white/30 focus:ring-0"
                  id="quick-find-search-input"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Search (Esc)"
                  id="quick-find-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search results body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar relative z-10 min-h-[150px]">
                {/* 1. Empty query search helper instructions / suggestions */}
                {searchQuery.trim() === '' && (
                  <div className="space-y-4 py-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase block px-2 mb-2">
                        Quick Suggestions
                      </span>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setActiveTab('saved');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-medium">Browse Saved Positions</span>
                          </div>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/50 border border-white/5">
                            {savedJobs.length} jobs
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('applied');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Briefcase className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-medium">View My Job Applications</span>
                          </div>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/50 border border-white/5">
                            {applications.length} apps
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            onSelectProfileSection('coaching');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-medium">Consult AI Career Coach</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                        </button>

                        <button
                          onClick={() => {
                            onSelectProfileSection('profile');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <User className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-medium">Analyze ATS Match Rate</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                        </button>

                        <button
                          onClick={() => {
                            onSelectProfileSection('interviews');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-medium">Review Scheduled Interviews</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex gap-2 items-start">
                      <FileText className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-white/80">Broad simultaneous queries</p>
                        <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">Type any keyword (e.g., skill, status, company, role title) to retrieve matching saved jobs, interactive applications, and specific parsed resume segments instantly.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Matches found */}
                {searchQuery.trim() !== '' && totalMatchesCount > 0 && (
                  <div className="space-y-4">
                    {/* Saved Jobs Matches Section */}
                    {matchedSavedJobs.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase block px-2 mb-1.5 flex items-center gap-1.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          Saved Positions ({matchedSavedJobs.length})
                        </span>
                        <div className="space-y-1">
                          {matchedSavedJobs.map(job => (
                            <button
                              key={job.id}
                              onClick={() => {
                                onSelectJob(job);
                                setIsSearchOpen(false);
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 flex items-start justify-between gap-3 group transition-colors cursor-pointer"
                            >
                              <div className="flex gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden text-indigo-300 font-bold text-xs">
                                  {job.logoUrl ? (
                                    <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    job.company[0]
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                    {job.title}
                                  </p>
                                  <p className="text-[10px] text-white/50 mt-0.5">
                                    {job.company} &bull; {job.location}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[9px] font-semibold bg-amber-400/10 border border-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                                {job.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Applications Matches Section */}
                    {matchedApplications.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase block px-2 mb-1.5 flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-emerald-400" />
                          Job Applications ({matchedApplications.length})
                        </span>
                        <div className="space-y-1">
                          {matchedApplications.map(({ app, job }) => {
                            const isInterviewing = app.status === 'Interviewing';
                            const isOffered = app.status === 'Offered';
                            const statusColorClass = isOffered 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : isInterviewing 
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                                : 'bg-white/10 border-white/10 text-white/60';

                            return (
                              <button
                                key={app.id}
                                onClick={() => {
                                  onSelectJob(job);
                                  setIsSearchOpen(false);
                                }}
                                className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 flex items-start justify-between gap-3 group transition-colors cursor-pointer"
                              >
                                <div className="flex gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden text-indigo-300 font-bold text-xs">
                                    {job.logoUrl ? (
                                      <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      job.company[0]
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                      {job.title}
                                    </p>
                                    <p className="text-[10px] text-white/50 mt-0.5">
                                      {job.company} &bull; Applied: {app.appliedAt}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full shrink-0 ${statusColorClass}`}>
                                  {app.status}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Profile Matches Section */}
                    {matchedProfileItems.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase block px-2 mb-1.5 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-indigo-400" />
                          Profile &amp; Career Content ({matchedProfileItems.length})
                        </span>
                        <div className="space-y-1">
                          {matchedProfileItems.map((item, index) => {
                            const ItemIcon = 
                              item.type === 'skill' ? Code :
                              item.type === 'resume' ? FileText :
                              item.type === 'headline' ? Briefcase : User;
                            
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  onSelectProfileSection(item.section);
                                  setIsSearchOpen(false);
                                }}
                                className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 flex items-start gap-3 group transition-colors cursor-pointer"
                              >
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-300 shrink-0">
                                  <ItemIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                    {item.title}
                                  </p>
                                  <p className="text-[10px] text-white/50 mt-0.5 truncate leading-relaxed">
                                    {item.subtitle}
                                  </p>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Empty State with advice */}
                {searchQuery.trim() !== '' && totalMatchesCount === 0 && (
                  <div className="py-12 text-center text-white/40">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                    <p className="text-xs font-semibold text-white/80">No matches found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-[10px] text-white/40 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Try searching skills like &ldquo;React&rdquo; or &ldquo;Figma&rdquo;, applications like &ldquo;Applied&rdquo;, or specific company names.
                    </p>
                  </div>
                )}
              </div>

              {/* Centered search box footer */}
              <div className="p-3 bg-slate-950/40 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 px-4">
                <div className="flex items-center gap-3">
                  <span>Press <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono text-white/50 text-[9px]">Esc</kbd> to exit</span>
                  <span>&bull;</span>
                  <span>Select any item to trigger instant views</span>
                </div>
                {searchQuery.trim() !== '' && (
                  <span className="font-semibold text-indigo-400">{totalMatchesCount} matches</span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
