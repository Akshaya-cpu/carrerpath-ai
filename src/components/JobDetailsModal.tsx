import React, { useState, useRef } from 'react';
import { 
  X, Briefcase, MapPin, DollarSign, Calendar, Sparkles, Send, 
  CheckCircle2, FileText, Gift, Award, AlertCircle, Clock, Users,
  Star, MessageSquare, HelpCircle, RefreshCw, BookOpen, ArrowRight, ChevronRight, ThumbsUp,
  Bookmark, Share2, Check, Mic, MicOff, ShieldAlert, ShieldCheck, Download, FileDown,
  Mail, Trash2, Paperclip, Phone, Globe, ArrowLeft, Upload, Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, UserProfile, JobApplication } from '../types';
import { parseApiResponse, parseErrorResponse } from '../utils/apiResponse';

interface InterviewQuestion {
  id: string;
  type: string;
  question: string;
  hint: string;
}

interface InterviewFeedback {
  rating: number;
  feedback: string;
  suggestions: string;
  sampleResponse: string;
}

interface JobDetailsModalProps {
  job: Job;
  profile: UserProfile;
  isApplied: boolean;
  isSaved?: boolean;
  onToggleSave?: (jobId: string) => void;
  application?: JobApplication;
  onUpdateStatus?: (jobId: string, status: JobApplication['status']) => void;
  onApply: (jobId: string, coverLetter: string, additionalData?: Partial<JobApplication>) => void;
  onClose: () => void;
}

