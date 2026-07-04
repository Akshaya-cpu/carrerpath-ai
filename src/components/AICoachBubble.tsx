import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, X, Send, RefreshCw, Bot, User, ArrowRight, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { parseApiResponse, parseErrorResponse } from '../utils/apiResponse';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface AICoachBubbleProps {
  profile: UserProfile;
}

export default function AICoachBubble({ profile }: AICoachBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello ${profile.name}! 👋 I am your CareerPath Coach AI. I've analyzed your headline as a **${profile.title}**.\n\nAsk me anything about tailoring your resume, negotiating a competitive salary, preparing for hard company interviews, or bridging skill gaps!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('careerpath_premium_pro') === 'true';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Input Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => prev ? prev + ' ' + transcript : transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const updatePremium = () => {
      setIsPremium(typeof window !== 'undefined' && localStorage.getItem('careerpath_premium_pro') === 'true');
    };

    updatePremium();
    window.addEventListener('storage', updatePremium);
    return () => window.removeEventListener('storage', updatePremium);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    if (!isPremium) {
      setMessages(prev => [
        ...prev,
        {
          id: `locked-${Date.now()}`,
          role: 'model',
          content: 'CareerPath AI Coach is available only for premium subscribers. Upgrade to Premium to unlock this feature.'
        }
      ]);
      return;
    }

    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) {
      setInput('');
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/gemini/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          })),
          profile: {
            name: profile.name,
            title: profile.title,
            skills: profile.skills,
            summary: profile.resumeText
          }
        })
      });

      if (!response.ok) {
        const errorText = await parseErrorResponse(response);
        throw new Error(errorText || 'Failed to reach AI Coach.');
      }

      const data = await parseApiResponse(response);
      const modelMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: data.response || "I apologize, I'm having trouble connecting right now. Let's try again!"
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'model',
          content: 'Oops! I experienced a connection issue. Please verify your connection or retry in a moment.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const quickPrompts = [
    'How do I negotiate my product design salary?',
    'Review my resume for key ATS keywords',
    'What are the trending frontend skills in 2026?',
    'Draft an elevator pitch for Senior Product Designer'
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50">
        <motion.button
          onClick={toggleChat}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-2xl border transition-all chat-btn-pulse ${
            isOpen 
              ? 'bg-slate-900 border-white/20 text-white' 
              : 'bg-indigo-600 border-indigo-400 text-white hover:bg-indigo-500'
          }`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          id="ai-coach-bubble-btn"
        >
          {isOpen ? (
            <X className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <MessageSquare className="w-5 h-5 shrink-0" />
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border border-slate-950 animate-pulse" />
              )}
              <span className="absolute -inset-1 rounded-full border border-indigo-500/30 animate-ping opacity-40 pointer-events-none" />
            </>
          )}
        </motion.button>
      </div>

      {/* Slide-over Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-36 md:bottom-24 right-4 left-4 sm:left-auto sm:w-[380px] max-h-[500px] h-[75vh] glass-card border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 text-white"
            id="ai-coach-chat-panel"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-white/10 bg-slate-950/60 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center border border-indigo-400/30">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white leading-none">CareerPath Coach AI</h4>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online strategist
                  </span>
                </div>
              </div>
              <button 
                onClick={toggleChat}
                className="w-7 h-7 rounded-lg hover:bg-white/5 text-white/50 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body (Scrollable Messages) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/20">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2.5 items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'model' && (
                    <div className="w-7 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  )}

                  <div 
                    className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed whitespace-pre-wrap font-sans ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white/5 border border-white/5 text-white/95 rounded-tl-none'
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-md bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-indigo-300" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 items-start justify-start">
                  <div className="w-7 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Suggestions Panel (shown only when thread has welcome message only) */}
              {messages.length === 1 && (
                <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1">
                    <p className="text-[11px] font-extrabold text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Dynamic Career Coaching
                    </p>
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      Consult with Gemini AI to bridge critical technical gaps, dry-run specific mock interviews, or design highly tailored resume profiles.
                    </p>
                  </div>
                  
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1 block">Quick Start Guides</span>
                  <div className="grid grid-cols-1 gap-2">
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(p)}
                        disabled={!isPremium}
                        className={`p-2.5 rounded-xl text-left text-[11px] transition-all flex justify-between items-center group font-medium ${isPremium ? 'bg-white/5 hover:bg-indigo-950/25 border border-white/5 hover:border-indigo-500/20 text-white/80 hover:text-white cursor-pointer' : 'bg-white/5 border border-white/10 text-white/35 cursor-not-allowed'}`}
                      >
                        <span className="line-clamp-1">{p}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-white/10 bg-slate-950/60 backdrop-blur-md flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleListening}
                disabled={!isPremium}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                  !isPremium
                    ? 'bg-white/10 border-white/10 text-white/40 cursor-not-allowed'
                    : isListening
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={!isPremium ? 'Premium feature - upgrade to use voice input' : isListening ? 'Listening... click to stop' : 'Voice Input (dictation)'}
              >
                {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4" />}
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? "Listening... speak now..." : isPremium ? "Type your career question..." : "Premium only. Upgrade to unlock the coach."}
                disabled={!isPremium}
                className="flex-1 h-9 px-3 bg-white/5 border border-white/10 rounded-xl outline-none text-xs text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans disabled:cursor-not-allowed disabled:opacity-70"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!isPremium || !input.trim() || isTyping}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${isPremium ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
