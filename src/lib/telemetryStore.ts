import { RiskTier } from '../types';

export interface StudentProfile {
  id: string;
  studentName: string;
  rollNo: string;
  email: string;
  targetRole: string;
  attendancePct: number;
  projectScore: number;
  avgQuizScore: number;
  keyLearningGap: string;
  lastActive: string;
  riskTier: RiskTier;
  activeModule: string;
}

export interface ActivitySubmission {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  timestamp: string;
  module: string;
  actionType: string;
  title: string;
  score?: number | string;
  summary: string;
  diagnosedGap?: string;
  details?: Record<string, any>;
}

export const INITIAL_STUDENT_PROFILES: StudentProfile[] = [
  {
    id: 'st-101',
    studentName: 'Jordan Smith',
    rollNo: '2022-CS-041',
    email: 'jordan.smith@eng.edu',
    targetRole: 'AI Cloud Architect',
    attendancePct: 96,
    projectScore: 94,
    avgQuizScore: 92,
    keyLearningGap: 'Mastered - Ready for Multi-Region Distributed Consensus',
    lastActive: 'Just now',
    riskTier: '[ON-TRACK]',
    activeModule: 'Voice STAR Interview',
  },
  {
    id: 'st-102',
    studentName: 'Rohan Sharma',
    rollNo: '2022-CS-012',
    email: 'rohan.s@eng.edu',
    targetRole: 'AI Systems Engineer',
    attendancePct: 72,
    projectScore: 61,
    avgQuizScore: 54,
    keyLearningGap: 'Concurrent State Mutation & Volatile Memory Hazards (Go/Java)',
    lastActive: '2 hours ago',
    riskTier: '[CRITICAL INTERVENTION]',
    activeModule: 'Vision Image Review',
  },
  {
    id: 'st-103',
    studentName: 'Ananya Verma',
    rollNo: '2022-CS-088',
    email: 'ananya.v@eng.edu',
    targetRole: 'Cybersecurity Lead',
    attendancePct: 68,
    projectScore: 55,
    avgQuizScore: 58,
    keyLearningGap: 'OAuth 2.0 PKCE Security Tokens & Code Challenge Verification',
    lastActive: '1 day ago',
    riskTier: '[CRITICAL INTERVENTION]',
    activeModule: 'Project Repo Grader',
  },
  {
    id: 'st-104',
    studentName: 'Karthik Raja',
    rollNo: '2022-CS-095',
    email: 'karthik.r@eng.edu',
    targetRole: 'Database Systems Architect',
    attendancePct: 84,
    projectScore: 78,
    avgQuizScore: 74,
    keyLearningGap: 'PostgreSQL B-Tree Index Fragmentation & Query Explain Execution',
    lastActive: '30 mins ago',
    riskTier: '[MODERATE SUPPORT]',
    activeModule: 'Spaced Retrieval Queue',
  },
  {
    id: 'st-105',
    studentName: 'Priya Sundaram',
    rollNo: '2022-CS-112',
    email: 'priya.s@eng.edu',
    targetRole: 'Full-Stack DevOps Lead',
    attendancePct: 99,
    projectScore: 95,
    avgQuizScore: 96,
    keyLearningGap: 'Mastered - Kubernetes Multi-Cluster Service Mesh Ingress',
    lastActive: '10 mins ago',
    riskTier: '[ON-TRACK]',
    activeModule: 'Engineering Task Board',
  },
];

export const INITIAL_SUBMISSIONS: ActivitySubmission[] = [
  {
    id: 'sub-1',
    studentId: 'st-101',
    studentName: 'Jordan Smith',
    rollNo: '2022-CS-041',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    module: 'Voice STAR Interview',
    actionType: 'STAR Answer Evaluation',
    title: 'Distributed Systems & Database Connection Pool Exhaustion',
    score: '94/100',
    summary: 'Explained circuit breaker patterns, bounded token buckets, and connection pooling under 10k RPS load spikes.',
    diagnosedGap: 'Demonstrates clear understanding of thread pools and rate limiters.',
  },
  {
    id: 'sub-2',
    studentId: 'st-101',
    studentName: 'Jordan Smith',
    rollNo: '2022-CS-041',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    module: 'Project Repo Grader',
    actionType: 'Async Code Review Submission',
    title: 'Cloud Microservices Architecture Repo',
    score: '94/100',
    summary: 'Static analysis passed 3/3 checks. Clean JWT validation, Redis rate-limiting middleware, and async error boundaries.',
    diagnosedGap: 'Passed all static checks with 100% test coverage.',
  },
  {
    id: 'sub-3',
    studentId: 'st-102',
    studentName: 'Rohan Sharma',
    rollNo: '2022-CS-012',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    module: 'Vision Image Review',
    actionType: 'Architecture Diagram Review',
    title: 'Cloud Distributed Cache SPOF Analysis',
    score: '61/100',
    summary: 'Detected single Redis node failure without replica sentinel clustering.',
    diagnosedGap: 'Concurrent State Mutation & Volatile Memory Hazards (Go/Java)',
  },
  {
    id: 'sub-4',
    studentId: 'st-103',
    studentName: 'Ananya Verma',
    rollNo: '2022-CS-088',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    module: 'Project Repo Grader',
    actionType: 'Security Code Submission',
    title: 'OAuth PKCE Gateway Microservice',
    score: '55/100',
    summary: 'Failed PKCE verifier validation check in static code review.',
    diagnosedGap: 'OAuth 2.0 PKCE Security Tokens & Code Challenge Verification',
  },
];

