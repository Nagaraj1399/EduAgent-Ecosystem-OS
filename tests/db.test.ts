import { describe, it, expect, beforeEach } from 'vitest';
import { DatabasePool } from '../src/server/db';

describe('DatabasePool Mock Persistence Layer', () => {
  let db: DatabasePool;

  beforeEach(() => {
    db = new DatabasePool();
  });

  it('should return initial health status metrics', () => {
    const health = db.getHealthStatus();
    expect(health.status).toBe('connected');
    expect(health.maxPoolSize).toBe(20);
    expect(health.activeConnections).toBeGreaterThanOrEqual(1);
  });

  it('should retrieve student profiles from mock store', async () => {
    const students = await db.getStudents();
    expect(Array.isArray(students)).toBe(true);
    expect(students.length).toBeGreaterThan(0);
    expect(students[0]).toHaveProperty('id');
    expect(students[0]).toHaveProperty('studentName');
    expect(students[0]).toHaveProperty('riskTier');
  });

  it('should retrieve student by ID correctly', async () => {
    const student = await db.getStudentById('st-101');
    expect(student).toBeDefined();
    expect(student?.studentName).toBe('Jordan Smith');
  });

  it('should record activity submission and update student risk tier', async () => {
    const submissionPayload = {
      studentId: 'st-101',
      studentName: 'Jordan Smith',
      rollNo: '2022-CS-041',
      timestamp: '10:00 AM',
      module: 'Project Repo Grader',
      actionType: 'Repo Audit',
      title: 'Async Error Boundaries & OAuth PKCE',
      score: 65,
      summary: 'Low score due to unhandled promise rejections.',
      diagnosedGap: 'Async Error Handling',
    };

    const createdSub = await db.addActivitySubmission(submissionPayload);
    expect(createdSub).toHaveProperty('id');
    expect(createdSub.studentId).toBe('st-101');

    const updatedStudent = await db.getStudentById('st-101');
    expect(updatedStudent?.projectScore).toBe(65);
    expect(updatedStudent?.riskTier).toBe('[CRITICAL INTERVENTION]');
  });

  it('should log query execution metrics', async () => {
    const result = await db.query('SELECT * FROM telemetry_students WHERE risk_tier = $1', [
      '[CRITICAL INTERVENTION]',
    ]);
    expect(result.rowCount).toBeGreaterThanOrEqual(0);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);

    const health = db.getHealthStatus();
    expect(health.totalQueriesExecuted).toBeGreaterThan(0);
  });
});
