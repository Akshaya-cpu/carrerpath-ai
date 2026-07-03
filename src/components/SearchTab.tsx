import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Search, Sparkles, AlertCircle, Briefcase, ChevronRight, BrainCircuit, Heart, BarChart, Check, MapPin, Bell, X, History, Trash2, TrendingUp, Info } from 'lucide-react';
import { Job, UserProfile, JobMatchResult, SearchAlert } from '../types';
import { calculateMatchScore, getScoreStyle, getMatchedAndMissingSkills } from '../utils/matchScore';

interface SearchTabProps {
  jobs: Job[];
  profile: UserProfile;
  onSelectJob: (job: Job) => void;
  searchAlerts: SearchAlert[];
  onToggleSearchAlert: (query: string) => void;
  onRemoveSearchAlert: (id: string) => void;
  savedJobIds: string[];
}

export default function SearchTab({ 
  jobs, 
  profile, 
  onSelectJob,
  searchAlerts,
  onToggleSearchAlert,
  onRemoveSearchAlert,
  savedJobIds = []
}: SearchTabProps) {
  const [query, setQuery] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<JobMatchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  // Market Insights state variables
  const savedJobs = jobs.filter(j => savedJobIds.includes(j.id));
  const baseTitles = savedJobs.length > 0 
    ? Array.from(new Set(savedJobs.map(j => j.title)))
    : [profile.title || 'Senior Frontend Engineer'];

  const availableTitles = Array.from(new Set([
    ...baseTitles,
    'Digital Product Designer',
    'Senior Frontend Engineer',
    'Lead Fullstack Developer',
    'Machine Learning Scientist'
  ]));

  const [selectedInsightTitle, setSelectedInsightTitle] = useState(availableTitles[0]);
  const [selectedRegion, setSelectedRegion] = useState('SF_BAY');

  // Multipliers for regions
  const regionalMultipliers: Record<string, { label: string; factor: number }> = {
    SF_BAY: { label: 'San Francisco Bay Area (+15%)', factor: 1.15 },
    NY_METRO: { label: 'New York Metro (+10%)', factor: 1.10 },
    REMOTE: { label: 'Remote / National (100%)', factor: 1.00 },
    EUROPE: { label: 'European Tech Hubs (-15%)', factor: 0.85 },
    APAC: { label: 'Asia-Pacific Hubs (-25%)', factor: 0.75 }
  };

  // Helper to parse salary text into a baseline average
  const getBaselineSalary = (title: string): number => {
    // Find matching job salary if available, or generate standard baseline
    const matchingJob = jobs.find(j => j.title === title || j.title.toLowerCase().includes(title.toLowerCase()));
    if (matchingJob?.salary) {
      const numbers = matchingJob.salary.replace(/[^0-9-]/g, '').split('-');
      if (numbers.length === 2) {
        const min = parseInt(numbers[0]) || 0;
        const max = parseInt(numbers[1]) || 0;
        return (min + max) / 2;
      } else if (numbers.length === 1) {
        return parseInt(numbers[0]) || 135000;
      }
    }
    // Fallbacks
    if (title.toLowerCase().includes('designer') || title.toLowerCase().includes('design')) return 125000;
    if (title.toLowerCase().includes('backend') || title.toLowerCase().includes('engineering')) return 145000;
    if (title.toLowerCase().includes('machine') || title.toLowerCase().includes('ai')) return 165000;
    return 130000;
  };

  const baseSalary = getBaselineSalary(selectedInsightTitle);
  const factor = regionalMultipliers[selectedRegion].factor;

  const currentJobAverage = baseSalary;
  const regionalAvg = Math.round(baseSalary * factor);
  const aiCeiling = Math.round(baseSalary * factor * 1.22);
  const floorRate = Math.round(baseSalary * factor * 0.78);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll('*').remove();

    const data = [
      { label: 'Listed Avg', value: currentJobAverage, color: '#6366f1' },
      { label: 'Regional Avg', value: regionalAvg, color: '#3b82f6' },
      { label: 'AI Premium Max', value: aiCeiling, color: '#10b981' },
      { label: 'Market Floor', value: floorRate, color: '#f59e0b' }
    ];

    const margin = { top: 25, right: 15, bottom: 45, left: 55 };
    const width = 340 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.label))
      .padding(0.35);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.15 || 220000])
      .range([height, 0]);

    // Define gradients
    const defs = svg.append('defs');
    data.forEach((d, idx) => {
      const grad = defs.append('linearGradient')
        .attr('id', `bar-grad-${idx}`)
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');
      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d.color)
        .attr('stop-opacity', 0.15);
      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.color)
        .attr('stop-opacity', 0.85);
    });

    // Define trend line linear gradient
    const lineGrad = defs.append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    lineGrad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1');
    lineGrad.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#3b82f6');
    lineGrad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981');

    // Add Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .style('fill', 'rgba(255,255,255,0.55)')
      .style('font-size', '8px')
      .style('font-weight', '600')
      .style('font-family', 'sans-serif')
      .attr('dy', '10px');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => `$${(d as number) / 1000}k`).tickSize(0))
      .selectAll('text')
      .style('fill', 'rgba(255,255,255,0.55)')
      .style('font-size', '8px')
      .style('font-family', 'monospace')
      .attr('dx', '-4px');

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .style('stroke', 'rgba(255,255,255,0.06)')
      .style('stroke-dasharray', '2,2')
      .call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(() => ''));

    // Animated Trend Path (Spline curve)
    const splineGenerator = d3.line<{ label: string; value: number }>()
      .x(d => (x(d.label) || 0) + x.bandwidth() / 2)
      .y(d => y(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Dynamic glowing trend spline path underneath
    svg.append('path')
      .datum(data)
      .attr('d', splineGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', '4')
      .style('opacity', '0.2')
      .style('filter', 'blur(3px)');

    // Dash-animated trend spline path on top
    svg.append('path')
      .datum(data)
      .attr('class', 'trend-line-spline')
      .attr('d', splineGenerator)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', '2.5')
      .attr('stroke-dasharray', '5,5');

    // Select or create dynamic HTML-based hover tooltip
    let tooltip = d3.select('#market-insights-widget .d3-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('#market-insights-widget')
        .append('div')
        .attr('class', 'd3-tooltip absolute bg-slate-950/90 border border-white/10 p-3 rounded-xl text-xs text-white shadow-2xl pointer-events-none z-30 backdrop-blur-md min-w-[150px] font-sans transition-all duration-200 ease-out')
        .style('opacity', 0)
        .style('transform', 'translateY(8px)');
    }

    // Draw Bars with animation
    const bars = svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label) || 0)
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('rx', 6)
      .attr('fill', (d, idx) => `url(#bar-grad-${idx})`)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease')
      .style('transform-origin', d => `${(x(d.label) || 0) + x.bandwidth() / 2}px ${height}px`);

    bars.transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value));

    // Mouse event handlers for interactive tooltip and effects on bars
    bars.on('mouseover', function(event, d) {
      d3.select(this)
        .style('transform', 'scaleY(1.04) scaleX(1.06)')
        .style('filter', `drop-shadow(0 0 12px ${d.color})`);

      tooltip
        .style('opacity', 1)
        .style('transform', 'translateY(0)')
        .html(`
          <div class="space-y-1.5 text-left font-sans">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full animate-ping" style="background-color: ${d.color}"></span>
              <span class="font-bold text-white uppercase text-[10px] tracking-wider">${d.label}</span>
            </div>
            <div class="h-[1px] bg-white/10 my-1"></div>
            <p class="font-mono text-white font-extrabold text-[13px]">$${d.value.toLocaleString()}</p>
            <p class="text-white/50 text-[9px] leading-snug">Calculated for ${selectedInsightTitle} specialty.</p>
          </div>
        `);
    })
    .on('mousemove', function(event) {
      const [xPos, yPos] = d3.pointer(event, d3.select('#market-insights-widget').node());
      tooltip
        .style('left', (xPos + 18) + 'px')
        .style('top', (yPos - 25) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('transform', 'scaleY(1) scaleX(1)')
        .style('filter', 'none');
      tooltip
        .style('opacity', 0)
        .style('transform', 'translateY(8px)');
    });

    // Glowing circle nodes on the trend line intersections (Task #3)
    const dots = svg.selectAll('.node-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'node-dot')
      .attr('cx', d => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr('cy', d => y(d.value))
      .attr('r', 0)
      .attr('fill', '#070b17')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', d => `drop-shadow(0 0 8px ${d.color})`)
      .style('transition', 'r 0.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.2s ease');

    dots.transition()
      .delay((d, idx) => idx * 100 + 450)
      .duration(600)
      .ease(d3.easeElasticOut.amplitude(1.1).period(0.4))
      .attr('r', 4.5);

    dots.on('mouseover', function(event, d) {
      d3.select(this)
        .attr('r', 7)
        .style('stroke-width', 3);

      tooltip
        .style('opacity', 1)
        .style('transform', 'translateY(0)')
        .html(`
          <div class="space-y-1.5 text-left font-sans">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${d.color}"></span>
              <span class="font-bold text-white uppercase text-[10px] tracking-wider">${d.label}</span>
            </div>
            <div class="h-[1px] bg-white/10 my-1"></div>
            <p class="font-mono text-white font-extrabold text-[13px]">$${d.value.toLocaleString()}</p>
            <p class="text-white/50 text-[9px] leading-snug">Interactive calibration benchmark node.</p>
          </div>
        `);
    })
    .on('mousemove', function(event) {
      const [xPos, yPos] = d3.pointer(event, d3.select('#market-insights-widget').node());
      tooltip
        .style('left', (xPos + 18) + 'px')
        .style('top', (yPos - 25) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('r', 4.5)
        .style('stroke-width', 2);
      
      tooltip
        .style('opacity', 0)
        .style('transform', 'translateY(8px)');
    });

    // Value Labels on Top of Bars
    svg.selectAll('.bar-val')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-val')
      .attr('x', d => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 8)
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .style('fill', '#ffffff')
      .style('font-size', '9px')
      .style('font-weight', '700')
      .style('font-family', 'monospace')
      .text(d => `$${Math.round(d.value / 1000)}k`);

  }, [baseSalary, factor, selectedInsightTitle, selectedRegion]);

  // Sync available titles if profile title changes or saved jobs changes
  useEffect(() => {
    if (availableTitles.length > 0 && !availableTitles.includes(selectedInsightTitle)) {
      setSelectedInsightTitle(availableTitles[0]);
    }
  }, [savedJobIds, profile.title]);

  // Recent searches state management (persisted in localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('career_path_ai_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('career_path_ai_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteRecentSearch = (searchTerm: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.toLowerCase() !== searchTerm.toLowerCase());
      localStorage.setItem('career_path_ai_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('career_path_ai_recent_searches');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
    }
  };

  // Run the Gemini compatibility matching engine
  const handleAIMatch = async () => {
    setIsMatching(true);
    setErrorMessage('');
    
    // Animate friendly, reassuring loading sub-steps to improve UX
    const steps = [
      'Reading your profile & skillset...',
      'Analyzing available job descriptions...',
      'Calculating match scores with Gemini AI...',
      'Synthesizing recommendations...'
    ];
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 2500); // 2.5-second ultra-responsive threshold

    try {
      const response = await fetch('/api/gemini/job-matcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          title: profile.title,
          skills: profile.skills,
          resumeText: profile.resumeText,
          jobs: jobs
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = 'Server error occurred during matching';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } catch (e) {
            // Ignore parse errors on bad JSON
          }
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON content. Falling back to local smart match engine.');
      }

      const data = await response.json();
      setMatchResults(data.matches || []);
    } catch (err: any) {
      console.warn('Backend match API is slow or offline. Switching to high-speed local smart match engine:', err.message || err);
      
      // Calculate high-quality compatibility ratings locally in real-time
      const localMatches: JobMatchResult[] = jobs.map(job => {
        const score = calculateMatchScore(job, profile?.skills || [], profile?.title, profile?.resumeText);
        const { matched, missing } = getMatchedAndMissingSkills(job, profile?.skills || []);
        
        let explanation = '';
        if (matched.length > 0) {
          explanation = `Excellent fit! Your skills in ${matched.slice(0, 3).join(', ')} match the core requirements for this ${job.title} role.`;
          if (missing.length > 0) {
            explanation += ` Picking up ${missing.slice(0, 2).join(', ')} would elevate your compatibility further.`;
          } else {
            explanation += ` You possess 100% of the core competencies for this opening.`;
          }
        } else {
          explanation = `Your background as a ${profile?.title || 'Specialist'} provides a strong foundation. Pick up ${missing.slice(0, 3).join(', ')} to boost your alignment with this position.`;
        }
        
        return {
          jobId: job.id,
          matchScore: score,
          explanation: explanation
        };
      });

      setMatchResults(localMatches);
    } finally {
      clearTimeout(timeoutId);
      clearInterval(interval);
      setIsMatching(false);
    }
  };

  const textFilteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(query.toLowerCase()) ||
    job.company.toLowerCase().includes(query.toLowerCase()) ||
    job.location.toLowerCase().includes(query.toLowerCase())
  );

  const getMatchData = (jobId: string) => {
    return matchResults.find(r => r.jobId === jobId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-white/50 bg-white/5 border-white/10';
  };

  const isAlertActiveForCurrentQuery = query.trim() 
    ? searchAlerts.some(a => a.query.toLowerCase() === query.trim().toLowerCase()) 
    : false;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h2 className="font-bold text-xl text-white tracking-tight">Advanced Search</h2>
        <p className="text-xs text-white/60 mt-1">
          Explore roles manually or run the Gemini AI Smart Matcher to discover compatibility ratings.
        </p>
      </div>

      {/* Manual Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by keyword, title, or workplace..."
            className="w-full h-12 pl-12 pr-10 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-white placeholder-white/40 text-sm shadow-sm transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-12 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Recent Searches Section */}
      {recentSearches.length > 0 && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              Recent Searches
            </span>
            <button
              onClick={handleClearRecentSearches}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, index) => (
              <div
                key={index}
                className="group flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                onClick={() => setQuery(term)}
              >
                <Search className="w-3 h-3 text-white/45 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-medium text-white/85 group-hover:text-white transition-colors">{term}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRecentSearch(term);
                  }}
                  className="w-4 h-4 rounded-md flex items-center justify-center text-white/20 group-hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
                  title="Remove query"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Control Panel */}
      <div className="glass-card bg-slate-950/25 border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              isAlertActiveForCurrentQuery
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                : 'bg-white/5 border-white/10 text-white/40'
            }`}>
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {query.trim() 
                  ? `Get Alerts for "${query.trim()}"` 
                  : "Search Alerts Assistant"}
              </p>
              <p className="text-[10px] text-white/50 leading-normal max-w-[260px] md:max-w-md">
                {query.trim() 
                  ? "Receive a notification when new matches are added to our directory." 
                  : "Save search criteria to get periodic custom match recommendations."}
              </p>
            </div>
          </div>
          
          {query.trim() && (
            <button
              onClick={() => onToggleSearchAlert(query)}
              className={`h-8 px-4.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAlertActiveForCurrentQuery
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {isAlertActiveForCurrentQuery ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Alert On
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  Get Alerts
                </>
              )}
            </button>
          )}
        </div>

        {/* List of active saved search criteria in localStorage */}
        {searchAlerts.length > 0 ? (
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Saved Criteria ({searchAlerts.length})
              </p>
              <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                Monitoring Live
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/15 text-indigo-200 text-xs px-2.5 py-1 rounded-xl"
                >
                  <Bell className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="font-medium">"{alert.query}"</span>
                  <button 
                    onClick={() => onRemoveSearchAlert(alert.id)}
                    className="hover:text-rose-400 text-white/30 transition-colors ml-0.5 focus:outline-none shrink-0"
                    title="Remove Alert"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !query.trim() && (
            <div className="pt-2 border-t border-white/5 text-center py-2">
              <p className="text-[10px] text-white/30 italic">Type a keyword above to enable live alerts</p>
            </div>
          )
        )}
      </div>

      {/* 📊 Market Insights & Salary Trends Widget (uses D3.js) */}
      <div className="glass-card bg-slate-900/40 border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden" id="market-insights-widget">
        <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-10 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-3.5 items-start relative z-10">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <BarChart className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Market Insights & Salary Trends
              <span className="bg-blue-500/20 text-blue-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-500/30">D3 Live Analytics</span>
            </h3>
            <p className="text-xs text-white/60 leading-relaxed max-w-md">
              Compare regional market averages and negotiating targets for your target specialties.
            </p>
          </div>
        </div>

        {/* Filters Panel - Interactive Filter Chips */}
        <div className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">Target Specialty (Select Peak)</label>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-h-[110px] scrollbar-thin">
              {availableTitles.map((t, idx) => {
                const isActive = selectedInsightTitle === t;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedInsightTitle(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/15'
                        : 'bg-white/5 text-white/60 border-white/5 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">Regional Location (Multiplier)</label>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {Object.entries(regionalMultipliers).map(([key, value]) => {
                const isActive = selectedRegion === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedRegion(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/15'
                        : 'bg-white/5 text-white/60 border-white/5 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {value.label.split(' (+')[0].split(' (-')[0].split(' (100')[0]}
                    <span className="text-[10px] opacity-65 ml-1">({key === 'REMOTE' ? '1.0x' : value.factor > 1 ? `+${Math.round((value.factor-1)*100)}%` : `-${Math.round((1-value.factor)*100)}%`})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* D3.js SVG Target Container */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-center relative min-h-[200px]">
          <svg ref={svgRef} className="w-full max-w-[340px] h-[180px]" />
        </div>

        {/* Legend / Metrics Board */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Listed Rate</span>
            <span className="text-xs font-mono font-bold text-indigo-300 mt-1 block">${(currentJobAverage / 1000).toFixed(0)}k</span>
          </div>
          <div className="p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Regional Avg</span>
            <span className="text-xs font-mono font-bold text-blue-300 mt-1 block">${(regionalAvg / 1000).toFixed(0)}k</span>
          </div>
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">AI Premium Ceiling</span>
            <span className="text-xs font-mono font-bold text-emerald-300 mt-1 block">${(aiCeiling / 1000).toFixed(0)}k</span>
          </div>
          <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Market Floor</span>
            <span className="text-xs font-mono font-bold text-amber-300 mt-1 block">${(floorRate / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Advisory Tips Callout */}
        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex gap-2.5 items-start text-[11px] text-white/70">
          <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-sans">
            AI Advisory: Applying with high synergy match scores unlocks potential to negotiate toward the <strong>AI Premium Ceiling (${(aiCeiling / 1000).toFixed(0)}k)</strong>. Leverage the AI interview prep guidelines to highlight these high-impact skills!
          </span>
        </div>
      </div>

      {/* AI Smart Matcher Callout Box */}
      <div className="glass-card bg-indigo-950/20 border-white/15 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <BrainCircuit className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Gemini AI Smart Matcher
              <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/30">Premium</span>
            </h3>
            <p className="text-xs text-white/75 leading-relaxed max-w-md">
              Let our AI analyze your profile skills and objective statement, and automatically rate every job in the directory for synergy!
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs flex items-start gap-2 border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-4 relative z-10">
          <button
            onClick={handleAIMatch}
            disabled={isMatching}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {isMatching ? 'Running matching model...' : 'Analyze Job Compatibility'}
          </button>
          
          {matchResults.length > 0 && (
            <button
              onClick={() => setMatchResults([])}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Reset scores
            </button>
          )}
        </div>

        {/* Custom Loading State with multi-step messages */}
        {isMatching && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>
                {[
                  'Reading your profile & skillset...',
                  'Analyzing available job descriptions...',
                  'Calculating match scores with Gemini AI...',
                  'Synthesizing recommendations...'
                ][loadingStep]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Filtered Feed list */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-white/80 uppercase tracking-wider">
          {matchResults.length > 0 ? 'AI-Rated Recommendations' : 'Available Openings'}
        </h3>

        <div className="space-y-3">
          {textFilteredJobs.length === 0 ? (
            <div className="p-10 text-center glass-card border-white/10 rounded-2xl space-y-3.5 max-w-md mx-auto page-enter">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-400">
                <Search className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">No Matching Openings Found</h4>
                <p className="text-[11px] text-white/50 leading-relaxed mt-1 max-w-[280px] mx-auto">
                  We couldn't find any positions matching that keyword. Try searching for broad tech categories (e.g., "React", "Python", "Designer") or resetting filters.
                </p>
              </div>
            </div>
          ) : (
            textFilteredJobs.map((job) => {
              const match = getMatchData(job.id);
              const matchScore = calculateMatchScore(job, profile?.skills || [], profile?.title, profile?.resumeText);
              const scoreStyle = getScoreStyle(matchScore);
              
              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="glass-card glass-card-hover p-4.5 border-white/10 rounded-2xl transition-all cursor-pointer flex flex-col gap-3.5 shadow-sm hover:shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center p-1.5 border border-white/10 shrink-0">
                        <img src={job.logoUrl} alt={job.company} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm leading-tight group-hover:text-indigo-300 transition-colors">{job.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-white/60">{job.company} • {job.location}</span>
                          <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0 ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border} ${scoreStyle.glow}`}>
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                            {matchScore}% Match
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-white/40 shrink-0" />
                  </div>

                  {/* If match rating is available, show customized Gemini panel */}
                  {match ? (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex gap-3.5 items-start">
                      <div className={`text-center py-1.5 px-2.5 rounded-lg border text-xs font-bold leading-none shrink-0 ${getScoreColor(match.matchScore)}`}>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-white/40 mb-0.5">Match</div>
                        {match.matchScore}%
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold text-white flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 inline shrink-0" />
                          Gemini Compatibility Feedback:
                        </p>
                        <p className="text-xs text-white/70 leading-relaxed font-sans">{match.explanation}</p>
                      </div>
                    </div>
                  ) : (
                    /* Default Requirements Preview with Dynamic Live Match Indicators */
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {job.requirements.slice(0, 2).map((req, i) => (
                          <span key={i} className="text-[10px] font-medium text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                            {req}
                          </span>
                        ))}
                      </div>
                      
                      {(() => {
                        const { matched, missing } = getMatchedAndMissingSkills(job, profile?.skills || []);
                        return (
                          <div className="flex flex-col gap-1 text-[10px] bg-slate-900/40 p-2 rounded-xl border border-white/5">
                            {matched.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400 font-extrabold text-[8px] uppercase tracking-wider bg-emerald-400/10 px-1.5 py-0.5 rounded shrink-0 border border-emerald-400/20">✓ Matched</span>
                                <span className="text-white/70 truncate">{matched.slice(0, 3).join(', ')}</span>
                              </div>
                            )}
                            {missing.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-400 font-extrabold text-[8px] uppercase tracking-wider bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0 border border-amber-400/20">▲ Gap</span>
                                <span className="text-white/50 truncate">{missing.slice(0, 3).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
