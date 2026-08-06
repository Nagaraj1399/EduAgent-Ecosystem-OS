import React, { useState, useEffect } from 'react';
import { LanguageType, FeatureModality } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { VisionQA } from './VisionQA';
import { VoiceInterview } from './VoiceInterview';
import { ProjectGrader } from './ProjectGrader';
import { SpacedRetrieval } from './SpacedRetrieval';
import { DisengagementStudio } from './DisengagementStudio';
import { SkillGapMatrix } from './SkillGapMatrix';
import { EngineeringTasks } from './EngineeringTasks';
import {
  getActiveStudentSession,
  setActiveStudentSession,
  getAllStudentProfiles,
  StudentProfile,
} from '../../lib/telemetryStore';
import { Eye, Mic, Code2, Brain, Flame, Target, Terminal, User, ShieldCheck, CheckCircle2, ChevronDown, Activity } from 'lucide-react';

interface Props {
  language: LanguageType;
  onSetModality: (modality: FeatureModality) => void;
}

export const StudentPortal: React.FC<Props> = ({ language, onSetModality }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'vision' | 'interview' | 'tasks' | 'grader' | 'spaced' | 'analogy' | 'skillgap'>('vision');
  const [activeSession, setActiveSession] = useState<StudentProfile>(getActiveStudentSession());
  const [allStudents, setAllStudents] = useState<StudentProfile[]>(getAllStudentProfiles());
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleSessionChange = () => {
      setActiveSession(getActiveStudentSession());
      setAllStudents(getAllStudentProfiles());
    };
    window.addEventListener('eduagent_student_session_changed', handleSessionChange);
    window.addEventListener('eduagent_students_data_updated', handleSessionChange);
    return () => {
      window.removeEventListener('eduagent_student_session_changed', handleSessionChange);
      window.removeEventListener('eduagent_students_data_updated', handleSessionChange);
    };
  }, []);

  const handleSelectStudent = (student: StudentProfile) => {
    const updated = {
      ...student,
      activeModule: activeTab,
    };
    setActiveStudentSession(updated);
    setActiveSession(updated);
    setIsDropdownOpen(false);
  };

  const handleTabChange = (tabId: 'vision' | 'interview' | 'tasks' | 'grader' | 'spaced' | 'analogy' | 'skillgap', label: string) => {
    setActiveTab(tabId);
    const updated = {
      ...activeSession,
      activeModule: label,
    };
    setActiveStudentSession(updated);
    setActiveSession(updated);
  };

  const tabs = [
    { id: 'vision', key: 'visionImageReview', label: 'Vision Image Review', icon: Eye, color: 'text-emerald-400' },
    { id: 'interview', key: 'voiceStarInterview', label: 'Voice STAR Interview', icon: Mic, color: 'text-cyan-400' },
    { id: 'tasks', key: 'engineeringTaskBoard', label: 'Engineering Task Board', icon: Terminal, color: 'text-indigo-400' },
    { id: 'grader', key: 'projectRepoGrader', label: 'Project Repo Grader', icon: Code2, color: 'text-blue-400' },
    { id: 'spaced', key: 'spacedRetrievalQueue', label: 'Spaced Retrieval Queue', icon: Brain, color: 'text-amber-400' },
    { id: 'analogy', key: 'disengagementAnalogy', label: 'Disengagement Analogy', icon: Flame, color: 'text-orange-400' },
    { id: 'skillgap', key: 'skillGapMatrix', label: 'Skill-Gap Career Matrix', icon: Target, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Student Session Context Binding Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 relative">
            <User className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                {t('activeStudentSession', 'Active Student Context Session')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activeSession.rollNo}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <span>{activeSession.studentName}</span>
              <span className="text-xs font-normal text-slate-400 font-sans">({activeSession.targetRole})</span>
            </h3>
          </div>
        </div>

        {/* Live Student Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs text-slate-200 hover:border-cyan-500 transition-all flex items-center gap-2 shadow-inner"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="font-bold">{activeSession.studentName}</div>
              <div className="text-[10px] text-slate-400">{t('score', 'Score:')} {activeSession.projectScore}% | {t('att', 'Att:')} {activeSession.attendancePct}%</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 font-mono text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t('switchActiveStudent', 'Switch Active Student Session')}
              </div>
              {allStudents.map((st) => {
                const isSelected = st.id === activeSession.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStudent(st)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div>
                      <div>{st.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{st.rollNo} • {st.targetRole}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any, tab.label)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex-shrink-0 border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-700 shadow-lg ring-1 ring-slate-600'
                  : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{t(tab.key, tab.label)}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'vision' && <VisionQA language={language} onSetModality={onSetModality} />}
        {activeTab === 'interview' && <VoiceInterview language={language} onSetModality={onSetModality} />}
        {activeTab === 'tasks' && <EngineeringTasks language={language} />}
        {activeTab === 'grader' && <ProjectGrader language={language} onSetModality={onSetModality} />}
        {activeTab === 'spaced' && <SpacedRetrieval language={language} />}
        {activeTab === 'analogy' && <DisengagementStudio language={language} onSetModality={onSetModality} />}
        {activeTab === 'skillgap' && <SkillGapMatrix language={language} onSetModality={onSetModality} />}
      </div>
    </div>
  );
};
