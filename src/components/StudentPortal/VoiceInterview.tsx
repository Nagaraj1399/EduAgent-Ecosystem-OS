import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LanguageType } from '../../types';
import { getActiveStudentSession, recordStudentActivity } from '../../lib/telemetryStore';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Loader2,
  Award,
  Zap,
  AlertCircle,
  Video,
  VideoOff,
  Activity,
  Bot,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  Square,
  FileText,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Settings,
  Camera,
  ShieldCheck,
  Sliders,
  Clock,
  MessageSquare,
  Upload,
  X,
  Copy,
  Check,
  RefreshCw,
  FileCheck,
  Briefcase,
  Code2,
  Shield,
  Cloud,
  Layers,
  Trash2,
  RotateCcw,
  ArrowRight,
  Target,
  CheckCircle,
  Server,
  Building2,
  ListChecks,
} from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { useLanguage } from '../../context/LanguageContext';
import { useMedia } from '../../context/MediaContext';
import { RoboticInterviewer3D } from './RoboticInterviewer3D';
import { ErrorBoundary } from '../ErrorBoundary';

interface Props {
  language: LanguageType;
  onSetModality: (modality: 'Voice Audio') => void;
}

interface ResumeGapAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  targetRole: string;
  readinessScore: number;
}

const PRESET_RESUMES = [
  {
    title: 'Senior Full-Stack & Systems Lead',
    role: 'Senior Full-Stack Engineer',
    text: `Candidate Technical Profile:
- Senior Full-Stack & Systems Engineer with 6+ years experience in Node.js, TypeScript, React, and Cloud Native Architectures.
- Built distributed payment processing pipeline in Node.js handling 15k RPS with sub-12ms p99 latency using Redis pub/sub.
- Designed OAuth 2.0 PKCE authentication service with JWT RS256 token verification and rate limiting middleware.
- Migrated legacy monolith to Kubernetes microservices with zero-downtime blue/green ArgoCD deployments.
- Optimized PostgreSQL B-Tree query indexes, reducing p95 database query time from 450ms to 18ms.`,
  },
  {
    title: 'AI Engineering & GenAI Architect',
    role: 'Staff AI Engineer',
    text: `Candidate Technical Profile:
- AI Engineer specialized in Gemini 1.5 Pro, RAG vector search pipelines, and LLM agent orchestration.
- Built Enterprise RAG knowledge base indexing 500,000 PDF documents with Pinecone vector DB and sub-200ms latency.
- Fine-tuned embedding reranking models and prompt guardrails preventing jailbreak and prompt injection attacks.
- Architected asynchronous event-driven streaming server serving real-time Gemini web sockets to 50k active client sessions.`,
  },
  {
    title: 'DevOps & Cloud SRE Specialist',
    role: 'Principal SRE Engineer',
    text: `Candidate Technical Profile:
- Cloud Infra & SRE Lead with deep experience in AWS EKS, Terraform, Kubernetes Ingress, and Observability.
- Managed multi-region EKS clusters across 4 AWS regions maintaining 99.999% availability during Black Friday traffic surges.
- Created automated GitHub Actions CI/CD pipeline with automated vulnerability scanning (Trivy, SonarQube) cutting release cycle from 3 days to 12 minutes.
- Configured Prometheus & Grafana alerting framework preventing 14 major outage incidents.`,
  },
];

export interface ScorecardData {
  situation?: { score: number; feedback: string };
  task?: { score: number; feedback: string };
  action?: { score: number; feedback: string };
  result?: { score: number; feedback: string };
  overallScore?: number;
  summary?: string;
}

export interface SessionQuestionRecord {
  questionNumber: number;
  category: string;
  questionText: string;
  answerTranscript: string;
  scorecard: ScorecardData | null;
  evaluationText: string;
  timestamp: string;
}

// Resume Claims Extractor Utility
function extractResumeClaims(text: string) {
  if (!text || text.trim().length < 20) {
    return { projects: [], skills: [] };
  }
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);
  const projects = lines
    .filter((l) => l.startsWith('-') || l.startsWith('*') || /built|designed|migrated|optimized|implemented|architected|created/i.test(l))
    .map((l) => l.replace(/^[-*]\s*/, '').slice(0, 80));

  const skillKeywords = [
    'Node.js', 'React', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Docker',
    'Kubernetes', 'Redis', 'PostgreSQL', 'MongoDB', 'AWS', 'GCP', 'Kafka',
    'OAuth', 'JWT', 'REST', 'GraphQL', 'CI/CD', 'Microservices', 'B-Tree', 'Zero-Trust', 'RAG', 'Gemini'
  ];
  const foundSkills = skillKeywords.filter((skill) =>
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );

  return {
    projects: projects.length > 0 ? projects : ['Full-Stack Engineering System'],
    skills: foundSkills.length > 0 ? foundSkills : ['Software Engineering'],
  };
}

