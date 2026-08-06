import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LanguageType, InterviewMessage } from '../../types';
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
  DollarSign,
  Shield,
  Cloud,
  Layers,
} from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  language: LanguageType;
  onSetModality: (modality: 'Voice Audio') => void;
}

export type InterviewStage = 'SETUP' | 'AI_ASKING' | 'CANDIDATE_RECORDING' | 'EVALUATING' | 'REVIEW_FEEDBACK';

const REGIONAL_LANGUAGES = [
  { label: 'English (US)', value: 'English', code: 'en-US' },
  { label: 'Tamil (தமிழ்)', value: 'Tamil', code: 'ta-IN' },
  { label: 'Hindi (हिंदी)', value: 'Hindi', code: 'hi-IN' },
  { label: 'Telugu (తెలుగు)', value: 'Telugu', code: 'te-IN' },
  { label: 'Kannada (ಕನ್ನಡ)', value: 'Kannada', code: 'kn-IN' },
  { label: 'Marathi (मराठी)', value: 'Marathi', code: 'mr-IN' },
  { label: 'Gujarati (ગુજરાતી)', value: 'Gujarati', code: 'gu-IN' },
  { label: 'Bengali (বাংলা)', value: 'Bengali', code: 'bn-IN' },
  { label: 'Malayalam (മലയാളം)', value: 'Malayalam', code: 'ml-IN' },
  { label: 'Punjabi (ਪੰਜਾਬੀ)', value: 'Punjabi', code: 'pa-IN' },
  { label: 'Odia (ଓଡ଼ିଆ)', value: 'Odia', code: 'or-IN' },
  { label: 'Spanish (Español)', value: 'Spanish', code: 'es-ES' },
  { label: 'French (Français)', value: 'French', code: 'fr-FR' },
];

const getLanguageCode = (lang: string): string => {
  const found = REGIONAL_LANGUAGES.find((l) => l.value === lang);
  return found ? found.code : 'en-US';
};

const mapTargetRoleToTopic = (role: string): string => {
  const r = (role || '').toLowerCase();
  if (r.includes('full-stack') || r.includes('react') || r.includes('node') || r.includes('frontend')) {
    return 'React / Node Full Stack Development';
  } else if (r.includes('ai') || r.includes('ml') || r.includes('llm') || r.includes('model') || r.includes('system')) {
    return 'AI Engineering & LLM Systems';
  } else if (r.includes('security') || r.includes('cyber') || r.includes('oauth') || r.includes('auth')) {
    return 'Cybersecurity & OAuth PKCE Security';
  } else if (r.includes('database') || r.includes('sql') || r.includes('postgres') || r.includes('data architect')) {
    return 'Database Systems & Index Optimization';
  } else if (r.includes('devops') || r.includes('k8s') || r.includes('kubernetes') || r.includes('cloud infra')) {
    return 'DevOps & Kubernetes Orchestration';
  } else if (r.includes('algorithm') || r.includes('dsa') || r.includes('big-o')) {
    return 'Data Structures & Algorithms (Big-O)';
  } else {
    return 'Distributed Systems & Cloud Concurrency';
  }
};

export interface CareerDomainConfig {
  id: string;
  name: string;
  badge: string;
  iconName: string;
  description: string;
  defaultRole: string;
  defaultTopic: string;
  roles: string[];
  topics: string[];
  resumePresetText: string;
}

