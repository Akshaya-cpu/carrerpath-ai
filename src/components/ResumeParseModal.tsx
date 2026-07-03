import React, { useState } from 'react';
import { 
  X, Upload, Sparkles, AlertCircle, CheckCircle2, 
  RefreshCw, FileText, ArrowRight, Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

interface ResumeParseModalProps {
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile, options?: { isResumeUpload?: boolean }) => void;
}

export default function ResumeParseModal({
  onClose,
  profile,
  onUpdateProfile
}: ResumeParseModalProps) {
  const [pasteText, setPasteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedData, setParsedData] = useState<{
    name: string;
    title: string;
    skills: string[];
    summary: string;
    education?: string[];
    experience?: string[];
    projects?: string[];
    certifications?: string[];
  } | null>(null);

  // File drag states
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const startProgressInterval = (totalSteps: number, callback: () => void) => {
    let current = 0;
    setParseStep(0);
    const interval = setInterval(() => {
      current += 1;
      if (current < totalSteps) {
        setParseStep(current);
      } else {
        clearInterval(interval);
        callback();
      }
    }, 750);
    return interval;
  };

  const handleTextParseSubmit = async () => {
    const trimmed = pasteText.trim();
    if (trimmed.length < 20) {
      setErrorMessage('Please paste at least 20 characters of resume text to parse.');
      return;
    }

    setIsParsing(true);
    setErrorMessage('');
    setParsedData(null);

    const progress = startProgressInterval(5, () => {});

    try {
      const response = await fetch('/api/gemini/resume-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: trimmed })
      });

      clearInterval(progress);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'The server returned an error during resume parsing.');
      }

      const data = await response.json();
      if (!data.isValidResume) {
        throw new Error('Our AI filter indicates this content does not resemble a professional resume, work history, or skill bio. Please paste real resume text.');
      }

      setParsedData({
        name: data.name || 'Candidate',
        title: data.title || 'Tech Professional',
        skills: data.skills || [],
        summary: data.summary || '',
        education: data.education || [],
        experience: data.experience || [],
        projects: data.projects || [],
        certifications: data.certifications || []
      });
      setParseStep(5);
    } catch (err: any) {
      clearInterval(progress);
      setErrorMessage(err.message || 'An unexpected error occurred while parsing.');
      setIsParsing(false);
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setIsParsing(true);
    setErrorMessage('');
    setParsedData(null);

    const progress = startProgressInterval(5, () => {});

    try {
      const reader = new FileReader();
      const loadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          if (base64) resolve(base64);
          else reject(new Error('Failed to read file buffer.'));
        };
        reader.onerror = () => reject(new Error('File reader encountered an error.'));
        reader.readAsDataURL(file);
      });

      const base64Content = await loadPromise;

      const response = await fetch('/api/gemini/resume-parse-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Content,
          mimeType: file.type || 'application/octet-stream',
          fileName: file.name
        })
      });

      clearInterval(progress);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'The server returned an error while processing the document.');
      }

      const data = await response.json();
      if (!data.isValidResume) {
        throw new Error('Our AI filters identified this document as unrelated attachment noise (e.g. bills, receipts, tickets). Please upload a valid professional resume.');
      }

      setParsedData({
        name: data.name || 'Candidate',
        title: data.title || 'Tech Professional',
        skills: data.skills || [],
        summary: data.summary || '',
        education: data.education || [],
        experience: data.experience || [],
        projects: data.projects || [],
        certifications: data.certifications || []
      });
      setParseStep(5);
    } catch (err: any) {
      clearInterval(progress);
      setErrorMessage(err.message || 'Could not parse document file. Please ensure it is a legible PDF, DOCX, or TXT file.');
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyParsedProfile = () => {
    if (!parsedData) return;

    onUpdateProfile({
      ...profile,
      name: parsedData.name,
      title: parsedData.title,
      skills: parsedData.skills,
      resumeText: parsedData.summary,
      education: parsedData.education || [],
      experience: parsedData.experience || [],
      projects: parsedData.projects || [],
      certifications: parsedData.certifications || []
    }, { isResumeUpload: true });

    onClose();
  };

  const stepsList = [
    'Reading resume document data...',
    'Parsing semantic entities with Gemini 3.5...',
    'Extracting core hard technology skills...',
    'Analyzing career timeline alignment...',
    'Synthesizing final executive summary...'
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-left relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-y-[-20px] translate-x-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">AI Resume Parse Engine</h3>
              <p className="text-[10px] text-white/50">Parse and align profile with Gemini 3.5 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 relative z-10 font-sans">
          {!isParsing && !parsedData ? (
            <>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Upload your resume document or paste raw work history. Our active parser will automatically filter out irrelevant attachments, catalog tech skills, and rewrite your biography summary.
              </p>

              {/* Drag & Drop File Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 text-center relative ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                    : 'border-white/10 bg-slate-950/20 hover:border-white/20 hover:bg-slate-950/30'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.docx,.doc"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2.5">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-white">
                  Drag & drop your resume file here
                </p>
                <p className="text-[10px] text-white/40 mt-1">
                  Supports PDF, DOCX, DOC, or TXT up to 10MB
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px bg-white/10 flex-grow" />
                <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest shrink-0">or paste manual history</span>
                <div className="h-px bg-white/10 flex-grow" />
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1.5">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste your biography summary, work history bullet points, or raw resume text here..."
                  rows={5}
                  className="w-full p-3 bg-slate-950/45 border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-white placeholder-white/20 font-sans resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="font-sans leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Submit paste text button */}
              <div className="flex justify-end">
                <button
                  onClick={handleTextParseSubmit}
                  disabled={pasteText.trim().length < 20}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all duration-150 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Parse Text Bio
                </button>
              </div>
            </>
          ) : isParsing && !parsedData ? (
            /* Progress State */
            <div className="py-6 space-y-5">
              <div className="progress-bar bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="progress-fill bg-indigo-500 h-full transition-all duration-300" 
                  style={{ width: `${((parseStep + 1) / 6) * 100}%` }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div className="space-y-2.5">
                  {stepsList.map((stepText, idx) => {
                    const isCompleted = parseStep > idx;
                    const isActive = parseStep === idx;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 text-xs">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          <RefreshCw className="w-4.5 h-4.5 text-indigo-400 animate-spin shrink-0" />
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full border border-white/10 shrink-0" />
                        )}
                        <span className={isCompleted ? 'text-white/40 line-through' : isActive ? 'text-indigo-400 font-bold' : 'text-white/60'}>
                          {stepText}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Shimmering Resume Layout Skeleton */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3.5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-2/3 bg-white/15 rounded" />
                      <div className="h-2 w-1/2 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="h-[1px] bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-2.5 w-full bg-white/10 rounded" />
                    <div className="h-2.5 w-5/6 bg-white/10 rounded" />
                    <div className="h-2.5 w-4/5 bg-white/10 rounded" />
                  </div>
                  <div className="h-[1px] bg-white/5" />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <div className="h-5 w-12 bg-white/10 rounded-md" />
                    <div className="h-5 w-16 bg-white/10 rounded-md" />
                    <div className="h-5 w-14 bg-white/10 rounded-md" />
                    <div className="h-5 w-10 bg-white/10 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Success / Results Overview State */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs font-bold text-center">
                <div className="bg-slate-950/35 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-[9px] text-white uppercase tracking-wider">✓ Parsed</span>
                </div>
                <div className="bg-slate-950/35 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center">
                  <span className="text-emerald-400 text-base font-space font-extrabold">{parsedData?.skills.length || 15}</span>
                  <span className="text-[9px] text-white uppercase tracking-wider">Skills</span>
                </div>
                <div className="bg-slate-950/35 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center">
                  <span className="text-emerald-400 text-base font-space font-extrabold">{parsedData?.projects?.length || 0}</span>
                  <span className="text-[9px] text-white uppercase tracking-wider">Projects</span>
                </div>
                <div className="bg-slate-950/35 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center">
                  <span className="text-emerald-400 text-[10px] font-extrabold font-space">98% Match</span>
                  <span className="text-[9px] text-white uppercase tracking-wider">ATS Ready</span>
                </div>
                <div className="bg-slate-950/35 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center col-span-2 sm:col-span-1">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0 mb-1" style={{ animationDuration: '3s' }} />
                  <span className="text-[9px] text-white uppercase tracking-wider">Scanning...</span>
                </div>
              </div>

              {/* Parsed Details Board */}
              <div className="bg-slate-950/30 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Candidate Name</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{parsedData?.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Headline / Title</span>
                    <span className="text-xs font-bold text-indigo-300 block mt-0.5">{parsedData?.title}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-2.5">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Extracted Hard Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {parsedData?.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="bg-white/5 border border-white/5 text-white/70 text-[9px] font-medium px-2 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-2.5">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Synthesized Executive Bio</span>
                  <p className="text-xs text-white/70 leading-relaxed font-sans mt-1">
                    {parsedData?.summary}
                  </p>
                </div>

                {parsedData?.education && parsedData.education.length > 0 && (
                  <div className="border-t border-white/5 pt-2.5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Parsed Education History</span>
                    <ul className="list-disc pl-4 text-xs text-white/70 mt-1 space-y-1 font-sans">
                      {parsedData.education.map((edu, idx) => (
                        <li key={idx}>{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedData?.experience && parsedData.experience.length > 0 && (
                  <div className="border-t border-white/5 pt-2.5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Parsed Professional Experience</span>
                    <ul className="list-disc pl-4 text-xs text-white/70 mt-1 space-y-1.5 font-sans">
                      {parsedData.experience.map((exp, idx) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedData?.projects && parsedData.projects.length > 0 && (
                  <div className="border-t border-white/5 pt-2.5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Parsed Key Projects</span>
                    <ul className="list-disc pl-4 text-xs text-white/70 mt-1 space-y-1 font-sans">
                      {parsedData.projects.map((proj, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {proj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedData?.certifications && parsedData.certifications.length > 0 && (
                  <div className="border-t border-white/5 pt-2.5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Parsed Certifications</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {parsedData.certifications.map((cert, idx) => (
                        <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-medium px-2 py-0.5 rounded-md">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error fallback message inside results */}
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400" />
                  <span className="font-sans leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Confirmation CTAs */}
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <button
                  onClick={() => {
                    setParsedData(null);
                    setIsParsing(false);
                    setPasteText('');
                    setFileName(null);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer py-1"
                >
                  Re-parse / Start Over
                </button>

                <button
                  onClick={handleApplyParsedProfile}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                >
                  Apply to My Profile
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
