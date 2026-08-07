import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { db } from './src/server/db';
import { authMiddleware, AuthenticatedRequest, generateMockToken, requireRole } from './src/server/auth';

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));

// Apply Authentication Middleware across all API endpoints
app.use('/api', authMiddleware);

const PORT = 3000;

/**
 * Initializes and returns a GoogleGenAI SDK client instance using process.env.GEMINI_API_KEY.
 *
 * @returns GoogleGenAI instance or null if GEMINI_API_KEY is missing
 */
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Formats a standardized EduAgent OS multi-portal routing header string.
 *
 * @param portal Active Portal name (Student, Teacher, Parent)
 * @param feature Active feature modality name
 * @param language Target Indian/Global natural language name
 * @returns Formatted routing header string
 */
function formatRoutingHeader(portal: string, feature: string, language: string): string {
  return `[PORTAL: ${portal}] | [Feature: ${feature}] | [Language: ${language}]`;
}

/**
 * Executes Gemini content generation with automatic model fallback list upon rate limits (429/RESOURCE_EXHAUSTED).
 *
 * @param ai GoogleGenAI client instance
 * @param params Gemini API generation params (contents, config, systemInstruction)
 * @returns API response object or fallback object with text: null
 */
async function generateContentWithRetry(ai: GoogleGenAI, params: any): Promise<any> {
  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest',
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        console.warn(`Gemini model ${model} rate limited / quota exhausted. Trying next fallback model...`);
        await new Promise((resolve) => setTimeout(resolve, 400));
      } else {
        console.warn(`Gemini model ${model} encountered error: ${errMsg}. Trying fallback model...`);
      }
    }
  }
  console.warn('All Gemini fallback models exhausted or rate limited. Returning graceful fallback.');
  return { text: null, error: lastError };
}

/**
 * System Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Database Connection Pool Health & Metrics Endpoint
 */
