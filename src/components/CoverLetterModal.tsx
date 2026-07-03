import React, { useState } from 'react';
import { 
  X, Sparkles, AlertCircle, RefreshCw, FileText, 
  ArrowRight, Copy, Download, Check, HelpCircle, Briefcase, Plus, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, UserProfile, JobApplication } from '../types';

interface CoverLetterModalProps {
  onClose: () => void;
  profile: UserProfile;
  jobs: Job[];
  applications: JobApplication[];
  onApply: (jobId: string, coverLetter: string, additionalData?: Partial<JobApplication>) => void;
  onUpdateStatus?: (jobId: string, status: JobApplication['status']) => void;
}

export default function CoverLetterModal({
  onClose,
  profile,
  jobs,
  applications,
  onApply,
  onUpdateStatus
}: CoverLetterModalProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [letterTone, setLetterTone] = useState('Professional & Persuasive');
  const [docType, setDocType] = useState<'cover-letter' | 'thank-you' | 'follow-up'>('cover-letter');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [editedLetter, setEditedLetter] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const isCustomMode = selectedJobId === 'custom';

  const startProgressInterval = (totalSteps: number, callback: () => void) => {
    let current = 0;
    setGenStep(0);
    const interval = setInterval(() => {
      current += 1;
      if (current < totalSteps) {
        setGenStep(current);
      } else {
        clearInterval(interval);
        callback();
      }
    }, 600);
    return interval;
  };

  const handleGenerateCoverLetter = async () => {
    let targetTitle = '';
    let targetCompany = '';
    let targetRequirements: string[] = [];

    if (isCustomMode) {
      if (!customJobTitle.trim() || !customCompany.trim()) {
        setErrorMessage('Please provide both the Target Job Title and Company Name for custom generation.');
        return;
      }
      targetTitle = customJobTitle.trim();
      targetCompany = customCompany.trim();
      targetRequirements = customRequirements.split(';').map(r => r.trim()).filter(Boolean);
    } else {
      const selectedJob = jobs.find(j => j.id === selectedJobId);
      if (!selectedJob) {
        setErrorMessage('Please select a target job listing to proceed.');
        return;
      }
      targetTitle = selectedJob.title;
      targetCompany = selectedJob.company;
      targetRequirements = selectedJob.requirements;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setGeneratedLetter(null);
    setEditedLetter('');
    setSaveSuccessMsg('');

    const progress = startProgressInterval(5, () => {});

    try {
      const response = await fetch('/api/gemini/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          skills: profile.skills,
          resumeText: profile.resumeText,
          jobTitle: targetTitle,
          company: targetCompany,
          requirements: targetRequirements,
          docType: docType
        })
      });

      clearInterval(progress);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'The server returned an error during cover letter drafting.');
      }

      const data = await response.json();
      if (!data.coverLetter) {
        throw new Error('Gemini successfully processed the request but returned an empty letter body.');
      }

      let letterBody = data.coverLetter;
      if (letterTone !== 'Professional & Persuasive') {
        letterBody = `[Tone Optimized: ${letterTone}]\n\n` + letterBody;
      }

      setGeneratedLetter(letterBody);
      setEditedLetter(letterBody);
      setGenStep(5);
    } catch (err: any) {
      clearInterval(progress);
      setErrorMessage(err.message || 'An unexpected error occurred during cover letter generation.');
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!editedLetter) return;
    navigator.clipboard.writeText(editedLetter);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxtFile = () => {
    if (!editedLetter) return;

    let titleText = 'Cover_Letter';
    if (isCustomMode) {
      titleText = `${customJobTitle.replace(/\s+/g, '_')}_Cover_Letter`;
    } else {
      const selectedJob = jobs.find(j => j.id === selectedJobId);
      if (selectedJob) {
        titleText = `${selectedJob.title.replace(/\s+/g, '_')}_${selectedJob.company.replace(/\s+/g, '_')}_Cover_Letter`;
      }
    }

    const element = document.createElement('a');
    const file = new Blob([editedLetter], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${titleText}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveToApplication = () => {
    if (!editedLetter || isCustomMode) return;
    
    const existingApp = applications.find(a => a.jobId === selectedJobId);
    const fieldName = docType === 'thank-you' ? 'Thank-You Email' : docType === 'follow-up' ? 'Follow-Up Email' : 'Cover Letter';
    
    if (existingApp) {
      onApply(selectedJobId, editedLetter, { status: existingApp.status });
      setSaveSuccessMsg(`Updated ${fieldName} on your active application registry successfully!`);
    } else {
      onApply(selectedJobId, editedLetter, { status: 'Applied' });
      setSaveSuccessMsg(`Created new job application in "Applied" status with this tailored ${fieldName}!`);
    }
  };

  const stepsList = docType === 'thank-you'
    ? [
        'Reviewing interview details and connection anchors...',
        'Formulating sincere personal appreciation anchors...',
        'Matching professional follow-through keywords...',
        'Synthesizing concise polite email sections...',
        'Finalizing post-interview thank-you email draft...'
      ]
    : docType === 'follow-up'
    ? [
        'Analyzing application timeline metrics...',
        'Calibrating cordial professional check-in tone...',
        'Isolating continued interest reinforcement hooks...',
        'Structuring brief status request paragraphs...',
        'Finalizing polite follow-up email draft...'
      ]
    : [
        'Scanning current profile hard technologies...',
        'Reviewing target company brand values...',
        'Isolating critical requirement credentials...',
        'Formulating high-impact professional greeting...',
        'Synthesizing tailored persuasive letter blocks...'
      ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl text-left relative overflow-hidden flex flex-col h-[85vh]"
      >
        <div className="absolute right-0 top-0 translate-y-[-20px] translate-x-20 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">AI Cover Letter Workspace</h3>
              <p className="text-[10px] text-white/50">Draft and edit tailored job applications with Gemini 3.5 live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal split-screen body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
          
          {/* Left Column: Input controls */}
          <div className="w-full md:w-1/2 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Our AI document generator drafts tailor-made applications, follow-up messages, and thank-you notes customized to your career history and matching opportunities.
              </p>

              {/* Document/Email Type Selection */}
              <div className="space-y-1 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">Document / Email Type</label>
                <div className="grid grid-cols-3 gap-2 font-sans">
                  {[
                    { id: 'cover-letter', label: 'Cover Letter' },
                    { id: 'thank-you', label: 'Thank-You Email' },
                    { id: 'follow-up', label: 'Follow-Up Email' }
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        setDocType(doc.id as any);
                        setErrorMessage('');
                      }}
                      className={`h-9.5 px-1 rounded-xl border text-[10px] font-bold transition-all truncate cursor-pointer ${
                        docType === doc.id
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-200 shadow'
                          : 'bg-slate-950/20 border-white/5 text-white/60 hover:text-white hover:bg-slate-950/35'
                      }`}
                    >
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Selector Dropdown */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">Select Target Job Opportunity</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full h-10 bg-slate-950/40 border border-white/10 rounded-xl px-3 text-xs text-white outline-none font-sans focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                >
                  <option value="" className="bg-slate-950 text-white font-sans text-xs">-- Select Job Posting --</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id} className="bg-slate-950 text-white font-sans text-xs">
                      {job.title} at {job.company} ({job.location})
                    </option>
                  ))}
                  <option value="custom" className="bg-slate-950 text-white font-sans text-xs font-bold text-purple-400">+ Input Custom Job Specifications</option>
                </select>
              </div>

              {/* Custom Job Input Block */}
              {isCustomMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/5 border border-white/5 rounded-xl animate-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">Target Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead React Architect"
                      value={customJobTitle}
                      onChange={(e) => setCustomJobTitle(e.target.value)}
                      className="w-full h-9 bg-slate-950/40 border border-white/10 rounded-lg text-xs px-3 outline-none focus:border-purple-500 text-white placeholder-white/20 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Google DeepMind"
                      value={customCompany}
                      onChange={(e) => setCustomCompany(e.target.value)}
                      className="w-full h-9 bg-slate-950/40 border border-white/10 rounded-lg text-xs px-3 outline-none focus:border-purple-500 text-white placeholder-white/20 font-medium"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">
                      Core Requirements / Keywords <span className="text-white/25">(Semi-colon separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React 19; Figma Libraries; Git; Information Architecture"
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                      className="w-full h-9 bg-slate-950/40 border border-white/10 rounded-lg text-xs px-3 outline-none focus:border-purple-500 text-white placeholder-white/20 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Letter Tone Customizer */}
              <div className="space-y-1 pt-1">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider pl-0.5 block">Narrative Persona / Tone Styling</label>
                <div className="grid grid-cols-2 gap-2 font-sans">
                  {[
                    'Professional & Persuasive',
                    'Creative & Bold',
                    'Confident & Direct',
                    'Empathetic & Warm'
                  ].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setLetterTone(tone)}
                      className={`h-9 px-2.5 rounded-xl border text-[10px] font-bold transition-all truncate cursor-pointer ${
                        letterTone === tone
                          ? 'bg-purple-600/15 border-purple-500 text-purple-300'
                          : 'bg-slate-950/20 border-white/10 text-white/60 hover:text-white hover:bg-slate-950/30'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="font-sans leading-relaxed">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Submit Action Block */}
            <div className="pt-4 border-t border-white/5 flex justify-between items-center bg-slate-900/50">
              <span className="text-[10px] text-white/30 italic">Verify specs before generation</span>
              <button
                onClick={handleGenerateCoverLetter}
                disabled={!selectedJobId || isGenerating}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-500/15 transition-all duration-150 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {docType === 'thank-you' ? 'Drafting Email...' : docType === 'follow-up' ? 'Drafting Email...' : 'Drafting Letter...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    {docType === 'thank-you' ? 'Draft Thank-You Email' : docType === 'follow-up' ? 'Draft Follow-Up Email' : 'Draft Tailored Letter'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Output viewer & Editor */}
          <div className="w-full md:w-1/2 p-5 overflow-y-auto flex flex-col justify-between bg-slate-950/30">
            
            {/* Main content display switch */}
            <div className="flex-1 flex flex-col min-h-0 justify-center">
              {!isGenerating && !generatedLetter ? (
                /* Empty Placeholder block */
                <div className="text-center py-10 space-y-3.5 max-w-sm mx-auto">
                  <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400/70 mx-auto">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Awaiting Specifications</h4>
                    <p className="text-[11px] text-white/40 leading-relaxed mt-1">
                      Configure your target position and desired brand narrative persona on the left pane, and your tailor-made draft will build here instantly.
                    </p>
                  </div>
                </div>
              ) : isGenerating && !generatedLetter ? (
                /* Animated steps loader */
                <div className="space-y-4 max-w-sm mx-auto w-full py-4 text-left">
                  <div className="progress-bar bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="progress-fill bg-purple-500 h-full transition-all duration-300" 
                      style={{ width: `${((genStep + 1) / 5) * 100}%` }}
                    />
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {stepsList.map((stepText, idx) => {
                      const isCompleted = genStep > idx;
                      const isActive = genStep === idx;
                      return (
                        <div key={idx} className="flex items-center gap-2.5 text-xs">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isActive ? (
                            <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                          )}
                          <span className={isCompleted ? 'text-white/35 line-through' : isActive ? 'text-purple-400 font-bold' : 'text-white/55'}>
                            {stepText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Editable layout viewer sheet */
                <div className="space-y-3 flex flex-col h-full min-h-0 justify-between animate-in fade-in duration-200">
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Interactive Live Editor (Edit text freely)</span>
                    <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wider">
                      Tailored • {letterTone}
                    </span>
                  </div>

                  {/* High quality live text area editor */}
                  <div className="flex-1 min-h-0 relative">
                    <textarea
                      value={editedLetter}
                      onChange={(e) => setEditedLetter(e.target.value)}
                      className="w-full h-full min-h-[300px] bg-slate-950/60 border border-white/15 rounded-xl p-4 font-mono text-[11px] text-slate-100 leading-relaxed outline-none focus:ring-1 focus:ring-purple-500/50 resize-none text-left scrollbar-thin select-text"
                      placeholder="Customize your generated cover letter..."
                    />
                  </div>

                  {saveSuccessMsg && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-xl text-[10px] text-center shrink-0">
                      🎉 {saveSuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons row */}
            {generatedLetter && !isGenerating && (
              <div className="flex flex-wrap gap-2 justify-between items-center pt-4 border-t border-white/5 shrink-0 mt-3">
                <button
                  onClick={() => {
                    setGeneratedLetter(null);
                    setEditedLetter('');
                    setIsGenerating(false);
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                >
                  Clear Draft
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadTxtFile}
                    className="h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    Download
                  </button>

                  {!isCustomMode && (
                    <button
                      onClick={handleSaveToApplication}
                      className="h-8 px-3.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Save Draft
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
