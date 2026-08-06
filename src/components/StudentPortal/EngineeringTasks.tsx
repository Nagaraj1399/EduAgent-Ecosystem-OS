import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageType } from '../../types';
import { LOCALIZED_TASKS, getTaskForLanguage, LocalizedTask } from '../../data/tasksData';
import {
  Terminal,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  Copy,
  Check,
  X,
  Server,
  Sparkles,
  Shield,
  Cpu,
  Database,
  Layers,
  Code
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  status: string;
  rawStatus: string;
  rawCategory: string;
  summary: string;
  commandSnippet: string;
  labUrl: string;
  cloudShellUrl: string;
  projectId: string;
  labSteps: string[];
}

interface Props {
  language?: LanguageType;
}

export const EngineeringTasks: React.FC<Props> = ({ language: propLanguage }) => {
  const { t, language: contextLanguage } = useLanguage();
  const currentLanguage: LanguageType = propLanguage || contextLanguage || 'English';

  const [filter, setFilter] = useState<string>('ALL');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [activeLabTask, setActiveLabTask] = useState<Task | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunningCommand, setIsRunningCommand] = useState(false);

  // Derive localized tasks array
  const localizedTasks: Task[] = LOCALIZED_TASKS.map((lt) => {
    const localized = getTaskForLanguage(lt, currentLanguage);
    const isCompleted = completedTaskIds.includes(lt.id);
    return {
      ...localized,
      status: isCompleted ? (t('Completed', 'Completed')) : localized.status,
      rawStatus: isCompleted ? 'Completed' : localized.rawStatus,
    };
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleLaunchLab = (task: Task) => {
    // 1. Open target GCP Cloud Console URL in new window/tab
    try {
      window.open(task.labUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to open window:', err);
    }

    // 2. Open active lab modal session in app
    setActiveLabTask(task);
    setTerminalOutput([
      `[SYS_INIT] Connected to GCP Sandbox Session (${task.projectId})`,
      `[SYS_INFO] Target Endpoint: ${task.labUrl}`,
      `[SYS_READY] Executable environment initialized. Ready for command input.`,
    ]);

    // 3. Display user-facing notification toast
    showToast(`🚀 Launched Cloud Console Lab: "${task.title}"`);
  };

  const handleCopySnippet = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(task.commandSnippet);
    setCopiedTaskId(task.id);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const handleRunCommand = () => {
    if (!activeLabTask || isRunningCommand) return;
    setIsRunningCommand(true);

    const newLogs = [
      ...terminalOutput,
      `$ ${activeLabTask.commandSnippet}`,
      `[RUNNING] Executing GCP CLI command in sandbox environment...`,
    ];
    setTerminalOutput(newLogs);

    setTimeout(() => {
      setTerminalOutput([
        ...newLogs,
        `[SUCCESS 200 OK] Verification test passed. Status: 0 Exit Code.`,
        `[RESULT] Resource configured for ${activeLabTask.projectId}.`,
      ]);
      setIsRunningCommand(false);
    }, 1200);
  };

  const handleCompleteLab = (taskId: string) => {
    setCompletedTaskIds((prev) => [...prev, taskId]);
    showToast(`🎉 ${t('labTaskCompleted', 'Lab task marked as Completed!')}`);
    setActiveLabTask(null);
  };

  const filteredTasks = localizedTasks.filter(
    (t) =>
      filter === 'ALL' ||
      t.rawCategory === filter ||
      t.rawStatus === filter ||
      t.category === filter ||
      t.status === filter
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-indigo-400 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-mono font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <span>{t('taskBoardTitle', 'Cloud & CS Senior Engineering Task Board')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {t('industryCurriculum', 'Industry Curriculum')}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {t('taskBoardSubtitle', 'Real-world hands-on cloud labs, GCP security benchmarks, and microservices architecture assignments.')}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {['ALL', 'In Progress', 'GCP & Cloud', 'AI & Vertex', 'DevOps & K8s', 'Systems & DB'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {f === 'ALL' ? t('allFilter', 'ALL') : t(f, f)}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border ${
                    task.status === 'Completed'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : task.status === 'In Progress'
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      : task.status === 'Review Due'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {t(task.status, task.status)}
                </span>

                <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {t(task.category, task.category)}
                </span>

                <span className="text-[10px] font-mono text-slate-500">
                  Est. {task.estimatedHours}h
                </span>
              </div>

              {/* Launch Button */}
              <button
                type="button"
                id={`launch-lab-${task.id}`}
                onClick={() => handleLaunchLab(task)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer group/btn"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('launchLab', 'Launch Cloud Console Lab')}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <h4 className="text-sm font-bold text-slate-100 font-mono group-hover:text-indigo-300 transition-colors">
              {t(task.title, task.title)}
            </h4>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {t(task.summary, task.summary)}
            </p>

            {/* CLI Snippet & Copy Action */}
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-emerald-500 font-bold">$</span>
                <code className="text-emerald-300 truncate">{task.commandSnippet}</code>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopySnippet(task, e)}
                  title="Copy command to clipboard"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                >
                  {copiedTaskId === task.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">{t('copied', 'Copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{t('copy', 'Copy')}</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">GCP CLI</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Cloud Console Lab Modal */}
      {activeLabTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {t('labSessionActive', 'GCP LAB SESSION ACTIVE')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Project: <code className="text-indigo-300">{activeLabTask.projectId}</code>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono mt-0.5">
                    {activeLabTask.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveLabTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 font-sans text-xs text-slate-300">
              {/* External GCP Console Link banner */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-indigo-200">Google Cloud Console Target</p>
                  <p className="text-slate-400 text-[11px] truncate max-w-md mt-0.5">{activeLabTask.labUrl}</p>
                </div>
                <a
                  href={activeLabTask.labUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold flex items-center gap-1.5 text-xs transition-colors"
                >
                  <span>{t('reopenGcpConsole', 'Re-open GCP Console')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Lab Steps */}
              <div className="space-y-2">
                <h4 className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  {t('stepByStepLabInstructions', 'Step-by-Step Lab Guidelines')}
                </h4>
                <ul className="space-y-2">
                  {activeLabTask.labSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Simulated Cloud Terminal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    {t('cloudShellSimulator', 'Cloud Shell Simulator')}
                  </span>
                  <button
                    type="button"
                    onClick={handleRunCommand}
                    disabled={isRunningCommand}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isRunningCommand ? t('running', 'Running...') : t('runCliCommand', 'Run CLI Command')}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300 max-h-40 overflow-y-auto">
                  {terminalOutput.map((line, idx) => (
                    <div key={idx} className={line.includes('SUCCESS') ? 'text-emerald-400 font-bold' : line.includes('$') ? 'text-amber-300' : 'text-slate-400'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <a
                href={activeLabTask.cloudShellUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{t('launchNativeCloudShell', 'Launch Native GCP Cloud Shell')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLabTask(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors"
                >
                  {t('closeDrawer', 'Close Drawer')}
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteLab(activeLabTask.id)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('markTaskCompleted', 'Mark Task Completed')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