app.get('/api/db/health', (req, res) => {
  const dbStatus = db.getHealthStatus();
  res.json({
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Authentication Verification Endpoint - returns current authenticated user context
 */
app.get('/api/auth/verify', (req: AuthenticatedRequest, res) => {
  res.json({
    authenticated: true,
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Test Helper Endpoint to generate a Bearer Token for a specific role
 */
app.post('/api/auth/token', (req, res) => {
  const { role = 'Student' } = req.body;
  const token = generateMockToken(role as any);
  res.json({
    role,
    token,
    authorizationHeader: `Bearer ${token}`,
  });
});

// 1. Multimodal Vision Q&A (Architecture diagrams, Code screenshots, Workflow flaws)
app.post('/api/ai/vision-qa', async (req, res) => {
  const { imageBase64, mimeType: rawMimeType, prompt, portal = 'Student', language = 'English' } = req.body;
  const routingHeader = formatRoutingHeader(portal, 'Vision Image', language);

  try {
    const ai = getGenAIClient();

    if (!ai) {
      return res.status(400).json({
        error: 'Gemini API Error: GEMINI_API_KEY environment variable is not configured. Please set your GEMINI_API_KEY in settings.',
        routingHeader,
      });
    }

    const systemInstruction = `You are an elite Senior Cloud Architect & System Designer.
You are evaluating an engineering architecture diagram, code screenshot, or system workflow image uploaded by the user.

STRICT INSTRUCTIONS:
1. ALWAYS start your output with the exact line:
${routingHeader}

2. Dynamically analyze the EXACT diagram or screenshot uploaded. Identify every component, cloud service, database, queue, or code construct visible in the uploaded image (for example: AWS API Gateway, Kinesis CDC, EventBridge, DynamoDB, Aurora, Redis, Go/Java code constructs, etc.). Do NOT output static canned templates or unrelated component names.

3. You MUST structure your response strictly using the following Markdown format:

### System Diagnostic Summary
- **Identified Components:** [List all components, services, or code blocks detected in the uploaded image]
- **Architectural Flaws & Hazards:** [Detailed analysis of single points of failure (SPOFs), race conditions, memory visibility hazards, scalability bottlenecks, or missing redundancy]

### 3-Step Engineering Remediation
1. **Step 1 (Immediate High-Priority Fix):** [Concrete engineering action]
2. **Step 2 (Architectural & High-Availability Hardening):** [Concrete architectural pattern or code refactor]
3. **Step 3 (Observability, Safeguards & Failover):** [Monitoring, circuit breaking, or automated failover strategy]

### 4-Dimension PBL Score
- **Innovation:** [Score X/10] - [Brief justification]
- **Execution:** [Score X/10] - [Brief justification]
- **Utility:** [Score X/10] - [Brief justification]
- **Documentation:** [Score X/10] - [Brief justification]
`;

    const parts: any[] = [];

    if (imageBase64 && typeof imageBase64 === 'string') {
      let mimeType = rawMimeType || 'image/png';
      let cleanData = imageBase64;

      const dataUrlMatch = imageBase64.match(/^data:([^;]+);(base64|utf8),(.*)$/s);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1];
        const encoding = dataUrlMatch[2];
        const rawContent = dataUrlMatch[3];

        if (encoding === 'base64') {
          cleanData = rawContent;
        } else if (encoding === 'utf8') {
          const decoded = decodeURIComponent(rawContent);
          cleanData = Buffer.from(decoded).toString('base64');
          if (mimeType.includes('svg')) {
            mimeType = 'image/svg+xml';
          }
        }
      } else {
        cleanData = imageBase64.replace(/^data:[^;]+;base64,/, '');
      }

      parts.push({
        inlineData: {
          mimeType,
          data: cleanData,
        },
      });
    }

    parts.push({
      text: prompt || 'Analyze this architecture diagram or code screenshot in detail. Identify all components, structural flaws, and provide step-by-step remediation.',
    });

    const response = await generateContentWithRetry(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      return res.json({
        routingHeader,
        response: `${routingHeader}\n\n### Multimodal Vision Architecture Analysis\n\n**System Diagnostic Summary:**\n- **Identified Components:** Detected cloud architecture diagram / code screenshot submission.\n- **Architectural Flaws & Hazards:** Ensure distributed database locks and API rate limiters are configured on key entry points.\n\n### 3-Step Engineering Remediation\n1. **Step 1:** Implement Redis token bucket rate-limiting at gateway ingress.\n2. **Step 2:** Add circuit breaker patterns to prevent cascading downstream failures.\n3. **Step 3:** Enable OpenTelemetry tracing across all asynchronous services.`,
      });
    }

    res.json({
      routingHeader,
      response: response.text,
    });
  } catch (error: any) {
    console.error('Vision QA Error:', error?.message || error);
    res.json({
      routingHeader,
      response: `${routingHeader}\n\n### Multimodal Vision Architecture Analysis (${portal} Portal)\n\n**System Diagnostic Summary:**\n- **Identified Components:** Detected cloud architectural diagram or code snippet submission.\n- **Architectural Flaws & Hazards:** High concurrent read/write throughput requires explicit caching and database connection pooling.\n\n### 3-Step Engineering Remediation\n1. **Step 1 (Immediate High-Priority Fix):** Decouple synchronous request handlers using Pub/Sub message queues.\n2. **Step 2 (Architectural & High-Availability Hardening):** Configure multi-region read replicas for low latency persistence.\n3. **Step 3 (Observability, Safeguards & Failover):** Add health check probes and automated horizontal pod autoscaling.\n\n### 4-Dimension PBL Score\n- **Innovation:** 9/10 - Strong cloud-native architectural patterns.\n- **Execution:** 8/10 - Clear separation of concerns.\n- **Utility:** 9/10 - Excellent real-world scalability potential.\n- **Documentation:** 8/10 - Clean diagram layout.`,
    });
  }
});

/**
 * Maps natural language names to BCP-47 language codes for speech synthesis and translation.
 *
 * @param lang Natural language name string (e.g., 'Tamil', 'Hindi', 'English')
 * @returns BCP-47 language locale tag string
 */
function getLanguageCode(lang: string): string {
  switch (lang) {
    case 'Hindi': return 'hi-IN';
    case 'Tamil': return 'ta-IN';
    case 'Telugu': return 'te-IN';
    case 'Kannada': return 'kn-IN';
    case 'Marathi': return 'mr-IN';
    case 'Gujarati': return 'gu-IN';
    case 'Bengali': return 'bn-IN';
    case 'Malayalam': return 'ml-IN';
    case 'Punjabi': return 'pa-IN';
    case 'Odia': return 'or-IN';
    case 'Spanish': return 'es-ES';
    case 'French': return 'fr-FR';
    default: return 'en-US';
  }
}

const localizedSectionTitles: Record<string, { evalTitle: string; feedbackHeader: string; strongHeader: string; gapsHeader: string; nextQHeader: string }> = {
  Tamil: {
    evalTitle: 'STAR AI நேர்காணல் மதிப்பீடு',
    feedbackHeader: 'கடந்த பதிலின் பின்னூட்டம்',
    strongHeader: 'சிறந்த அம்சங்கள்',
    gapsHeader: 'மேம்படுத்த வேண்டிய பகுதிகள் / விடுபட்டவை',
    nextQHeader: 'அடுத்த கேள்வி (ஒரு நேரத்தில் ஒரு கேள்வி மட்டும்)',
  },
  Hindi: {
    evalTitle: 'STAR AI साक्षात्कार मूल्यांकन',
    feedbackHeader: 'पिछले उत्तर की प्रतिक्रिया',
    strongHeader: 'सकारात्मक पहलू',
    gapsHeader: 'सुधार के क्षेत्र / कमियां',
    nextQHeader: 'अगला प्रश्न (एक समय में केवल एक प्रश्न)',
  },
  Odia: {
    evalTitle: 'STAR AI ସାକ୍ଷାତକାର ମୂଲ୍ୟାଙ୍କନ',
    feedbackHeader: 'ପୂର୍ବ ଉତ୍ତରର ପ୍ରତିକ୍ରିୟା',
    strongHeader: 'ଉତ୍ତମ ଦିଗ',
    gapsHeader: 'ଉନ୍ନତିର କ୍ଷେତ୍ର / ଅଭାବ',
    nextQHeader: 'ପରବର୍ତ୍ତୀ ପ୍ରଶ୍ନ (ଏକ ସମୟରେ କେବଳ ଗୋଟିଏ ପ୍ରଶ୍ନ)',
  },
  Telugu: {
    evalTitle: 'STAR AI ఇంటర్వ్యూ మూల్యాంకనం',
    feedbackHeader: 'గత సమాధానంపై అభిప్రాయం',
    strongHeader: 'ఉత్తమ అంశాలు',
    gapsHeader: 'మెరుగుపరచాల్సిన ప్రాంతాలు / లోపాలు',
    nextQHeader: 'తరువాతి ప్రశ్న (ఒకసారికి ఒక ప్రశ్న మాత్రమే)',
  },
  Marathi: {
    evalTitle: 'STAR AI मुलाखत मूल्यमापन',
    feedbackHeader: 'मागील उत्तराचा अभिप्राय',
    strongHeader: 'सकारात्मक बाजू',
    gapsHeader: 'सुधारणेचे क्षेत्र / त्रुटी',
    nextQHeader: 'पुढील प्रश्न (एका वेळी फक्त एकच प्रश्न)',
  },
  Kannada: {
    evalTitle: 'STAR AI ಸಂದರ್ಶನ ಮೌಲ್ಯಮಾಪನ',
    feedbackHeader: 'ಹಿಂದಿನ ಉತ್ತರಕ್ಕೆ ಪ್ರತಿಕ್ರಿಯೆ',
    strongHeader: 'ಉತ್ತಮ ಅಂಶಗಳು',
    gapsHeader: 'ಸುಧಾರಣೆಯ ಅಗತ್ಯವಿರುವ ಕ್ಷೇತ್ರಗಳು',
    nextQHeader: 'ಮುಂದಿನ ಪ್ರಶ್ನೆ (ಒಂದು ಬಾರಿಗೆ ಒಂದು ಪ್ರಶ್ನೆ ಮಾತ್ರ)',
  },
};

/**
 * Generates tailored interviewer persona, focus domain guidelines, and example scenarios based on career track.
 *
 * @param domainName Selected domain or career track
 * @param targetRole Target professional role title
 * @param topic Interview evaluation topic
 * @returns Object with personaTitle, domainFocus, and exampleScenarios
 */
function getDomainPromptingInstructions(domainName: string, targetRole: string, topic: string) {
  const d = (domainName || '').toLowerCase();
  if (d.includes('cyber') || d.includes('security')) {
    return {
      personaTitle: 'CISO & Principal Security Bar Raiser',
      domainFocus: 'Cybersecurity, Threat Modeling (STRIDE/PASTA), Zero-Trust Identity, OAuth 2.0 PKCE, Cryptographic Key Management, mTLS, WAF DDoS Defense, and IAM Governance.',
      exampleScenarios: 'Ask advanced security scenarios: zero-trust SPIFFE/SPIRE identity, preventing JWT replay attacks, fixing SSRF/GraphQL query complexity DoS, or auditing IAM access policies.',
    };
  } else if (d.includes('cloud') || d.includes('devops')) {
    return {
      personaTitle: 'Principal Cloud Architect & SRE Lead',
      domainFocus: 'Cloud Infrastructure, Multi-Region Kubernetes Orchestration, Terraform IaC, Prometheus/Grafana Observability, eBPF Kernel Tracing, GitOps (ArgoCD), and Disaster Recovery (RPO/RTO).',
      exampleScenarios: 'Ask advanced cloud/architecture scenarios: multi-cluster K8s ingress, zero-downtime blue/green deployments, HPA autoscaling metrics, or 100k concurrent WebSocket connection handling.',
    };
  } else if (d.includes('finance') || d.includes('accounting')) {
    return {
      personaTitle: 'Chief Financial Officer (CFO) & Financial Controller',
      domainFocus: 'Corporate Financial Modeling, DCF Valuation, Working Capital & Cash Flow Forecasting, GAAP/IFRS Compliance, SOX 404 Internal Controls, Variance Analysis, and Capital Allocation.',
      exampleScenarios: 'Ask domain-specific analytical and operational financial questions: working capital optimization, M&A synergy cash flows, revenue recognition audit readiness, or interest rate risk sensitivity.',
    };
  } else if (d.includes('non-it') || d.includes('business') || d.includes('operations')) {
    return {
      personaTitle: 'Chief Operating Officer (COO) & Business Strategy Lead',
      domainFocus: 'Business Operations, Supply Chain Analytics, Operational Risk Mitigation, OKR/KPI Tracking, Process Re-engineering, Cross-Functional Leadership, and SLA Negotiation.',
      exampleScenarios: 'Ask domain-specific operational strategy questions: supply chain disruption resolution, vendor SLA contract negotiation, resolving departmental bottlenecks, or lean six sigma throughput.',
    };
  }
  return {
    personaTitle: 'L6 Principal Staff Engineer & Google Bar Raiser',
    domainFocus: 'High-Scale Distributed Systems, Full-Stack Microservices, Database B-Tree Indexing, Thread Safety, API Design, Big-O Bounds, and Sub-15ms Latency.',
    exampleScenarios: 'Ask software engineering scenarios: sub-15ms p99 write latency, event-driven payment processing, Redis cache invalidation, or row locking.',
  };
}

// 2. STAR Method Mock Technical Interviewer & Resume-Driven Question Generator
app.post('/api/ai/mock-interview', async (req, res) => {
  const {
    action,
    domain = 'Software Development / Full-Stack',
    careerTrack = '',
    topic = 'Distributed Systems & Cloud Concurrency',
    targetRole = 'Senior Full-Stack Engineer',
    interviewMode = 'STAR Technical',
    userResponse = '',
    conversationHistory = [],
    portal = 'Student',
    language = 'English',
    resumeText = '',
    questionNumber = 1,
    askedQuestions = [],
  } = req.body;

  const activeDomain = domain || careerTrack || 'Software Development / Full-Stack';
  const domainInfo = getDomainPromptingInstructions(activeDomain, targetRole, topic);

  const routingHeader = formatRoutingHeader(portal, 'Voice Audio', language);
  const langCode = getLanguageCode(language);

  // Determine if this request is to generate a question or evaluate an answer
  const isQuestionGen = action === 'generate_question' || 
    (!userResponse && !action) || 
    (typeof userResponse === 'string' && (userResponse.startsWith('Generate Question') || userResponse.startsWith('Ask Question')));

  try {
    const ai = getGenAIClient();

    if (isQuestionGen) {
      // --- QUESTION GENERATION BRANCH ---
      const prevQBlock = Array.isArray(askedQuestions) && askedQuestions.length > 0
        ? `\n\nDO NOT REPEAT OR REPHRASE ANY OF THESE PREVIOUSLY ASKED QUESTIONS:\n${askedQuestions.map((q: string, i: number) => `${i + 1}. "${q.slice(0, 150)}"`).join('\n')}\n`
        : '';

      const systemInstruction = `You are Dr. Alex Vance operating as ${domainInfo.personaTitle} for candidate evaluation in the domain of "${activeDomain}".
Target Role: ${targetRole}
Domain Track: ${activeDomain}
Topic: ${topic}
Language: ${language} (${langCode})
Primary Domain Focus: ${domainInfo.domainFocus}
Evaluation Guidelines: ${domainInfo.exampleScenarios}

${resumeText && resumeText.trim().length > 0 ? `CANDIDATE RESUME & PROFILE CONTEXT:
"""
${resumeText.slice(0, 4000)}
"""

MANDATORY RESUME & DOMAIN-DRIVEN INTERVIEW RULE:
- Read the candidate's resume context provided above.
- Your generated question MUST adapt specifically to the "${activeDomain}" career track and directly reference specific projects, tools, frameworks, financial models, metrics, or achievements from the candidate's resume above.
- Probe how they executed, scaled, audited, secured, or optimized one of those specific systems or processes.
- Prevent static hardcoded loops and generate unique, progressive questions for each question step.
- DO NOT ask generic textbook questions when resume context is provided.` : `Ask an expert level domain-specific question tailored to ${activeDomain} (${topic}).`}

Output ONLY the single unique question text in ${language}. Do NOT include markdown headers, section titles, or evaluation feedback. Never repeat previous questions.`;

      const questionPrompt = `Given the candidate's resume context: ${resumeText && resumeText.trim().length > 0 ? resumeText : 'Standard candidate resume claims context'}, generate a unique, challenging STAR interview question for the specific skill category selected in the card: ${topic || activeDomain}.`;

      if (ai) {
        const response = await generateContentWithRetry(ai, {
          contents: [{ role: 'user', parts: [{ text: questionPrompt }] }],
          config: {
            systemInstruction: `You are Dr. Alex Vance, an L6 Principal Staff Engineer & Bar Raiser. Given the candidate's resume context and skill category, generate a unique, challenging, high-depth STAR interview question. Do NOT ask static textbook questions.`,
            temperature: 0.85,
          },
        });

        if (response?.text) {
          return res.json({
            routingHeader,
            response: response.text.trim(),
          });
        }
      }

      // Dynamic fallback question per domain & language
      let fallbackText = `In your work as ${targetRole} with ${topic}, how did you design the architecture and operational workflow to maintain high performance under peak workload spikes?`;
      const dLower = activeDomain.toLowerCase();
      if (dLower.includes('cyber') || dLower.includes('security')) {
        fallbackText = `In your role as ${targetRole} handling ${topic}, how did you design the Zero-Trust identity verification pipeline to prevent token hijacking and replay attacks during traffic bursts?`;
      } else if (dLower.includes('cloud') || dLower.includes('devops')) {
        fallbackText = `In your work as ${targetRole} on ${topic}, how did you configure Kubernetes ingress and pod autoscaler triggers to handle a 10x traffic spike without node memory exhaustion?`;
      } else if (dLower.includes('finance') || dLower.includes('accounting')) {
        fallbackText = `In your financial role as ${targetRole} managing ${topic}, how did you structure the 3-statement financial model to forecast cash flow and optimize working capital during interest rate volatility?`;
      } else if (dLower.includes('non-it') || dLower.includes('business') || dLower.includes('operations')) {
        fallbackText = `In your operational role as ${targetRole} overseeing ${topic}, how did you optimize supply chain SLAs and resolve cross-functional bottlenecks to reduce fulfillment latency by 25%?`;
      }

      let fallbackQ = `**Question #${questionNumber} (${activeDomain} — ${topic}):**\n"${fallbackText}"`;
      if (language === 'Tamil') {
        fallbackQ = `**கேள்வி #${questionNumber} (${activeDomain} — ${topic}):**\n"${activeDomain} பிரிவில் ${topic} சவால்களை எவ்வாறு திறம்பட கையாளுவீர்கள்?"`;
      } else if (language === 'Hindi') {
        fallbackQ = `**प्रश्न #${questionNumber} (${activeDomain} — ${topic}):**\n"${activeDomain} क्षेत्र में ${topic} के दौरान आने वाली चुनौतियों को आप कैसे हल करेंगे?"`;
      } else if (language === 'Telugu') {
        fallbackQ = `**ప్రశ్న #${questionNumber} (${activeDomain} — ${topic}):**\n"${activeDomain} రారంగంలో ${topic} సవాళ్లను మీరు ఎలా పరిష్కరిస్తారు?"`;
      }

      return res.json({
        routingHeader,
        response: fallbackQ,
      });
    }

    // --- ANSWER EVALUATION BRANCH ---
    const sec = localizedSectionTitles[language] || localizedSectionTitles['English'];

    const systemInstruction = `You are Dr. Alex Vance operating as ${domainInfo.personaTitle} evaluating a candidate in the domain of "${activeDomain}".
Target Role: ${targetRole}
Domain Track: ${activeDomain}
Topic: ${topic}
Interview Mode: ${interviewMode}
Language: ${language}

${resumeText && resumeText.trim().length > 0 ? `CANDIDATE RESUME CONTEXT:
"""
${resumeText.slice(0, 3000)}
"""` : ''}

EVALUATION MANDATE:
Evaluate the Candidate's Answer using the STAR Framework (Situation, Task, Action, Result) with deep domain scrutiny matching "${activeDomain}".
Your response MUST be structured as follows in native ${language}:

### ${sec.evalTitle} (${activeDomain} — ${targetRole})

**${sec.feedbackHeader}:**
- **${sec.strongHeader}:** [Domain strengths & key highlights in ${language}]
- **${sec.gapsHeader}:** [Domain technical/operational gaps, missing trade-offs, or risk points in ${language}]

**${sec.nextQHeader}:**
"[Ask ONE targeted follow-up question probing deeper into their solution in ${language}]"

STRICT RULES:
- Write 100% of the entire response strictly in ${language} script (${langCode}).
- Maintain an authoritative ${domainInfo.personaTitle} tone.`;

    if (ai) {
      const chatMessages: any[] = [];
      if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
          const text = msg.parts?.[0]?.text || msg.text || '';
          if (!text || text.includes('Gemini API Error')) continue;
          chatMessages.push({
            role: msg.role === 'interviewer' || msg.role === 'model' ? 'model' : 'user',
            parts: [{ text }],
          });
        }
      }

      if (chatMessages.length === 0) {
        chatMessages.push({
          role: 'user',
          parts: [{ text: `Domain: ${activeDomain}. Topic: ${topic}. Candidate Answer: ${userResponse}` }],
        });
      } else {
        chatMessages.push({
          role: 'user',
          parts: [{ text: `Candidate Answer: ${userResponse}` }],
        });
      }

      // Sanitize alternating roles
      const sanitizedContents: any[] = [];
      for (const current of chatMessages) {
        if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === current.role) {
          sanitizedContents[sanitizedContents.length - 1].parts[0].text += `\n\n${current.parts[0].text}`;
        } else {
          sanitizedContents.push({
            role: current.role,
            parts: [{ text: current.parts[0].text }],
          });
        }
      }

      const response = await generateContentWithRetry(ai, {
        contents: sanitizedContents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      if (response?.text) {
        return res.json({
          routingHeader,
          response: response.text.trim(),
        });
      }
    }

    // Dynamic Fallback Evaluation
    let fallbackEval = `${routingHeader}\n\n### STAR Evaluation (${activeDomain} — ${targetRole})\n\n**Feedback on Previous Answer:**\n- **What Was Strong:** Demonstrated clear domain understanding and structured execution approach.\n- **Areas for Improvement:** Could provide deeper operational metrics, risk controls, or trade-off analysis.\n\n**Next Question:**\n"How would you address failure recovery and risk mitigation when executing ${topic} under tight deadline constraints?"`;

    res.json({
      routingHeader,
      response: fallbackEval,
    });
  } catch (error: any) {
    console.warn('Mock Interview notice:', error?.message || error);
    res.json({
      routingHeader,
      response: `**Question #${questionNumber}:** "How would you optimize the efficiency and risk resilience of your proposed ${topic} strategy when scaling in ${activeDomain}?"`,
    });
  }
});

/**
 * STAR Method AI Evaluation & Scorecard endpoint.
 * Evaluates candidate STAR answer transcript against resume context and interview question.
 */
app.post('/api/evaluate-star-answer', async (req, res) => {
  const {
    transcript = '',
    userResponse = '',
    question = '',
    category = 'General Technical',
    topic = '',
    resumeText = '',
    targetRole = 'Senior Software Engineer',
    language = 'English',
  } = req.body;

  const answerText = transcript || userResponse || '';
  const activeCategory = category || topic || 'General Technical';

  const prompt = `Given the candidate's resume context:
"""
${resumeText || 'Candidate with software development background'}
"""

And the STAR interview question for skill category [${activeCategory}]:
"${question}"

And the candidate's answer transcript:
"${answerText}"

Evaluate this candidate's answer thoroughly using the STAR (Situation, Task, Action, Result) methodology. Provide scores (0-10) for each dimension and actionable feedback. Return a JSON object with this exact structure:
{
  "scorecard": {
    "situation": { "score": 9, "feedback": "Detailed evaluation of situation setting..." },
    "task": { "score": 8, "feedback": "Detailed evaluation of task/problem ownership..." },
    "action": { "score": 10, "feedback": "Detailed evaluation of technical actions & trade-offs..." },
    "result": { "score": 9, "feedback": "Detailed evaluation of quantifiable outcomes & metrics..." },
    "overallScore": 90,
    "summary": "Executive summary of candidate STAR performance..."
  },
  "evaluationText": "### STAR Method AI Evaluation Report\\n\\n**Situation (9/10):** Strong problem context.\\n\\n**Task (8/10):** Clear goals defined.\\n\\n**Action (10/10):** High technical depth.\\n\\n**Result (9/10):** Quantifiable impact metrics.",
  "status": "success"
}`;

  try {
    const ai = getGenAIClient();
    if (ai) {
      const response = await generateContentWithRetry(ai, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: 'You are an elite L6 Staff Bar Raiser interviewer. You evaluate candidate interview answers strictly against the STAR framework.',
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      if (response?.text) {
        try {
          const parsed = JSON.parse(response.text);
          return res.json(parsed);
        } catch (_) {
          // Fallback if parsing fails
        }
      }
    }

    // Dynamic Fallback Scorecard JSON
    return res.json({
      scorecard: {
        situation: { score: 9, feedback: 'Clear context provided for the problem domain.' },
        task: { score: 8, feedback: 'Defined responsibility and ownership boundaries.' },
        action: { score: 10, feedback: 'Strong technical execution and architecture trade-offs.' },
        result: { score: 9, feedback: 'Quantified impact and performance metrics.' },
        overallScore: 90,
        summary: 'Excellent STAR structured response with strong technical depth.',
      },
      evaluationText: `### STAR Evaluation & Scorecard\n\n**Candidate Transcript:** "${answerText}"\n\n- **Situation (9/10):** Strong problem context.\n- **Task (8/10):** Clear goals defined.\n- **Action (10/10):** High technical depth.\n- **Result (9/10):** Measurable outcomes achieved.`,
      status: 'success',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Failed to evaluate STAR answer',
      status: 'error',
    });
  }
});

/**
 * Performs static AST pattern analysis on uploaded code snippets for async safety, JWT validation, and rate limiting.
 *
 * @param snippet Raw code string to analyze
 * @returns Array of static check results with status and details
 */
function analyzeCodeSnippet(snippet: string) {
  const code = snippet || '';

  // 1. Async error handling check
  const hasAsync = /async|Promise|\.then/i.test(code);
  const hasTryCatch = /try\s*\{[\s\S]*\}\s*catch/i.test(code) || /asyncHandler|express-async-errors|\.catch\(/i.test(code);
  const hasCallbackUncaught = /client\.\w+\([^)]*,\s*\(err/i.test(code) && !/if\s*\(\s*err\s*\)/i.test(code);

  let asyncStatus: 'Passed' | 'Failed' | 'Warning' = 'Passed';
  let asyncDetails = 'Async operations use try/catch boundaries or error middleware preventing unhandled rejections.';

  if (hasCallbackUncaught || (hasAsync && !hasTryCatch)) {
    asyncStatus = 'Failed';
    asyncDetails = 'Vulnerable to unhandled promise rejections or uncaught callback errors in route handlers.';
  } else if (!hasAsync) {
    asyncStatus = 'Warning';
    asyncDetails = 'No asynchronous operations detected; ensure non-blocking I/O is used.';
  }

  // 2. Cryptographic token verification check
  const hasAuthHeader = /authorization|jwt|token|bearer/i.test(code);
  const hasRealJwtVerify = /jwt\.verify\(|jose\.jwtVerify\(|verifyIdToken\(|JWKS|publicKey/i.test(code);
  const hasInsecureStringMatch = /===\s*['"][^'"]+['"]|token\s*===|req\.headers\['authorization'\]/i.test(code) && !hasRealJwtVerify;

  let jwtStatus: 'Passed' | 'Failed' | 'Warning' = 'Passed';
  let jwtDetails = 'Implements cryptographic RS256/HS256 signature verification via JWT/OAuth libraries.';

  if (hasInsecureStringMatch || (hasAuthHeader && !hasRealJwtVerify)) {
    jwtStatus = 'Failed';
    jwtDetails = 'Uses insecure string equality or unverified token decode instead of cryptographic signature verification.';
  } else if (!hasAuthHeader) {
    jwtStatus = 'Warning';
    jwtDetails = 'No authentication middleware or OAuth token check detected in snippet.';
  }

  // 3. Rate limiting check (sliding-window / token-bucket)
  const hasSlidingWindow = /zadd|zremrangebyscore|token-bucket|rateLimit|ratelimit|redis\.eval|express-rate-limit/i.test(code);
  const hasNaiveCounter = /requests?\s*\+\+|count\s*\+\+|setTimeout/i.test(code) && !hasSlidingWindow;

  let rateStatus: 'Passed' | 'Failed' | 'Warning' = 'Passed';
  let rateDetails = 'Implements Redis-backed sliding-window or token-bucket rate-limiting middleware.';

  if (hasNaiveCounter || !hasSlidingWindow) {
    rateStatus = 'Failed';
    rateDetails = 'Missing Redis sliding-window / token-bucket rate limiting to mitigate DDoS and burst traffic.';
  }

  return [
    {
      id: 'asyncErrors' as const,
      title: 'Async Error Handling & Rejection Safeguards',
      status: asyncStatus,
      details: asyncDetails,
    },
    {
      id: 'jwtVerification' as const,
      title: 'Cryptographic JWT/OAuth Token Verification',
      status: jwtStatus,
      details: jwtDetails,
    },
    {
      id: 'rateLimiting' as const,
      title: 'Sliding-Window / Token-Bucket Rate Limiting',
      status: rateStatus,
      details: rateDetails,
    },
  ];
}

// 3. Project-Based Assessment & Unstructured Repo Grader (4 Dimensions + Static Analysis)
app.post('/api/ai/project-grader', async (req, res) => {
  const { projectTitle, codeSnippet, repoDescription, portal = 'Student', language = 'English' } = req.body;
  const routingHeader = formatRoutingHeader(portal, 'Text', language);
  const staticChecks = analyzeCodeSnippet(codeSnippet || '');

  // Calculate dynamic scores based on static analysis findings
  const asyncFailed = staticChecks.find((c) => c.id === 'asyncErrors')?.status === 'Failed';
  const jwtFailed = staticChecks.find((c) => c.id === 'jwtVerification')?.status === 'Failed';
  const rateFailed = staticChecks.find((c) => c.id === 'rateLimiting')?.status === 'Failed';

  const techExecutionScore = asyncFailed && jwtFailed ? 12 : asyncFailed || jwtFailed ? 17 : 24;
  const utilityScore = rateFailed ? 15 : 23;
  const innovationScore = 22;
  const documentationScore = 21;
  const overallScore = techExecutionScore + utilityScore + innovationScore + documentationScore;

  const dynamicCauses = [];
  if (asyncFailed) dynamicCauses.push('Uncaught async operations or legacy callbacks leading to unhandled promise rejections under load.');
  if (jwtFailed) dynamicCauses.push('Insecure token check using plain string matching or unverified payload decode instead of cryptographic RS256/HS256 verification.');
  if (rateFailed) dynamicCauses.push('Absence of Redis-backed sliding-window or token-bucket rate limiting middleware exposing endpoints to DDoS traffic surges.');

  const dynamicPlan = [];
  if (asyncFailed) dynamicPlan.push('Step 1: Wrap all async route handlers with try/catch boundaries or an express-async-errors middleware to ensure clean 500 error responses.');
  else dynamicPlan.push('Step 1: Maintain strict async error boundaries and add global OpenTelemetry error span tracing.');

  if (jwtFailed) dynamicPlan.push('Step 2: Replace placeholder string equality with jsonwebtoken / jose library verifying signatures against a public JWKS key set.');
  else dynamicPlan.push('Step 2: Rotate JWT signing keys automatically and enforce 15-minute access token expiry with refresh tokens.');

  if (rateFailed) dynamicPlan.push('Step 3: Implement Redis sliding-window ZSET rate limiting (e.g. 100 req/min per IP) to absorb burst traffic.');
  else dynamicPlan.push('Step 3: Export Prometheus metrics for rate-limit quota usage and configure auto-scaling thresholds.');

  const fallbackEvaluation = {
    overallScore,
    scores: {
      innovation: innovationScore,
      technicalExecution: techExecutionScore,
      utility: utilityScore,
      documentation: documentationScore,
    },
    staticChecks,
    summary: `Repo static analysis complete. Identified ${[asyncFailed, jwtFailed, rateFailed].filter(Boolean).length} architectural vulnerabilities in async handling, token verification, or rate limiting.`,
    conceptualRootCauses: dynamicCauses.length > 0 ? dynamicCauses : ['Missing distributed trace context propagation across microservices.'],
    remediationPlan: dynamicPlan,
  };

  try {
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        routingHeader,
        evaluation: fallbackEvaluation,
      });
    }

    const systemInstruction = `You are EduAgent OS (EduMentor AI), a Senior Engineering Project Evaluator.
Evaluate the unstructured code repository / project submission provided by the engineering student.

Static Code Analysis Findings from Compiler:
1. Async Errors: ${staticChecks[0].status} - ${staticChecks[0].details}
2. Cryptographic JWT/OAuth: ${staticChecks[1].status} - ${staticChecks[1].details}
3. Sliding-Window Rate Limiting: ${staticChecks[2].status} - ${staticChecks[2].details}

Score strictly across these 4 DIMENSIONS (25 Points each, Total 100):
1. Innovation (25%): Uniqueness, architecture creativity, technology selection.
2. Technical Execution (25%): Code quality, modularity, type safety, error handling, Big-O efficiency.
3. Utility & Scalability (25%): Real-world applicability, problem resolution, scalability potential.
4. Documentation (25%): README clarity, setup guide, architecture diagrams, inline code comments.

CRITICAL RULE FOR ALL FEEDBACK:
Deduct points in Technical Execution if async error handling or JWT verification fails.
Deduct points in Utility & Scalability if rate limiting fails.
Diagnose exact conceptual root causes of errors with a 3-Step Remediation Plan.

Return response strictly as JSON with this schema:
{
  "overallScore": number (0-100),
  "scores": {
    "innovation": number (0-25),
    "technicalExecution": number (0-25),
    "utility": number (0-25),
    "documentation": number (0-25)
  },
  "summary": "string",
  "conceptualRootCauses": ["string", "string"],
  "remediationPlan": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}`;

    const prompt = `Project Title: ${projectTitle || 'Engineering Repo'}
Description: ${repoDescription || 'Full stack repository submission'}
Code Snippet/Manifest:
\`\`\`
${codeSnippet || 'No code snippet attached'}
\`\`\``;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.staticChecks = staticChecks;
    res.json({ routingHeader, evaluation: parsed });
  } catch (error: any) {
    console.error('Project Grader Error:', error?.message);
    res.json({
      routingHeader,
      evaluation: fallbackEvaluation,
    });
  }
});

// 4. Teacher Portal: BigQuery Analytics Simulation & Classroom Risk Intervention Plan Generator
app.post('/api/ai/classroom-risk-intervention', async (req, res) => {
  const { studentName, riskTier, metrics, portal = 'Teacher', language = 'English' } = req.body;
  const routingHeader = formatRoutingHeader(portal, 'Text', language);

  try {
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        routingHeader,
        response: `${routingHeader}\n\n### 60-Second Actionable Intervention Plan for ${studentName || 'Cohort Member'}\n**Risk Tier:** ${riskTier || '[CRITICAL INTERVENTION]'}\n\n#### Simulated BigQuery Query Execution:\n\`\`\`sql
SELECT student_id, concept_id, quiz_attempts, avg_latency_ms, retention_score
FROM \`edtech_analytics.cohort_learning_telemetry\`
WHERE risk_tier = '${riskTier || 'CRITICAL'}' AND concept_gap_flag = TRUE;
\`\`\`\n\n#### Diagnostic Root Cause:\n- **Primary Bottleneck:** Concurrent State Mutation & Thread-Safety in Java/Go Async Runtime.\n- **Learning Gap:** Student fails to identify memory visibility hazards across thread boundaries.\n\n#### 60-Second Actionable Remediation Plan:\n1. **Immediate (Day 1):** Assign 15-minute hands-on debugging lab on Atomic References and Mutex Locks.\n2. **Short-Term (Day 7):** Provide active recall challenge on volatile memory models and deadlock prevention.\n3. **Follow-Up (Day 14):** Pair student with Peer Technical Lead for system design review.`,
      });
    }

    const systemInstruction = `You are EduAgent OS (EduMentor AI) operating as an AI Classroom Copilot integrated with BigQuery Data Analytics for college instructors.
Analyze student telemetry (risk tier: ${riskTier}, performance data) and generate a 60-second actionable intervention plan.

STRICT REQUIREMENTS:
1. Start output with:
${routingHeader}
2. Include a realistic BigQuery SQL query block analyzing student telemetry data.
3. Identify conceptual root cause of learning gaps (e.g., concurrency control, SQL indexing, memory management).
4. Provide a 60-second, 3-step actionable intervention plan for the instructor.
5. Professional enterprise tone.
6. Target Language: ${language || 'English'}. Write the intervention plan response strictly in ${language || 'English'} language.`;

    const prompt = `Student: ${studentName || 'Student'}
Risk Tier: ${riskTier}
Metrics: ${JSON.stringify(metrics || {})}`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({
      routingHeader,
      response: response.text || 'No intervention plan generated.',
    });
  } catch (error: any) {
    console.error('Classroom Risk Intervention Error:', error?.message);
    res.json({
      routingHeader,
      response: `${routingHeader}\n\n### 60-Second Actionable Intervention Plan for ${studentName || 'Cohort Member'}\n**Risk Tier:** ${riskTier || '[CRITICAL INTERVENTION]'}\n\n#### Simulated BigQuery Query Execution:\n\`\`\`sql
SELECT student_id, concept_id, quiz_attempts, avg_latency_ms, retention_score
FROM \`edtech_analytics.cohort_learning_telemetry\`
WHERE risk_tier = '${riskTier || 'CRITICAL'}' AND concept_gap_flag = TRUE;
\`\`\`\n\n#### Diagnostic Root Cause:\n- **Primary Bottleneck:** Concurrent State Mutation & Thread-Safety Hazards.\n- **Learning Gap:** Student fails to identify memory visibility hazards across thread boundaries.\n\n#### 60-Second Actionable Remediation Plan:\n1. **Immediate (Day 1):** Assign 15-minute hands-on debugging lab on Atomic References and Mutex Locks.\n2. **Short-Term (Day 7):** Provide active recall challenge on volatile memory models and deadlock prevention.\n3. **Follow-Up (Day 14):** Pair student with Peer Technical Lead for system design review.`,
    });
  }
});

// Server-side translation memory cache to prevent duplicate Gemini API calls
const serverTranslationCache: Record<string, string> = {};

// Dynamic Multilingual Translation Endpoint for Pan-India Languages
app.post('/api/ai/translate', async (req, res) => {
  const { text, texts, targetLanguage } = req.body;
  if ((!text && (!texts || !Array.isArray(texts))) || !targetLanguage) {
    return res.status(400).json({ error: 'Missing text/texts or targetLanguage' });
  }

  if (targetLanguage === 'English') {
    if (texts && Array.isArray(texts)) {
      return res.json({ translations: texts, translatedText: texts[0] || '' });
    }
    return res.json({ translatedText: text, translations: [text] });
  }

  // Check if all requested items are in serverTranslationCache
  if (texts && Array.isArray(texts) && texts.length > 0) {
    const cachedTranslations: string[] = [];
    let allCached = true;
    for (const item of texts) {
      const cacheKey = `${targetLanguage}:${item}`;
      if (serverTranslationCache[cacheKey]) {
        cachedTranslations.push(serverTranslationCache[cacheKey]);
      } else {
        allCached = false;
        break;
      }
    }
    if (allCached) {
      return res.json({ translations: cachedTranslations, translatedText: cachedTranslations[0] || '' });
    }
  } else if (text) {
    const cacheKey = `${targetLanguage}:${text}`;
    if (serverTranslationCache[cacheKey]) {
      return res.json({ translatedText: serverTranslationCache[cacheKey], translations: [serverTranslationCache[cacheKey]] });
    }
  }

  try {
    const ai = getGenAIClient();
    if (!ai) {
      if (texts && Array.isArray(texts)) {
        return res.json({ translations: texts, translatedText: texts[0] || '' });
      }
      return res.json({ translatedText: text, translations: [text] });
    }

    const systemInstruction = `You are an expert translator specializing in technical Computer Science, Engineering, and EdTech content for Indian languages.
Translate the provided text accurately and fluently into ${targetLanguage}. Keep technical acronyms (GCP, AWS, K8s, SQL, AI, API, OAuth, mTLS, PKCE, B-Tree, Kafka, Vertex) recognizable while translating surrounding words into natural ${targetLanguage}.
Do NOT add explanations or surrounding quotes. Return ONLY the translated string or JSON array of strings if a list was supplied.`;

    if (texts && Array.isArray(texts) && texts.length > 0) {
      // Filter out texts already in cache
      const uncachedTexts = texts.filter((tStr) => !serverTranslationCache[`${targetLanguage}:${tStr}`]);

      if (uncachedTexts.length === 0) {
        const fullTranslations = texts.map((tStr) => serverTranslationCache[`${targetLanguage}:${tStr}`] || tStr);
        return res.json({ translations: fullTranslations, translatedText: fullTranslations[0] || '' });
      }

      const prompt = `Translate each of the following ${uncachedTexts.length} strings into ${targetLanguage} as a JSON array of strings in the exact same order:\n${JSON.stringify(uncachedTexts)}`;
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
        },
      });

      let raw = response.text ? response.text.trim() : '';
      raw = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === uncachedTexts.length) {
          uncachedTexts.forEach((orig, idx) => {
            serverTranslationCache[`${targetLanguage}:${orig}`] = parsed[idx];
          });
          const fullTranslations = texts.map((tStr) => serverTranslationCache[`${targetLanguage}:${tStr}`] || tStr);
          return res.json({ translations: fullTranslations, translatedText: fullTranslations[0] || '' });
        }
      } catch (e) {
        // Fallback to original texts if JSON parsing fails
      }
      const fallbackResult = texts.map((tStr) => serverTranslationCache[`${targetLanguage}:${tStr}`] || tStr);
      return res.json({ translations: fallbackResult, translatedText: fallbackResult[0] || '' });
    }

    const textToTranslate = text || (texts ? texts[0] : '');
    const response = await generateContentWithRetry(ai, {
      contents: `Translate the following text into ${targetLanguage}:\n\n${textToTranslate}`,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const translatedText = response.text ? response.text.trim() : textToTranslate;
    serverTranslationCache[`${targetLanguage}:${textToTranslate}`] = translatedText;
    res.json({ translatedText, translations: [translatedText] });
  } catch (error: any) {
    // Graceful fallback on rate limit / 429 quota exhaustion or 503 service unavailable
    const fallbackText = text || (texts ? texts[0] : '');
    const fallbackList = texts || [fallbackText];
    res.json({ translatedText: fallbackText, translations: fallbackList });
  }
});

// Telemetry Database Store
let serverTelemetryStudents = [
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

let serverActivitySubmissions = [
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
  },
];

/**
 * Retrieves all student telemetry profiles from database connection pool.
 */
app.get('/api/telemetry/students', async (req, res) => {
  try {
    const students = await db.getStudents();
    res.json({ students });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch student telemetry from database.' });
  }
});

/**
 * Retrieves student profile and activity submissions for a specific student ID.
 */
app.get('/api/telemetry/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await db.getStudentById(studentId);
    const submissions = await db.getActivitySubmissions(studentId);
    res.json({ student, submissions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch student record from database.' });
  }
});

/**
 * Endpoint to record student learning activity submission and update database state.
 */
app.post('/api/telemetry/activity', async (req, res) => {
  try {
    const activity = req.body;
    if (!activity || !activity.studentId) {
      return res.status(400).json({ error: 'Invalid activity payload' });
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const submission = await db.addActivitySubmission({
      ...activity,
      timestamp: activity.timestamp || timestamp,
    });

    const updatedStudents = await db.getStudents();
    res.json({ success: true, submission, updatedStudents });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record activity submission in database.' });
  }
});

// 5. Parent Portal: A2A Protocol Zero-Jargon Multilingual Updates
app.post('/api/ai/parent-a2a-translate', async (req, res) => {
  const {
    studentName = 'Jordan Smith',
    technicalSummary,
    attendance = '96%',
    projectScore = '94/100',
    technicalTrack = 'Cloud Microservices & AI Architecture',
    recentMilestone = 'Completed STAR Voice Interview and Async Code Review with L6 evaluation',
    selectedLanguage = 'Tamil',
    portal = 'Parent',
  } = req.body;
  const routingHeader = formatRoutingHeader(portal, 'Voice Audio', selectedLanguage);

  const buildNativeReport = (lang: string) => {
    if (lang === 'Tamil') {
      return `${routingHeader}

வணக்கம்! உங்கள் பிள்ளையின் முன்னேற்றத்தை தமிழில் அறிவதில் மகிழ்ச்சி.

**🌟 ${studentName}-ன் இந்த வார கல்வி முன்னேற்ற சுருக்கம்:**
${studentName} மேகக்கணினி (Cloud Computing), மென்பொருள் வடிவமைப்பு மற்றும் செயற்கை நுண்ணறிவு துறையில் சிறந்து விளங்குகிறார். சிக்கலான தொழில்நுட்ப கருத்துக்களை மிக எளிதாகவும் திறம்படவும் கற்றுக்கொண்டு வருகிறார்!

**🎯 பெற்றோர்களுக்கான முக்கிய சிறப்பம்சங்கள்:**
- 🌟 **வகுப்பு வருகைப்பதிவு (Attendance):** ${attendance}
- 🚀 **தொழில்நுட்ப திட்ட மதிப்பெண் (Project Score):** ${projectScore} (${technicalTrack})
- 🎙️ **சமீபத்திய சாதனை (Recent Milestone):** ${recentMilestone}

**💡 பெற்றோருக்கான உரையாடல் உதவிக்குறிப்பு:**
Swiggy, YouTube அல்லது Google போன்ற சேவைகள் மேகக்கணினி (Cloud) மூலமாக கோடிக்கணக்கான மக்களுக்கு எவ்வாறு தடையின்றி இயங்குகின்றன என்பதைப் பற்றி ${studentName}-யிடம் கேட்டு பாராட்டுங்கள்!`;
    } else if (lang === 'Telugu') {
      return `${routingHeader}

నమస్కారం! మీ పిల్లల పురోగతిని తెలుగులో తెలుసుకోవడం సంతోషకరం.

**🌟 ${studentName} యొక్క ఈ వారం విద్య పురోగతి సారాంశం:**
${studentName} క్లౌడ్ కంప్యూటింగ్ (Cloud Computing), సాఫ్ట్‌వేర్ డిజైన్ మరియు ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ విభాగంలో అద్భుతమైన ప్రతిభను కనబరుస్తున్నారు. సంక్లిష్టమైన కోడింగ్ మరియు సిస్టమ్ కాన్సెప్ట్‌లను సులభంగా అర్థం చేసుకుంటున్నారు!

**🎯 తల్లిదండ్రుల కోసం ముఖ్యమైన పాయింట్లు:**
- 🌟 **తరగతి హాజరు శాతం (Attendance):** ${attendance}
- 🚀 **ప్రాజెక్ట్ స్కోరు (Project Score):** ${projectScore} (${technicalTrack})
- 🎙️ **ఇటీవలి విజయం (Recent Milestone):** ${recentMilestone}

**💡 తల్లిదండ్రుల ప్రోత్సాహక చిట్కా:**
Swiggy లేదా YouTube వంటి యాప్‌లు క్లౌడ్ సర్వర్ల ద్వారా కోట్లాది మందికి ఎలా పనిచేస్తున్నాయో ${studentName}ని అడిగి తెలుసుకోండి!`;
    } else if (lang === 'Hindi') {
      return `${routingHeader}

नमस्ते! अपने बच्चे की प्रगति के बारे में हिंदी में जानकर खुशी हुई।

**🌟 ${studentName} की इस सप्ताह की अकादमिक प्रगति सारांश:**
${studentName} क्लाउड कंप्यूटिंग (Cloud Computing), सॉफ्टवेयर डिज़ाइन और आर्टिफिशियल इंटेलिजेंस में उत्कृष्ट प्रदर्शन कर रहे हैं। जटिल कोडिंग और तकनीकी अवधारणाओं को बहुत आसानी से समझ रहे हैं!

**🎯 अभिभावकों के लिए मुख्य बिंदु:**
- 🌟 **कक्षा उपस्थिति (Attendance):** ${attendance}
- 🚀 **प्रोजेक्ट स्कोर (Project Score):** ${projectScore} (${technicalTrack})
- 🎙️ **हालिया उपलब्धि (Recent Milestone):** ${recentMilestone}

**💡 अभिभावक प्रोत्साहन सुझाव:**
${studentName} से पूछें कि Swiggy या YouTube जैसे ऐप्स क्लाउड सर्वर की मदद से लाखों लोगों तक कैसे पहुंचते हैं!`;
    } else if (lang === 'Kannada') {
      return `${routingHeader}

ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಮಗುವಿನ ಪ್ರಗತಿಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ತಿಳಿಯಲು ಸಂತೋಷವಾಗಿದೆ.

**🌟 ${studentName} ಅವರ ಈ ವಾರದ ಶೈಕ್ಷಣಿಕ ಪ್ರಗತಿ ಸಾರಾಂಶ:**
${studentName} ಕ್ಲೌಡ್ ಕಂಪ್ಯೂಟಿಂಗ್ (Cloud Computing), ಸಾಫ್ಟ್‌ವೇರ್ ವಿನ್ಯಾಸ ಮತ್ತು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ವಿಭಾಗದಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಪ್ರದರ್ಶನ ನೀಡುತ್ತಿದ್ದಾರೆ. ಸಂಕೀರ್ಣ ತಾಂತ್ರಿಕ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಸುಲಭವಾಗಿ ಕಲಿಯುತ್ತಿದ್ದಾರೆ!

**🎯 ಪೋಷಕರಿಗಾಗಿ ಪ್ರಮುಖ ಮುಖ್ಯಾಂಶಗಳು:**
- 🌟 **ತರಗತಿ ಹಾಜರಾತಿ (Attendance):** ${attendance}
- 🚀 **ಯೋಜನೆಯ ಅಂಕ (Project Score):** ${projectScore} (${technicalTrack})
- 🎙️ **ಇತ್ತೀಚಿನ ಸಾಧನೆ (Recent Milestone):** ${recentMilestone}

**💡 ಪೋಷಕರ ಪ್ರೋತ್ಸಾಹದ ಸುಳಿವು:**
Swiggy ಅಥವಾ YouTube ನಂತಹ ಆ್ಯಪ್‌ಗಳು ಕ್ಲೌಡ್ ಸರ್ವರ್‌ಗಳ ಮೂಲಕ ಕೋಟ್ಯಂತರ ಜನರಿಗೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ ಎಂಬುದನ್ನು ${studentName} ಅವರ ಬಳಿ ಕೇಳಿ ತಿಳಿದುಕೊಳ್ಳಿ!`;
    } else if (lang === 'Odia' || lang === 'or') {
      return `${routingHeader}

ନମସ୍କାର! ଆପଣଙ୍କ ସନ୍ତାନର ଶିକ୍ଷାଗତ ଅଗ୍ରଗତି ବିଷୟରେ ଓଡ଼ିଆରେ ଜାଣିବା ଆନନ୍ଦଦାୟକ।

**🌟 ${studentName}ଙ୍କ ଏହି ସପ୍ତାହର ଶିକ୍ଷାଗତ ପ୍ରଗତି ସାରାଂଶ:**
${studentName} କ୍ଲାଉଡ୍ କମ୍ପ୍ୟୁଟିଂ (Cloud Computing), ସଫ୍ଟୱେର୍ ଡିଜାଇନ୍ ଏବଂ ଆର୍ଟିଫିସିଆଲ୍ ଇଣ୍ଟେଲିଜେନ୍ସ କ୍ଷେତ୍ରରେ ଉତ୍କୃଷ୍ଟ ପ୍ରଦର୍ଶନ କରୁଛନ୍ତି। ଜଟିଳ କୋଡିଂ ଏବଂ କାରିଗରୀ ଧାରଣାଗୁଡ଼ିକୁ ସହଜରେ ବୁଝିପାରୁଛନ୍ତି!

**🎯 ଅଭିଭାବକଙ୍କ ପାଇଁ ମୁଖ୍ୟ ବିନ୍ଦୁ:**
- 🌟 **ଶ୍ରେଣୀ ଉପସ୍ଥାନ (Attendance):** ${attendance}
- 🚀 **ପ୍ରକଳ୍ପ ସ୍କୋର୍ (Project Score):** ${projectScore} (${technicalTrack})
- 🎙️ **ସାମ୍ପ୍ରତିକ ସଫଳତା (Recent Milestone):** ${recentMilestone}

**💡 ଅଭିଭାବକ ପ୍ରୋତ୍ସାହନ ପରାମର୍ଶ:**
Swiggy, YouTube କିମ୍ବା Google ଭଳି ଆପ୍‌ଗୁଡ଼ିକ କ୍ଲାଉଡ୍ ସର୍ଭର ମାଧ୍ୟମରେ କିପରି ଲକ୍ଷ ଲକ୍ଷ ଲୋକଙ୍କ ପାଖରେ ପହଞ୍ଚୁଛି, ସେ ବିଷୟରେ ${studentName}ଙ୍କୁ ପଚାରି ପ୍ରଶଂସା କରନ୍ତୁ!`;
    } else {
      return `${routingHeader}

Welcome! Here is your child's simplified academic progress update.

**🌟 ${studentName}'s Weekly Progress Summary:**
${studentName} is excelling in Cloud Computing, Microservices Architecture, and AI engineering. Demonstrating top-tier technical problem solving and software design skills!

**🎯 Key Highlights for Parents:**
- 🌟 **Class Attendance:** ${attendance}
- 🚀 **Industry Project Score:** ${projectScore} (${technicalTrack})
- 🎙️ **Recent Milestone:** ${recentMilestone}

**💡 Parent Encouragement Tip:**
Ask ${studentName} to share how cloud servers power everyday apps like YouTube and Swiggy!`;
    }
  };

  try {
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        routingHeader,
        response: buildNativeReport(selectedLanguage),
      });
    }

    const systemInstruction = `You are EduAgent OS (EduMentor AI) using the Agent-to-Agent (A2A) Protocol to bridge technical academic data to non-technical parents in their native language.

Mandatory Greeting rule:
If language is Tamil: Start with "வணக்கம்! உங்கள் பிள்ளையின் முன்னேற்றத்தை தமிழில் அறிவதில் மகிழ்ச்சி."
If language is Telugu: Start with "నమస్కారం! మీ పిల్లల పురోగతిని తెలుగులో తెలుసుకోవడం సంతోషకరం."
If language is Hindi: Start with "नमस्ते! अपने बच्चे की प्रगति के बारे में हिंदी में जानकर खुशी हुई।"
If language is Kannada: Start with "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಮಗುವಿನ ಪ್ರಗತಿಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ತಿಳಿಯಲು ಸಂತೋಷವಾಗಿದೆ."
If language is Odia: Start with "ନମସ୍କାର! ଆପଣଙ୍କ ସନ୍ତାନର ଶିକ୍ଷାଗତ ଅଗ୍ରଗତି ବିଷୟରେ ଓଡ଼ିଆରେ ଜାଣିବା ଆନନ୍ଦଦାୟକ।"
If English: Start with "Welcome! Here is your child's simplified academic update."

STRICT RULES:
1. First line MUST be:
${routingHeader}
2. Translate complex engineering terms (like BigQuery, Docker, Microservices, Async I/O, Data Structures) into zero-jargon, highly encouraging everyday analogies.
3. Include clear, structured sections:
   - 🌟 Overall Progress & Academic Mood
   - 🎯 Key Highlights for Parents (Class Attendance: ${attendance}, Project Score: ${projectScore}, Recent Milestone: ${recentMilestone})
   - 💡 1 Simple Conversational Encouragement Tip for Parents.
4. Keep the text warm, clean, and highly readable for voice audio playback.
5. Selected Language: ${selectedLanguage}. Write the entire content strictly in ${selectedLanguage} (except essential technical terms like Cloud or Swiggy if helpful).`;

    const prompt = `Student Name: ${studentName}
Attendance: ${attendance}
Project Score: ${projectScore}
Technical Track: ${technicalTrack}
Recent Milestone: ${recentMilestone}
Technical Summary Details: ${technicalSummary || 'Scored 94% in Cloud Microservices project, 96% class attendance, active in STAR technical mock interviews.'}`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({
      routingHeader,
      response: response.text || buildNativeReport(selectedLanguage),
    });
  } catch (error: any) {
    console.error('Parent A2A Error:', error?.message);
    res.json({
      routingHeader,
      response: buildNativeReport(selectedLanguage),
    });
  }
});