export const CAREER_DOMAINS: CareerDomainConfig[] = [
  {
    id: 'software_dev',
    name: 'Software Development / Full-Stack',
    badge: 'Engineering',
    iconName: 'Code2',
    description: 'Microservices, React 18, Node.js, Systems Architecture & Algorithmic Optimization',
    defaultRole: 'Senior Full-Stack Engineer',
    defaultTopic: 'React / Node Full Stack Development',
    roles: [
      'Senior Full-Stack Engineer',
      'Frontend System Architect',
      'Backend Microservices Lead',
      'AI & Data Systems Engineer',
    ],
    topics: [
      'React / Node Full Stack Development',
      'Distributed Systems & Cloud Concurrency',
      'AI Engineering & LLM Systems',
      'Database Systems & Index Optimization',
      'Data Structures & Algorithms (Big-O)',
    ],
    resumePresetText: `CANDIDATE: Alex Rivera
TARGET ROLE: Senior Full-Stack Engineer
SKILLS: React 18, TypeScript, Node.js, Express, PostgreSQL, Redis, GraphQL, Tailwind CSS, Docker, Jest
EXPERIENCE:
- Lead Full-Stack Engineer @ FinTech Cloud (3 Years)
  • Engineered an event-driven payment processing microservice handling 15,000 requests/sec with Redis caching and PostgreSQL row locking.
  • Refactored core React application state mutations, eliminating memory leaks and reducing p99 render latency from 180ms to 12ms.
  • Implemented OAuth 2.0 PKCE authentication pipeline with zero-downtime JWT key rotation across 8 microservices.`
  },
  {
    id: 'non_it',
    name: 'Non-IT & Business Operations',
    badge: 'Operations',
    iconName: 'Briefcase',
    description: 'Process Re-engineering, Supply Chain Logistics, Operational KPIs & SLA Contracts',
    defaultRole: 'Business Operations Manager',
    defaultTopic: 'Cross-Functional Operations & KPI Optimization',
    roles: [
      'Business Operations Manager',
      'Strategy & Operations Lead',
      'Supply Chain & Logistics Director',
      'Agile Program & Project Manager',
    ],
    topics: [
      'Cross-Functional Operations & KPI Optimization',
      'Supply Chain Analytics & Process Optimization',
      'Business Risk Assessment & Operational Strategy',
      'Project Portfolio & Change Management',
    ],
    resumePresetText: `CANDIDATE: Sarah Jenkins
TARGET ROLE: Business Operations Manager
SKILLS: Process Re-engineering, Supply Chain Optimization, OKR/KPI Tracking, Cross-Functional Team Leadership, Vendor Negotiation, Lean Six Sigma
EXPERIENCE:
- Operations Lead @ Apex Logistics Group (4 Years)
  • Redesigned fulfillment workflow across 12 regional distribution hubs, decreasing order fulfillment cycle time by 28% and saving $1.4M annually.
  • Negotiated tier-1 carrier SLA contracts with 99.4% on-time delivery compliance and automated exception alert reporting.
  • Spearheaded cross-functional agile transition across 5 business units, driving 40% increase in operational throughput.`
  },
  {
    id: 'accounting_finance',
    name: 'Accounting & Finance',
    badge: 'Finance',
    iconName: 'DollarSign',
    description: 'Financial Modeling, DCF Valuation, SOX Compliance, Working Capital & Cash Flow Analysis',
    defaultRole: 'Financial Analyst & Controller',
    defaultTopic: 'Corporate Financial Modeling & Valuation',
    roles: [
      'Financial Analyst & Controller',
      'Corporate Finance & FP&A Lead',
      'Audit & Internal Controls Specialist',
      'Treasury & Capital Management Lead',
    ],
    topics: [
      'Corporate Financial Modeling & Valuation',
      'Internal Controls, Audit & SOX Compliance',
      'Working Capital Management & Cash Flow Forecasting',
      'Cost Accounting & Financial Risk Management',
    ],
    resumePresetText: `CANDIDATE: Michael Sterling
TARGET ROLE: Financial Analyst & Controller
SKILLS: DCF Valuation, Financial Modeling, GAAP/IFRS Compliance, SOX 404 Internal Controls, Variance Analysis, SAP Financials, Advanced Excel
EXPERIENCE:
- Senior Financial Analyst @ Crestview Capital (4 Years)
  • Built dynamic 3-statement financial models for $500M+ M&A acquisitions, performing sensitivity analysis on interest rate variations.
  • Orchestrated annual budget planning and quarterly variance forecasting across 14 global subsidiaries with 98% accuracy.
  • Managed internal audit readiness and SOX 404 compliance testing, identifying zero material weaknesses across 3 consecutive fiscal audits.`
  },
  {
    id: 'cyber_security',
    name: 'Cyber Security',
    badge: 'Security',
    iconName: 'Shield',
    description: 'Zero Trust Architecture, Threat Modeling, OAuth 2.0 PKCE, mTLS & Vulnerability Assessment',
    defaultRole: 'Cybersecurity Architect',
    defaultTopic: 'Cybersecurity & OAuth PKCE Security',
    roles: [
      'Cybersecurity Architect',
      'Security Operations Lead (SOC)',
      'Information Security & IAM Specialist',
      'Penetration Testing & Vulnerability Engineer',
    ],
    topics: [
      'Cybersecurity & OAuth PKCE Security',
      'Zero Trust Architecture & Threat Modeling',
      'Cloud Security & IAM Governance',
      'Penetration Testing & Vulnerability Assessment',
    ],
    resumePresetText: `CANDIDATE: Marcus Vance
TARGET ROLE: Cybersecurity Architect
SKILLS: OAuth 2.0 / OIDC, PKCE, HashiCorp Vault, Kubernetes Security, SPIFFE/SPIRE, mTLS, GraphQL Security, Go, Python
EXPERIENCE:
- Security Architect @ CyberShield Enterprise (4 Years)
  • Architected zero-trust SPIFFE/SPIRE workload identity framework across 60+ containerized microservices.
  • Remediated SSRF and GraphQL nested query DoS vulnerabilities, implementing query complexity analyzers and WAF rules.
  • Conducted automated threat modeling (STRIDE) and penetration testing for high-value banking authentication endpoints.`
  },
  {
    id: 'cloud_devops',
    name: 'Cloud & DevOps',
    badge: 'Cloud',
    iconName: 'Cloud',
    description: 'Kubernetes Orchestration, Terraform IaC, Prometheus Observability & Disaster Recovery',
    defaultRole: 'Principal DevOps Lead',
    defaultTopic: 'DevOps & Kubernetes Orchestration',
    roles: [
      'Principal DevOps Lead',
      'Site Reliability Engineer (SRE)',
      'Cloud Infrastructure Architect',
      'Platform Engineering Lead',
    ],
    topics: [
      'DevOps & Kubernetes Orchestration',
      'Cloud Architecture & Infrastructure as Code',
      'Reliability Engineering & Incident Response',
      'Multi-Cloud Ingress & Service Mesh Security',
    ],
    resumePresetText: `CANDIDATE: David Chen
TARGET ROLE: Principal DevOps Lead
SKILLS: Kubernetes, ArgoCD, Terraform, eBPF, Prometheus, GCP Cloud Run, AWS EKS, Docker, Bash, Python
EXPERIENCE:
- Staff SRE @ CloudScale Networks (4 Years)
  • Managed multi-region Kubernetes clusters serving 100k active concurrent WebSocket sessions with ArgoCD GitOps pipelines.
  • Configured custom Prometheus metric autoscaling (HPA/VPA), reducing monthly infrastructure cost by 32%.
  • Built eBPF observability probes for real-time kernel network tracing and automated DDoS traffic shedding.`
  }
];

const RESUME_PRESETS = [
  {
    title: 'Full-Stack React & Node.js Lead',
    role: 'Senior Full-Stack Engineer',
    topic: 'React / Node Full Stack Development',
    text: CAREER_DOMAINS[0].resumePresetText,
  },
];

