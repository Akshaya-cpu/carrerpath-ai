import { useState } from 'react';
import { Bell, Check, Sparkles, Sun, Moon } from 'lucide-react';
import { Notification, UserProfile } from '../types';

interface HeaderProps {
  profile: UserProfile;
  activeTab?: string;
  notifications: Notification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearNotifications: () => void;
  setActiveTab: (tab: string) => void;
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
  theme = 'dark',
  onToggleTheme
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const tabDetails: { [key: string]: { title: string; subtitle: string } } = {
    home: { title: 'Home Feed', subtitle: 'Personalized job matches powered by your resume' },
    search: { title: 'AI Search & Market', subtitle: 'Discover open roles and establish intelligent market alerts' },
    saved: { title: 'Saved Jobs', subtitle: 'Track and organize your bookmarked opportunities' },
    applied: { title: 'Applications Tracker', subtitle: 'Monitor progress and active interviews across your submissions' },
    profile: { title: 'Profile & Tools', subtitle: 'Manage your resume taxonomy, cover letters, and career roadmaps' },
    privacy: { title: 'Privacy Policy', subtitle: 'Understand how CareerPath AI uses and protects your data' },
    terms: { title: 'Terms of Service', subtitle: 'Review the usage terms for CareerPath AI' },
    contact: { title: 'Contact Us', subtitle: 'Get support or send feedback about your experience' },
    about: { title: 'About CareerPath AI', subtitle: 'Learn more about our mission and product capabilities' }
  };

  const currentTabInfo = tabDetails[activeTab] || tabDetails.home;

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

      {/* Right side: Notifications */}
      <div className="flex items-center gap-1">

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

    </header>
  );
}