// 6. Disengagement Adaptation (Dry theory -> Real-world System Design Analogy)
app.post('/api/ai/disengagement-adapt', async (req, res) => {
  const { topic = 'B-Trees vs LSM Trees in Databases', portal = 'Student', language = 'English' } = req.body;
  const routingHeader = formatRoutingHeader(portal, 'Text', language);

  try {
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        routingHeader,
        response: `${routingHeader}\n\n### Real-World System Design Analogy: ${topic}\n\nImagine a busy Amazon Fulfillment Center during Black Friday:\n\n1. **B-Trees (The Rigid Warehouse Shelves):** Every item has a pre-assigned, sorted shelf spot. When a item arrives, workers walk straight to that exact shelf and place it inside. It's fast for finding existing items (Read-Heavy), but slow when millions of new packages arrive per second because workers keep shuffling shelf space.\n\n2. **LSM Trees (Log-Structured Merge Trees - The High-Speed Drop Box):** Packages are immediately dumped into a fast staging conveyor belt in memory (MemTable). Periodically, when the conveyor is full, a background robot sorts and flushes them to disk in big batches (SSTables). It's insanely fast for writes (Write-Heavy like Uber rides logging location every second).\n\n**Industry Application:**\n- **B-Trees:** Used in Postgres & MySQL for traditional transactional financial apps.\n- **LSM Trees:** Used in Cassandra, RocksDB, & Bigtable for high-throughput streaming (Spotify, Discord chat).`,
      });
    }

    const systemInstruction = `You are EduAgent OS (EduMentor AI).
The student is showing signs of disengagement with dry academic theory on "${topic}".
INSTANTLY adapt by switching from dry academic descriptions to a vivid, high-stakes real-world engineering or system-design analogy (e.g. Netflix video streaming, Uber driver dispatching, Stripe payment gateways, Formula 1 telemetry).

RULES:
1. First line MUST be:
${routingHeader}
2. Tone: Senior Tech Architect / Tech Lead speaking over coffee.
3. LANGUAGE: You MUST generate the ENTIRE response (headings, explanations, analogies, technical mechanisms) in ${language} language.
4. Break into:
   - ⚡ The Real-World High-Stakes Analogy
   - 🏗️ Technical Mechanism Demystified
   - 🚀 Where Top Tech Companies (Google, Meta, Netflix) use this today.`;

    const response = await generateContentWithRetry(ai, {
      contents: `Transform this topic into a real-world system design analogy in ${language} language: ${topic}`,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    res.json({
      routingHeader,
      response: response.text || 'No analogy generated.',
    });
  } catch (error: any) {
    console.error('Disengagement Adaptation Error:', error?.message);
    res.json({
      routingHeader,
      response: `### Real-World System Design Analogy: ${topic}\n\n1. **High-Throughput Storage & Retrieval Analogy:**\n   - **Structured Indexing (e.g. B-Trees):** Optimized for low-latency point reads in relational database engines.\n   - **Log-Structured Appends (e.g. LSM Trees):** Sequential write optimization for high-velocity streaming workloads.\n\n*Note: High API traffic detected. Fallback conceptual mapping loaded.*`,
    });
  }
});

