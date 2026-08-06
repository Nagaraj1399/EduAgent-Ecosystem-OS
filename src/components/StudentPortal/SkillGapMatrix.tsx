import React, { useState } from 'react';
import { LanguageType, SkillGapData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Target, CheckCircle, AlertCircle, Compass, Sparkles, TrendingUp, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  language: LanguageType;
  onSetModality: (modality: 'Text') => void;
}

export const SkillGapMatrix: React.FC<Props> = ({ language, onSetModality }) => {
  const { t } = useLanguage();
  const [targetRole, setTargetRole] = useState<string>('AI Cloud Architect');
  const [studentSkills, setStudentSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js', 'REST APIs', 'Git', 'Docker Basics']);
  const [loading, setLoading] = useState<boolean>(false);
  const [matrixData, setMatrixData] = useState<SkillGapData | null>({
    targetRole: 'AI Cloud Architect',
    readinessScore: 78,
    masteredSkills: ['React 19', 'TypeScript', 'Node.js Express', 'REST API Architecture', 'Git Workflow', 'Docker Multi-Stage'],
    gapSkills: ['Kubernetes Cluster Orchestration', 'Prometheus & Grafana Telemetry', 'Terraform Infrastructure-as-Code', 'gRPC Microservices'],
    actionPlan: [
      'Week 1: Containerize Express microservices with Docker multi-stage builds and minimal Alpine layers.',
      'Week 2: Deploy a 3-node Minikube cluster and configure ingress controllers with SSL termination.',
      'Week 3: Write Terraform modules to automate Cloud Run and Cloud SQL database provisioning.',
    ],
  });

  React.useEffect(() => {
    onSetModality('Text');
  }, [onSetModality]);

  const targetRoleOptions = [
    t('role1', 'AI Cloud Architect'),
    t('role2', 'MLOps & LLM Systems Engineer'),
    t('role3', 'Rust High-Frequency Backend Lead'),
    t('role4', 'Cybersecurity & Zero-Trust Architect'),
    t('role5', 'Full-Stack Cloud Native Specialist'),
  ];

  const handleGenerateMatrix = async (roleToGen?: string) => {
    const selectedRole = roleToGen || targetRole;
    setLoading(true);
    setMatrixData(null);

    try {
      const res = await fetch('/api/ai/skill-gap-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: selectedRole,
          studentSkills,
          portal: 'Student',
          language,
        }),
      });

      const data = await res.json();
      if (data.matrix) {
        setMatrixData(data.matrix);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono">{t('skillGapMatrixTitle', 'Career Skill-Gap Matrix Strategist')}</h2>
            <p className="text-sm text-slate-400">
              {t('skillGapMatrixSubtitle', 'Maps your current coding & project strengths against emerging high-pay tech roles with a 3-week targeted bridge plan.')}
            </p>
          </div>
        </div>

        {/* Role Selector */}
        <select
          value={targetRole}
          onChange={(e) => {
            setTargetRole(e.target.value);
            handleGenerateMatrix(e.target.value);
          }}
          className="bg-slate-950 border border-slate-700 text-xs font-bold text-purple-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400 cursor-pointer"
        >
          {targetRoleOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Student Current Skills Inventory */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Current Skill Inventory ({studentSkills.length})
          </h3>

          <div className="flex flex-wrap gap-2">
            {studentSkills.map((sk, idx) => (
              <span
                key={idx}
                className="text-xs bg-slate-950 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-800 font-mono font-semibold"
              >
                {sk}
              </span>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => handleGenerateMatrix()}
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all font-mono text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('computingSkillMatrix', 'Computing Skill Matrix...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('recalculateGapMatrix', 'Re-calculate Gap Matrix')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Matrix Results */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <p className="text-sm font-mono">Aligning Student Portfolio to {targetRole} Requirements...</p>
            </div>
          ) : matrixData ? (
            <div className="space-y-6">
              {/* Header Metric */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-purple-400 uppercase font-bold tracking-wider">{t('targetIndustryRole', 'Target Industry Role')}</span>
                  <h3 className="text-lg font-bold text-white font-mono">{matrixData.targetRole}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400 block">{t('roleReadinessBar', 'Role Readiness Bar')}</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{matrixData.readinessScore}%</span>
                </div>
              </div>

              {/* Mastered vs Missing Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/10 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('masteredCompetencies', 'Mastered Competencies')} ({matrixData.masteredSkills.length})</span>
                  </h4>
                  <ul className="space-y-1">
                    {matrixData.masteredSkills.map((m, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{t(m, m)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-purple-950/80 bg-purple-950/10 space-y-2">
                  <h4 className="text-xs font-bold text-purple-400 uppercase font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t('skillGapsToBridge', 'Skill Gaps to Bridge')} ({matrixData.gapSkills.length})</span>
                  </h4>
                  <ul className="space-y-1">
                    {matrixData.gapSkills.map((g, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{t(g, g)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3-Week Action Plan */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>{t('threeWeekSkillBridge', '3-Week Targeted Skill Bridge Roadmap')}</span>
                </h4>

                <div className="space-y-2">
                  {matrixData.actionPlan.map((plan, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 font-sans leading-relaxed">
                      <span className="text-purple-400 font-mono font-bold mt-0.5">{idx + 1}.</span>
                      <span>{t(plan, plan)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
