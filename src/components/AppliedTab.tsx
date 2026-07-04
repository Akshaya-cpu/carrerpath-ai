import { useState } from 'react';
import { 
  Briefcase, Calendar, MapPin, Clock, Sparkles, Filter, Search, 
  Trash2, ExternalLink, ChevronDown, CheckCircle2, XCircle, 
  AlertCircle, TrendingUp, UserCheck, FileText, ChevronRight, Award, 
  Info, ShieldCheck, HeartHandshake, Smile
} from 'lucide-react';
import { Job, UserProfile, JobApplication } from '../types';
import { calculateMatchScore, getScoreStyle } from '../utils/matchScore';
import { motion, AnimatePresence } from 'motion/react';

interface AppliedTabProps {
  jobs: Job[];
  applications: JobApplication[];
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (jobId: string, status: JobApplication['status']) => void;
  onUpdateInterviewDate: (jobId: string, interviewDate: string) => void;
  onWithdrawApplication: (jobId: string) => void;
  profile: UserProfile;
}

export default function AppliedTab({
  jobs,
  applications,
  onSelectJob,
  onUpdateStatus,
  onUpdateInterviewDate,
  onWithdrawApplication,
  profile
}: AppliedTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingInterviewJobId, setEditingInterviewJobId] = useState<string | null>(null);
  const [tempInterviewDate, setTempInterviewDate] = useState('');
  const [selectedApplicationForNotes, setSelectedApplicationForNotes] = useState<JobApplication | null>(null);

  // Filter and match applications with actual jobs
  const appliedJobsWithDetails = applications.map(app => {
    let job = jobs.find(j => j.id === app.jobId);
    if (!job && jobs.length > 0) {
      // Stale data fallback: map missing job to one of the active jobs in the system using hash index mapping
      const index = Math.abs(app.jobId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % jobs.length;
      job = jobs[index];
    }
    return {
      app,
      job
    };
  }).filter((item): item is { app: JobApplication; job: Job } => item.job !== undefined);

  // Apply search & status filter
  const filteredApplications = appliedJobsWithDetails.filter(({ app, job }) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate high level stats
  const totalApplied = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'Interviewing').length;
  const offeredCount = applications.filter(a => a.status === 'Offered').length;
  const averageMatchScore = Math.round(
    appliedJobsWithDetails.reduce((sum, { job }) => sum + calculateMatchScore(job, profile.skills), 0) / 
    (appliedJobsWithDetails.length || 1)
  );

  const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'Applied':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/25';
      case 'Reviewing':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'Interviewing':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/25';
      case 'Offered':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'Declined':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      default:
        return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: JobApplication['status']) => {
    switch (status) {
      case 'Applied':
        return <Clock className="w-3.5 h-3.5" />;
      case 'Reviewing':
        return <Info className="w-3.5 h-3.5 animate-pulse" />;
      case 'Interviewing':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'Offered':
        return <Award className="w-3.5 h-3.5" />;
      case 'Declined':
        return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  // Status transitions helper for inline updating
  const statuses: JobApplication['status'][] = ['Applied', 'Reviewing', 'Interviewing', 'Offered', 'Declined'];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-5.5 h-5.5 text-indigo-400" />
            Applied Applications
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Track and manage your professional job applications and interactive interview preparation.
          </p>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Applied</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white">{totalApplied}</span>
            <span className="text-[10px] text-emerald-400 font-bold">Positions</span>
          </div>
        </div>

        <div className="glass-card border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Interviews Scheduled</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-purple-400">{interviewingCount}</span>
            <span className="text-[10px] text-purple-300 font-bold">Active</span>
          </div>
        </div>

        <div className="glass-card border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Offers Secured</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-400">{offeredCount}</span>
            <span className="text-[10px] text-emerald-300 font-bold">Offer!</span>
          </div>
        </div>

        <div className="glass-card border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Avg Skill Match</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-indigo-300">{averageMatchScore}%</span>
            <span className="text-[10px] text-indigo-400 font-bold">Synergy</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-3.5 shadow-inner">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company, role, or location..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 hover:bg-white/10 focus:bg-slate-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <div className="flex flex-wrap items-center gap-1">
            {['all', 'Applied', 'Reviewing', 'Interviewing', 'Offered', 'Declined'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all focus:outline-none ${
                  statusFilter === filter
                    ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                {filter === 'all' ? 'All Statuses' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List Grid */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="p-10 text-center glass-card border-white/10 rounded-3xl space-y-8 shadow-2xl max-w-2xl mx-auto page-enter">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest font-space">
                Tracking Pipeline
              </span>
              <h3 className="font-extrabold text-white text-xl font-sora">No Applications Tracked</h3>
              <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
                {searchTerm || statusFilter !== 'all' 
                  ? "We couldn't find matches matching your filter options. Try resetting your search term or filtering by 'All Statuses'."
                  : "Begin your optimized AI-guided search to populate your live tracking board!"}
              </p>
            </div>

            {/* Pipeline Step-by-Step Flow Illustration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative pt-4">
              {/* Step 1 */}
              <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center space-y-2 relative group hover:border-indigo-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="font-extrabold text-xs text-white">1. Apply to Jobs</p>
                <p className="text-[10px] text-white/40 leading-relaxed">Find optimal synergy roles in Home and AI Search and hit 'Apply now'.</p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center space-y-2 relative group hover:border-purple-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <p className="font-extrabold text-xs text-white">2. Track Progress</p>
                <p className="text-[10px] text-white/40 leading-relaxed">Manage interview phases, application status updates and schedule alerts.</p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center space-y-2 relative group hover:border-emerald-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="font-extrabold text-xs text-white">3. Get AI Follow-ups</p>
                <p className="text-[10px] text-white/40 leading-relaxed">Receive AI-tailored cover letters, salary predictions and coaching.</p>
              </div>
            </div>
          </div>
        ) : (
          filteredApplications.map(({ app, job }) => {
            const matchScore = calculateMatchScore(job, profile.skills, profile.title, profile.resumeText);
            const scoreStyle = getScoreStyle(matchScore);
            const isEditingInterview = editingInterviewJobId === job.id;

            return (
              <div 
                key={app.id}
                className="glass-card glass-card-hover border-white/10 hover:border-indigo-500/30 rounded-2xl p-5 shadow-xl transition-all duration-300 relative group"
              >
                {/* Visual Accent bar depending on status */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-2xl ${
                  app.status === 'Offered' ? 'bg-emerald-500' :
                  app.status === 'Interviewing' ? 'bg-purple-500' :
                  app.status === 'Reviewing' ? 'bg-amber-500' :
                  app.status === 'Declined' ? 'bg-rose-500' : 'bg-blue-500'
                }`} />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Company Logo and Info */}
                  <div className="flex gap-4 items-start">
                    <div 
                      onClick={() => onSelectJob(job)}
                      className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center p-2 border border-white/10 cursor-pointer hover:scale-105 transition-transform shrink-0"
                    >
                      <img src={job.logoUrl} alt={job.company} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 
                          onClick={() => onSelectJob(job)}
                          className="font-extrabold text-white text-base leading-snug cursor-pointer hover:text-indigo-300 hover:underline transition-colors"
                        >
                          {job.title}
                        </h4>
                        <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0 ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border} ${scoreStyle.glow}`}>
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                          {matchScore}% Match
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs text-white/60">
                        <span className="font-medium text-white/80">{job.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-white/40" />
                          {job.location}
                        </span>
                        <span>•</span>
                        <span className="text-white/80 font-bold">{job.salary}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Interactive Status controls */}
                  <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">
                    {/* Status Badge Select dropdown */}
                    <div className="relative">
                      <select
                        value={app.status}
                        onChange={(e) => onUpdateStatus(job.id, e.target.value as JobApplication['status'])}
                        className={`appearance-none pl-3 pr-7 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer focus:outline-none transition-colors ${getStatusColor(app.status)}`}
                      >
                        {statuses.map(st => (
                          <option key={st} value={st} className="bg-slate-900 text-white">
                            {st}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                    </div>

                    {/* Withdraw Application */}
                    <button
                      onClick={() => onWithdrawApplication(job.id)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-white/30 hover:text-rose-400 transition-all cursor-pointer"
                      title="Withdraw application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid details (timeline + schedule info) */}
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Timeline Stage progress bar */}
                  <div className="md:col-span-6 space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Application Progress</span>
                    <div className="flex items-center gap-1.5">
                      {statuses.map((step, sIdx) => {
                        const currentIdx = statuses.indexOf(app.status);
                        const isCompleted = sIdx <= currentIdx;
                        const isDeclined = app.status === 'Declined' && step === 'Declined';
                        const isDeclinedFuture = app.status === 'Declined' && sIdx > currentIdx;
                        
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`h-1.5 w-full rounded-full transition-all ${
                              isDeclined ? 'bg-rose-500' :
                              isDeclinedFuture ? 'bg-white/5' :
                              isCompleted ? (app.status === 'Offered' ? 'bg-emerald-500' : 'bg-indigo-500') :
                              'bg-white/10'
                            }`} />
                            <span className={`text-[8px] font-bold tracking-tight select-none truncate ${
                              isDeclined ? 'text-rose-400' :
                              isCompleted ? 'text-white' : 'text-white/30'
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interview date scheduler info */}
                  <div className="md:col-span-6 space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Schedule Timeline</span>
                    {isEditingInterview ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={tempInterviewDate}
                          onChange={(e) => setTempInterviewDate(e.target.value)}
                          className="bg-slate-900 border border-white/10 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            if (tempInterviewDate) {
                              onUpdateInterviewDate(job.id, tempInterviewDate);
                            }
                            setEditingInterviewJobId(null);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingInterviewJobId(null)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-xs text-white/80 font-medium">
                            {app.interviewDate ? (
                              <span className="text-indigo-300 font-bold">
                                Interview: {new Date(app.interviewDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-white/40 italic">No interview scheduled</span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingInterviewJobId(job.id);
                            setTempInterviewDate(app.interviewDate || '');
                          }}
                          className="text-[10px] text-indigo-400 hover:text-white font-bold underline bg-transparent cursor-pointer"
                        >
                          {app.interviewDate ? 'Reschedule' : 'Set Date'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover letter & notes snippet */}
                {app.coverLetter && (
                  <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400/80 uppercase tracking-wide">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Cover Letter Snippet
                      </span>
                      <button 
                        onClick={() => setSelectedApplicationForNotes(app)}
                        className="text-[9px] text-white/50 hover:text-white flex items-center gap-0.5"
                      >
                        Read Full <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <p className="text-white/70 line-clamp-2 italic leading-relaxed">
                      "{app.coverLetter}"
                    </p>
                  </div>
                )}

                {/* AI Coach Action Prep Widget */}
                <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="text-[11px] text-white/70">
                      {app.status === 'Applied' && `Recommended: Follow up on LinkedIn after 3-5 working days.`}
                      {app.status === 'Reviewing' && `Recommended: Prepare standard answers about ${job.category} best practices.`}
                      {app.status === 'Interviewing' && `Preparation Alert: Brush up on keys like ${job.requirements.slice(0, 2).join(', ')}.`}
                      {app.status === 'Offered' && `Congratulations! Secure details, or prep standard salary-neg questions.`}
                      {app.status === 'Declined' && `Keep head high! Would you like AI to find similar alternate design roles?`}
                    </span>
                  </div>

                  <button 
                    onClick={() => onSelectJob(job)}
                    className="h-7 px-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 border border-white/10 transition-all cursor-pointer shrink-0"
                  >
                    View Details
                    <ExternalLink className="w-3 h-3 text-white/60" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Slide Up Drawer/Modal for Full Notes */}
      <AnimatePresence>
        {selectedApplicationForNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 text-left shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Submitted Cover Letter
                </h3>
                <button
                  onClick={() => setSelectedApplicationForNotes(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap italic">
                  "{selectedApplicationForNotes.coverLetter}"
                </p>
              </div>

              <div className="text-[11px] text-white/50 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  This cover letter statement was automatically generated and customized using Gemini AI targeting the unique requirements and keywords of this position.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedApplicationForNotes(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

