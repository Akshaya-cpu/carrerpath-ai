import { useState } from 'react';
import { Bookmark, Briefcase, MapPin, Trash2, ArrowUpRight, ArrowUpDown, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { Job, UserProfile } from '../types';
import { calculateMatchScore, getScoreStyle } from '../utils/matchScore';

interface SavedTabProps {
  jobs: Job[];
  savedJobIds: string[];
  appliedJobIds: string[];
  onSelectJob: (job: Job) => void;
  onRemoveSave: (jobId: string) => void;
  profile: UserProfile;
}

export default function SavedTab({
  jobs,
  savedJobIds,
  appliedJobIds,
  onSelectJob,
  onRemoveSave,
  profile
}: SavedTabProps) {
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'salary'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const savedJobs = jobs.filter(job => savedJobIds.includes(job.id));

  // Helper parser for salary strings like "$140k - $180k" to average number
  const parseSalaryValue = (salaryStr: string): number => {
    const matches = salaryStr.match(/\d+/g);
    if (!matches) return 0;
    const vals = matches.map(m => parseInt(m) * (salaryStr.toLowerCase().includes('k') ? 1000 : 1));
    if (vals.length === 1) return vals[0];
    if (vals.length >= 2) return (vals[0] + vals[1]) / 2;
    return 0;
  };

  // Sort logic
  const sortedSavedJobs = [...savedJobs].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'match') {
      const scoreA = calculateMatchScore(a, profile?.skills || [], profile?.title, profile?.resumeText);
      const scoreB = calculateMatchScore(b, profile?.skills || [], profile?.title, profile?.resumeText);
      comparison = scoreA - scoreB;
    } else if (sortBy === 'date') {
      // Index in savedJobIds represent when they were added.
      // Higher index = added later.
      const indexA = savedJobIds.indexOf(a.id);
      const indexB = savedJobIds.indexOf(b.id);
      comparison = indexA - indexB;
    } else if (sortBy === 'salary') {
      comparison = parseSalaryValue(a.salary) - parseSalaryValue(b.salary);
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-xl text-white tracking-tight">Saved Opportunities</h2>
        <p className="text-xs text-white/60 mt-1">
          Review and submit applications to the positions you bookmarked.
        </p>
      </div>

      {savedJobs.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 shadow-inner">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white/80">Sort saved positions</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                if (sortBy === 'date') {
                  setSortOrder(curr => curr === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 focus:outline-none ${
                sortBy === 'date'
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Date Added
              {sortBy === 'date' && (
                <span className="text-[10px] opacity-70">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (sortBy === 'match') {
                  setSortOrder(curr => curr === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('match');
                  setSortOrder('desc');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 focus:outline-none ${
                sortBy === 'match'
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Match Score
              {sortBy === 'match' && (
                <span className="text-[10px] opacity-70">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (sortBy === 'salary') {
                  setSortOrder(curr => curr === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('salary');
                  setSortOrder('desc');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 focus:outline-none ${
                sortBy === 'salary'
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Salary Range
              {sortBy === 'salary' && (
                <span className="text-[10px] opacity-70">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {savedJobs.length === 0 ? (
        <div className="p-5 text-center glass-card border-white/10 rounded-3xl space-y-3.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 mx-auto border border-white/10">
            <Bookmark className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-sm">Your bookmarks list is empty</h3>
            <p className="text-xs text-white/50 max-w-xs mx-auto">
              Find positions you are interested in on the home tab, tap the bookmark icon, and they will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedSavedJobs.map((job) => {
            const isApplied = appliedJobIds.includes(job.id);
            const matchScore = calculateMatchScore(job, profile?.skills || [], profile?.title, profile?.resumeText);
            const scoreStyle = getScoreStyle(matchScore);

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="glass-card glass-card-hover p-5 border-white/10 rounded-2xl shadow-lg cursor-pointer flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3.5 items-center">
                    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-white/10 shrink-0">
                      <img src={job.logoUrl} alt={job.company} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-snug">{job.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-white/60">{job.company} • {job.location}</span>
                        <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0 ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border} ${scoreStyle.glow}`}>
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                          {matchScore}% Match
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSave(job.id);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus:outline-none"
                    aria-label="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub Metadata Row */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="text-white font-bold text-sm tracking-tight">{job.salary}</div>
                  
                  <div className="flex items-center gap-2">
                    {isApplied ? (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        Applied Successfully
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJob(job);
                        }}
                        className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm transition-all"
                      >
                        Apply
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

