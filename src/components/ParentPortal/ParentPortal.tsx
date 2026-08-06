import React, { useState, useEffect } from 'react';
import { LanguageType, FeatureModality } from '../../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import {
  getAllStudentProfiles,
  getActivitySubmissions,
  getActiveStudentSession,
  StudentProfile,
  ActivitySubmission,
} from '../../lib/telemetryStore';
import {
  HeartHandshake,
  Volume2,
  Globe,
  Sparkles,
  VolumeX,
  Award,
  Loader2,
  UserCheck,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface Props {
  language: LanguageType;
  onLanguageChange: (lang: LanguageType) => void;
  onSetModality: (modality: FeatureModality) => void;
}

export interface StudentPerformanceProfile {
  id: string;
  studentName: string;
  attendance: string;
  projectScore: string;
  technicalTrack: string;
  recentMilestone: string;
  technicalSummary: string;
}

export const ParentPortal: React.FC<Props> = ({ language, onLanguageChange, onSetModality }) => {
  const { t } = useLanguage();
  const [students, setStudents] = useState<StudentProfile[]>(getAllStudentProfiles());
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>(getActivitySubmissions());
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformanceProfile>(() => {
    const active = getActiveStudentSession();
    return {
      id: active.id,
      studentName: active.studentName,
      attendance: `${active.attendancePct}%`,
      projectScore: `${active.projectScore}/100`,
      technicalTrack: active.targetRole || 'Cloud & AI Engineering',
      recentMilestone: `Active in ${active.activeModule || 'Voice STAR Interview'}`,
      technicalSummary: `Attendance: ${active.attendancePct}%, Repo Score: ${active.projectScore}/100. ${active.keyLearningGap}`,
    };
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [parentReport, setParentReport] = useState<{ routingHeader: string; response: string } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  useEffect(() => {
    onSetModality('Voice Audio');
  }, [onSetModality]);

  // Sync state from telemetryStore and custom events
  const refreshProfilesFromStore = () => {
    const allSt = getAllStudentProfiles();
    const subs = getActivitySubmissions();
    setStudents(allSt);
    setSubmissions(subs);

    // Update selected student if present
    const currentActive = allSt.find((s) => s.id === selectedStudent.id) || allSt[0];
    if (currentActive) {
      const studentSubs = subs.filter((s) => s.studentId === currentActive.id);
      const latestSub = studentSubs[0];
      const milestone = latestSub
        ? `${latestSub.actionType}: ${latestSub.title} (${latestSub.score || 'Completed'})`
        : `Active in ${currentActive.activeModule || 'Voice STAR Interview'}`;

      setSelectedStudent({
        id: currentActive.id,
        studentName: currentActive.studentName,
        attendance: `${currentActive.attendancePct}%`,
        projectScore: `${currentActive.projectScore}/100`,
        technicalTrack: currentActive.targetRole || 'Software Engineering',
        recentMilestone: milestone,
        technicalSummary: `Attendance: ${currentActive.attendancePct}%, Repo Project Score: ${currentActive.projectScore}/100. ${
          currentActive.keyLearningGap ? 'Diagnosed Focus: ' + currentActive.keyLearningGap : 'Consistently mastering engineering concepts.'
        }`,
      });
    }
  };

  useEffect(() => {
    refreshProfilesFromStore();

    const handleUpdate = () => {
      refreshProfilesFromStore();
    };

    window.addEventListener('eduagent_student_session_changed', handleUpdate);
    window.addEventListener('eduagent_telemetry_activity_recorded', handleUpdate);
    window.addEventListener('eduagent_students_data_updated', handleUpdate);

    return () => {
      window.removeEventListener('eduagent_student_session_changed', handleUpdate);
      window.removeEventListener('eduagent_telemetry_activity_recorded', handleUpdate);
      window.removeEventListener('eduagent_students_data_updated', handleUpdate);
    };
  }, []);

  // Mandatory Multilingual Greetings dictionary for all 10 Pan-India languages
  const mandatoryGreetings: Record<LanguageType, string> = {
    English: "Welcome! You can track your child's academic progress in English, Tamil, Hindi, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, or Punjabi. Which language would you prefer?",
    Tamil: 'வணக்கம்! உங்கள் பிள்ளையின் முன்னேற்றத்தை தமிழ், English, हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം, मराठी, ગુજરાતી, বাংলা அல்லது ਪੰਜਾਬੀ-யில் அறியலாம்.',
    Hindi: 'नमस्ते! आप अपने बच्चे की शैक्षणिक प्रगति हिंदी, English, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം, मराठी, ગુજરાતી, বাংলা या ਪੰਜਾਬੀ में जान सकते हैं।',
    Telugu: 'నమస్కారం! మీ పిల్లల విద్యా పురోగతిని తెలుగు, English, தமிழ், हिन्दी, కన్నడ, മലയാളം, मराठी, ગુજરાતી, বাংলা లేదా ਪੰਜਾਬੀ లో తెలుసుకోవచ్చు.',
    Kannada: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಮಗುವಿನ ಶೈಕ್ಷಣಿಕ ಪ್ರಗತಿಯನ್ನು ಕನ್ನಡ, English, தமிழ், हिन्दी, తెలుగు, മലയാളം, मराठी, ગુજરાતી, বাংলা ಅಥವಾ ಪੰਜਾਬੀ ಯಲ್ಲಿ ತಿಳಿಯಬಹುದು.',
    Malayalam: 'നമസ്കാരം! നിങ്ങളുടെ കുട്ടിയുടെ പഠന പുരോഗതി മലയാളം, English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, मराठी, ગુજરાતી, বাংলা അല്ലെങ്കിൽ ਪੰਜਾਬੀ എന്നിവയിൽ അറിയാം.',
    Marathi: 'नमस्ते! तुम्ही तुमच्या पाल्याची शैक्षणिक प्रगती मराठी, English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം, ગુજરાતી, বাংলা किंवा ਪੰਜਾਬੀ मध्ये पाहू शकता.',
    Gujarati: 'નમસ્તે! તમે તમારા બાળકની શૈક્ષણિક પ્રગતિ ગુજરાતી, English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം, मराठी, বাংলা અથવા પੰਜਾਬੀ માં જોઈ શકો છો.',
    Bengali: 'নমস্কার! আপনি আপনার সন্তানের শিক্ষাগত অগ্রগতি বাংলা, English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം, मराठी, ગુજરાતી বা ਪੰਜਾਬੀ তে জানতে পারেন।',
    Punjabi: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਤੁਸੀਂ ਆਪਣੇ ਬੱਚੇ ਦੀ ਵਿਦਿਅਕ ਪ੍ਰਗਤੀ ਪੰਜਾਬੀ, English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, മലയാളം, मराठी, ગુજરાતી ਜਾਂ বাংলা ਵਿੱਚ ਦੇਖ ਸਕਦੇ ਹੋ।',
    Odia: 'ନମସ୍କାର! ଆପଣ ଆପଣଙ୍କ ସନ୍ତାନର ଶିକ୍ଷାଗତ ଅଗ୍ରଗତି ଓଡ଼ିଆ, English, தமிழ், हिन्दी, తెలుగు, କନ୍ନଡ, ମଲାୟାଲମ୍, ମରାଠୀ, ଗୁଜରାଟୀ, ବଙ୍ଗାଳୀ କିମ୍ବା ପଞ୍ଜାବୀ ରେ ଜାଣିପାରିବେ।',
  };

  const generateParentReport = async (studentProfile: StudentPerformanceProfile, lang: LanguageType) => {
    setLoading(true);
    setParentReport(null);

    try {
      const res = await fetch('/api/ai/parent-a2a-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentProfile.studentName,
          attendance: studentProfile.attendance,
          projectScore: studentProfile.projectScore,
          technicalTrack: studentProfile.technicalTrack,
          recentMilestone: studentProfile.recentMilestone,
          technicalSummary: studentProfile.technicalSummary,
          selectedLanguage: lang,
          portal: 'Parent',
        }),
      });

      const data = await res.json();
      setParentReport(data);
    } catch (err) {
      console.error('Parent report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate parent report whenever student or language changes
  useEffect(() => {
    generateParentReport(selectedStudent, language);
  }, [selectedStudent, language]);

  const handleStudentSelect = (st: StudentProfile) => {
    const studentSubs = submissions.filter((s) => s.studentId === st.id);
    const latestSub = studentSubs[0];
    const milestone = latestSub
      ? `${latestSub.actionType}: ${latestSub.title} (${latestSub.score || 'Completed'})`
      : `Active in ${st.activeModule || 'Voice STAR Interview'}`;

    const profile: StudentPerformanceProfile = {
      id: st.id,
      studentName: st.studentName,
      attendance: `${st.attendancePct}%`,
      projectScore: `${st.projectScore}/100`,
      technicalTrack: st.targetRole || 'Software Engineering',
      recentMilestone: milestone,
      technicalSummary: `Attendance: ${st.attendancePct}%, Repo Project Score: ${st.projectScore}/100. ${
        st.keyLearningGap ? 'Diagnosed Focus: ' + st.keyLearningGap : 'Consistently mastering concepts.'
      }`,
    };
    setSelectedStudent(profile);
  };

  const handleLanguageSwitch = (newLang: LanguageType) => {
    onLanguageChange(newLang);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    generateParentReport(selectedStudent, newLang);
  };

  const handleSpeakReport = (textToSpeak: string, speakLang: LanguageType = language) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();
      if (isPlayingAudio) {
        setIsPlayingAudio(false);
        return;
      }

      const cleanText = textToSpeak
        .replace(/\[.*?\]/g, '')
        .replace(/[\*#`]/g, '')
        .trim();

      const Utterance = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;
      if (!Utterance || typeof Utterance !== 'function') return;

      const utterance = new Utterance(cleanText);

      if (speakLang === 'Tamil') utterance.lang = 'ta-IN';
      else if (speakLang === 'Hindi') utterance.lang = 'hi-IN';
      else if (speakLang === 'Telugu') utterance.lang = 'te-IN';
      else if (speakLang === 'Kannada') utterance.lang = 'kn-IN';
      else if (speakLang === 'Malayalam') utterance.lang = 'ml-IN';
      else if (speakLang === 'Marathi') utterance.lang = 'mr-IN';
      else if (speakLang === 'Gujarati') utterance.lang = 'gu-IN';
      else if (speakLang === 'Bengali') utterance.lang = 'bn-IN';
      else if (speakLang === 'Punjabi') utterance.lang = 'pa-IN';
      else if (speakLang === 'Odia') utterance.lang = 'or-IN';
      else utterance.lang = 'en-US';

      utterance.rate = 0.95;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Language Switcher Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <span>{t('parentPortal', 'Parent Portal (Multilingual & Voice-First)')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                3-Way Telemetry Bound
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              {t('parentLoginDesc', 'Translates real-time student performance telemetry into warm, encouraging native language reports for parents.')}
            </p>
          </div>
        </div>

        {/* Language Selection Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 font-mono text-xs">
          {SUPPORTED_LANGUAGES.map((langObj) => (
            <button
              key={langObj.id}
              onClick={() => handleLanguageSwitch(langObj.id as LanguageType)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                language === langObj.id
                  ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {langObj.label} ({langObj.nativeLabel})
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Student Performance Selector Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {t('dynamicStudentContext', 'Dynamic Student Telemetry Context')}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
            {t('synchronizedPortals', 'Synchronized with Student & Teacher Portals')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {students.map((st) => {
            const isSelected = selectedStudent.id === st.id;
            return (
              <button
                key={st.id}
                onClick={() => handleStudentSelect(st)}
                className={`p-3 rounded-xl border text-left font-mono transition-all flex flex-col justify-between space-y-1.5 ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-lg ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 truncate">{st.studentName}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{t('score', 'Score:')} {st.projectScore}%</span>
                  <span>•</span>
                  <span>{t('att', 'Att:')} {st.attendancePct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mandatory Multilingual Welcome Greeting Card */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-800/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>{t('multilingualVoiceGreeting', 'Mandatory Multilingual Voice Greeting')} ({language})</span>
            </span>
            <p className="text-base font-semibold text-slate-100 leading-relaxed font-sans">
              "{mandatoryGreetings[language]}"
            </p>
          </div>

          <button
            onClick={() => handleSpeakReport(mandatoryGreetings[language], language)}
            className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all font-mono text-xs flex-shrink-0"
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4 text-red-950" /> : <Volume2 className="w-4 h-4 text-slate-950" />}
            <span>🔊 {t('listenIn', 'Listen in')} {language}</span>
          </button>
        </div>
      </div>

      {/* Clean Dynamic Student Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
            <span>{t('attendance', 'Class Attendance')}</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{selectedStudent.attendance}</div>
          <p className="text-[11px] text-slate-400 font-sans">{t('liveParticipationMetric', 'Live participation metric')}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
            <span>{t('repoScore', 'Project Submission Score')}</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">{selectedStudent.projectScore}</div>
          <p className="text-[11px] text-slate-400 font-sans">{t('evaluatedFromSubmission', 'Evaluated from live submission data')}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
            <span>{t('techTrackMilestone', 'Technical Track & Recent Milestone')}</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 font-mono truncate">{t(selectedStudent.technicalTrack, selectedStudent.technicalTrack)}</div>
          <p className="text-[11px] text-indigo-300 font-sans line-clamp-1">{t(selectedStudent.recentMilestone, selectedStudent.recentMilestone)}</p>
        </div>
      </div>

      {/* Zero-Jargon A2A Progress Report Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-mono">
              {t('parentReportTitle', 'A2A Zero-Jargon Progress Report')} - {selectedStudent.studentName} ({language})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {parentReport?.response && (
              <button
                onClick={() => handleSpeakReport(parentReport.response, language)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-lg text-xs transition-all font-mono border border-slate-700 flex items-center gap-1.5 shadow-sm"
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{t('readAloud', 'Read Aloud')} ({language})</span>
              </button>
            )}

            <button
              onClick={() => generateParentReport(selectedStudent, language)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-all font-mono shadow-md flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{t('refreshReport', 'Refresh Report')}</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/90 shadow-inner min-h-[180px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-mono text-center">
                {t('a2aTranslatingPrompt', 'A2A Protocol Translating Dynamic Telemetry for')} {selectedStudent.studentName} {t('intoZeroJargon', 'into Zero-Jargon')} {language}...
              </p>
            </div>
          ) : parentReport ? (
            <MarkdownRenderer content={parentReport.response} />
          ) : null}
        </div>
      </div>
    </div>
  );
};
