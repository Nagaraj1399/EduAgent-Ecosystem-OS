import React, { useState } from 'react';
import { PortalType, LanguageType, UserProfile } from '../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { demoUsers } from './LandingPage';
import {
  GraduationCap,
  Users,
  HeartHandshake,
  Globe,
  Sparkles,
  Terminal,
  User,
  ChevronDown,
  LogOut,
  RefreshCw,
  Home,
  Lock,
} from 'lucide-react';

interface Props {
  activePortal: PortalType | 'Landing';
  onPortalChange: (portal: PortalType | 'Landing') => void;
  activeLanguage: LanguageType;
  onLanguageChange: (language: LanguageType) => void;
  currentUser: UserProfile | null;
  onLoginAs: (user: UserProfile) => void;
  onLogout: () => void;
}

/**
 * Global Header component providing EduAgent OS brand identity,
 * active portal indicator, multi-language selector, and user profile session management.
 *
 * @param props Props containing active portal, user session, language handlers, and logout callbacks
 */
export const Header: React.FC<Props> = ({
  activePortal,
  onPortalChange,
  activeLanguage,
  onLanguageChange,
  currentUser,
  onLoginAs,
  onLogout,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isPostLogin = currentUser !== null && activePortal !== 'Landing';

  const handleLangChange = (newLang: LanguageType) => {
    setLanguage(newLang);
    onLanguageChange(newLang);
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity + Google Tech Stack Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 cursor-pointer" onClick={() => onPortalChange('Landing')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                  EduAgent OS <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">v3.6 Enterprise</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-sans flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 inline" />
                <span>EduMentor AI • Google Cloud & AI Studio Ecosystem</span>
              </p>
            </div>
          </div>

          {/* Pre-login Google Tech Stack Badges in Header */}
          {!isPostLogin && (
            <div className="hidden xl:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">Vertex AI</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">Gemini 1.5 Pro</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300">BigQuery</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">Cloud Run</span>
            </div>
          )}
        </div>

        {/* POST-LOGIN ONLY: Singular Active Portal Badge (No cross-portal tab switcher) */}
        {isPostLogin && (
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs shadow-inner">
            {activePortal === 'Student' && (
              <div className="flex items-center gap-2 text-indigo-300">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">{t('studentPortalActive', 'Student Portal Active')}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{currentUser?.name}</span>
              </div>
            )}
            {activePortal === 'Teacher' && (
              <div className="flex items-center gap-2 text-cyan-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">{t('teacherDashboardActive', 'Teacher Dashboard Active')}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{currentUser?.name}</span>
              </div>
            )}
            {activePortal === 'Parent' && (
              <div className="flex items-center gap-2 text-emerald-300">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{t('parentPortalActive', 'Parent Portal Active')}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{currentUser?.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Right Section: Multilingual Selector & User Profile / Logout */}
        <div className="flex items-center gap-3">
          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={language}
              onChange={(e) => handleLangChange(e.target.value as LanguageType)}
              className="bg-slate-950 text-xs font-bold text-slate-200 border border-slate-700 rounded-md px-1.5 py-1 focus:outline-none focus:border-amber-400 cursor-pointer font-mono"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-slate-950 text-slate-200">
                  {lang.label} ({lang.nativeLabel})
                </option>
              ))}
            </select>
          </div>

          {/* User Profile Dropdown & Logout (Post-Login) */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl px-3 py-1.5 transition-all text-left shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                    {currentUser.avatar}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-white font-mono leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-indigo-400 font-mono leading-none">{currentUser.role} Portal</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2.5 z-50 space-y-2 font-mono text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <p className="font-bold text-white flex items-center justify-between">
                        <span>{currentUser.name}</span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded">
                          {currentUser.role}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <p className="text-[10px] text-slate-500 font-sans italic">{currentUser.title}</p>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          onLogout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-red-400 hover:bg-red-950/50 flex items-center gap-2 transition-colors font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('exitLogout', 'Exit / Logout Account')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Explicit Header Logout Button */}
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/50 text-slate-300 hover:text-red-400 font-bold rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm"
                title="Logout from active session"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">{t('logout', 'Logout')}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onPortalChange('Landing')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-400 font-bold rounded-xl text-xs font-mono shadow-sm flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('demoLogin', 'Demo Login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

