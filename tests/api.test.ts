import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../src/server/db';
import { authMiddleware, AuthenticatedRequest, generateMockToken } from '../src/server/auth';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', authMiddleware);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/db/health', (req, res) => {
    const dbStatus = db.getHealthStatus();
    res.json({ database: dbStatus, timestamp: new Date().toISOString() });
  });

  app.get('/api/auth/verify', (req: AuthenticatedRequest, res) => {
    res.json({ authenticated: true, user: req.user });
  });

  app.post('/api/auth/token', (req, res) => {
    const { role = 'Student' } = req.body;
    const token = generateMockToken(role as any);
    res.json({ role, token, authorizationHeader: `Bearer ${token}` });
  });

  app.get('/api/telemetry/students', async (req, res) => {
    const students = await db.getStudents();
    res.json({ students });
  });

  app.get('/api/telemetry/student/:studentId', async (req, res) => {
    const { studentId } = req.params;
    const student = await db.getStudentById(studentId);
    const submissions = await db.getActivitySubmissions(studentId);
    res.json({ student, submissions });
  });

  app.post('/api/telemetry/activity', async (req, res) => {
    const activity = req.body;
    const submission = await db.addActivitySubmission(activity);
    const updatedStudents = await db.getStudents();
    res.json({ success: true, submission, updatedStudents });
  });

  return app;
}

describe('API Endpoints & Integration Tests', () => {
  const app = createTestApp();
  const teacherToken = generateMockToken('Teacher');
  const studentToken = generateMockToken('Student');

  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/db/health should return database connection pool metrics', async () => {
    const res = await request(app)
      .get('/api/db/health')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('database');
    expect(res.body.database.status).toBe('connected');
    expect(res.body.database.maxPoolSize).toBe(20);
  });

  it('GET /api/auth/verify should return current authenticated user context', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.user.role).toBe('Teacher');
  });

  it('POST /api/auth/token should generate a new bearer token', async () => {
    const res = await request(app)
      .post('/api/auth/token')
      .send({ role: 'Student' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('Student');
    expect(res.body).toHaveProperty('token');
    expect(res.body.authorizationHeader).toContain('Bearer ');
  });

  it('GET /api/telemetry/students should return list of students', async () => {
    const res = await request(app)
      .get('/api/telemetry/students')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('students');
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(res.body.students.length).toBeGreaterThan(0);
  });

  it('GET /api/telemetry/student/:studentId should return student details and submissions', async () => {
    const res = await request(app)
      .get('/api/telemetry/student/st-101')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('student');
    expect(res.body).toHaveProperty('submissions');
    expect(res.body.student.id).toBe('st-101');
  });

  it('POST /api/telemetry/activity should record activity submission and update store', async () => {
    const res = await request(app)
      .post('/api/telemetry/activity')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'st-101',
        studentName: 'Jordan Smith',
        rollNo: '2022-CS-041',
        module: 'Voice STAR Interview',
        actionType: 'Practice Test',
        title: 'Microservices Communication',
        score: '92/100',
        summary: 'Excellent explanation of gRPC and proto files.',
        diagnosedGap: 'Mastered gRPC Protocol Buffers',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('submission');
    expect(res.body.submission.studentId).toBe('st-101');
  });
});
