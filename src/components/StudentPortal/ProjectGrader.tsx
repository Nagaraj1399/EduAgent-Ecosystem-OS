import React, { useState } from 'react';
import { LanguageType, ProjectEvaluation } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getActiveStudentSession, recordStudentActivity } from '../../lib/telemetryStore';
import {
  Code2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Zap,
  Lock,
  Gauge,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface Props {
  language: LanguageType;
  onSetModality: (modality: 'Text') => void;
}

const PRESET_SAMPLES = [
  {
    id: 'vulnerable',
    name: 'Sample 1: Vulnerable Legacy Gateway',
    description: 'Callback hell, uncaught Redis errors, unverified string equality auth check, no rate limiting.',
    title: 'Distributed Cloud Microservices Gateway',
    repoOverview: 'Express API gateway handling external microservices routing without rate limiting or token signatures.',
    code: `// Express API Gateway Route Handler (Vulnerable)
import express from 'express';
import redis from 'redis';

const app = express();
const client = redis.createClient();

app.get('/api/v1/resource', async (req, res) => {
  const token = req.headers['authorization'];
  
  // INSECURE: Plain string equality instead of cryptographic JWT verification!
  if (token === 'Bearer my-secret-admin-token') {
    // VULNERABLE: Legacy callback without error boundary causing unhandled rejections!
    client.get('cache_key', (err, data) => {
      if (data) {
        return res.json(JSON.parse(data));
      } else {
        // Missing rate-limiting middleware and slow DB bottleneck
        setTimeout(() => {
          const payload = { status: 'success', data: 'unprotected payload' };
          client.set('cache_key', JSON.stringify(payload));
          res.json(payload);
        }, 500);
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});`,
  },
  {
    id: 'partial',
    name: 'Sample 2: Naive In-Memory Counter',
    description: 'Async/await without try-catch, unverified jwt.decode(), in-memory request counter.',
    title: 'User Analytics Ingestion Service',
    repoOverview: 'Node.js service storing high-frequency event streams with naive in-memory rate limiting.',
    code: `// User Analytics Ingestion API
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
let requestCounter = 0; // Naive in-memory counter (fails across pods!)

app.post('/api/v2/telemetry', async (req, res) => {
  // NAIVE RATE LIMIT: In-memory counter easily bypassed by concurrent load
  requestCounter++;
  if (requestCounter > 100) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  // INSECURE: jwt.decode() reads claims WITHOUT verifying signature against public key!
  const decoded = jwt.decode(token);
  
  // VULNERABLE: Uncaught async database query without try/catch
  const result = await db.query('INSERT INTO telemetry VALUES ($1)', [decoded.userId]);
  res.json({ status: 'ingested', id: result.id });
});`,
  },
  {
    id: 'hardened',
    name: 'Sample 3: Production Hardened API',
    description: 'Async try-catch boundaries, RS256 jose.jwtVerify(), Redis sliding-window ZSET rate limiting.',
    title: 'Hardened Zero-Trust Microservice Gateway',
    repoOverview: 'Production-ready Express & TypeScript API gateway with sliding window rate limiting and JWKS verification.',
    code: `// Production-Grade Hardened Express Route Handler
import express, { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import Redis from 'ioredis';

const app = express();
const redis = new Redis(process.env.REDIS_URL);
const JWKS = createRemoteJWKSet(new URL('https://auth.enterprise.io/.well-known/jwks.json'));

// 1. Redis Sliding-Window Rate Limiting Middleware (Token Bucket / ZSET)
async function slidingWindowRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = req.ip || 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = 100; // 100 req/min

    const key = \`rate_limit:\${ip}\`;
    const clearBefore = now - windowMs;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, clearBefore);
    pipeline.zadd(key, now, \`\${now}-\${Math.random()}\`);
    pipeline.zcard(key);
    pipeline.expire(key, 60);

    const results = await pipeline.exec();
    const requestCount = results?.[2]?.[1] as number;

    if (requestCount > limit) {
      return res.status(429).json({ error: 'Too Many Requests - Sliding Window Exceeded' });
    }
    next();
  } catch (err) {
    next(err); // Safe error propagation
  }
}

// 2. Route with Cryptographic Token Verification & Async Error Boundaries
app.get('/api/v3/secure-resource', slidingWindowRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const token = authHeader.split(' ')[1];
    
    // Cryptographic RS256 signature verification via JWKS
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://auth.enterprise.io/',
      audience: 'api.enterprise.io',
    });

    const data = await redis.get(\`user_cache:\${payload.sub}\`);
    res.json({ success: true, user: payload.sub, cachedData: data });
  } catch (err) {
    next(err); // Route error sent to global error middleware
  }
});

// 3. Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[CRITICAL_API_ERROR]', err.stack);
  res.status(500).json({ error: 'Internal Server Error', traceId: req.headers['x-request-id'] });
});`,
  },
];

export const ProjectGrader: React.FC<Props> = ({ language, onSetModality }) => {
  const { t } = useLanguage();
  const [projectTitle, setProjectTitle] = useState<string>(PRESET_SAMPLES[0].title);
  const [repoDescription, setRepoDescription] = useState<string>(PRESET_SAMPLES[0].repoOverview);
  const [codeSnippet, setCodeSnippet] = useState<string>(PRESET_SAMPLES[0].code);

  const [loading, setLoading] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<ProjectEvaluation | null>({
    overallScore: 60,
    scores: {
      innovation: 22,
      technicalExecution: 12,
      utility: 15,
      documentation: 21,
    },
    staticChecks: [
      {
        id: 'asyncErrors',
        title: 'Async Error Handling & Rejection Safeguards',
        status: 'Failed',
        details: 'Vulnerable to unhandled promise rejections or uncaught callback errors in route handlers.',
      },
      {
        id: 'jwtVerification',
        title: 'Cryptographic JWT/OAuth Token Verification',
        status: 'Failed',
        details: 'Uses insecure string equality or unverified token decode instead of cryptographic signature verification.',
      },
      {
        id: 'rateLimiting',
        title: 'Sliding-Window / Token-Bucket Rate Limiting',
        status: 'Failed',
        details: 'Missing Redis sliding-window / token-bucket rate limiting to mitigate DDoS and burst traffic.',
      },
    ],
    summary: 'Identified 3 major architectural gaps in async error propagation, cryptographic token verification, and rate limiting.',
    conceptualRootCauses: [
      'Uncaught async operations or legacy callbacks leading to unhandled promise rejections under load.',
      'Insecure token check using plain string matching or unverified payload decode instead of cryptographic RS256/HS256 verification.',
      'Absence of Redis-backed sliding-window or token-bucket rate limiting middleware exposing endpoints to DDoS traffic surges.',
    ],
    remediationPlan: [
      'Step 1: Wrap all async route handlers with try/catch boundaries or express-async-errors middleware to ensure clean 500 error responses.',
      'Step 2: Replace placeholder string equality with jsonwebtoken / jose library verifying signatures against a public JWKS key set.',
      'Step 3: Implement Redis sliding-window ZSET rate limiting (e.g. 100 req/min per IP) to absorb burst traffic.',
    ],
  });

  React.useEffect(() => {
    onSetModality('Text');
  }, [onSetModality]);

  const handleSelectPreset = (sample: (typeof PRESET_SAMPLES)[0]) => {
    setProjectTitle(sample.title);
    setRepoDescription(sample.repoOverview);
    setCodeSnippet(sample.code);
  };

  const handleGradeProject = async () => {
    setLoading(true);
    setEvaluation(null);

    try {
      const res = await fetch('/api/ai/project-grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          repoDescription,
          codeSnippet,
          portal: 'Student',
          language,
        }),
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        const activeStudent = getActiveStudentSession();
        recordStudentActivity({
          studentId: activeStudent.id,
          studentName: activeStudent.studentName,
          rollNo: activeStudent.rollNo,
          module: 'Project Repo Grader',
          actionType: 'Async Code Review Submission',
          title: projectTitle || 'Code Review Evaluation',
          score: `${data.evaluation.overallScore}/100`,
          summary: data.evaluation.summary || 'Project repository graded by static analysis engine.',
          diagnosedGap: data.evaluation.conceptualRootCauses?.[0] || 'Static analysis checks evaluated',
        });
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
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono">{t('graderTitle', 'Unstructured Repo & Static Analysis Assessor')}</h2>
            <p className="text-sm text-slate-400">
              {t('graderSubtitle', 'Performs deep static code analysis for async error boundaries, cryptographic JWT/OAuth verification, and Redis token bucket rate limiting alongside 4-Dimension scoring.')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Code / Repo Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{t('loadCodeSamplePresets', 'Load Code Sample Presets')}</span>
              <span className="text-[10px] text-indigo-400 font-mono">Static Analysis Benchmarks</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectPreset(s)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs group"
                >
                  <span className="font-bold text-indigo-300 block group-hover:text-white font-mono truncate">
                    {t(s.name, s.name.split(':')[0])}
                  </span>
                  <span className="text-[10px] text-slate-400 block line-clamp-2 mt-0.5">
                    {t(s.description, s.description)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t('projectTitle', 'Project Title')}
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t('repoOverviewLabel', 'Repository & Architecture Overview')}
            </label>
            <textarea
              value={repoDescription}
              onChange={(e) => setRepoDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{t('sourceCodeLabel', 'Code Snippet / Manifest File')}</span>
              <span className="text-[10px] text-indigo-400 font-mono">TypeScript / Express</span>
            </label>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              rows={10}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          <button
            onClick={handleGradeProject}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all font-mono text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('evaluatingRepo', 'Running Static Analysis & 4-Dimension Rubric...')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('btnRunGrader', 'Run Static Code Audit & Grade Repo')}</span>
              </>
            )}
          </button>
        </div>

        {/* Evaluation Output */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-3 mb-4 font-mono">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>{t('projectEvalStaticAudit', 'Project Evaluation & Static Audit')}</span>
              </span>
              {evaluation && (
                <span className={`text-base font-extrabold px-3 py-1 rounded-lg border ${
                  evaluation.overallScore >= 80
                    ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60'
                    : evaluation.overallScore >= 65
                    ? 'text-amber-400 bg-amber-950/80 border-amber-800/60'
                    : 'text-red-400 bg-red-950/80 border-red-800/60'
                }`}>
                  {evaluation.overallScore} / 100
                </span>
              )}
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-sm font-mono">{t('runningStaticAnalysis', 'Running Compiler Static Analysis & Rubric Evaluation...')}</p>
              </div>
            ) : evaluation ? (
              <div className="space-y-5">
                {/* Static Analysis Audit Badges */}
                {evaluation.staticChecks && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span>{t('staticAnalysisCompilerChecks', 'Static Analysis Compiler Checks')}</span>
                    </h4>
                    <div className="space-y-2">
                      {evaluation.staticChecks.map((check) => (
                        <div
                          key={check.id}
                          className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5"
                        >
                          {check.id === 'asyncErrors' && <Zap className={`w-4 h-4 mt-0.5 flex-shrink-0 ${check.status === 'Passed' ? 'text-emerald-400' : 'text-red-400'}`} />}
                          {check.id === 'jwtVerification' && <Lock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${check.status === 'Passed' ? 'text-emerald-400' : 'text-red-400'}`} />}
                          {check.id === 'rateLimiting' && <Gauge className={`w-4 h-4 mt-0.5 flex-shrink-0 ${check.status === 'Passed' ? 'text-emerald-400' : 'text-red-400'}`} />}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-200 font-mono">
                                {t(check.title, check.title)}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  check.status === 'Passed'
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                    : check.status === 'Failed'
                                    ? 'bg-red-950 text-red-400 border-red-800'
                                    : 'bg-amber-950 text-amber-400 border-amber-800'
                                }`}
                              >
                                {t(check.status, check.status)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                              {t(check.details, check.details)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4 Dimension Progress Bars */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Innovation (25%)</span>
                      <span className="text-indigo-400 font-mono">{evaluation.scores.innovation}/25</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(evaluation.scores.innovation / 25) * 100}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Tech Execution (25%)</span>
                      <span className="text-cyan-400 font-mono">{evaluation.scores.technicalExecution}/25</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(evaluation.scores.technicalExecution / 25) * 100}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Utility & Scalability (25%)</span>
                      <span className="text-emerald-400 font-mono">{evaluation.scores.utility}/25</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(evaluation.scores.utility / 25) * 100}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Documentation (25%)</span>
                      <span className="text-amber-400 font-mono">{evaluation.scores.documentation}/25</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(evaluation.scores.documentation / 25) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Conceptual Root Causes */}
                <div className="bg-slate-950 p-4 rounded-xl border border-red-950/60 bg-red-950/10">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t('conceptualRootCauseDiagnostic', 'Conceptual Root Cause Diagnostic')}</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {evaluation.conceptualRootCauses.map((cause, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3-Step Remediation Plan */}
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-950/60 bg-emerald-950/10">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('seniorRemediationPlan', '3-Step Senior Remediation Plan')}</span>
                  </h4>
                  <ul className="space-y-2">
                    {evaluation.remediationPlan.map((step, idx) => (
                      <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 font-mono">
                        <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