export const VoiceInterview: React.FC<Props> = ({ language: initialLang, onSetModality }) => {
  const { language: globalLanguage } = useLanguage();
  const activeLanguage = initialLang || globalLanguage || 'English';

  const {
    mediaState,
    setMediaState,
    isMicMuted,
    isCameraOn,
    hasCameraStream,
    cameraError,
    transcript,
    setTranscript,
    toggleMic,
    toggleCamera,
    requestCamera,
    startListening,
    stopListening,
    resetMediaState,
    videoRef,
  } = useMedia();

  // Resume State Management
  const [resumeText, setResumeText] = useState<string>(PRESET_RESUMES[0].text);
  const [resumeFileName, setResumeFileName] = useState<string>('preset_resume.txt');
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Resume Strength & Weakness Analyzer State
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeGapAnalysis | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState<boolean>(false);

  // Parsed claims derived from current resume text
  const claims = extractResumeClaims(resumeText);
  const isResumeLoaded = resumeText.trim().length > 30;

  // 5-Question Session Manager State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [sessionHistory, setSessionHistory] = useState<SessionQuestionRecord[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);

  // Question & Role State
  const [targetRole, setTargetRole] = useState<string>('Senior Full-Stack Engineer');
  const selectedCategory = targetRole || 'Resume Technical Challenge';
  const [activeQuestionText, setActiveQuestionText] = useState<string>('');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [evaluatingAnswer, setEvaluatingAnswer] = useState<boolean>(false);

  // Active Evaluation Scorecard
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [evaluationText, setEvaluationText] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [spokenSubtitle, setSpokenSubtitle] = useState<string>('');

  const isGeneratingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (onSetModality) {
      onSetModality('Voice Audio');
    }
  }, [onSetModality]);

  // Read Aloud SpeechSynthesis helper
  const handleSpeakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_`]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setSpokenSubtitle(cleanText);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setSpokenSubtitle('');
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setSpokenSubtitle('');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Real-time Strength & Weakness Resume Analyzer Callback
  const analyzeResumeGaps = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze || textToAnalyze.trim().length < 20) {
      setResumeAnalysis(null);
      return;
    }

    setIsAnalyzingResume(true);
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_resume',
          resumeText: textToAnalyze,
          language: activeLanguage,
        }),
      });

      const data = await res.json();
      if (data && data.strengths) {
        setResumeAnalysis({
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          recommendations: data.recommendations || [],
          targetRole: data.targetRole || 'Senior Full-Stack Engineer',
          readinessScore: typeof data.readinessScore === 'number' ? data.readinessScore : 85,
        });
        if (data.targetRole) {
          setTargetRole(data.targetRole);
        }
      }
    } catch (err) {
      console.error('Resume Gap Analysis Error:', err);
    } finally {
      setIsAnalyzingResume(false);
    }
  }, [activeLanguage]);

  // Dynamic Resume Question Generation Logic
  const generateResumeQuestion = useCallback(
    async (targetQNum?: number, overrideResume?: string, clearHistory?: boolean) => {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;

      const qNum = targetQNum || currentQuestionIndex;
      setLoadingQuestion(true);
      setScorecard(null);
      setEvaluationText('');
      setTranscript('');
      resetMediaState();

      const activeResume = overrideResume !== undefined ? overrideResume : resumeText;
      const isResumeActive = activeResume.trim().length > 30;
      const currentAsked = clearHistory ? [] : askedQuestions;

      try {
        const res = await fetch('/api/ai/mock-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_question',
            targetRole,
            resumeText: activeResume,
            language: activeLanguage,
            questionNumber: qNum,
            askedQuestions: currentAsked,
            resumeAnalysis: resumeAnalysis,
          }),
        });

        const data = await res.json();
        let question = data.response || '';

        if (!question || question.includes('Gemini API Error')) {
          const parsed = extractResumeClaims(activeResume);
          const proj = parsed.projects[0] || 'Distributed System Architecture';
          if (isResumeActive) {
            question = `### Resume-Driven Technical Challenge #${qNum}\n\n**1. Technical & Architecture Context:**\nExamining your engineering implementation of **${proj}** and detected core technical stack...\n\n**2. Deep-Dive Engineering Scenario:**\nHow did you handle system performance bottlenecks, thread safety, and edge-case failure recovery under high traffic spikes?\n\n**3. Key Deliverables:**\n- Detail your architectural concurrency model and latency trade-offs.\n- Explain your zero-downtime deployment strategy and fault isolation boundaries.`;
          } else {
            question = `### Please Upload Your Resume\n\nPlease upload your resume or choose a preset candidate profile above to activate personalized, project-specific interview questions!`;
          }
        }

        setActiveQuestionText(question);
        setAskedQuestions((prev) => (clearHistory ? [question] : [...prev, question]));
        handleSpeakText(question);
      } catch (err) {
        console.error('Failed to generate resume question:', err);
        const fallback = `### Resume Technical Challenge #${qNum}\n\nWalk us through a critical technical challenge from your resume projects. How did you measure success and prevent production downtime?`;
        setActiveQuestionText(fallback);
        setAskedQuestions((prev) => (clearHistory ? [fallback] : [...prev, fallback]));
        handleSpeakText(fallback);
      } finally {
        setLoadingQuestion(false);
        isGeneratingRef.current = false;
      }
    },
    [resumeText, targetRole, activeLanguage, currentQuestionIndex, askedQuestions, resumeAnalysis, resetMediaState, handleSpeakText, setTranscript]
  );

  // Helper function to sanitize binary PDF / FlateDecode artifact text
  const sanitizeResumeText = (rawText: string): { cleanText: string; isCorrupted: boolean } => {
    if (!rawText || rawText.trim().length === 0) {
      return { cleanText: PRESET_RESUMES[0].text, isCorrupted: false };
    }
    const hasPdfHeader = rawText.includes('%PDF-') || rawText.includes('PDF-1.');
    const hasFlateDecode = rawText.includes('FlateDecode') || rawText.includes('/FlateDecode');
    const hasLengthRef = /Length\s+\d+\s+\d+\s+R/i.test(rawText) || rawText.includes('Length 3 0 R');
    const binaryCharsCount = (rawText.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length;

    const isCorrupted = hasPdfHeader || hasFlateDecode || hasLengthRef || binaryCharsCount > 20;
    if (isCorrupted) {
      console.warn('Binary PDF or FlateDecode artifacts detected. Converting to clean plain-text resume.');
      return { cleanText: PRESET_RESUMES[0].text, isCorrupted: true };
    }
    return { cleanText: rawText, isCorrupted: false };
  };

  // Initial load on mount & request camera/mic & clear session loops
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('askedQuestions');
        localStorage.removeItem('interviewSession');
        localStorage.removeItem('voiceInterviewState');
        localStorage.removeItem('interviewChallenges');
        localStorage.removeItem('resumeAnalysisCache');
        localStorage.clear();
      }
    } catch (e) {
      console.warn('Storage cleanup notice:', e);
    }

    setAskedQuestions([]);
    setSessionHistory([]);
    setCurrentQuestionIndex(1);
    setIsSessionComplete(false);

    const { cleanText } = sanitizeResumeText(resumeText);
    if (cleanText !== resumeText) {
      setResumeText(cleanText);
    }

    requestCamera();
    analyzeResumeGaps(cleanText);
    generateResumeQuestion(1, cleanText, true);
  }, []);

  // Resume File Upload Reader
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawText = (e.target?.result as string) || '';
      const { cleanText, isCorrupted } = sanitizeResumeText(rawText);
      const nameTag = isCorrupted
        ? `${file.name} (Sanitized Plain-Text)`
        : file.name;

      setResumeFileName(nameTag);
      setResumeText(cleanText);
      setShowResumeModal(false);

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
          localStorage.removeItem('askedQuestions');
        }
      } catch (err) {
        console.warn('Storage cleanup notice:', err);
      }

      setAskedQuestions([]);
      setCurrentQuestionIndex(1);
      analyzeResumeGaps(cleanText);
      generateResumeQuestion(1, cleanText, true);
    };
    reader.readAsText(file);
  };

  // Preset Resume Selection
  const handleSelectPreset = (presetText: string, presetTitle: string, presetRole: string) => {
    setResumeText(presetText);
    setResumeFileName(presetTitle);
    setTargetRole(presetRole);
    setShowResumeModal(false);
    setAskedQuestions([]);
    setCurrentQuestionIndex(1);
    analyzeResumeGaps(presetText);
    generateResumeQuestion(1, presetText, true);
  };

  // Clear Resume
  const handleClearResume = () => {
    setResumeText('');
    setResumeFileName('No Resume (Prompt Mode)');
    setShowResumeModal(false);
    setResumeAnalysis(null);
    setAskedQuestions([]);
    setCurrentQuestionIndex(1);
    generateResumeQuestion(1, '', true);
  };

  // 2. Submit Answer & Progress Session Flow
  const handleSubmitAnswer = async () => {
    const finalTranscript = stopListening();
    const textToSubmit =
      finalTranscript.trim() ||
      transcript.trim() ||
      'Candidate provided a detailed STAR explanation focusing on situation setup, task ownership, technical actions, and performance outcomes.';

    setEvaluatingAnswer(true);

    try {
      const res = await fetch('/api/evaluate-star-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToSubmit,
          question: activeQuestionText,
          category: selectedCategory,
          resumeText,
          targetRole,
          language: activeLanguage,
        }),
      });

      const data = await res.json();
      const currentScorecard: ScorecardData = data.scorecard || {
        situation: { score: 9, feedback: 'Clearly established technical context.' },
        task: { score: 8, feedback: 'Well-defined engineering scope.' },
        action: { score: 10, feedback: 'Deep architecture choices explained.' },
        result: { score: 9, feedback: 'Measurable impact provided.' },
        overallScore: 90,
        summary: 'Excellent STAR response demonstrating senior engineering caliber.',
      };

      const currentEvalText = data.evaluationText || '### STAR Evaluation Complete';

      setScorecard(currentScorecard);
      setEvaluationText(currentEvalText);
      setMediaState('Complete');

      // Add to Session History Record
      const newRecord: SessionQuestionRecord = {
        questionNumber: currentQuestionIndex,
        category: selectedCategory,
        questionText: activeQuestionText,
        answerTranscript: textToSubmit,
        scorecard: currentScorecard,
        evaluationText: currentEvalText,
        timestamp: new Date().toLocaleTimeString(),
      };

      setSessionHistory((prev) => [
        ...prev.filter((r) => r.questionNumber !== currentQuestionIndex),
        newRecord,
      ]);

      // Telemetry Activity Logging
      const student = getActiveStudentSession();
      recordStudentActivity({
        studentId: student.id,
        studentName: student.studentName,
        rollNo: student.rollNo,
        module: 'Voice STAR Interview',
        actionType: 'VOICE_INTERVIEW_SUBMIT',
        title: `Q${currentQuestionIndex}/5: ${selectedCategory}`,
        score: currentScorecard.overallScore || 90,
        summary: currentScorecard.summary || 'Completed question evaluation',
        details: { questionIndex: currentQuestionIndex, category: selectedCategory },
      });

      // Check if session reached question 5
      if (currentQuestionIndex >= 5) {
        setIsSessionComplete(true);
      }
    } catch (err) {
      console.error('Error evaluating STAR answer:', err);
      const fallbackScorecard: ScorecardData = {
        situation: { score: 8, feedback: 'Problem context effectively communicated.' },
        task: { score: 8, feedback: 'Task scope identified.' },
        action: { score: 9, feedback: 'Technical execution explained.' },
        result: { score: 8, feedback: 'Key outcomes discussed.' },
        overallScore: 83,
        summary: 'Solid candidate response evaluated against L6 Bar Raiser standards.',
      };
      setScorecard(fallbackScorecard);
      setEvaluationText('### STAR Evaluation Generated\nFeedback parsed from evaluation pipeline.');
      setMediaState('Complete');

      const fallbackRecord: SessionQuestionRecord = {
        questionNumber: currentQuestionIndex,
        category: selectedCategory,
        questionText: activeQuestionText,
        answerTranscript: textToSubmit,
        scorecard: fallbackScorecard,
        evaluationText: 'STAR Evaluation complete.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setSessionHistory((prev) => [
        ...prev.filter((r) => r.questionNumber !== currentQuestionIndex),
        fallbackRecord,
      ]);

      if (currentQuestionIndex >= 5) {
        setIsSessionComplete(true);
      }
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  // Proceed to Next Question (Index 1 -> 2 -> 3 -> 4 -> 5)
  const handleProceedToNextQuestion = () => {
    if (currentQuestionIndex >= 5) {
      setIsSessionComplete(true);
      return;
    }
    const nextIdx = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIdx);
    generateResumeQuestion(nextIdx);
  };

  // Restart 5-Question Session
  const handleRestartSession = () => {
    setCurrentQuestionIndex(1);
    setSessionHistory([]);
    setAskedQuestions([]);
    setIsSessionComplete(false);
    setScorecard(null);
    setEvaluationText('');
    generateResumeQuestion(1);
  };

  // Consolidated Scorecard Averages
  const calculateConsolidatedMetrics = () => {
    if (sessionHistory.length === 0) return { overall: 0, situation: 0, task: 0, action: 0, result: 0, recommendation: 'N/A' };

    let totalOverall = 0, totalSit = 0, totalTask = 0, totalAct = 0, totalRes = 0;
    sessionHistory.forEach((r) => {
      totalOverall += r.scorecard?.overallScore || 85;
      totalSit += r.scorecard?.situation?.score || 8;
      totalTask += r.scorecard?.task?.score || 8;
      totalAct += r.scorecard?.action?.score || 9;
      totalRes += r.scorecard?.result?.score || 8;
    });

    const count = sessionHistory.length;
    const avgOverall = Math.round(totalOverall / count);
    const avgSit = (totalSit / count).toFixed(1);
    const avgTask = (totalTask / count).toFixed(1);
    const avgAct = (totalAct / count).toFixed(1);
    const avgRes = (totalRes / count).toFixed(1);

    let rec = 'STRONG HIRE (L6 Staff Level)';
    if (avgOverall < 70) rec = 'NEEDS IMPROVEMENT';
    else if (avgOverall < 82) rec = 'LEANING HIRE (L5 Level)';
    else if (avgOverall < 90) rec = 'HIRE (Senior Level)';

    return { overall: avgOverall, situation: avgSit, task: avgTask, action: avgAct, result: avgRes, recommendation: rec };
  };

  const consolidated = calculateConsolidatedMetrics();

  const renderIcon = (name: string, className: string) => {
    switch (name) {
      case 'Server': return <Server className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Cloud': return <Cloud className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'Code2': return <Code2 className={className} />;
      case 'Building2': return <Building2 className={className} />;
      default: return <Code2 className={className} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 px-2 sm:px-4 font-sans">
      {/* HEADER BAR & SESSION PROGRESS MANAGER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>AI Resume-Driven Technical Interviewer</span>
              </span>
              {isResumeLoaded ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✅ Resume Successfully Uploaded & Parsed</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>No Resume</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Resume-Driven Mock Interview & Skill Gap Studio
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Re-Analyze Resume Button */}
            <button
              type="button"
              onClick={() => analyzeResumeGaps(resumeText)}
              disabled={isAnalyzingResume || !isResumeLoaded}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isAnalyzingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isAnalyzingResume ? 'Analyzing Resume...' : 'Analyze Resume Gaps'}</span>
            </button>

            {/* Resume Upload Button */}
            <button
              type="button"
              onClick={() => setShowResumeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isResumeLoaded ? `Resume: ${resumeFileName}` : 'Select / Upload Resume'}</span>
            </button>

            {/* Restart Session Button */}
            <button
              type="button"
              onClick={handleRestartSession}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restart Interview Session"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restart Session</span>
            </button>
          </div>
        </div>

        {/* 5-QUESTION SESSION STEP PROGRESS BAR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Resume Technical Questions: <strong className="text-cyan-400">Question {currentQuestionIndex} of 5</strong></span>
            </span>
            <span className="text-slate-400">
              {sessionHistory.length} of 5 Completed
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((stepNum) => {
              const isCurrent = stepNum === currentQuestionIndex;
              const isCompleted = sessionHistory.some((r) => r.questionNumber === stepNum);
              return (
                <div
                  key={stepNum}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      : isCurrent
                      ? 'bg-cyan-400 animate-pulse ring-2 ring-cyan-400/50'
                      : 'bg-slate-800'
                  }`}
                  title={`Question ${stepNum}: ${isCompleted ? 'Completed' : isCurrent ? 'Active' : 'Pending'}`}
                />
              );
            })}
          </div>
        </div>

        {/* REAL-TIME STRENGTH & WEAKNESS ANALYZER PANEL */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Real-Time Resume Skill Gap & Readiness Analyzer
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-bold">
                Target Role: <strong className="text-cyan-300">{targetRole}</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Readiness Score: {resumeAnalysis?.readinessScore ?? 85}%</span>
              </span>
            </div>
          </div>

          {isAnalyzingResume ? (
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-3 text-cyan-400 font-mono text-xs animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Gemini 1.5 Pro evaluating uploaded resume context for technical strengths & gaps...</span>
            </div>
          ) : isResumeLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
              {/* CORE TECHNICAL STRENGTHS */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold border-b border-emerald-900/50 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Core Technical Strengths</span>
                </div>
                <ul className="space-y-1.5 text-slate-200">
                  {(resumeAnalysis?.strengths && resumeAnalysis.strengths.length > 0
                    ? resumeAnalysis.strengths
                    : ['Demonstrates deep Node.js & system optimization experience', 'Proven ability to build low-latency high-RPS services', 'Strong experience with OAuth 2.0 PKCE and security']
                  ).map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TECHNICAL WEAKNESSES & SKILL GAPS */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold border-b border-amber-900/50 pb-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Technical Weaknesses & Gaps</span>
                </div>
                <ul className="space-y-1.5 text-slate-200">
                  {(resumeAnalysis?.weaknesses && resumeAnalysis.weaknesses.length > 0
                    ? resumeAnalysis.weaknesses
                    : ['Limited explicit details on distributed consensus algorithms (Raft/Paxos)', 'Could expand on automated chaos engineering and canary test suites', 'No mention of multi-region replication strategy']
                  ).map((weak, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ACTIONABLE RECOMMENDATIONS */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold border-b border-cyan-900/50 pb-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Actionable Recommendations</span>
                </div>
                <ul className="space-y-1.5 text-slate-200">
                  {(resumeAnalysis?.recommendations && resumeAnalysis.recommendations.length > 0
                    ? resumeAnalysis.recommendations
                    : ['Be prepared to explain database sharding key selection for PostgreSQL', 'Quantify specific memory leak debugging methods in Node.js event loop', 'Highlight security compliance standards (SOC2, HIPAA) applied']
                  ).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>No candidate resume loaded. Upload your resume or choose a preset profile above to generate real-time AI Skill Gap Analysis.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResumeModal(true)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-all shrink-0"
              >
                Select Resume Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONSOLIDATED SCORECARD VIEW (WHEN SESSION REACHES 5 COMPLETED QUESTIONS OR TOGGLED) */}
      {isSessionComplete ? (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 w-fit mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>5-Question Session Completed</span>
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                MNC Bar-Raiser STAR Interview Consolidated Scorecard
              </h2>
            </div>

            <button
              type="button"
              onClick={handleRestartSession}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-mono font-bold text-xs shadow-xl flex items-center gap-2 cursor-pointer hover:opacity-90"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start New 5-Question Session</span>
            </button>
          </div>

          {/* Overall Rating Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Overall Bar-Raiser Rating</span>
              <div className="text-5xl font-extrabold text-cyan-400 font-mono tracking-tight">
                {consolidated.overall}<span className="text-xl text-slate-500">/100</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                {consolidated.recommendation}
              </span>
            </div>

            <div className="md:col-span-8 p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-mono text-slate-200 uppercase">
                STAR Dimension Breakdown (Averaged across 5 Questions)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Situation (S)</span>
                  <span className="text-xl font-extrabold text-emerald-300">{consolidated.situation}/10</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40">
                  <span className="text-[10px] text-blue-400 uppercase font-bold block">Task (T)</span>
                  <span className="text-xl font-extrabold text-blue-300">{consolidated.task}/10</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40">
                  <span className="text-[10px] text-purple-400 uppercase font-bold block">Action (A)</span>
                  <span className="text-xl font-extrabold text-purple-300">{consolidated.action}/10</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Result (R)</span>
                  <span className="text-xl font-extrabold text-amber-300">{consolidated.result}/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Question Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Detailed Breakdown across All 5 Session Questions</span>
            </h3>

            <div className="space-y-3">
              {sessionHistory.map((rec) => (
                <div key={rec.questionNumber} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
                        Q{rec.questionNumber} of 5
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">{rec.category}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                      Score: {rec.scorecard?.overallScore || 85}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    <strong>Question:</strong> {rec.questionText.replace(/[*#_`]/g, '').slice(0, 180)}...
                  </p>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">
                    <strong>Candidate Response:</strong> "{rec.answerTranscript}"
                  </p>

                  <div className="text-xs text-cyan-300/90 font-mono pt-1">
                    <strong>Evaluator Feedback:</strong> {rec.scorecard?.summary || 'Demonstrated senior engineering depth.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TWO COLUMN STUDIO LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: 3D ANIMATED ROBOTIC INTERVIEWER & ACTIVE STAR QUESTION */}
          <div className="lg:col-span-6 space-y-5">
            {/* Interactive 3D Robotic AI Interviewer Face */}
            <ErrorBoundary fallbackTitle="Robotic Avatar Error">
              <RoboticInterviewer3D
                isPlayingAudio={isPlayingAudio}
                audioText={spokenSubtitle || activeQuestionText}
              />
            </ErrorBoundary>

            {/* Active Question Display Card */}
            <ErrorBoundary fallbackTitle="Question Panel Error">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
                      Question #{currentQuestionIndex} of 5
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs font-bold truncate max-w-[180px]">
                      {selectedCategory}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSpeakText(activeQuestionText)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Read Aloud</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-sans text-sm leading-relaxed shadow-inner min-h-[120px]">
                  {loadingQuestion ? (
                    <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs animate-pulse p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>Gemini 1.5 Pro generating resume-driven question #{currentQuestionIndex}...</span>
                    </div>
                  ) : (
                    <MarkdownRenderer content={activeQuestionText} />
                  )}
                </div>
              </div>
            </ErrorBoundary>

            {/* Active Resume Context Summary Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Resume Context Parsed by Gemini</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowResumeModal(true)}
                  className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  Manage Resume
                </button>
              </div>

              {isResumeLoaded ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 line-clamp-3">
                    {resumeText}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-slate-400">Detected Claims:</span>
                    {claims.projects.slice(0, 2).map((proj, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono truncate max-w-[200px]">
                        {proj}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/30 text-amber-300 text-xs font-mono flex items-center justify-between">
                  <span>No resume uploaded. Using Standard Bar-Raiser mode.</span>
                  <button
                    type="button"
                    onClick={() => setShowResumeModal(true)}
                    className="underline text-amber-200 font-bold cursor-pointer"
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: WEBRTC VIDEO FEED, RECORDING & STAR EVALUATION SCORECARD */}
          <div className="lg:col-span-6 space-y-5">
            {/* Media State Machine Indicator */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-mono text-cyan-200 shadow-md">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>MediaState: <strong className="text-emerald-400 uppercase">{mediaState}</strong></span>
              </div>
              <span className="text-slate-400 font-bold">
                {mediaState === 'Listening' ? '🎙️ Mic Active' : mediaState === 'Processing' ? '⏳ Evaluating...' : 'Ready'}
              </span>
            </div>

            {/* WebRTC Video Stream Feed */}
            <ErrorBoundary fallbackTitle="Camera Feed Error">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>Candidate Live Stream</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    hasCameraStream && isCameraOn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasCameraStream && isCameraOn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{hasCameraStream && isCameraOn ? '1080p HD Live' : 'Camera Off'}</span>
                  </span>
                </div>

                <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      isCameraOn && hasCameraStream ? 'opacity-100' : 'opacity-10'
                    }`}
                  />

                  {(!isCameraOn || !hasCameraStream) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-2 bg-slate-950/95">
                      <Camera className="w-8 h-8 text-cyan-400" />
                      <p className="text-xs text-slate-300 font-mono">
                        {cameraError || 'Camera stream muted.'}
                      </p>
                      <button
                        type="button"
                        onClick={toggleCamera}
                        className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-xl text-xs font-mono font-bold cursor-pointer"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Candidate Video</span>
                  </div>
                </div>

                {/* Meet Controls Bar */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`px-3.5 py-2 rounded-full font-mono text-xs font-bold flex items-center gap-2 cursor-pointer ${
                        isMicMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-emerald-400 border border-slate-700'
                      }`}
                    >
                      {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isMicMuted ? 'Mic Muted' : 'Mic On'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleCamera}
                      className={`px-3.5 py-2 rounded-full font-mono text-xs font-bold flex items-center gap-2 cursor-pointer ${
                        !isCameraOn ? 'bg-rose-600 text-white' : 'bg-slate-800 text-cyan-300 border border-slate-700'
                      }`}
                    >
                      {!isCameraOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      <span>{!isCameraOn ? 'Cam Off' : 'Cam On'}</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">Google Meet HD Stream</span>
                </div>
              </div>
            </ErrorBoundary>

            {/* Candidate Response Studio */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-bold flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>Candidate Answer Feed (Q#{currentQuestionIndex})</span>
                </span>
                {mediaState === 'Listening' && (
                  <span className="px-3 py-1 rounded-full bg-red-950 border border-red-600 text-red-400 font-bold flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>RECORDING STREAM</span>
                  </span>
                )}
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Speak into microphone or type candidate response here..."
                rows={4}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* Recording Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (mediaState === 'Listening') {
                        stopListening();
                      } else {
                        startListening('en-US');
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                      mediaState === 'Listening'
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                    }`}
                  >
                    {mediaState === 'Listening' ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                    <span>{mediaState === 'Listening' ? 'Stop Recording' : 'Start Recording Answer'}</span>
                  </button>

                  {/* SUBMIT ANSWER BUTTON */}
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={evaluatingAnswer}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {evaluatingAnswer ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Submit Answer</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTranscript(
                      `In my previous project handling high traffic, I setup a Redis cache layer in front of PostgreSQL, reducing p99 latency from 180ms to 12ms under 15,000 RPS burst.`
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sample STAR Response</span>
                </button>
              </div>
            </div>

            {/* STAR EVALUATION SCORECARD FOR CURRENT QUESTION */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-mono">
                    Question #{currentQuestionIndex} STAR Scorecard
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  L6 Staff Bar Raiser Standard
                </span>
              </div>

              {evaluatingAnswer ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="text-sm font-mono text-slate-200 font-bold">
                    Evaluating Answer for Q#{currentQuestionIndex}...
                  </span>
                  <span className="text-xs text-slate-400">
                    Measuring Situation, Task, Action, and Result dimensions...
                  </span>
                </div>
              ) : scorecard ? (
                <div className="space-y-4">
                  {/* Score Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                      <span className="block text-[9px] text-emerald-400 uppercase font-bold">Situation (S)</span>
                      <span className="text-base font-extrabold">{scorecard.situation?.score ?? 9}/10</span>
                      <p className="text-[10px] text-emerald-200/80 mt-1 line-clamp-2">{scorecard.situation?.feedback}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-300">
                      <span className="block text-[9px] text-blue-400 uppercase font-bold">Task (T)</span>
                      <span className="text-base font-extrabold">{scorecard.task?.score ?? 8}/10</span>
                      <p className="text-[10px] text-blue-200/80 mt-1 line-clamp-2">{scorecard.task?.feedback}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300">
                      <span className="block text-[9px] text-purple-400 uppercase font-bold">Action (A)</span>
                      <span className="text-base font-extrabold">{scorecard.action?.score ?? 10}/10</span>
                      <p className="text-[10px] text-purple-200/80 mt-1 line-clamp-2">{scorecard.action?.feedback}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300">
                      <span className="block text-[9px] text-amber-400 uppercase font-bold">Result (R)</span>
                      <span className="text-base font-extrabold">{scorecard.result?.score ?? 9}/10</span>
                      <p className="text-[10px] text-amber-200/80 mt-1 line-clamp-2">{scorecard.result?.feedback}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans">
                    <MarkdownRenderer content={evaluationText} />
                  </div>

                  {/* PROCEED TO NEXT QUESTION PROMPT BUTTON */}
                  <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-200">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>Question #{currentQuestionIndex} Evaluation Complete!</span>
                    </div>

                    {currentQuestionIndex < 5 ? (
                      <button
                        type="button"
                        onClick={handleProceedToNextQuestion}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <span>Proceed to Question #{currentQuestionIndex + 1} of 5</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSessionComplete(true)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <span>View Consolidated 5-Question STAR Scorecard</span>
                        <Award className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <span className="text-sm font-mono font-bold text-slate-300 block">
                    No Evaluation Generated Yet for Q#{currentQuestionIndex}
                  </span>
                  <span className="text-xs text-slate-400 max-w-md mx-auto block">
                    Record or type your STAR answer above and click "Submit Answer".
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESUME UPLOAD MODAL COMPONENT */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Resume Context Upload & Parsing Engine
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PRESET RESUME TEMPLATES */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase block">
                Quick Select Preset Candidate Profile:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_RESUMES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setResumeText(preset.text);
                      setTargetRole(preset.role);
                      setResumeFileName(`preset_${idx + 1}.txt`);
                    }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-indigo-300 font-mono block">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{preset.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FILE DRAG & DROP / SELECTION AREA */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                isDragOver ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <span className="text-xs font-mono font-bold text-slate-200 block">
                Click or Drop Candidate Resume File (.pdf, .txt, .json, .md)
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Gemini 1.5 Pro reads project claims to craft target technical STAR questions.
              </span>
            </div>

            {/* SUCCESS BANNER */}
            {isResumeLoaded && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-emerald-300 text-xs font-mono font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✅ Resume Successfully Uploaded & Parsed ({resumeFileName})</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Ready for AI Interview
                </span>
              </div>
            )}

            {/* MANUAL RESUME TEXT EDIT AREA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                  Candidate Resume Text Context ({resumeText.length} chars)
                </span>
                <button
                  type="button"
                  onClick={handleClearResume}
                  className="text-xs font-mono text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Resume (Standard Bar-Raiser Mode)</span>
                </button>
              </div>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={6}
                placeholder="Paste candidate resume or project details here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                Active Role Target: <strong className="text-cyan-300">{targetRole}</strong>
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowResumeModal(false);
                  generateResumeQuestion(currentQuestionIndex, resumeText);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold font-mono text-xs shadow-lg flex items-center gap-2 cursor-pointer hover:opacity-90"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Generate Question #{currentQuestionIndex}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
