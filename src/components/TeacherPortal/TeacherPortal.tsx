import React, { useState, useEffect } from 'react';
import { LanguageType, FeatureModality, RiskTier } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  getAllStudentProfiles,
  getActivitySubmissions,
  StudentProfile,
  ActivitySubmission,
} from '../../lib/telemetryStore';
import {
  Users,
  Database,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  Loader2,
  History,
  X,
  FileCode,
  Mic,
  Eye,
  Brain,
  BarChart2,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface Props {
  language: LanguageType;
  onSetModality: (modality: FeatureModality) => void;
}

export const TeacherPortal: React.FC<Props> = ({ language, onSetModality }) => {
  const { t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [students, setStudents] = useState<StudentProfile[]>(getAllStudentProfiles());
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>(getActivitySubmissions());

  // Modal / Drill-Down State
  const [drillDownStudent, setDrillDownStudent] = useState<StudentProfile | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [interventionPlan, setInterventionPlan] = useState<{ routingHeader: string; response: string } | null>(null);

  useEffect(() => {
    onSetModality('Text');
  }, [onSetModality]);

  // Load telemetry from backend API or local storage
  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry/students');
      if (res.ok) {
        const data = await res.json();
        if (data && data.students && data.students.length > 0) {
          setStudents(data.students);
        } else {
          setStudents(getAllStudentProfiles());
        }
      } else {
        setStudents(getAllStudentProfiles());
      }
    } catch (e) {
      setStudents(getAllStudentProfiles());
    }
    setSubmissions(getActivitySubmissions());
  };

  useEffect(() => {
    fetchTelemetry();

    const handleDataUpdate = () => {
      fetchTelemetry();
    };

    window.addEventListener('eduagent_telemetry_activity_recorded', handleDataUpdate);
    window.addEventListener('eduagent_students_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('eduagent_telemetry_activity_recorded', handleDataUpdate);
      window.removeEventListener('eduagent_students_data_updated', handleDataUpdate);
    };
  }, []);

  // Filter students based on risk tier and search query
  const filteredStudents = students.filter((st) => {
    const matchesTier = selectedTier === 'ALL' || st.riskTier.includes(selectedTier);
    const matchesQuery =
      st.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.targetRole.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesQuery;
  });

  // Calculate dynamic Risk Radar counts
  const criticalCount = students.filter((s) => s.riskTier.includes('CRITICAL')).length;
  const moderateCount = students.filter((s) => s.riskTier.includes('MODERATE')).length;
  const onTrackCount = students.filter((s) => s.riskTier.includes('ON-TRACK')).length;

  const handleOpenDrillDown = (student: StudentProfile) => {
    setDrillDownStudent(student);
    setInterventionPlan(null);
  };

  const handleGenerateIntervention = async (student: StudentProfile) => {
    setDrillDownStudent(student);
    setLoadingPlan(true);
    setInterventionPlan(null);

    try {
      const res = await fetch('/api/ai/classroom-risk-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.studentName,
          riskTier: student.riskTier,
          metrics: {
            attendance: `${student.attendancePct}%`,
            quizScore: `${student.avgQuizScore}%`,
            projectScore: `${student.projectScore}%`,
            gap: student.keyLearningGap,
          },
          portal: 'Teacher',
          language,
        }),
      });

      const data = await res.json();
      setInterventionPlan(data);
    } catch (err) {
      console.error('Intervention generation error:', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const getStudentSubmissions = (studentId: string) => {
    return submissions.filter((s) => s.studentId === studentId);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Live Telemetry Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 relative">
            <Users className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <span>{t('liveTelemetryTitle', 'Classroom Live Telemetry & BigQuery Risk Radar')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                3-Way Data Binding Active
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              {t('liveTelemetrySub', 'Live synchronized data feed tracking active student submissions across STAR Voice Interviews, Vision Diagrams, and Project Code Reviews.')}
            </p>
          </div>
        </div>

        {/* Dynamic Risk Breakdown Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchTelemetry}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all font-mono text-xs flex items-center gap-1.5"
            title="Refresh Live Telemetry Feed"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('sync', 'Sync')}</span>
          </button>
          <div className="bg-red-950/60 border border-red-800/80 text-red-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>{criticalCount} {t('criticalIntervention', 'Critical')}</span>
          </div>
          <div className="bg-amber-950/60 border border-amber-800/80 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{moderateCount} {t('moderateSupport', 'Moderate')}</span>
          </div>
          <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{onTrackCount} {t('onTrack', 'On-Track')}</span>
          </div>
        </div>
      </div>

      {/* Cohort Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', 'Search engineering cohort by student name, roll number, or target role...')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">{t('riskFilter', 'Risk Filter:')}</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">{t('allRiskTiers', 'All Risk Tiers')} ({students.length})</option>
            <option value="CRITICAL">[{t('criticalIntervention', 'CRITICAL INTERVENTION')}] ({criticalCount})</option>
            <option value="MODERATE">[{t('moderateSupport', 'MODERATE SUPPORT')}] ({moderateCount})</option>
            <option value="ON-TRACK">[{t('onTrack', 'ON-TRACK')}] ({onTrackCount})</option>
          </select>
        </div>
      </div>

      {/* Student Telemetry Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">{t('studentRollNo', 'Student & Roll No')}</th>
                <th className="p-4">{t('riskTierStatus', 'Risk Tier Status')}</th>
                <th className="p-4">{t('attendance', 'Attendance')}</th>
                <th className="p-4">{t('repoScore', 'Repo Score')}</th>
                <th className="p-4">{t('activeModule', 'Active Module')}</th>
                <th className="p-4">{t('diagnosedGap', 'Diagnosed Learning Gap')}</th>
                <th className="p-4 text-right">{t('actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-sans">
              {filteredStudents.map((st) => {
                const studentSubs = getStudentSubmissions(st.id);
                return (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{st.studentName}</span>
                        {studentSubs.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                            {studentSubs.length} sub
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {st.rollNo} • {t(st.targetRole, st.targetRole)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
                          st.riskTier.includes('CRITICAL')
                            ? 'bg-red-950 text-red-300 border-red-800/80'
                            : st.riskTier.includes('MODERATE')
                            ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                        }`}
                      >
                        {t(st.riskTier, st.riskTier)}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-200">{st.attendancePct}%</td>
                    <td className="p-4 font-mono font-semibold text-indigo-300">{st.projectScore}/100</td>
                    <td className="p-4">
                      <span className="text-xs text-slate-300 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {t(st.activeModule || 'Voice STAR Interview', st.activeModule || 'Voice STAR Interview')}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs text-slate-300 truncate" title={t(st.keyLearningGap, st.keyLearningGap)}>
                      {t(st.keyLearningGap, st.keyLearningGap)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDrillDown(st)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition-all font-mono border border-slate-700 flex items-center gap-1"
                          title="View complete submission history"
                        >
                          <History className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t('drillDown', 'Drill-Down')}</span>
                        </button>
                        <button
                          onClick={() => handleGenerateIntervention(st)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-all font-mono shadow-md flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t('plan', 'Plan')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Student Submission History & Diagnostic Drill-Down Modal */}
      {drillDownStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl my-8 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <span>{t('studentTelemetryDrillDown', 'Student Telemetry Drill-Down')}: {drillDownStudent.studentName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-950 text-cyan-400 border border-cyan-800 font-mono">
                      {drillDownStudent.rollNo}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('targetRole', 'Target Role')}: {t(drillDownStudent.targetRole, drillDownStudent.targetRole)} | {t('riskTier', 'Risk Tier')}: {t(drillDownStudent.riskTier, drillDownStudent.riskTier)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrillDownStudent(null)}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Score Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">{t('attendance', 'Attendance')}</span>
                <div className="text-lg font-bold text-emerald-400 font-mono">{drillDownStudent.attendancePct}%</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">{t('repoScore', 'Repo Project Score')}</span>
                <div className="text-lg font-bold text-cyan-400 font-mono">{drillDownStudent.projectScore}/100</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">{t('avgQuizRetention', 'Avg Quiz Retention')}</span>
                <div className="text-lg font-bold text-amber-400 font-mono">{drillDownStudent.avgQuizScore}%</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">{t('activeModule', 'Active Module')}</span>
                <div className="text-xs font-bold text-indigo-300 font-mono truncate">{t(drillDownStudent.activeModule, drillDownStudent.activeModule)}</div>
              </div>
            </div>

            {/* Action Bar inside Drill-Down */}
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-300 font-mono">
                <span className="text-slate-500">{t('diagnosedBottleneck', 'Diagnosed Bottleneck')}: </span>
                <span className="font-semibold text-cyan-300">{t(drillDownStudent.keyLearningGap, drillDownStudent.keyLearningGap)}</span>
              </div>
              <button
                onClick={() => handleGenerateIntervention(drillDownStudent)}
                disabled={loadingPlan}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all flex-shrink-0"
              >
                {loadingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{t('generate60SecPlan', 'Generate 60-Sec Remediation Plan')}</span>
              </button>
            </div>

            {/* Generated Intervention Plan Output */}
            {interventionPlan && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-800/80 shadow-inner space-y-2">
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>{t('bigQueryPlan', 'BigQuery AI Remediation Plan')}</span>
                </div>
                <MarkdownRenderer content={interventionPlan.response} />
              </div>
            )}

            {/* Submission History Feed */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>{t('realTimeActivityLog', 'Real-Time Activity & Submission Log')} ({getStudentSubmissions(drillDownStudent.id).length})</span>
              </h4>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {getStudentSubmissions(drillDownStudent.id).length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
                    {t('noSubmissionsYet', 'No submissions recorded yet for')} {drillDownStudent.studentName}. {t('submissionsStreamHint', 'Submissions in Student Portal will instantly stream here!')}
                  </div>
                ) : (
                  getStudentSubmissions(drillDownStudent.id).map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 hover:border-slate-700 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-cyan-400">
                            {sub.module}
                          </span>
                          <span className="text-xs font-bold text-white font-mono">{sub.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          {sub.score && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                              {sub.score}
                            </span>
                          )}
                          <span>{sub.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-sans leading-relaxed">{sub.summary}</p>

                      {sub.diagnosedGap && (
                        <div className="text-[11px] text-amber-300 font-mono bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-900/60">
                          ⚠️ Diagnostic Gap: {sub.diagnosedGap}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