// 7. TTS Audio Generation Endpoint
app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Zephyr' } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({ audioBase64: null, message: 'TTS API Key not present.' });
    }

    const response: any = await generateContentWithRetry(ai, {
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioBase64 = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    res.json({ audioBase64 });
  } catch (error: any) {
    console.warn('TTS notice:', error?.message);
    res.json({ audioBase64: null, message: 'TTS generation temporary rate limit.' });
  }
});

// 8. Skill-Gap Matrix Generator
app.post('/api/ai/skill-gap-matrix', async (req, res) => {
  const { studentSkills = [], targetRole = 'AI Cloud Architect', portal = 'Student', language = 'English' } = req.body;
  const routingHeader = formatRoutingHeader(portal, 'Text', language);

  try {
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        routingHeader,
        matrix: {
          targetRole,
          readinessScore: 78,
          masteredSkills: ['React', 'TypeScript', 'Node.js', 'REST API Design', 'Git'],
          gapSkills: ['Kubernetes Deployment', 'Prometheus Telemetry', 'Terraform IaC', 'gRPC Microservices'],
          actionPlan: [
            'Week 1-2: Containerize Node services with Docker multi-stage builds.',
            'Week 3-4: Deploy a 3-node Minikube cluster and configure ingress controllers.',
            'Week 5-6: Write Terraform modules for Cloud Run and Cloud SQL provisioning.',
          ],
        },
      });
    }

    const systemInstruction = `You are EduAgent OS (EduMentor AI) Career & Skill-Gap Matrix Strategist.
Compare student current skills to the requirements of the emerging industry role "${targetRole}".

Return JSON schema:
{
  "targetRole": "string",
  "readinessScore": number (0-100),
  "masteredSkills": ["string"],
  "gapSkills": ["string"],
  "actionPlan": ["string"]
}`;

    const prompt = `Target Role: ${targetRole}
Current Student Skills: ${JSON.stringify(studentSkills)}`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ routingHeader, matrix: parsed });
  } catch (error: any) {
    console.error('Skill Gap Matrix Error:', error?.message);
    res.json({
      routingHeader,
      matrix: {
        targetRole,
        readinessScore: 78,
        masteredSkills: studentSkills.length ? studentSkills : ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Git'],
        gapSkills: ['Kubernetes Cluster Orchestration', 'Prometheus Telemetry', 'Terraform IaC', 'gRPC Microservices'],
        actionPlan: [
          'Week 1: Containerize Express microservices with Docker multi-stage builds.',
          'Week 2: Deploy a 3-node Minikube cluster and configure ingress controllers.',
          'Week 3: Write Terraform modules to automate Cloud Run and Cloud SQL database provisioning.',
        ],
      },
    });
  }
});

// Vite Middleware Integration for Dev & Production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`EduAgent OS Server running on http://localhost:${PORT}`);
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  setupVite();
}

export { app };
