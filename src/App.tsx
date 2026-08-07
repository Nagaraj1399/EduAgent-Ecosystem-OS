import React, { useState } from 'react';
import { PortalType, LanguageType, FeatureModality, UserProfile } from './types';
import { useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { RoutingHeaderBanner } from './components/RoutingHeaderBanner';
import { LandingPage, demoUsers } from './components/LandingPage';
import { StudentPortal } from './components/StudentPortal/StudentPortal';
import { TeacherPortal } from './components/TeacherPortal/TeacherPortal';
import { ParentPortal } from './components/ParentPortal/ParentPortal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Cpu, Terminal, Shield, Zap } from 'lucide-react';

export default function App() {
  const [portal, setPortal] = useState<PortalType | 'Landing'>('Landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { language, setLanguage } = useLanguage();
  const [feature, setFeature] = useState<FeatureModality>('Vision Image');

  const handleLoginAs = (user: UserProfile) => {
    setCurrentUser(user);
    setPortal(user.role);
    if (user.role === 'Student') {
      setFeature('Vision Image');
    } else if (user.role === 'Teacher') {
      setFeature('Text');
    } else if (user.role === 'Parent') {
      setFeature('Voice Audio');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPortal('Landing');
    setFeature('Vision Image');
  };

  const handlePortalChange = (newPortal: PortalType | 'Landing') => {
    if (newPortal === 'Landing') {
      handleLogout();
      return;
    }

    // If user is already logged in, lock view to their role
    if (currentUser) {
      setPortal(currentUser.role);
      if (currentUser.role === 'Student') setFeature('Vision Image');
      else if (currentUser.role === 'Teacher') setFeature('Text');
      else if (currentUser.role === 'Parent') setFeature('Voice Audio');
    } else {
      setPortal('Landing');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        activePortal={portal}
        onPortalChange={handlePortalChange}
        activeLanguage={language}
        onLanguageChange={setLanguage}
        currentUser={currentUser}
        onLoginAs={handleLoginAs}
        onLogout={handleLogout}
      />

      {/* Mandatory Routing Header Banner */}
      <RoutingHeaderBanner portal={portal} feature={feature} language={language} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary resetKey={portal} fallbackTitle={`${portal} Portal Execution Warning`}>
          {portal === 'Landing' && <LandingPage onLoginAs={handleLoginAs} />}

          {portal === 'Student' && (
            <StudentPortal language={language} onSetModality={setFeature} />
          )}

          {portal === 'Teacher' && (
            <TeacherPortal language={language} onSetModality={setFeature} />
          )}

          {portal === 'Parent' && (
            <ParentPortal
              language={language}
              onLanguageChange={setLanguage}
              onSetModality={setFeature}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Enterprise System Status Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-xs font-mono py-4 px-6 text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>EduAgent OS • Powered by Vertex AI, Gemini 1.5 Pro, BigQuery, ADK, MCP & Cloud Run</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>A2A Protocol Ready</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">STAR Method Evaluator L6</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">Spaced Retrieval (1-7-21-60d)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
