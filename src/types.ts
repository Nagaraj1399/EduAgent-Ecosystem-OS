export type PortalType = 'Student' | 'Teacher' | 'Parent';

export type LanguageType =
  | 'English'
  | 'Tamil'
  | 'Hindi'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Marathi'
  | 'Gujarati'
  | 'Bengali'
  | 'Punjabi'
  | 'Odia';

export type FeatureModality = 'Vision Image' | 'Voice Audio' | 'Text';

export interface UserProfile {
  name: string;
  email: string;
  role: PortalType;
  title: string;
  avatar: string;
}

export interface RoutingHeaderState {
  portal: PortalType;
  feature: FeatureModality;
  language: LanguageType;
}

export interface VisionQAResponse {
  routingHeader: string;
  response: string;
}

export interface InterviewMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
  audioUrl?: string;
}

export interface StaticAnalysisCheck {
  id: 'asyncErrors' | 'jwtVerification' | 'rateLimiting';
  title: string;
  status: 'Passed' | 'Failed' | 'Warning';
  details: string;
}

export interface ProjectEvaluation {
  overallScore: number;
  scores: {
    innovation: number;
    technicalExecution: number;
    utility: number;
    documentation: number;
  };
  staticChecks?: StaticAnalysisCheck[];
  summary: string;
  conceptualRootCauses: string[];
  remediationPlan: string[];
}

export interface SpacedRetrievalCard {
  id: string;
  topic: string;
  concept: string;
  question: string;
  answer: string;
  intervalDay: 1 | 7 | 21 | 60;
  lastReviewed: string;
  nextReviewDate: string;
  status: 'Mastered' | 'Review Due' | 'In Progress';
}

export interface SkillGapData {
  targetRole: string;
  readinessScore: number;
  masteredSkills: string[];
  gapSkills: string[];
  actionPlan: string[];
}

export type RiskTier = '[CRITICAL INTERVENTION]' | '[MODERATE SUPPORT]' | '[ON-TRACK]';

export interface StudentTelemetry {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  riskTier: RiskTier;
  attendancePct: number;
  avgQuizScore: number;
  projectScore: number;
  keyLearningGap: string;
  lastActive: string;
  spacedIntervalDue: number;
  targetRole: string;
}

export interface TeacherInterventionPlan {
  studentId: string;
  studentName: string;
  riskTier: RiskTier;
  bigQueryQuery: string;
  diagnosticCause: string;
  remediationSteps: string[];
}
