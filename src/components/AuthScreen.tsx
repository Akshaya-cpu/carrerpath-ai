import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, Briefcase, Code, AlertCircle, ArrowRight, ShieldCheck, Key, RefreshCw, Github, Chrome } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('sunkaraakshaya11@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  
  // Register Form States
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerTitle, setRegisterTitle] = useState('');
  const [registerSkills, setRegisterSkills] = useState('');
  
  // OTP Flow States
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [otpValue, setOtpValue] = useState('');
  const [serverOtpHint, setServerOtpHint] = useState<string | null>(null);

  const DEMO_EMAIL = 'sunkaraakshaya11@gmail.com';
  const DEMO_PASSWORD = 'password123';
  const DEMO_USER_PROFILE: UserProfile = {
    name: 'Sunkara Akshaya',
    email: DEMO_EMAIL,
    title: 'Career Seeker',
    skills: ['Resume Writing', 'Interview Prep', 'Job Matching'],
    resumeText: 'Focused on landing a role that bridges technical skills with impact-driven product work.',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=demo-user',
  };

  // Social OAuth Integration States
  const [activeSocialFlow, setActiveSocialFlow] = useState<'google' | 'github' | null>(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  
  // General UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setOtpValue('');
    setServerOtpHint(null);
    setActiveSocialFlow(null);
    setGithubUsername('');
    setGoogleCustomEmail('');
    setGoogleCustomName('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (
        loginEmail.trim().toLowerCase() === DEMO_EMAIL &&
        loginPassword === DEMO_PASSWORD
      ) {
        localStorage.setItem('career_path_ai_token', 'demo-token');
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          onLoginSuccess(DEMO_USER_PROFILE);
        }, 800);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (customName: string, customEmail: string) => {
    setIsSocialLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'Google',
          email: customEmail.trim(),
          name: customName.trim(),
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(customName.trim())}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      if (data.token) localStorage.setItem('career_path_ai_token', data.token);
      setSuccess('Logged in successfully with Google!');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign in.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleGithubConnect = async () => {
    if (!githubUsername.trim()) return;
    setIsSocialLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://api.github.com/users/${githubUsername.trim()}`);
      if (!res.ok) {
        throw new Error('GitHub profile not found. Please verify the username.');
      }
      const data = await res.json();
      
      const name = data.name || data.login;
      const email = data.email || `${data.login}@github.com`;
      const avatarUrl = data.avatar_url;
      const bio = data.bio || `Developer profile for ${name} synced from GitHub.`;
      const location = data.location || 'Remote';
      const company = data.company || 'Open Source';
      
      const potentialSkills = ['Git', 'GitHub', 'JavaScript', 'TypeScript'];
      if (bio.toLowerCase().includes('react')) potentialSkills.push('React');
      if (bio.toLowerCase().includes('node')) potentialSkills.push('Node.js');
      if (bio.toLowerCase().includes('python')) potentialSkills.push('Python');
      if (bio.toLowerCase().includes('design')) potentialSkills.push('UI/UX Design', 'Figma');
      if (bio.toLowerCase().includes('rust')) potentialSkills.push('Rust');
      if (bio.toLowerCase().includes('web')) potentialSkills.push('CSS', 'HTML');
      if (potentialSkills.length <= 4) {
        potentialSkills.push('System Design', 'Software Engineering', 'API Integration');
      }

      const title = data.company ? `Software Engineer at ${data.company}` : 'Full Stack Developer';

      const loginResponse = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GitHub',
          email,
          name,
          avatarUrl,
          title,
          skills: potentialSkills,
          resumeText: `${bio}\n\nLocation: ${location}\nCompany: ${company}\nGitHub Profile: ${data.html_url}`
        })
      });

      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        throw new Error(loginData.error || 'Failed to authenticate on server.');
      }

      if (loginData.token) localStorage.setItem('career_path_ai_token', loginData.token);
      setSuccess('Successfully synchronized and authenticated via GitHub!');
      setTimeout(() => {
        onLoginSuccess(loginData.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during GitHub authentication.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const skillsArray = registerSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await fetch('/api/auth/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          name: registerName,
          password: registerPassword,
          title: registerTitle || 'Professional',
          skills: skillsArray.length > 0 ? skillsArray : ['Communication', 'Analytical Thinking'],
          resumeText: `Professional profile for ${registerName}. Specialize as a ${registerTitle || 'Professional'}.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration request failed');
      }

      setSuccess('Verification OTP code sent successfully!');
      if (data.otp) {
        setServerOtpHint(data.otp);
      }
      setRegisterStep(2); // Move to OTP verification step
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!otpValue || otpValue.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          otp: otpValue.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OTP Verification failed');
      }

      if (data.token) localStorage.setItem('career_path_ai_token', data.token);
      setSuccess('Account verified and created successfully!');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Visual Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md glass-card bg-slate-900/30 border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Careers with AI
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            CareerPath AI
          </h1>
          <p className="text-xs text-white/50">
            {mode === 'login' 
              ? 'Sign in to access personalized matching opportunities' 
              : 'Create your professional account and verify your credential'}
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-emerald-200 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <p className="leading-normal">{success}</p>
          </div>
        )}

        {/* Form Switcher */}
        {activeSocialFlow === 'google' ? (
          /* GOOGLE SOCIAL FLOW VIEW */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Chrome className="w-4 h-4 text-rose-400" />
                Sign in with Google
              </h3>
              <button 
                type="button"
                onClick={() => resetForm()}
                className="text-white/40 hover:text-white text-xs cursor-pointer bg-transparent border-none py-1 px-2.5 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Authenticate using your Google Identity. Select a pre-authorized account or configure a custom credential.
            </p>

            {/* Realistic Google Accounts Selection list */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('Akshaya Sunkara', 'sunkaraakshaya11@gmail.com')}
                disabled={isSocialLoading}
                className="w-full flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950/70 border border-white/5 hover:border-indigo-500/30 rounded-2xl text-left cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbAWwMpbTuAXNkpIJt-rJA58sDRLHcrMnIbEVrakGD1qSQoBZ-GbMLc_0S9egMlnx1yz20wzRi2SuaaDfVLoU-t5jX7QIsfingYDVp1m7lxfiFZPlOD-laLGB9Ej5MSaJOe1ZD0V5k9AsQqN4FPLZoc1MzlYI_70mvWtYWMzqWxppr6AyuFC9NAY6M56DUU7RBfQsEyXBxqgy8G4wxi_277d7eplRep1_v8fS7rWkbCDRdXlmwMy2e" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Akshaya Sunkara</p>
                    <p className="text-[10px] text-white/40">sunkaraakshaya11@gmail.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Pre-authorized</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <span className="relative px-2.5 text-[9px] uppercase font-bold tracking-widest text-white/30 bg-slate-900/40">
                  Or Use Custom Account
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    value={googleCustomEmail}
                    onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    placeholder="e.g. custom.dev@gmail.com"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                    Google Display Name
                  </label>
                  <input
                    type="text"
                    value={googleCustomName}
                    onChange={(e) => setGoogleCustomName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isSocialLoading || !googleCustomEmail || !googleCustomName}
              onClick={() => handleGoogleSignIn(googleCustomName, googleCustomEmail)}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all cursor-pointer mt-2"
            >
              {isSocialLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In with Google Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : activeSocialFlow === 'github' ? (
          /* GITHUB SOCIAL FLOW VIEW */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Github className="w-4 h-4 text-indigo-400" />
                Connect GitHub Profile
              </h3>
              <button 
                type="button"
                onClick={() => resetForm()}
                className="text-white/40 hover:text-white text-xs cursor-pointer bg-transparent border-none py-1 px-2.5 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-xs text-white/60 leading-relaxed">
              Connect your GitHub account. We synchronize directly with the public GitHub API to dynamically import your professional avatar, profile biography, and technical skills list.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                GitHub Username
              </label>
              <div className="relative">
                <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                  placeholder="e.g. torvalds"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSocialLoading || !githubUsername}
              onClick={handleGithubConnect}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all cursor-pointer mt-2"
            >
              {isSocialLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sync & Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : mode === 'login' ? (
          /* LOGIN VIEW */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Social Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative px-3 text-[9px] uppercase font-bold tracking-widest text-white/40 bg-slate-900/30">
                Or Continue With
              </span>
            </div>

            {/* Social Auth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setActiveSocialFlow('google'); setError(null); }}
                className="h-10 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Chrome className="w-4 h-4 text-rose-400" />
                Google
              </button>
              <button
                type="button"
                onClick={() => { setActiveSocialFlow('github'); setError(null); }}
                className="h-10 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Github className="w-4 h-4 text-slate-300" />
                GitHub
              </button>
            </div>

            {/* Demo user helper box */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-indigo-300 leading-normal">
                <span className="font-bold">Demo account:</span> <code className="bg-indigo-950/50 px-1 py-0.5 rounded text-white font-mono">sunkaraakshaya11@gmail.com</code> with password <code className="bg-indigo-950/50 px-1 py-0.5 rounded text-white font-mono">password123</code>
              </p>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetForm();
                }}
                className="text-xs text-white/55 hover:text-white transition-colors"
              >
                Don't have an account? <span className="text-indigo-400 font-semibold underline">Create one</span>
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER VIEW WITH OTP VERIFICATION */
          <div className="space-y-4">
            {registerStep === 1 ? (
              /* REGISTER STEP 1: Details Form */
              <form onSubmit={handleRegisterRequest} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                      placeholder="e.g. john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                    Professional Headline
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={registerTitle}
                      onChange={(e) => setRegisterTitle(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                      placeholder="e.g. Frontend Software Engineer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1">
                    Skills (comma separated)
                  </label>
                  <div className="relative">
                    <Code className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={registerSkills}
                      onChange={(e) => setRegisterSkills(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/25"
                      placeholder="React, TypeScript, Figma"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send Verification OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      resetForm();
                    }}
                    className="text-xs text-white/55 hover:text-white transition-colors"
                  >
                    Already have an account? <span className="text-indigo-400 font-semibold underline">Sign In</span>
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER STEP 2: OTP Verification */
              <form onSubmit={handleRegisterVerify} className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center space-y-2">
                  <Key className="w-6 h-6 text-indigo-400 mx-auto" />
                  <p className="text-xs text-white/80 font-medium">
                    We sent a 6-digit verification code to <span className="text-indigo-300 font-bold">{registerEmail}</span>
                  </p>
                  <p className="text-[10px] text-white/40">
                    Enter the code below to complete account activation.
                  </p>
                </div>

                <div className="space-y-1 text-center">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Enter OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-48 bg-slate-950/40 border-2 border-indigo-500/30 rounded-2xl py-3 text-center text-2xl font-bold text-white tracking-[0.5em] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-white/10 mx-auto block"
                    placeholder="000000"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.25)] transition-all cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Verify & Activate Account
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Developer Demo Aid Banner */}
                {serverOtpHint && (
                  <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-3.5 text-center space-y-1">
                    <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Demo Live Bypass
                    </span>
                    <p className="text-xs text-white/70">
                      Your server-generated OTP is: <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded tracking-wider">{serverOtpHint}</span>
                    </p>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep(1);
                      resetForm();
                    }}
                    className="text-xs text-white/50 hover:text-white underline transition-colors"
                  >
                    ← Back to Sign Up Details
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
