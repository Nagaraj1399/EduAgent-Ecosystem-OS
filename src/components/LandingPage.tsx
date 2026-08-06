import React from 'react';
import { PortalType, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  GraduationCap,
  Users,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  Cpu,
  Terminal,
  Zap,
  ArrowRight,
  Database,
  Brain,
  Code2,
  Lock,
  Globe,
  Flame,
  Target,
} from 'lucide-react';

interface Props {
  onLoginAs: (user: UserProfile) => void;
}

export const demoUsers: UserProfile[] = [
  {
    name: 'Jordan Smith',
    email: 'jordan.smith@eduagent.ai',
    role: 'Student',
    title: 'Final Year CS - Cloud & AI Specialist',
    avatar: 'JS',
  },
  {
    name: 'Prof. Sharma',
    email: 'prof.sharma@eduagent.ai',
    role: 'Teacher',
    title: 'BigQuery Classroom Risk Radar Lead',
    avatar: 'PS',
  },
  {
    name: 'Lakshmi Parent',
    email: 'parent.lakshmi@eduagent.ai',
    role: 'Parent',
    title: 'Multilingual Voice Access Parent',
    avatar: 'LP',
  },
];

export const LandingPage: React.FC<Props> = ({ onLoginAs }) => {
  const { t } = useLanguage();
  // Separate Login ID and Password States for 3 Roles
  const [studentId, setStudentId] = React.useState('jordan.smith@eduagent.ai');
  const [studentPass, setStudentPass] = React.useState('demo2026');
  const [studentError, setStudentError] = React.useState('');

  const [teacherId, setTeacherId] = React.useState('prof.sharma@eduagent.ai');
  const [teacherPass, setTeacherPass] = React.useState('demo2026');
  const [teacherError, setTeacherError] = React.useState('');

  const [parentId, setParentId] = React.useState('parent.lakshmi@eduagent.ai');
  const [parentPass, setParentPass] = React.useState('demo2026');
  const [parentError, setParentError] = React.useState('');

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    if (!studentId.trim()) {
      setStudentError('Please enter a valid Student Login ID.');
      return;
    }
    const user = { ...demoUsers[0], email: studentId.trim() };
    onLoginAs(user);
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    if (!teacherId.trim()) {
      setTeacherError('Please enter a valid Teacher Login ID.');
      return;
    }
    const user = { ...demoUsers[1], email: teacherId.trim() };
    onLoginAs(user);
  };

  const handleParentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setParentError('');
    if (!parentId.trim()) {
      setParentError('Please enter a valid Parent Login ID.');
      return;
    }
    const user = { ...demoUsers[2], email: parentId.trim() };
    onLoginAs(user);
  };
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('heroTag')}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-mono leading-tight">
            {t('heroTitle')}
          </h1>

          <p className="text-base md:text-lg text-slate-300 font-sans max-w-3xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 pt-2 text-xs font-mono text-slate-400">
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">Vertex AI</span>
            <span>•</span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300">Gemini 1.5 Pro</span>
            <span>•</span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-purple-300">BigQuery Telemetry</span>
            <span>•</span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300">ADK & MCP</span>
            <span>•</span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300">Cloud Run</span>
          </div>
        </div>
      </div>

      {/* One-Click Demo Login Cards (3 Portals) */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white font-mono flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>{t('selectDemoLogin')}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {t('selectDemoSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Student Login Form */}
          <div className="bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-800">
                  {t('studentPortal')}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white font-mono group-hover:text-indigo-300 transition-colors">
                  {t('studentLoginTitle')}
                </h3>
                <p className="text-xs text-indigo-300 font-mono font-medium">
                  {t('studentDemoTitle', 'Jordan Smith (College CS - Cloud & AI)')}
                </p>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {t('studentLoginDesc')}
                </p>
              </div>

              {/* Student Login Form */}
              <form onSubmit={handleStudentLogin} className="space-y-3 pt-2 border-t border-slate-800/80">
                {studentError && (
                  <div className="p-2 text-[11px] bg-red-950/80 border border-red-800 text-red-300 rounded-lg font-mono">
                    {studentError}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                    {t('studentLoginId', 'Student Login ID:')}
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. jordan.smith@eduagent.ai"
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                    {t('password', 'Password:')}
                  </label>
                  <input
                    type="password"
                    value={studentPass}
                    onChange={(e) => setStudentPass(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 font-mono text-xs transition-all mt-2"
                >
                  <Lock className="w-4 h-4 text-indigo-300" />
                  <span>{t('loginStudentBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Teacher Login Form */}
          <div className="bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Users className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-800">
                  {t('teacherDashboard')}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                  {t('teacherLoginTitle')}
                </h3>
                <p className="text-xs text-cyan-300 font-mono font-medium">
                  {t('teacherDemoTitle', 'Prof. Sharma (BigQuery Risk Telemetry)')}
                </p>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {t('teacherLoginDesc')}
                </p>
              </div>

              {/* Teacher Login Form */}
              <form onSubmit={handleTeacherLogin} className="space-y-3 pt-2 border-t border-slate-800/80">
                {teacherError && (
                  <div className="p-2 text-[11px] bg-red-950/80 border border-red-800 text-red-300 rounded-lg font-mono">
                    {teacherError}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                    {t('teacherLoginId', 'Teacher Login ID:')}
                  </label>
                  <input
                    type="text"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    placeholder="e.g. prof.sharma@eduagent.ai"
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                    {t('password', 'Password:')}
                  </label>
                  <input
                    type="password"
                    value={teacherPass}
                    onChange={(e) => setTeacherPass(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 font-mono text-xs transition-all mt-2"
                >
                  <Lock className="w-4 h-4 text-cyan-300" />
                  <span>{t('loginTeacherBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Card 3: Parent Login Form */}
          <div className="bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-800">
                  {t('parentPortal')}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white font-mono group-hover:text-emerald-300 transition-colors">
                  {t('parentLoginTitle')}
                </h3>
                <p className="text-xs text-emerald-300 font-mono font-medium">
                  {t('parentDemoTitle', 'Lakshmi Parent (Multilingual Voice Access)')}
                </p>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {t('parentLoginDesc')}
                </p>
              </div>

              {/* Parent Login Form */}
              <form onSubmit={handleParentLogin} className="space-y-3 pt-2 border-t border-slate-800/80">
                {parentError && (
                  <div className="p-2 text-[11px] bg-red-950/80 border border-red-800 text-red-300 rounded-lg font-mono">
                    {parentError}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                    {t('parentLoginId', 'Parent Login ID:')}
                  </label>
                  <input
                    type="text"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    placeholder="e.g. parent.lakshmi@eduagent.ai"
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                    {t('password', 'Password:')}
                  </label>
                  <input
                    type="password"
                    value={parentPass}
                    onChange={(e) => setParentPass(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 font-mono text-xs transition-all mt-2"
                >
                  <Lock className="w-4 h-4 text-emerald-300" />
                  <span>{t('loginParentBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-white font-mono">
            {t('architectureTitle')}
          </h3>
          <p className="text-xs text-slate-400">
            {t('architectureSub')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h4 className="text-xs font-bold text-white font-mono">{t('multimodalVision')}</h4>
            <p className="text-[11px] text-slate-400 font-sans">
              {t('multimodalVisionDesc')}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h4 className="text-xs font-bold text-white font-mono">{t('bigQueryAnalytics')}</h4>
            <p className="text-[11px] text-slate-400 font-sans">
              {t('bigQueryAnalyticsDesc')}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h4 className="text-xs font-bold text-white font-mono">{t('a2aMultilingual')}</h4>
            <p className="text-[11px] text-slate-400 font-sans">
              {t('a2aMultilingualDesc')}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h4 className="text-xs font-bold text-white font-mono">{t('skillGapTitle')}</h4>
            <p className="text-[11px] text-slate-400 font-sans">
              {t('skillGapDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