// Local Storage Helper Utilities
const LOCAL_STORAGE_SESSION_KEY = 'eduagent_active_student_session';
const LOCAL_STORAGE_STUDENTS_KEY = 'eduagent_all_students_profiles';
const LOCAL_STORAGE_SUBMISSIONS_KEY = 'eduagent_activity_submissions';

export function getActiveStudentSession(): StudentProfile {
  if (typeof window === 'undefined') return INITIAL_STUDENT_PROFILES[0];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Error reading student session:', e);
  }
  return INITIAL_STUDENT_PROFILES[0];
}

export function setActiveStudentSession(session: StudentProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
    // Trigger window event for cross-component re-renders
    window.dispatchEvent(new Event('eduagent_student_session_changed'));
  } catch (e) {
    console.warn('Error saving active session:', e);
  }
}

export function getAllStudentProfiles(): StudentProfile[] {
  if (typeof window === 'undefined') return INITIAL_STUDENT_PROFILES;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_STUDENTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Error reading all student profiles:', e);
  }
  return INITIAL_STUDENT_PROFILES;
}

export function saveAllStudentProfiles(profiles: StudentProfile[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_STUDENTS_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new Event('eduagent_students_data_updated'));
  } catch (e) {
    console.warn('Error saving student profiles:', e);
  }
}

export function getActivitySubmissions(studentId?: string): ActivitySubmission[] {
  if (typeof window === 'undefined') return INITIAL_SUBMISSIONS;
  let submissions = INITIAL_SUBMISSIONS;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY);
    if (stored) submissions = JSON.parse(stored);
  } catch (e) {
    console.warn('Error reading submissions:', e);
  }

  if (studentId) {
    return submissions.filter((s) => s.studentId === studentId);
  }
  return submissions;
}

export function recordStudentActivity(submission: Omit<ActivitySubmission, 'id' | 'timestamp'>) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newSub: ActivitySubmission = {
    ...submission,
    id: `sub-${Date.now()}`,
    timestamp,
  };

  if (typeof window !== 'undefined') {
    const allSubs = getActivitySubmissions();
    const updatedSubs = [newSub, ...allSubs];
    try {
      localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(updatedSubs));
    } catch (e) {
      console.warn('Error saving activity submission:', e);
    }

    // Also update student's profile telemetry
    const profiles = getAllStudentProfiles();
    const updatedProfiles = profiles.map((p) => {
      if (p.id === submission.studentId) {
        let newProjectScore = p.projectScore;
        if (typeof submission.score === 'number') {
          newProjectScore = submission.score;
        } else if (typeof submission.score === 'string' && submission.score.includes('/100')) {
          const parsed = parseInt(submission.score.split('/')[0]);
          if (!isNaN(parsed)) newProjectScore = parsed;
        }

        let newRiskTier: RiskTier = p.riskTier;
        if (newProjectScore < 70 || p.attendancePct < 75) {
          newRiskTier = '[CRITICAL INTERVENTION]';
        } else if (newProjectScore < 85) {
          newRiskTier = '[MODERATE SUPPORT]';
        } else {
          newRiskTier = '[ON-TRACK]';
        }

        return {
          ...p,
          lastActive: 'Just now',
          activeModule: submission.module,
          projectScore: newProjectScore,
          keyLearningGap: submission.diagnosedGap || p.keyLearningGap,
          riskTier: newRiskTier,
        };
      }
      return p;
    });

    saveAllStudentProfiles(updatedProfiles);

    // Sync with active session if currently selected
    const active = getActiveStudentSession();
    if (active.id === submission.studentId) {
      const updatedActive = updatedProfiles.find((p) => p.id === active.id);
      if (updatedActive) setActiveStudentSession(updatedActive);
    }

    // Send payload to backend asynchronously
    fetch('/api/telemetry/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub),
    }).catch((err) => console.warn('Backend telemetry sync warning:', err));

    window.dispatchEvent(new Event('eduagent_telemetry_activity_recorded'));
  }

  return newSub;
}