export default function JobDetailsModal({
  job,
  profile,
  isApplied,
  isSaved = false,
  onToggleSave,
  application,
  onUpdateStatus,
  onApply,
  onClose
}: JobDetailsModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Split profile.name into First and Last names
  const nameParts = profile.name ? profile.name.trim().split(/\s+/) : [];
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [formStep, setFormStep] = useState(1); // Step 1: Basic Info, Step 2: Resume & Doc, Step 3: Cover Letter & Preferences
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(profile.email || '');
  const [confirmEmail, setConfirmEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United States');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  
  // Simulated file upload states
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(profile.resumeText ? 'Profile_Resume.pdf' : null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Consents & notification choices
  const [consentPostings, setConsentPostings] = useState(true);
  const [consentRecruiting, setConsentRecruiting] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setUploadProgress(10);
    setErrorMessage('');

    // Simulate upload progress interval
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploadingFile(false);
          setUploadedResumeName(file.name);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleShare = () => {
    try {
      const text = `${job.title} at ${job.company} (${job.location}) - Found on CareerPath AI!`;
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`${text}\n${url}`);
      }
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // Interview prep feature states
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<InterviewFeedback | null>(null);
  const [feedbackError, setFeedbackError] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Voice Input Speech Recognition for Practice Interview Answers
  const [isListeningAnswer, setIsListeningAnswer] = useState(false);
  const recognitionAnswerRef = useRef<any>(null);

  const startListeningAnswer = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListeningAnswer(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript) {
          setUserAnswer(prev => prev ? prev + ' ' + transcript : transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListeningAnswer(false);
      };

      rec.onend = () => {
        setIsListeningAnswer(false);
      };

      rec.start();
      recognitionAnswerRef.current = rec;
    } catch (err) {
      console.error(err);
      setIsListeningAnswer(false);
    }
  };

  const stopListeningAnswer = () => {
    if (recognitionAnswerRef.current) {
      recognitionAnswerRef.current.stop();
    }
    setIsListeningAnswer(false);
  };

  const toggleListeningAnswer = () => {
    if (isListeningAnswer) {
      stopListeningAnswer();
    } else {
      startListeningAnswer();
    }
  };

  // Smart Job Scam Detector States & Function
  const [isScamChecking, setIsScamChecking] = useState(false);
  const [scamResult, setScamResult] = useState<{
    safetyScore: number;
    riskLevel: string;
    verdict: string;
    redFlags: string[];
    safeSignals: string[];
    verificationSteps: string[];
  } | null>(null);
  const [scamCheckError, setScamCheckError] = useState('');
  const [showScamPanel, setShowScamPanel] = useState(false);

  const handleScamCheck = async () => {
    setIsScamChecking(true);
    setScamCheckError('');
    try {
      const response = await fetch('/api/gemini/scam-detector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          description: job.description,
          salary: job.salary,
          location: job.location
        })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to analyze job safety.');
      }

      const data = await parseApiResponse(response);
      setScamResult(data);
      setShowScamPanel(true);
    } catch (err: any) {
      console.error(err);
      setScamCheckError(err.message || 'Security check failed. Please check connection.');
    } finally {
      setIsScamChecking(false);
    }
  };

  const handleFetchQuestions = async () => {
    setIsLoadingQuestions(true);
    setQuestionsError('');
    try {
      const response = await fetch('/api/gemini/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          jobTitle: job.title,
          company: job.company,
          description: job.description,
          requirements: job.requirements
        })
      });
      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to load interview questions');
      }
      const data = await parseApiResponse(response);
      setInterviewQuestions(data.questions || []);
    } catch (err: any) {
      console.error(err);
      setQuestionsError(err.message || 'Error compiling interview questions.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleToggleInterviewPrep = () => {
    const nextState = !showInterviewPrep;
    setShowInterviewPrep(nextState);
    if (nextState && interviewQuestions.length === 0) {
      handleFetchQuestions();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion) return;
    if (!userAnswer || userAnswer.trim().length < 5) {
      setFeedbackError('Please write a more complete answer to evaluate.');
      return;
    }
    setIsSubmittingAnswer(true);
    setFeedbackError('');
    setFeedbackResult(null);
    try {
      const response = await fetch('/api/gemini/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          jobTitle: job.title,
          company: job.company,
          question: selectedQuestion.question,
          type: selectedQuestion.type,
          userAnswer: userAnswer
        })
      });
      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to analyze your answer.');
      }
      const data = await parseApiResponse(response);
      setFeedbackResult(data);
    } catch (err: any) {
      console.error(err);
      setFeedbackError(err.message || 'Error scoring your answer. Please try again.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Generate customized AI Cover Letter via API route
  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCover(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/gemini/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          skills: profile.skills,
          resumeText: profile.resumeText,
          jobTitle: job.title,
          company: job.company,
          requirements: job.requirements
        })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to generate cover letter');
      }

      const data = await parseApiResponse(response);
      setCoverLetter(data.coverLetter);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unable to generate cover letter. Please verify server connection.');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleNextStep1 = () => {
    if (!firstName.trim()) {
      setErrorMessage('Please enter your First Name.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Please enter your Last Name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your Email Address.');
      return;
    }
    if (!confirmEmail.trim()) {
      setErrorMessage('Please confirm your Email Address.');
      return;
    }
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setErrorMessage('Email addresses do not match.');
      return;
    }
    setErrorMessage('');
    setFormStep(2);
  };

  const handleNextStep2 = () => {
    if (!uploadedResumeName) {
      setErrorMessage('Please upload a resume/CV or attach your profile resume.');
      return;
    }
    setErrorMessage('');
    setFormStep(3);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter both First Name and Last Name.');
      return;
    }
    if (!email.trim() || !confirmEmail.trim()) {
      setErrorMessage('Please enter and confirm your email address.');
      return;
    }
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setErrorMessage('Email addresses do not match.');
      return;
    }
    if (!uploadedResumeName) {
      setErrorMessage('Please upload a resume or attach your profile resume.');
      return;
    }
    if (!agreePrivacy) {
      setErrorMessage('You must agree to the Privacy Policy to submit your application.');
      return;
    }

    setErrorMessage('');
    onApply(job.id, coverLetter, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      resumeName: uploadedResumeName,
      country: country,
      portfolioUrl: portfolioUrl.trim()
    });
    setSuccessMessage(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const getActiveStep = (status?: string) => {
    if (!status) return 0;
    switch (status) {
      case 'Applied': return 0;
      case 'Reviewing': return 1;
      case 'Interviewing': return 2;
      case 'Offered':
      case 'Declined':
        return 3;
      default: return 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className={`glass-card border-white/10 w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-white transition-all duration-300 ${
          showInterviewPrep ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-white/5">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center p-2 border border-white/10 shrink-0">
              <img src={job.logoUrl} alt={job.company} className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white tracking-tight">{job.title}</h2>
              <p className="text-sm text-white/70 font-medium flex items-center gap-1.5">
                {job.company}
                {isApplied && (
                  <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                    Applied
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleInterviewPrep}
              className={`text-xs font-bold uppercase tracking-wider h-8 px-3 rounded-lg flex items-center gap-1.5 border transition-all duration-150 ${
                showInterviewPrep 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                  : 'bg-white/5 text-indigo-300 border-indigo-500/30 hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Interview Prep
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors flex items-center justify-center"
              id="modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Container */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Job Details & Apply State */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {!successMessage && !isApplying && (
              <div className="bg-slate-950/40 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4 shrink-0 relative z-20">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Quick Actions
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Save Action */}
                  <button
                    type="button"
                    onClick={() => onToggleSave?.(job.id)}
                    className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isSaved
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                        : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                    title={isSaved ? 'Unsave Job' : 'Save Job'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 transition-transform duration-150 ${isSaved ? 'fill-indigo-400 text-indigo-400 scale-105' : 'text-white/40'}`} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  {/* Apply Action */}
                  {isApplied ? (
                    <div
                      className="h-9 px-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-1.5 text-xs font-bold select-none"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Applied</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsApplying(true)}
                      className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-150 shrink-0 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Apply</span>
                    </button>
                  )}

                  {/* Share Action */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isShared
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                    title="Copy Job Link"
                  >
                    {isShared ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50 duration-150" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-white/45 group-hover:text-white" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {successMessage ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                  <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
                  <p className="text-white/60 max-w-sm text-sm">
                    Your credentials and cover letter have been sent successfully to the recruiting team at <strong>{job.company}</strong>.
                  </p>
                </div>
              ) : isApplying ? (
                /* Application Form */
                <form onSubmit={handleSubmitApplication} className="space-y-6">
                  {/* Step Banner / Progress Tracker */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs rounded-lg flex items-center justify-center">
                          {formStep}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white tracking-tight">Apply for {job.title}</h4>
                          <p className="text-[10px] text-white/50">{job.company} • Step {formStep} of 3</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsApplying(false);
                          setFormStep(1);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Details
                      </button>
                    </div>

                    {/* Progress Bar Indicators */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${formStep >= 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${formStep >= 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${formStep >= 3 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 rounded-xl flex items-start gap-2.5 text-xs text-rose-400 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* STEP 1: PERSONAL DETAILS */}
                  {formStep === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                      <div className="border-b border-white/10 pb-1">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-indigo-300">Contact & Identity</h3>
                        <p className="text-xs text-white/50">Enter your legal name and contact details.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-white/70">Legal First Name <span className="text-rose-400">*</span></label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="e.g. John"
                            required
                            className="w-full text-sm p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white/5 text-white placeholder-white/20"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-white/70">Legal Last Name <span className="text-rose-400">*</span></label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="e.g. Doe"
                            required
                            className="w-full text-sm p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white/5 text-white placeholder-white/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-white/70">Valid Email Address <span className="text-rose-400">*</span></label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              required
                              className="w-full text-sm pl-10 p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white/5 text-white placeholder-white/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-white/70">Retype Email Address <span className="text-rose-400">*</span></label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                            <input
                              type="email"
                              value={confirmEmail}
                              onChange={(e) => setConfirmEmail(e.target.value)}
                              placeholder="Confirm email address"
                              required
                              className="w-full text-sm pl-10 p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white/5 text-white placeholder-white/20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-white/70">Phone Number <span className="text-white/40 font-normal">(Optional)</span></label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 (555) 000-0000"
                              className="w-full text-sm pl-10 p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white/5 text-white placeholder-white/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-white/70">Country of Application <span className="text-rose-400">*</span></label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full text-sm pl-10 p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-zinc-900 text-white cursor-pointer"
                            >
                              <option value="United States">United States</option>
                              <option value="India">India</option>
                              <option value="Canada">Canada</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Germany">Germany</option>
                              <option value="France">France</option>
                              <option value="Australia">Australia</option>
                              <option value="Singapore">Singapore</option>
                              <option value="Japan">Japan</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextStep1}
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-1.5 mt-4 cursor-pointer"
                      >
                        <span>Next: Resume & Links</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* STEP 2: RESUME & LINKS */}
                  {formStep === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                      <div className="border-b border-white/10 pb-1">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-indigo-300">Resume & Documents</h3>
                        <p className="text-xs text-white/50">Provide your latest professional resume/CV and online links.</p>
                      </div>

                      {/* Drag & Drop File Upload Block */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-white/70">Upload Resume <span className="text-rose-400">*</span></label>
                        
                        {!uploadedResumeName && !isUploadingFile ? (
                          <div className="relative border-2 border-dashed border-white/15 hover:border-indigo-500/40 bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-150">
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc,.txt"
                              onChange={handleSimulatedUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Upload className="w-8 h-8 text-white/40 mb-2" />
                            <p className="text-xs font-semibold text-white">Drag and drop or click to upload</p>
                            <p className="text-[10px] text-white/40 mt-1">Accepts PDF, DOCX, DOC, TXT (Max 5MB)</p>
                          </div>
                        ) : isUploadingFile ? (
                          <div className="bg-white/5 border border-white/15 rounded-2xl p-5 flex flex-col gap-2 animate-pulse">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/60 font-medium">Uploading document...</span>
                              <span className="text-indigo-400 font-bold">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-emerald-500/15 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-white">{uploadedResumeName}</h4>
                                <p className="text-[10px] text-white/40">Ready to submit • Verified</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUploadedResumeName(null)}
                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/10 rounded-lg transition-all duration-150 cursor-pointer"
                              title="Delete resume"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Fast Fill Option */}
                        {profile.resumeText && !uploadedResumeName && !isUploadingFile && (
                          <div className="pt-1.5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setIsUploadingFile(true);
                                setUploadProgress(20);
                                const t = setTimeout(() => {
                                  setIsUploadingFile(false);
                                  setUploadedResumeName('Profile_Resume.pdf');
                                }, 400);
                              }}
                              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3" />
                              ⚡ Attach current resume from my profile
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Portfolio URL Input */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-xs font-semibold text-white/70">Portfolio / Personal Website URL <span className="text-white/40 font-normal">(Optional)</span></label>
                        <div className="relative">
                          <Link className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                          <input
                            type="url"
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                            placeholder="https://myportfolio.com"
                            className="w-full text-sm pl-10 p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white/5 text-white placeholder-white/20"
                          />
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setFormStep(1)}
                          className="h-11 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/10 transition-all duration-150 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep2}
                          className="h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow transition-all duration-150 cursor-pointer"
                        >
                          <span>Next: Cover Letter</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: COVER LETTER & CONSENT */}
                  {formStep === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                      <div className="border-b border-white/10 pb-1">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-indigo-300">Cover Letter & Consents</h3>
                        <p className="text-xs text-white/50">Write or generate a cover letter and provide your recruiter consent.</p>
                      </div>

                      {/* Cover Letter Block */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-white/70">
                            Cover Letter <span className="text-white/40 font-normal">(Optional)</span>
                          </label>
                          
                          <button
                            type="button"
                            onClick={handleGenerateCoverLetter}
                            disabled={isGeneratingCover}
                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium disabled:opacity-50 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isGeneratingCover ? 'Generating cover...' : 'Write custom cover letter with Gemini AI'}
                          </button>
                        </div>

                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Paste or write your cover letter here, or click the button above to let our custom Gemini model generate a highly persuasive one for you based on your resume and skills."
                          rows={6}
                          className="w-full text-xs p-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white/5 text-white placeholder-white/30 custom-scrollbar"
                        />
                      </div>

                      {/* Recruiter & Privacy Agreements */}
                      <div className="space-y-2.5 pt-2 bg-white/5 rounded-2xl p-4 border border-white/10">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Corporate Terms & Permissions</h4>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={consentPostings}
                            onChange={(e) => setConsentPostings(e.target.checked)}
                            className="mt-0.5 rounded border-white/10 text-indigo-600 focus:ring-indigo-500/20"
                          />
                          <span className="text-white/70 font-medium">
                            Send me email updates and notifications for future <strong>{job.category}</strong> role opportunities.
                          </span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={consentRecruiting}
                            onChange={(e) => setConsentRecruiting(e.target.checked)}
                            className="mt-0.5 rounded border-white/10 text-indigo-600 focus:ring-indigo-500/20"
                          />
                          <span className="text-white/70 font-medium">
                            I consent to recruiters at <strong>{job.company}</strong> contacting me regarding this application via Email or SMS.
                          </span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={agreePrivacy}
                            onChange={(e) => setAgreePrivacy(e.target.checked)}
                            required
                            className="mt-0.5 rounded border-white/10 text-indigo-600 focus:ring-indigo-500/20"
                          />
                          <span className="text-indigo-300 font-bold">
                            I have read, understood, and accept the corporate Data Privacy Policy and Agreement. <span className="text-rose-400">*</span>
                          </span>
                        </label>
                      </div>

                      {/* Bottom Actions */}
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setFormStep(2)}
                          className="h-11 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/10 transition-all duration-150 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Application</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                /* Job Details Screen */
                <div className="space-y-6">
                  {/* Visual Application Status Tracker */}
                  {isApplied && (
                    <div className="glass-card bg-indigo-950/20 border border-white/10 p-5 rounded-2xl shadow-xl relative overflow-hidden space-y-4">
                      {/* Decorative ambient blobs */}
                      <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute left-0 bottom-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-lg pointer-events-none" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/20">
                            <CheckCircle2 className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white tracking-tight">Application Status Tracker</h4>
                            <p className="text-[10px] text-white/50">Tracking your interview & evaluation pipeline</p>
                          </div>
                        </div>
                        {application?.appliedAt && (
                          <span className="text-[10px] bg-white/5 border border-white/10 text-white/60 px-2.5 py-1 rounded-md font-medium">
                            Applied on {application.appliedAt}
                          </span>
                        )}
                      </div>

                      {/* Horizontal Stepper */}
                      <div className="relative pt-4 pb-2 z-10">
                        {/* Connection Line Background */}
                        <div className="absolute left-[12.5%] right-[12.5%] top-[34px] -translate-y-1/2 h-1 bg-white/10 rounded-full" />
                        
                        {/* Connection Line Filled */}
                        <motion.div 
                          className="absolute left-[12.5%] top-[34px] -translate-y-1/2 h-1 rounded-full"
                          style={{
                            background: application?.status === 'Declined'
                              ? 'linear-gradient(to right, #6366f1, #ef4444)'
                              : 'linear-gradient(to right, #6366f1, #34d399)'
                          }}
                          initial={{ width: '0%' }}
                          animate={{ 
                            width: `${(Math.min(
                              getActiveStep(application?.status), 
                              3
                            ) / 3) * 75}%` 
                          }}
                          transition={{ type: 'spring', stiffness: 70, damping: 15 }}
                        />

                        {/* Step Circles Row */}
                        <div className="relative flex justify-between items-center w-full">
                          {(() => {
                            const isDeclined = application?.status === 'Declined';
                            const isOffered = application?.status === 'Offered';
                            const activeStep = getActiveStep(application?.status);

                            const steps = [
                              { label: 'Applied', desc: 'Received', icon: Send },
                              { label: 'Under Review', desc: 'Screening', icon: Clock },
                              { label: 'Interview', desc: 'Scheduled', icon: Users },
                              { 
                                label: isDeclined ? 'Closed' : isOffered ? 'Offer!' : 'Decision', 
                                desc: isDeclined ? 'Declined' : isOffered ? 'Hired' : 'Pending', 
                                icon: isDeclined ? AlertCircle : Award 
                              }
                            ];

                            return steps.map((s, index) => {
                              const isCompleted = index < activeStep;
                              const isActive = index === activeStep;
                              const StepIcon = s.icon;

                              return (
                                <div key={index} className="flex flex-col items-center w-[25%] relative">
                                  {/* Circle container */}
                                  <motion.div 
                                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${
                                      isActive 
                                        ? isDeclined
                                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                                          : 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                                        : isCompleted 
                                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                          : 'bg-slate-900 border-white/10 text-white/40'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {isCompleted ? (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                      >
                                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                                      </motion.div>
                                    ) : (
                                      <StepIcon className="w-4 h-4" />
                                    )}

                                    {/* Glow ring on active */}
                                    {isActive && (
                                      <span className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                                        isDeclined ? 'bg-rose-400' : 'bg-indigo-400'
                                      }`} />
                                    )}
                                  </motion.div>
                                  
                                  {/* Step Labels */}
                                  <div className="text-center mt-2.5 px-0.5">
                                    <span className={`block text-[10px] font-bold tracking-tight leading-none ${
                                      isActive 
                                        ? isDeclined ? 'text-rose-400' : 'text-indigo-300' 
                                        : isCompleted ? 'text-emerald-400' : 'text-white/40'
                                    }`}>
                                      {s.label}
                                    </span>
                                    <span className="block text-[8px] text-white/40 mt-1 uppercase font-semibold tracking-wider">
                                      {s.desc}
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Status Simulator Tools */}
                      {onUpdateStatus && (
                        <div className="pt-3 border-t border-white/5 flex flex-col gap-2 relative z-10">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            Simulate Application Stages (Reviewer Journey)
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Under Review', value: 'Reviewing' as const, style: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/25' },
                              { label: 'Interview Scheduled', value: 'Interviewing' as const, style: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/25' },
                              { label: 'Offer Received', value: 'Offered' as const, style: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/25' },
                              { label: 'Decline Candidate', value: 'Declined' as const, style: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/25' },
                              { label: 'Reset (Applied)', value: 'Applied' as const, style: 'bg-white/5 hover:bg-white/10 text-white/75 border-white/10' }
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                type="button"
                                onClick={() => onUpdateStatus(job.id, btn.value)}
                                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-all ${btn.style}`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Job Metadata Bar */}
                  <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-white/80">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <DollarSign className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium">{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium">{job.category} Department</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium">Posted {job.postedTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 col-span-2 border-t border-white/5 pt-2 mt-1">
                      <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium">
                        Experience: {
                          job.experienceLevel === 'Fresher' ? 'Entry Level / Fresher' :
                          job.experienceLevel === 'Mid' ? 'Mid Level' :
                          job.experienceLevel === 'Senior' ? 'Senior / Lead Level' :
                          /senior|lead|architect|principal|enterprise|staff|manager|director/i.test(job.title) ? 'Senior / Lead Level' :
                          /junior|fresher|associate|intern|graduate|entry/i.test(job.title) ? 'Entry Level / Fresher' : 'Mid Level'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Smart Job Scam Detector / AI Scam Shield Guard */}
                  <div className="glass-card bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 flex items-center justify-between bg-white/5 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7.5 h-7.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">AI Scam Shield</h4>
                          <p className="text-[10px] text-white/50">Verify job legitimacy & detect phishing red flags</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleScamCheck}
                        disabled={isScamChecking}
                        className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer select-none shrink-0"
                      >
                        {isScamChecking ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-white" />
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-indigo-200 animate-pulse" />
                            <span>{scamResult ? 'Scan Again' : 'Verify Safety'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {scamCheckError && (
                      <div className="p-3.5 text-xs text-rose-400 bg-rose-500/5 border-b border-rose-500/10 font-medium">
                        {scamCheckError}
                      </div>
                    )}

                    {scamResult && (
                      <div className="p-4 space-y-4 animate-in fade-in duration-200 text-xs">
                        {/* Risk Meter and Safety Score */}
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider block">Safety Score</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-lg leading-none ${
                                scamResult.safetyScore >= 80 ? 'text-emerald-400' : scamResult.safetyScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {scamResult.safetyScore}%
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase border leading-none ${
                                scamResult.riskLevel === 'Low Risk' 
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                                  : scamResult.riskLevel === 'Medium Risk'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              }`}>
                                {scamResult.riskLevel}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                scamResult.safetyScore >= 80 ? 'bg-emerald-500' : scamResult.safetyScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${scamResult.safetyScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Verdict */}
                        <p className="p-3 bg-indigo-950/20 border border-indigo-500/10 text-indigo-100 rounded-xl leading-relaxed italic">
                          "{scamResult.verdict}"
                        </p>

                        {/* Red Flags & Safe Signals columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* Red Flags */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1 leading-none">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Red Flags ({scamResult.redFlags.length})
                            </span>
                            {scamResult.redFlags.length === 0 ? (
                              <p className="text-white/40 italic pl-1 text-[11px]">No immediate warning indicators detected.</p>
                            ) : (
                              <ul className="space-y-1">
                                {scamResult.redFlags.map((flag, i) => (
                                  <li key={i} className="text-[11px] text-rose-300 flex items-start gap-1 leading-snug">
                                    <span className="text-rose-500 select-none mt-0.5 shrink-0">✕</span>
                                    <span>{flag}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Safe Signals */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 leading-none">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Safe Signals ({scamResult.safeSignals.length})
                            </span>
                            {scamResult.safeSignals.length === 0 ? (
                              <p className="text-white/40 italic pl-1 text-[11px]">No clear verification anchors observed.</p>
                            ) : (
                              <ul className="space-y-1">
                                {scamResult.safeSignals.map((sig, i) => (
                                  <li key={i} className="text-[11px] text-emerald-300 flex items-start gap-1 leading-snug">
                                    <span className="text-emerald-500 select-none mt-0.5 shrink-0">✓</span>
                                    <span>{sig}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Practical Verification Steps */}
                        {scamResult.verificationSteps && scamResult.verificationSteps.length > 0 && (
                          <div className="space-y-1.5 pt-3.5 border-t border-white/5">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider block">Recommended Safety Actions</span>
                            <ol className="space-y-1.5">
                              {scamResult.verificationSteps.map((step, i) => (
                                <li key={i} className="text-[11px] text-white/70 leading-relaxed font-sans flex items-start gap-1">
                                  <span className="font-bold text-indigo-400 mr-1 shrink-0">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-white text-base">Job Description</h3>
                    <p className="text-sm text-white/75 leading-relaxed">{job.description}</p>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-400" />
                      Key Requirements
                    </h3>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex gap-2.5 text-sm text-white/70 items-start">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  {job.benefits && job.benefits.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <Gift className="w-4 h-4 text-indigo-400" />
                        Perks & Benefits
                      </h3>
                      <ul className="space-y-2">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="flex gap-2.5 text-sm text-white/70 items-start">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions for Details view */}
            {!isApplying && !successMessage && (
              <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={handleToggleInterviewPrep}
                  className={`flex-1 h-11 border font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-150 ${
                    showInterviewPrep
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40 hover:bg-indigo-600/30'
                      : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/60'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  {showInterviewPrep ? 'Hide Practice Coach' : 'Interview Prep Coach'}
                </button>

                {isApplied ? (
                  <button
                    disabled
                    className="flex-1 h-11 bg-white/5 text-white/40 border border-white/10 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Applied Successfully
                  </button>
                ) : (
                  <button
                    onClick={() => setIsApplying(true)}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Apply Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Interview Prep Sidebar */}
          {showInterviewPrep && (
            <div className="w-full md:w-[440px] border-t md:border-t-0 md:border-l border-white/10 bg-indigo-950/20 flex flex-col min-h-0 overflow-hidden relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
              
              {/* Sidebar Header */}
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wider text-indigo-300">AI Interview Simulator</span>
                </div>
                {selectedQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(null);
                      setUserAnswer('');
                      setFeedbackResult(null);
                      setFeedbackError('');
                      setShowHint(false);
                    }}
                    className="text-[10px] text-white/60 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 px-2 py-1 rounded transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    All Questions
                  </button>
                )}
              </div>

              {/* Sidebar Content Scrollable container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar relative z-10">
                {isLoadingQuestions ? (
                  /* Loading State */
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-white">Generating Practice Questions...</p>
                      <p className="text-[11px] text-white/50 max-w-[280px]">
                        Our Gemini model is analyzing the description & requirements to curate custom behavioral, technical, and situational prompts.
                      </p>
                    </div>
                  </div>
                ) : questionsError ? (
                  /* Error State */
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3 text-center">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                    <p className="text-xs text-rose-300 font-semibold">{questionsError}</p>
                    <button
                      type="button"
                      onClick={handleFetchQuestions}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-lg transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                ) : !selectedQuestion ? (
                  /* Question Picker list */
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
                      <h4 className="font-bold text-xs text-white">Prepped for {job.company}</h4>
                      <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                        Practice answering these high-yield interview questions curated specifically for this role. Type your answer and receive real-time scoring, structural review, and elite rephrasing recommendations.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-1">Curated Prompts</h5>
                      {interviewQuestions.map((q) => (
                        <div
                          key={q.id}
                          onClick={() => setSelectedQuestion(q)}
                          className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all duration-200 cursor-pointer group text-left relative"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              q.type === 'Technical' 
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' 
                                : q.type === 'Behavioral'
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                            }`}>
                              {q.type}
                            </span>
                            <span className="text-[10px] text-indigo-400 group-hover:text-indigo-300 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              Practice <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <p className="font-bold text-xs text-white/90 leading-snug group-hover:text-white transition-colors">
                            {q.question}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Selected Question Screen (Chat/Practice mode) */
                  <div className="space-y-4">
                    {/* Header summary */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          selectedQuestion.type === 'Technical' 
                            ? 'bg-indigo-500/15 text-indigo-300' 
                            : selectedQuestion.type === 'Behavioral'
                            ? 'bg-purple-500/15 text-purple-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}>
                          {selectedQuestion.type} Question
                        </span>
                        <h4 className="font-bold text-xs text-white mt-1.5 leading-relaxed">
                          {selectedQuestion.question}
                        </h4>
                      </div>
                    </div>

                    {/* Expandable Hint section */}
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                      <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        className="w-full p-3 flex justify-between items-center text-xs font-bold text-white/80 hover:bg-white/5 transition-all outline-none"
                      >
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-indigo-400" />
                          Insider Strategy Hint
                        </span>
                        <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${showHint ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {showHint && (
                        <div className="p-3 text-[11px] text-white/70 leading-relaxed font-sans bg-indigo-950/20 border-t border-white/5">
                          {selectedQuestion.hint}
                        </div>
                      )}
                    </div>

                    {/* Active Practice Response Form */}
                    {!feedbackResult ? (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                            Draft your oral or written answer:
                          </label>
                          <button
                            type="button"
                            onClick={toggleListeningAnswer}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                              isListeningAnswer
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {isListeningAnswer ? (
                              <>
                                <Mic className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                                <span>Listening (Click to Stop)</span>
                              </>
                            ) : (
                              <>
                                <MicOff className="w-3.5 h-3.5" />
                                <span>Oral Dictate Mode</span>
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder={isListeningAnswer ? "Listening... start speaking your answer now out loud! We will translate your speech into written text in real time." : "Write your answer here. Try using the STAR framework (Situation, Task, Action, Result) with specific impact metrics..."}
                          rows={10}
                          disabled={isSubmittingAnswer}
                          className="w-full text-xs p-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/25 focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none resize-none"
                        />
                        {feedbackError && (
                          <p className="text-xs text-rose-400 font-semibold px-1">{feedbackError}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleSubmitAnswer}
                          disabled={isSubmittingAnswer || userAnswer.trim().length < 5}
                          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                          {isSubmittingAnswer ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                              Analyzing Response Structure...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-white animate-pulse" />
                              Get AI Coach Review
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Coach Grade/Feedback Result Screen */
                      <div className="space-y-4 pt-1 animate-in fade-in duration-300">
                        {/* Rating Card */}
                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center space-y-2 relative overflow-hidden">
                          <div className="absolute right-0 top-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">AI Evaluated Score</span>
                          
                          <div className="flex justify-center items-center gap-1">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <Star
                                key={starVal}
                                className={`w-5 h-5 ${
                                  starVal <= feedbackResult.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                            <span className="font-black text-white text-sm ml-1">{feedbackResult.rating}/5</span>
                          </div>
                        </div>

                        {/* Critical Critique Box */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block px-1">Coaching Critique</span>
                          <div className="p-3.5 bg-indigo-950/25 border border-indigo-500/20 rounded-xl text-[11px] leading-relaxed text-white/80 space-y-2 font-sans whitespace-pre-line">
                            {feedbackResult.feedback}
                          </div>
                        </div>

                        {/* Growth Suggestions */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block px-1">How to Improve</span>
                          <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] leading-relaxed text-white/80 font-sans whitespace-pre-line">
                            {feedbackResult.suggestions}
                          </div>
                        </div>

                        {/* Exemplary Model Answer */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block px-1">Model STAR Answer</span>
                          <div className="p-4 border border-dashed border-emerald-500/35 bg-emerald-500/5 rounded-xl text-[11px] leading-relaxed text-emerald-100 relative font-sans italic whitespace-pre-line">
                            <div className="absolute top-2.5 right-2.5 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-emerald-400 tracking-wider select-none">
                              Recommended
                            </div>
                            {feedbackResult.sampleResponse}
                          </div>
                        </div>

                        {/* Repeat buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackResult(null);
                              setUserAnswer('');
                              setFeedbackError('');
                            }}
                            className="h-9 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Redo Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuestion(null);
                              setUserAnswer('');
                              setFeedbackResult(null);
                              setFeedbackError('');
                              setShowHint(false);
                            }}
                            className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            Next Question
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