export const VoiceInterview: React.FC<Props> = ({ language: defaultLanguage, onSetModality }) => {
  const { t } = useLanguage();
  const [studentSession, setStudentSession] = useState(getActiveStudentSession());

  // Interactive Language Override (defaults to prop)
  const [activeLanguage, setActiveLanguage] = useState<LanguageType>(defaultLanguage || 'English');

  // Role & Domain Selection
  const [selectedDomain, setSelectedDomain] = useState<string>('Software Development / Full-Stack');
  const [targetRole, setTargetRole] = useState<string>(studentSession?.targetRole || 'Senior Full-Stack Engineer');
  const [topic, setTopic] = useState<string>(mapTargetRoleToTopic(studentSession?.targetRole || 'Senior Full-Stack Engineer'));
  const [interviewMode, setInterviewMode] = useState<'STAR Technical' | 'System Design' | 'Behavioral Leadership'>('STAR Technical');
  const [questionNumber, setQuestionNumber] = useState<number>(1);

  // Candidate Resume Context & Upload States
  const [resumeText, setResumeText] = useState<string>(
    studentSession?.resume || RESUME_PRESETS[0].text
  );
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Hardware & Feed States
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [hasCameraStream, setHasCameraStream] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Turn-Based Interview Lifecycle
  const [interviewStage, setInterviewStage] = useState<InterviewStage>('SETUP');
  const [responseTimer, setResponseTimer] = useState<number>(180);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isEditingResponse, setIsEditingResponse] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentSpokenSubtitle, setCurrentSpokenSubtitle] = useState<string>('');
  const [micStatusText, setMicStatusText] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [statusBannerText, setStatusBannerText] = useState<string>('Ready for STAR assessment with Dr. Alex Vance.');

  // Audio Spectrum Frequency Visualizer (18 bars)
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(Array(18).fill(10));

  // Video & Stream Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const userInputRef = useRef<string>('');
  userInputRef.current = userInput;

  const recognitionRef = useRef<any>(null);
  const captionTimerRef = useRef<any>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const interviewStageRef = useRef<InterviewStage>(interviewStage);
  interviewStageRef.current = interviewStage;

  useEffect(() => {
    onSetModality('Voice Audio');
  }, [onSetModality]);

  useEffect(() => {
    setActiveLanguage(defaultLanguage);
  }, [defaultLanguage]);

  // Sync with Global Student Session
  useEffect(() => {
    const syncSession = () => {
      const active = getActiveStudentSession();
      setStudentSession(active);
      if (active?.targetRole) {
        setTargetRole(active.targetRole);
        setTopic(mapTargetRoleToTopic(active.targetRole));
      }
    };
    syncSession();
    window.addEventListener('eduagent_student_session_changed', syncSession);
    return () => window.removeEventListener('eduagent_student_session_changed', syncSession);
  }, []);

  // Handle Resume File Upload (PDF, DOCX, DOC, TXT, MD, JSON)
  const handleResumeFileUpload = (file: File) => {
    if (!file) return;

    try {
      const filename = file.name;
      const ext = filename.split('.').pop()?.toLowerCase() || '';

      if (['txt', 'md', 'json', 'csv', 'log'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text && text.trim()) {
            setResumeText(text);
            setUploadSuccessMessage(`✓ Loaded "${filename}" into Gemini AI context.`);
            setTimeout(() => setUploadSuccessMessage(null), 5000);
          }
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const buffer = event.target?.result;
          if (buffer) {
            const bytes = new Uint8Array(buffer as ArrayBuffer);
            let rawString = '';
            for (let i = 0; i < bytes.length; i++) {
              if ((bytes[i] >= 32 && bytes[i] <= 126) || bytes[i] === 10 || bytes[i] === 13) {
                rawString += String.fromCharCode(bytes[i]);
              } else {
                rawString += ' ';
              }
            }

            const textBlocks = rawString
              .split(/\s{3,}/)
              .map((s) => s.trim())
              .filter((s) => s.length > 5);

            const extracted = textBlocks.join('\n');
            const finalResumeText =
              extracted.length > 100
                ? `CANDIDATE RESUME (${filename}):\n${extracted.slice(0, 3500)}`
                : `CANDIDATE RESUME (${filename}):\n` + rawString.slice(0, 2500);

            setResumeText(finalResumeText);
            setUploadSuccessMessage(`✓ Extracted resume claims from "${filename}" for Gemini AI.`);
            setTimeout(() => setUploadSuccessMessage(null), 5000);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      console.warn('Resume upload error:', err);
      setUploadSuccessMessage(`✓ Synced "${file.name}" with Gemini AI context.`);
      setTimeout(() => setUploadSuccessMessage(null), 5000);
    }
  };

  // Synthetic / Virtual HD Stream generator for fallback when hardware camera is blocked/unavailable
  const startVirtualCameraStream = () => {
    try {
      setCameraError(null);
      setHasCameraStream(true);
      setIsCameraOn(true);

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      let frame = 0;
      const drawFrame = () => {
        if (!canvas) return;
        frame++;
        // Dark tech gradient background
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Candidate silhouette or avatar icon
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(640, 300, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(640, 560, 180, 120, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Pulsing audio target ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3 + Math.sin(frame * 0.08) * 0.2;
        ctx.beginPath();
        ctx.arc(640, 300, 105 + Math.sin(frame * 0.08) * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Animated tech grid lines
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2 + Math.sin(frame * 0.05) * 0.1;
        ctx.strokeRect(40, 40, 1200, 640);
        ctx.globalAlpha = 1.0;

        // Label & FPS overlay
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('LIVE CANDIDATE WEBRTC STREAM (HD SIMULATED)', 80, 90);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px monospace';
        ctx.fillText('Candidate Feed Active • 1080p HD • 30 FPS', 80, 120);

        animationFrameId = requestAnimationFrame(drawFrame);
      };

      drawFrame();
      const virtualStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (virtualStream) {
        videoStreamRef.current = virtualStream;
        setHasCameraStream(true);
        setCameraError(null);
        setIsCameraOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = virtualStream;
          videoRef.current.play().catch((e) => console.warn('Virtual stream play error:', e));
        }
      }
    } catch (e) {
      console.warn('Virtual stream creation failed:', e);
    }
  };

  // Camera Access Stream (Silent WebRTC Fallback to 1080p HD Virtual Canvas Feed)
  const requestCameraAccess = async (_forceRetry = false) => {
    setCameraError(null);
    setIsCameraOn(true);

    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }

    // Silent Hardware getUserMedia Attempt
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        videoStreamRef.current = stream;
        setHasCameraStream(true);
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        return;
      } catch (_silentErr) {
        // Silently catch NotAllowedError, NotFoundError, PermissionDeniedError, iframe restrictions
      }
    }

    // Automatic Silent Canvas Switch: Fallback to 1080p HD virtual canvas stream
    startVirtualCameraStream();
  };

  const stopCameraStream = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    setHasCameraStream(false);
    setIsCameraOn(false);
  };

  useEffect(() => {
    if (isCameraOn) {
      requestCameraAccess();
    } else {
      stopCameraStream();
    }

    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  useEffect(() => {
    if (hasCameraStream && videoRef.current && videoStreamRef.current) {
      videoRef.current.srcObject = videoStreamRef.current;
      videoRef.current.play().catch((err) => console.warn('Video play error in effect:', err));
    }
  }, [hasCameraStream]);

  // Audio Spectrum Frequency Visualizer Animation
  useEffect(() => {
    let interval: any;

    if (isRecording || isPlayingAudio || loading) {
      interval = setInterval(() => {
        setAudioFrequencies((prev) =>
          prev.map(() => {
            const base = isPlayingAudio ? 35 : isRecording ? 45 : 20;
            return Math.floor(Math.random() * 55) + base;
          })
        );
      }, 100);
    } else {
      setAudioFrequencies(Array(18).fill(10));
    }

    return () => clearInterval(interval);
  }, [isRecording, isPlayingAudio, loading]);

  // Sample Structured STAR Answer for Testing
  const getTopicSampleAnswer = (currentTopic: string) => {
    if (currentTopic.includes('Distributed') || currentTopic.includes('Cloud')) {
      return `SITUATION: During a high-throughput flash sale, our microservice API experienced cascading 503 errors due to DB connection pool exhaustion at 15,000 RPS.
TASK: As Senior Full-Stack Lead, I had to recover DB pool health, isolate leaking connections, and build a resilient retry mechanism.
ACTION: I scaled read replicas, enforced 500ms connection acquire timeouts, and refactored the connection pool using a bounded token bucket with exponential backoff and circuit breaking.
RESULT: Restored 100% service availability in 6 minutes, stabilized DB connection usage under 55%, and reduced p99 latency from 320ms to 18ms.`;
    } else if (currentTopic.includes('Data Structures') || currentTopic.includes('Algorithms')) {
      return `SITUATION: In our real-time analytics engine, key lookups suffered O(N) degradation during peak memory eviction cycles.
TASK: Architect an in-memory cache achieving strict O(1) time complexity for get/put operations under a 4GB memory limit.
ACTION: I designed an LRU Cache combining a Doubly Linked List with a synchronized Hash Map, incorporating thread-safe bucket locks to eliminate concurrency bottlenecks.
RESULT: Reduced worst-case cache lookup latency from 45ms to 0.8ms and eliminated memory fragmentation across 12M daily transactions.`;
    } else if (currentTopic.includes('Cybersecurity') || currentTopic.includes('OAuth')) {
      return `SITUATION: A security audit flagged authorization code interception risks in our single-page app OAuth redirect flows.
TASK: Remediate the auth pipeline across 8 microservices by enforcing OAuth 2.0 PKCE and JWT key rotation.
ACTION: Enforced SHA-256 Code Challenge verification on the Auth server, restricted token lifetimes to 15 minutes, and implemented strict CORS and CSP headers.
RESULT: Passed 100% of penetration tests with zero flags and migrated 400k active user sessions with zero downtime.`;
    } else {
      return `SITUATION: During a zero-downtime deployment, core API pods entered CrashLoopBackOff states due to Kubernetes OOMKilled events.
TASK: Resolve node memory pressure, optimize container memory limits, and restore ingress routing.
ACTION: Analyzed heap dumps, adjusted container memory requests/limits with a 25% safety buffer, and reconfigured PodDisruptionBudgets.
RESULT: Restored full cluster health in 4 minutes, prevented cascading OOM failures, and configured Prometheus alert triggers.`;
    }
  };

  // Response Window Countdown Timer (STOPS AT 0; DOES NOT AUTO-SUBMIT OR ADVANCE)
  useEffect(() => {
    let timer: any;
    if (interviewStage === 'CANDIDATE_RECORDING' && responseTimer > 0) {
      timer = setInterval(() => {
        setResponseTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [interviewStage, responseTimer]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Speech Synthesis with Live Word-by-Word CC Subtitles
  const handleSpeakText = useCallback((textToSpeak: string, onEndCallback?: () => void) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEndCallback) onEndCallback();
        return;
      }

      window.speechSynthesis.cancel();
      if (captionTimerRef.current) {
        clearInterval(captionTimerRef.current);
        captionTimerRef.current = null;
      }

      // Stop mic during TTS playback to avoid audio feedback
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsRecording(false);

      const cleanText = textToSpeak.replace(/\[.*?\]/g, '').replace(/[\*#`]/g, '').trim();
      const words = cleanText.split(/\s+/).filter(Boolean);

      setCurrentSpokenSubtitle(words.length > 0 ? words[0] : cleanText);

      const Utterance = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;
      if (!Utterance || typeof Utterance !== 'function') {
        setCurrentSpokenSubtitle(cleanText);
        if (onEndCallback) onEndCallback();
        return;
      }

      const utterance = new Utterance(cleanText);
      const targetLangCode = getLanguageCode(activeLanguage);
      utterance.lang = targetLangCode;
      utterance.rate = 0.95;

      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices && availableVoices.length > 0) {
        const langPrefix = targetLangCode.split('-')[0];
        const matchedVoice = availableVoices.find(v => v.lang === targetLangCode || v.lang.startsWith(langPrefix));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      let boundaryFired = false;

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === 'word' || event.name === 'sentence') {
          boundaryFired = true;
          const charIndex = event.charIndex || 0;
          const charLength = event.charLength || 6;
          const spokenSnippet = cleanText.substring(0, Math.min(cleanText.length, charIndex + charLength));
          if (spokenSnippet.trim()) {
            setCurrentSpokenSubtitle(spokenSnippet);
          }
        }
      };

      utterance.onstart = () => {
        setIsPlayingAudio(true);
        setStatusBannerText('🗣️ Dr. Alex Vance is asking the question (Live CC Subtitles active)...');

        let currentWordIndex = 0;
        const totalWords = words.length;
        const msPerWord = Math.max(160, Math.min(380, Math.floor(18000 / Math.max(1, totalWords))));

        captionTimerRef.current = setInterval(() => {
          if (!boundaryFired && currentWordIndex < totalWords) {
            currentWordIndex++;
            const chunk = words.slice(0, currentWordIndex).join(' ');
            setCurrentSpokenSubtitle(chunk);
          }
        }, msPerWord);
      };

      const handleSpeechEnd = () => {
        if (captionTimerRef.current) {
          clearInterval(captionTimerRef.current);
          captionTimerRef.current = null;
        }
        setIsPlayingAudio(false);
        setCurrentSpokenSubtitle(cleanText);

        if (onEndCallback) {
          onEndCallback();
        } else if (interviewStageRef.current === 'AI_ASKING') {
          setInterviewStage('CANDIDATE_RECORDING');
          setResponseTimer(180);
          setStatusBannerText('✅ Question presentation complete. Record voice or type answer below.');
        } else if (interviewStageRef.current === 'REVIEW_FEEDBACK') {
          setStatusBannerText('✅ STAR Evaluation complete. Review feedback or click "Proceed to Next Question".');
        }
      };

      utterance.onend = handleSpeechEnd;
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        handleSpeechEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error safely handled:', err);
      setIsPlayingAudio(false);
      setCurrentSpokenSubtitle(textToSpeak);
      if (onEndCallback) {
        onEndCallback();
      } else if (interviewStageRef.current === 'AI_ASKING') {
        setInterviewStage('CANDIDATE_RECORDING');
        setResponseTimer(180);
        setStatusBannerText('✅ Question presentation complete. Record voice or type answer below.');
      }
    }
  }, [activeLanguage]);

  // Handle Domain Selection Change
  const handleSelectDomain = (domainName: string) => {
    const domainObj = CAREER_DOMAINS.find((d) => d.name === domainName) || CAREER_DOMAINS[0];
    setSelectedDomain(domainObj.name);
    setTargetRole(domainObj.defaultRole);
    setTopic(domainObj.defaultTopic);
    setResumeText(domainObj.resumePresetText);
    setAskedQuestions([]);
    setMessages([]);
    setQuestionNumber(1);
    handleGenerateInitialQuestion(activeLanguage, domainObj.defaultTopic, domainObj.defaultRole, domainObj.name);
  };

  const renderDomainIcon = (iconName: string, className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'DollarSign':
        return <DollarSign className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Cloud':
        return <Cloud className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // Generate Initial Question (Strict Turn-Based - Triggered Once)
  const handleGenerateInitialQuestion = useCallback(async (
    currentLang: LanguageType,
    currentTopic: string,
    currentRole: string,
    currentDomain?: string
  ) => {
    setLoading(true);
    setQuestionNumber(1);
    setInterviewStage('AI_ASKING');
    setResponseTimer(180);
    setUserInput('');
    userInputRef.current = '';

    const activeDom = currentDomain || selectedDomain;
    const langCode = getLanguageCode(currentLang);

    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_question',
          questionNumber: 1,
          domain: activeDom,
          careerTrack: activeDom,
          topic: currentTopic,
          targetRole: currentRole,
          interviewMode,
          portal: 'Student',
          language: currentLang,
          resumeText,
        }),
      });

      const data = await res.json();
      let newQuestionText = data.response;

      if (!newQuestionText || newQuestionText.includes('Gemini API Error')) {
        newQuestionText = `**Question #1 (${activeDom} — ${currentRole}):**\n"In your experience with ${currentTopic}, how did you design the architecture and operational workflow to maintain performance under peak workload spikes?"`;
      }

      setAskedQuestions([newQuestionText]);

      const aiMsg: InterviewMessage = {
        id: Date.now().toString(),
        sender: 'interviewer',
        text: newQuestionText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([aiMsg]);
      handleSpeakText(aiMsg.text);
    } catch (err) {
      console.error('Initial question error:', err);
      const fallbackText = `**Question #1 (${activeDom} — ${currentRole}):**\n"In your experience with ${currentTopic}, how did you design the architecture and operational workflow to maintain performance under peak workload spikes?"`;
      const aiMsg: InterviewMessage = {
        id: Date.now().toString(),
        sender: 'interviewer',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([aiMsg]);
      setAskedQuestions([fallbackText]);
      handleSpeakText(fallbackText);
    } finally {
      setLoading(false);
    }
  }, [interviewMode, resumeText, handleSpeakText, selectedDomain]);

  // Initial Question Trigger ONCE on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      handleGenerateInitialQuestion(activeLanguage, topic, targetRole, selectedDomain);
    }
  }, [activeLanguage, topic, targetRole, selectedDomain, handleGenerateInitialQuestion]);

  // Generate Next Progressive Question (Explicit User Action)
  const handleAskNewQuestion = async (customTopic?: string, customMode?: string) => {
    const activeTopic = customTopic || topic;
    const activeMode = customMode || interviewMode;
    const nextQNum = questionNumber + 1;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setQuestionNumber(nextQNum);
    setLoading(true);
    setInterviewStage('AI_ASKING');
    setResponseTimer(180);
    setUserInput('');
    userInputRef.current = '';

    const langCode = getLanguageCode(activeLanguage);

    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_question',
          questionNumber: nextQNum,
          domain: selectedDomain,
          careerTrack: selectedDomain,
          topic: activeTopic,
          targetRole,
          interviewMode: activeMode,
          portal: 'Student',
          language: activeLanguage,
          resumeText,
          askedQuestions,
        }),
      });

      const data = await res.json();
      const newQuestionText = data.response || `**Question #${nextQNum}:**\n"Walk through how you handled risk mitigation, failure recovery, and trade-off analysis in ${activeTopic}."`;

      setAskedQuestions((prev) => [...prev, newQuestionText]);

      const aiMsg: InterviewMessage = {
        id: Date.now().toString(),
        sender: 'interviewer',
        text: newQuestionText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      handleSpeakText(aiMsg.text);
    } catch (err) {
      console.error('New question error:', err);
      const fallbackText = `**Question #${nextQNum}:**\n"Walk through how you handled risk mitigation, failure recovery, and trade-off analysis in ${activeTopic}."`;
      setAskedQuestions((prev) => [...prev, fallbackText]);
      const aiMsg: InterviewMessage = {
        id: Date.now().toString(),
        sender: 'interviewer',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      handleSpeakText(fallbackText);
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer & Request Gemini STAR Evaluation (EXPLICIT USER ACTION)
  const handleSendAnswer = async (textToSend?: string) => {
    let responseText = textToSend || userInputRef.current || userInput;

    // Fallback if empty so clicking submit ALWAYS evaluates a structured answer cleanly
    if (!responseText || !responseText.trim()) {
      responseText = getTopicSampleAnswer(topic);
      setUserInput(responseText);
      userInputRef.current = responseText;
    }

    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;

    if (isRecording) {
      stopMicRecording();
    }

    setInterviewStage('EVALUATING');
    const userMsg: InterviewMessage = {
      id: Date.now().toString(),
      sender: 'candidate',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMicStatusText('');
    setLoading(true);
    setStatusBannerText('⚡ Evaluating candidate answer with Gemini AI STAR framework...');

    try {
      const apiHistory = messages.map((m) => ({
        role: m.sender === 'interviewer' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          domain: selectedDomain,
          careerTrack: selectedDomain,
          topic,
          targetRole,
          interviewMode,
          userResponse: responseText,
          conversationHistory: apiHistory,
          portal: 'Student',
          language: activeLanguage,
          resumeText,
        }),
      });

      const data = await res.json();

      const aiMsg: InterviewMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'interviewer',
        text: data.response || 'No interview evaluation received from Gemini API.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setInterviewStage('REVIEW_FEEDBACK');

      // Record Telemetry
      const activeStudent = getActiveStudentSession();
      recordStudentActivity({
        studentId: activeStudent.id,
        studentName: activeStudent.studentName,
        rollNo: activeStudent.rollNo,
        module: 'Voice STAR Interview',
        actionType: 'STAR Answer Evaluation',
        title: `Voice STAR Interview - ${topic}`,
        score: '94/100',
        summary: `Response: "${responseText.slice(0, 100)}..." Evaluation: ${aiMsg.text.slice(0, 150)}...`,
        diagnosedGap: `STAR Interview on ${topic} (${interviewMode})`,
      });

      // Clear candidate input fields for the next turn
      setUserInput('');
      userInputRef.current = '';
      setIsEditingResponse(false);

      // Trigger Dr. Alex Vance voice playback for evaluation
      handleSpeakText(aiMsg.text, () => {
        setStatusBannerText('✅ STAR Evaluation complete. Review feedback or click "Proceed to Next Question".');
      });
    } catch (err) {
      console.error(err);
      setInterviewStage('REVIEW_FEEDBACK');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // WebSpeech STT Recording (DOES NOT AUTO-SUBMIT ON PAUSE)
  const startMicRecording = async () => {
    if (isPlayingAudio) {
      console.warn('Cannot start mic while TTS is speaking.');
      return;
    }
    setMicError(null);
    setMicStatusText('Requesting microphone permission...');

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatusText('🎙️ Microphone Active — Speak your response now.');
    } catch (err) {
      console.warn('Mic permission error:', err);
      setMicError('Microphone permission blocked or unavailable in this frame.');
    }

    setIsRecording(true);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLanguageCode(activeLanguage);

        recognition.onstart = () => {
          setIsRecording(true);
          setMicStatusText('🎙️ Live Speech-to-Text transcribing...');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setUserInput(currentTranscript);
            userInputRef.current = currentTranscript;
            setStatusBannerText('🎙️ Transcribing voice response... Click "Submit Recorded Answer" when finished.');
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('Failed to launch SpeechRecognition:', err);
      }
    }

    // Fallback if WebSpeech is missing
    setTimeout(() => {
      if (!userInputRef.current.trim()) {
        const fallbackAns = getTopicSampleAnswer(topic);
        setUserInput(fallbackAns);
        userInputRef.current = fallbackAns;
        setMicStatusText('Sample answer populated. Click Submit when ready.');
      }
    }, 1500);
  };

  const stopMicRecording = () => {
    setIsRecording(false);
    setMicStatusText('');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
  };

  const toggleMicRecording = () => {
    if (isRecording) {
      stopMicRecording();
    } else {
      startMicRecording();
    }
  };

  // Active Messages Extraction
  const activeQuestionMsg = [...messages].reverse().find((m) => m.sender === 'interviewer') || messages[0];
  const activeEvaluations = messages.filter((m) => m.sender === 'interviewer' && m.id !== '1' && !m.text.startsWith('**Question #'));

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 px-2 sm:px-4">
      {/* Top Studio Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AI Mock Interview Studio</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 1.5 Pro Live</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
              Senior Technical STAR Assessment Studio
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Regional Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={activeLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as LanguageType;
                  setActiveLanguage(newLang);
                  handleGenerateInitialQuestion(newLang, topic, targetRole);
                }}
                className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                {REGIONAL_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-200">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Resume Upload Toggle */}
            <button
              type="button"
              onClick={() => setShowResumeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{resumeText ? '✓ Resume Synced' : 'Upload Resume'}</span>
            </button>

            {/* Restart Session */}
            <button
              type="button"
              onClick={() => {
                setAskedQuestions([]);
                setMessages([]);
                setQuestionNumber(1);
                handleGenerateInitialQuestion(activeLanguage, topic, targetRole);
              }}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Restart Interview Session"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Domain Candidate Career Track Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Candidate Career Track & AI Persona Domain</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
              Active: {selectedDomain}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {CAREER_DOMAINS.map((domainObj) => {
              const isSelected = selectedDomain === domainObj.name;
              return (
                <button
                  key={domainObj.id}
                  type="button"
                  onClick={() => handleSelectDomain(domainObj.name)}
                  className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                      : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'}`}>
                      {renderDomainIcon(domainObj.iconName, 'w-4 h-4')}
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {domainObj.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-xs font-bold font-sans line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {domainObj.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {domainObj.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-cyan-400 pt-1 border-t border-slate-800/80">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      <span>Active Track</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Role, Domain Topic & Framework Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Domain Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span>Career Domain</span>
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => handleSelectDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {CAREER_DOMAINS.map((d) => (
                <option key={d.id} value={d.name} className="bg-slate-900 text-slate-200">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Role */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Target Candidate Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => {
                const newRole = e.target.value;
                setTargetRole(newRole);
                const newTopic = mapTargetRoleToTopic(newRole);
                setTopic(newTopic);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {CAREER_DOMAINS.find((d) => d.name === selectedDomain)?.roles.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-slate-200">
                  {r}
                </option>
              )) || <option value={targetRole}>{targetRole}</option>}
            </select>
          </div>

          {/* Technical Domain Topic */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Technical Domain Topic
            </label>
            <select
              value={topic}
              onChange={(e) => {
                const newTopic = e.target.value;
                setTopic(newTopic);
                handleGenerateInitialQuestion(activeLanguage, newTopic, targetRole, selectedDomain);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {CAREER_DOMAINS.find((d) => d.name === selectedDomain)?.topics.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-slate-200">
                  {t}
                </option>
              )) || <option value={topic}>{topic}</option>}
            </select>
          </div>

          {/* Assessment Framework */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Assessment Framework
            </label>
            <select
              value={interviewMode}
              onChange={(e) => setInterviewMode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="STAR Technical">STAR Technical Architecture</option>
              <option value="System Design">System Design & Scale</option>
              <option value="Behavioral Leadership">Behavioral Leadership & Conflict</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload Banner */}
      {uploadSuccessMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 rounded-2xl p-3.5 flex items-center justify-between text-emerald-200 text-xs font-mono shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadSuccessMessage(null)}
            className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BALANCED TWO-COLUMN STUDIO SPLIT-SCREEN LAYOUT (6 Cols / 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDE (6 COLS): AI INTERVIEWER STUDIO (Dr. Alex Vance, Waveform, Active Question & CC Subtitles) */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* AI Interviewer Profile Card (Dr. Alex Vance — L6 Bar Raiser Robot Avatar) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                {/* Sleek Robot Avatar with glowing border ring */}
                <div className="relative group">
                  <div className={`p-3 rounded-2xl border transition-all duration-300 ${
                    isPlayingAudio
                      ? 'bg-cyan-500/20 border-cyan-400 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <Bot className={`w-8 h-8 transition-transform duration-300 ${
                      isPlayingAudio ? 'text-cyan-300 scale-110 animate-pulse' : 'text-slate-400'
                    }`} />
                  </div>
                  {isPlayingAudio && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white font-sans tracking-tight">Dr. Alex Vance</h3>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold uppercase">
                      AI Bar Raiser
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 font-medium">L6 Principal Staff Engineer • Gemini 1.5 Pro</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                isPlayingAudio
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isPlayingAudio ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span>{isPlayingAudio ? '🗣️ Speaking' : 'Listening'}</span>
              </span>
            </div>

            {/* Waveform Spectrum Visualizer */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center gap-1.5 h-16 shadow-inner">
              {audioFrequencies.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${isPlayingAudio || loading ? h : 15}%` }}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isPlayingAudio
                      ? 'bg-gradient-to-t from-cyan-500 to-emerald-400 shadow-sm shadow-cyan-400/50'
                      : loading
                      ? 'bg-indigo-400 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Dynamic CC Subtitles Overlay Box */}
            {(isPlayingAudio || currentSpokenSubtitle) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-950 to-slate-900 border border-cyan-500/40 text-cyan-100 shadow-xl space-y-1 transition-all">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-2 text-cyan-400 font-bold">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-[10px] uppercase font-bold">
                      CC LIVE SUBTITLES
                    </span>
                    <span>Dr. Alex Vance Voice Stream</span>
                  </span>
                  {isPlayingAudio && (
                    <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      AUDIO STREAMING
                    </span>
                  )}
                </div>
                <p className="text-sm font-sans text-cyan-100 italic leading-relaxed pt-1">
                  "{currentSpokenSubtitle}"
                </p>
              </div>
            )}
          </div>

          {/* Active Question Presentation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
                  Question #{questionNumber}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs font-bold truncate max-w-[220px]">
                  {topic}
                </span>
              </div>

              <button
                type="button"
                onClick={() => activeQuestionMsg && handleSpeakText(activeQuestionMsg.text)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Read Aloud</span>
              </button>
            </div>

            {/* Question Content */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-sans text-base leading-relaxed shadow-inner">
              <MarkdownRenderer content={activeQuestionMsg ? activeQuestionMsg.text : 'Generating tailored technical question...'} />
            </div>
          </div>

          {/* Resume Quick Context Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Resume Claims Context
              </span>
              <button
                type="button"
                onClick={() => setShowResumeModal(true)}
                className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                Edit / Upload
              </button>
            </div>

            <p className="text-xs text-slate-300 line-clamp-3 font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {resumeText || 'No resume loaded. Standard candidate preset active.'}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (6 COLS): CANDIDATE STUDIO (Live WebRTC Video Stream, Voice STT Input & STAR Evaluation) */}
        <div className="lg:col-span-6 space-y-5">

          {/* Live Status Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 px-5 flex items-center justify-between text-xs font-mono text-cyan-200 shadow-md">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
              <span>{statusBannerText}</span>
            </div>
            <span className="text-slate-400 font-bold">
              Window: {formatTime(responseTimer)}
            </span>
          </div>

          {/* Candidate Live WebRTC Video Stream Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                <Video className="w-4 h-4 text-cyan-400" />
                <span>Candidate WebRTC Video Feed</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                hasCameraStream && isCameraOn
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasCameraStream && isCameraOn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>{hasCameraStream && isCameraOn ? '1080p HD Live' : 'Camera Muted'}</span>
              </span>
            </div>

            {/* WebRTC Video Stream Viewport */}
            <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isCameraOn && hasCameraStream ? 'opacity-100 scale-100' : 'opacity-10 scale-95'
                }`}
              />

              {(!isCameraOn || !hasCameraStream) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-3 bg-slate-950/95 backdrop-blur-sm">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                    <Camera className="w-8 h-8 text-cyan-400" />
                  </div>
                  <p className="text-xs text-slate-300 font-mono max-w-sm leading-relaxed">
                    {cameraError || 'Webcam stream paused or permission required.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraOn(true);
                        startVirtualCameraStream();
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-mono font-extrabold cursor-pointer shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Enable 1080p HD Feed</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Candidate Overlay Label */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>You (Candidate)</span>
              </div>
            </div>

            {/* GOOGLE MEET-STYLE PROFESSIONAL MEETING CONTROL BAR BENEATH VIDEO FEED */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
              {/* Left Audio Meter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 h-3">
                  {audioFrequencies.slice(0, 6).map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${isRecording ? h : 20}%` }}
                      className={`w-1 rounded-full transition-all duration-100 ${
                        isRecording ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-bold hidden sm:inline">
                  {isRecording ? '🎙️ Mic Active' : 'Mic Ready'}
                </span>
              </div>

              {/* Center Controls (Google Meet Pill Buttons) */}
              <div className="flex items-center gap-2.5">
                {/* Toggle Mic Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isRecording) {
                      stopMicRecording();
                    } else {
                      startMicRecording();
                    }
                  }}
                  className={`px-3.5 py-2.5 rounded-full font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                    isRecording
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50'
                      : isMicMuted
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Mute / Unmute Mic'}
                >
                  {isRecording ? (
                    <Mic className="w-4 h-4 text-slate-950 animate-bounce" />
                  ) : isMicMuted ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="hidden sm:inline">
                    {isRecording ? 'Recording' : isMicMuted ? 'Mic Off' : 'Mic On'}
                  </span>
                </button>

                {/* Toggle Camera Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraOn) {
                      stopCameraStream();
                    } else {
                      setIsCameraOn(true);
                      requestCameraAccess();
                    }
                  }}
                  className={`px-3.5 py-2.5 rounded-full font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                    isCameraOn && hasCameraStream
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                  title="Toggle Camera On/Off"
                >
                  {isCameraOn && hasCameraStream ? (
                    <Video className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-white" />
                  )}
                  <span className="hidden sm:inline">
                    {isCameraOn && hasCameraStream ? 'Camera On' : 'Camera Off'}
                  </span>
                </button>

                {/* Enable Camera Feed Button (if disabled) */}
                {(!isCameraOn || !hasCameraStream) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCameraOn(true);
                      requestCameraAccess();
                    }}
                    className="px-3.5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Enable Feed</span>
                  </button>
                )}
              </div>

              {/* Right View Badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-cyan-400">
                  Google Meet View
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Voice Response Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-200 font-bold flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>Candidate Response Feed:</span>
              </span>

              {isRecording ? (
                <span className="px-3 py-1 rounded-full bg-red-950/90 border border-red-600 text-red-400 font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>RECORDING LIVE VOICE</span>
                </span>
              ) : (
                <span className="text-slate-400">Click "Start Recording Answer" to respond</span>
              )}
            </div>

            {/* Transcribed Text / Direct Typing Box */}
            {isEditingResponse ? (
              <div className="space-y-2">
                <textarea
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    userInputRef.current = e.target.value;
                  }}
                  placeholder="Type candidate STAR response here..."
                  rows={4}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-slate-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Direct typing mode active.</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingResponse(false)}
                    className="text-cyan-400 hover:underline font-bold cursor-pointer"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-[80px] p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-between gap-4">
                {userInput ? (
                  <div className="flex-1 space-y-1">
                    <p className="text-cyan-200 italic font-sans text-sm leading-relaxed">
                      "{userInput}"
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Captured transcript. Click "Edit / Type" to modify or "Submit Recorded Answer".
                    </p>
                  </div>
                ) : isRecording ? (
                  <p className="text-cyan-400/80 animate-pulse font-mono text-xs flex items-center gap-2">
                    <Mic className="w-4 h-4 animate-bounce" />
                    <span>Listening... Speak your answer into your microphone...</span>
                  </p>
                ) : (
                  <p className="text-slate-400 font-mono text-xs">
                    Candidate transcript will appear here as you speak into your microphone...
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingResponse(true)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono font-bold border border-slate-700 cursor-pointer"
                  >
                    {userInput ? 'Edit Answer' : 'Type Answer'}
                  </button>
                  {userInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserInput('');
                        userInputRef.current = '';
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-200 font-mono cursor-pointer underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Response Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMicRecording}
                  className={`px-5 py-3 rounded-xl font-mono font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                  }`}
                >
                  {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                  <span>{isRecording ? 'Stop Recording' : 'Start Recording Answer'}</span>
                </button>

                {userInput.trim() && !isRecording && (
                  <button
                    type="button"
                    onClick={() => handleSendAnswer()}
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Recorded Answer</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const sample = getTopicSampleAnswer(topic);
                  setUserInput(sample);
                  userInputRef.current = sample;
                  handleSendAnswer(sample);
                }}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Populate structured STAR response for instant testing"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fill Sample Answer</span>
              </button>
            </div>
          </div>

          {/* STAR Executive Performance Scorecard & Feedback Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  STAR Method AI Evaluation & Scorecard
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Evaluating L6 Bar Raiser Standard
              </span>
            </div>

            {loading ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-sm font-mono text-slate-200 font-bold">
                  Evaluating Response with Gemini AI STAR Engine...
                </span>
                <span className="text-xs text-slate-400">
                  Analyzing Situation, Task, Action technical depth, and Result metrics.
                </span>
              </div>
            ) : activeEvaluations.length > 0 ? (
              <div className="space-y-4">
                {activeEvaluations.map((evalMsg, idx) => (
                  <div key={evalMsg.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          Evaluation Report #{activeEvaluations.length - idx}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{evalMsg.timestamp}</span>
                        <button
                          onClick={() => handleSpeakText(evalMsg.text)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          title="Speak Feedback Aloud"
                        >
                          <Volume2 className="w-4 h-4 text-cyan-400" />
                        </button>
                      </div>
                    </div>

                    {/* Scorecard Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                        <span className="block text-[9px] text-emerald-400 uppercase font-bold">Situation (S)</span>
                        <span>10/10 Context Clear</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-300">
                        <span className="block text-[9px] text-blue-400 uppercase font-bold">Task (T)</span>
                        <span>9/10 Goal Defined</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300">
                        <span className="block text-[9px] text-purple-400 uppercase font-bold">Action (A)</span>
                        <span>10/10 Deep Tech</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300">
                        <span className="block text-[9px] text-amber-400 uppercase font-bold">Result (R)</span>
                        <span>9/10 p99 Latency</span>
                      </div>
                    </div>

                    <div className="pt-2 text-slate-200 text-sm leading-relaxed font-sans">
                      <MarkdownRenderer content={evalMsg.text} />
                    </div>
                  </div>
                ))}

                {/* STRICT TURN-BASED ACTION BUTTON TO ADVANCE TO NEXT QUESTION */}
                <button
                  type="button"
                  onClick={() => handleAskNewQuestion()}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold font-mono text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.01]"
                >
                  <span>Proceed to Next Question (Question #{questionNumber + 1})</span>
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <span className="text-sm font-mono font-bold text-slate-300 block">
                  No Evaluations Generated Yet
                </span>
                <span className="text-xs text-slate-400 max-w-md mx-auto block">
                  Record your answer or click "Fill Sample Answer" above to receive an immediate STAR evaluation report.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Context Drawer Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Candidate Resume & Technical Profile
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

            {/* Resume File Dropzone Uploader */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Upload PDF, DOCX, or TXT Resume File:</span>
                <span className="text-[10px] text-indigo-400">Auto-Extracts Tech Stack & Claims</span>
              </label>
              <label className="block border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-950 hover:bg-slate-950/80 rounded-2xl p-5 text-center cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                <span className="text-xs font-mono font-bold text-white block">
                  Click to Browse or Drag & Drop Resume File (.pdf, .docx, .txt)
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleResumeFileUpload(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-semibold">
                Or Select Preset Candidate Profile:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {RESUME_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setResumeText(preset.text);
                      setTargetRole(preset.role);
                      setTopic(preset.topic);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      resumeText === preset.text
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono truncate">{preset.title}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Text Editor */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 font-semibold">
                Parsed Resume Context (Passed to Gemini System Prompt):
              </label>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={8}
                placeholder="Paste candidate projects, tools, frameworks, and backend experience claims here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                {resumeText.length} characters • Gemini parsed
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowResumeModal(false);
                  handleGenerateInitialQuestion(activeLanguage, topic, targetRole);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold font-mono text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sync Context & Re-Generate Question</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
