/**
 * Database Connection Stub & Mock Persistence Engine for EduAgent OS
 *
 * This module provides a resilient simulated database pool layer with query logging,
 * transaction safety, state persistence, connection metrics, and health diagnostics.
 */

export interface DBQueryOptions {
  timeoutMs?: number;
  useCache?: boolean;
}

export interface DBQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  executionTimeMs: number;
  cached: boolean;
}

export interface DatabaseHealthStatus {
  status: 'connected' | 'degraded' | 'disconnected';
  activeConnections: number;
  idleConnections: number;
  maxPoolSize: number;
  totalQueriesExecuted: number;
  uptimeSeconds: number;
  lastPingMs: number;
}

export interface DBStudentRecord {
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
  riskTier: string;
  activeModule: string;
  updatedAt: string;
}

export interface DBActivitySubmission {
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
  createdAt: string;
}

/**
 * Mock Persistent Database Connection Pool Class
 */
export class DatabasePool {
  private isConnected: boolean = true;
  private maxPoolSize: number = 20;
  private activeConnections: number = 2;
  private idleConnections: number = 18;
  private totalQueriesExecuted: number = 0;
  private startTime: number = Date.now();

  private studentsStore: Map<string, DBStudentRecord> = new Map();
  private activityStore: DBActivitySubmission[] = [];

  constructor() {
    this.seedInitialData();
  }

  /**
   * Seeds default mock persistent records for EduAgent OS telemetry.
   */
  private seedInitialData(): void {
    const initialStudents: DBStudentRecord[] = [
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      },
    ];

    initialStudents.forEach((st) => this.studentsStore.set(st.id, st));

    this.activityStore = [
      {
        id: 'sub-1',
        studentId: 'st-101',
        studentName: 'Jordan Smith',
        rollNo: '2022-CS-041',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        module: 'Voice STAR Interview',
        actionType: 'STAR Answer Evaluation',
        title: 'Distributed Systems & Database Connection Pool Exhaustion',
        score: '94/100',
        summary: 'Explained circuit breaker patterns, bounded token buckets, and connection pooling under 10k RPS load spikes.',
        diagnosedGap: 'Demonstrates clear understanding of thread pools and rate limiters.',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Simulates executing a database query with connection pooling & telemetry metrics.
   *
   * @param sql Raw or parameterized SQL string
   * @param params Query parameters
   * @returns DBQueryResult containing rows, rowCount, and execution latency
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<DBQueryResult<T>> {
    const start = performance.now();
    this.totalQueriesExecuted++;

    // Simulate minor connection pool checkout latency
    await new Promise((res) => setTimeout(res, 2));

    const end = performance.now();
    return {
      rows: [] as T[],
      rowCount: 0,
      executionTimeMs: parseFloat((end - start).toFixed(2)),
      cached: false,
    };
  }

  /**
   * Retrieves all student records from mock persistent database store.
   */
  public async getStudents(): Promise<DBStudentRecord[]> {
    this.totalQueriesExecuted++;
    return Array.from(this.studentsStore.values());
  }

  /**
   * Retrieves a single student record by student ID.
   *
   * @param studentId Student unique ID
   */
  public async getStudentById(studentId: string): Promise<DBStudentRecord | null> {
    this.totalQueriesExecuted++;
    return this.studentsStore.get(studentId) || null;
  }

  /**
   * Upserts/updates student record in mock persistence database.
   *
   * @param student Data to insert or update
   */
  public async upsertStudent(student: Partial<DBStudentRecord> & { id: string }): Promise<DBStudentRecord> {
    this.totalQueriesExecuted++;
    const existing = this.studentsStore.get(student.id);
    const updated: DBStudentRecord = {
      id: student.id,
      studentName: student.studentName || existing?.studentName || 'Student',
      rollNo: student.rollNo || existing?.rollNo || '2022-CS-000',
      email: student.email || existing?.email || 'student@eng.edu',
      targetRole: student.targetRole || existing?.targetRole || 'Software Engineer',
      attendancePct: student.attendancePct ?? existing?.attendancePct ?? 90,
      projectScore: student.projectScore ?? existing?.projectScore ?? 80,
      avgQuizScore: student.avgQuizScore ?? existing?.avgQuizScore ?? 80,
      keyLearningGap: student.keyLearningGap || existing?.keyLearningGap || 'None',
      lastActive: student.lastActive || 'Just now',
      riskTier: student.riskTier || existing?.riskTier || '[ON-TRACK]',
      activeModule: student.activeModule || existing?.activeModule || 'General',
      updatedAt: new Date().toISOString(),
    };

    this.studentsStore.set(student.id, updated);
    return updated;
  }

  /**
   * Appends an activity submission to the database store.
   *
   * @param submission Activity record
   */
  public async addActivitySubmission(submission: Omit<DBActivitySubmission, 'id' | 'createdAt'>): Promise<DBActivitySubmission> {
    this.totalQueriesExecuted++;
    const record: DBActivitySubmission = {
      ...submission,
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.activityStore.unshift(record);

    // Update corresponding student profile
    const student = await this.getStudentById(submission.studentId);
    if (student) {
      let scoreNum = student.projectScore;
      if (typeof submission.score === 'number') {
        scoreNum = submission.score;
      } else if (typeof submission.score === 'string' && submission.score.includes('/100')) {
        const parsed = parseInt(submission.score.split('/')[0]);
        if (!isNaN(parsed)) scoreNum = parsed;
      }

      let riskTier = student.riskTier;
      if (scoreNum < 70 || student.attendancePct < 75) {
        riskTier = '[CRITICAL INTERVENTION]';
      } else if (scoreNum < 85) {
        riskTier = '[MODERATE SUPPORT]';
      } else {
        riskTier = '[ON-TRACK]';
      }

      await this.upsertStudent({
        id: student.id,
        projectScore: scoreNum,
        lastActive: 'Just now',
        activeModule: submission.module,
        keyLearningGap: submission.diagnosedGap || student.keyLearningGap,
        riskTier,
      });
    }

    return record;
  }

  /**
   * Retrieves activity submissions, optionally filtered by studentId.
   *
   * @param studentId Filter student ID
   */
  public async getActivitySubmissions(studentId?: string): Promise<DBActivitySubmission[]> {
    this.totalQueriesExecuted++;
    if (studentId) {
      return this.activityStore.filter((sub) => sub.studentId === studentId);
    }
    return this.activityStore;
  }

  /**
   * Returns current connection pool health statistics.
   */
  public getHealthStatus(): DatabaseHealthStatus {
    return {
      status: this.isConnected ? 'connected' : 'disconnected',
      activeConnections: this.activeConnections,
      idleConnections: this.idleConnections,
      maxPoolSize: this.maxPoolSize,
      totalQueriesExecuted: this.totalQueriesExecuted,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      lastPingMs: 1.2,
    };
  }

  /**
   * Executes a database transaction closure securely.
   *
   * @param callback Async transaction function
   */
  public async transaction<T>(callback: (db: DatabasePool) => Promise<T>): Promise<T> {
    try {
      return await callback(this);
    } catch (err) {
      console.error('Database transaction rollback:', err);
      throw err;
    }
  }
}

// Global Singleton Instance
export const db = new DatabasePool();
