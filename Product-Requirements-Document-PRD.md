# Product Requirements Document (PRD): SkillForge AI

## 1. Executive Summary
**SkillForge AI** is an enterprise-grade, autonomous **Multi-Agent EdTech Ecosystem** designed to revolutionize the educational experience. Built on the **Google AI Stack**, the system moves beyond traditional chatbots by utilizing a collaborative network of specialized AI agents. These agents autonomously evaluate code in live sandboxes, diagnose granular learning gaps via BigQuery analytics, alert educators to struggling students, and construct adaptive career roadmaps. The system is engineered for the **AI Agent Builder Series 2026 National Finale**, showcasing a "360° Agentic" approach to learning.

## 2. Problem Statement
Traditional EdTech platforms suffer from "static" learning:
*   Grades reflect raw marks rather than specific conceptual gaps.
*   Knowledge retention drops significantly after exams.
*   Career guidance is often generic and disconnected from real-time market needs.
*   Teachers are overwhelmed and cannot identify struggling students in large cohorts.
*   Project-based learning lacks automated, deep-level technical assessment.

## 3. Goals & Objectives
*   **Autonomous Orchestration:** Implement a multi-agent system that collaborates without manual intervention.
*   **Deep Diagnostic Learning:** Transition from "grading" to "skill-gap mapping."
*   **Real-world Validation:** Use live code execution and GitHub scanning to verify technical competency.
*   **Stakeholder Transparency:** Provide tailored, actionable insights for Students, Teachers, and Parents.
*   **Scalability:** Maintain high performance under demo-day loads (National Finale).

## 4. Target Users / Stakeholders
*   **Students & Developers:** Users seeking adaptive technical interviews, project reviews, and actionable career roadmaps.
*   **Teachers & Educators:** Users requiring automated grading support and early-warning systems for student intervention.
*   **Parents:** Users needing jargon-free, verified visibility into their child's genuine skill progress.

## 5. Functional Requirements (FR)
*   **FR-1: Adaptive Technical Interviewer:** The system must simulate interactive technical interviews where question difficulty scales dynamically based on real-time performance.
*   **FR-2: MCP Code Sandbox & Repo Evaluation:** 
    *   Execute user-submitted code snippets in an isolated environment to check logic, latency, and security.
    *   Scan multi-file GitHub repositories to grade project-based assignments using Abstract Syntax Tree (AST) analysis.
*   **FR-3: Skill-Gap Diagnostic & Retention Engine:**
    *   Log errors into BigQuery with conceptual tags (e.g., `tag:ASYNC_JS_ERROR`).
    *   Generate spaced-repetition micro-quizzes based on memory-retention decay curves for failed concepts.
*   **FR-4: Teacher Alerting & Engagement Adaptation:**
    *   Trigger automated alerts to the Teacher UI when competency scores fall below a set threshold.
    *   Detect drops in engagement (e.g., high latency in user response) and autonomously switch instructional formats (e.g., from text to interactive visual prompts).
*   **FR-5: Career Guidance & Parent Reporting:**
    *   Cross-reference BigQuery competency logs with real-time job market data to generate 30-day roadmaps.
    *   Generate weekly, plain-language progress summaries for the Parent UI.

## 6. Non-Functional Requirements (NFR)
*   **NFR-1: Scalability:** Backend APIs on Google Cloud Run must scale from 0 to 50 concurrent sessions with sub-second cold-start performance.
*   **NFR-2: Security:** All code execution via MCP must occur in isolated Docker containers with disabled network access to prevent exploits.
*   **NFR-3: Latency:** Conversational response latency from Gemini 1.5 Pro/Flash via Vertex AI must remain under 2,000 ms.
*   **NFR-4: Reliability:** Agent-to-Agent (A2A) communication must ensure state consistency across the Orchestrator and worker agents.

## 7. System Architecture Overview
The system follows a tiered Agentic Architecture:
1.  **User Layer:** Multi-persona frontend (Angular/React).
2.  **Gateway Layer:** Google Cloud Run acting as a serverless entry point.
3.  **Reasoning Layer:** 
    *   **ADK Main Orchestrator (Gemini 1.5 Pro):** Handles high-level reasoning and task routing.
    *   **Worker Agents (Gemini 1.5 Flash):** Specialized agents for Learning, Classroom Support, and Career/Parent reporting.
4.  **Tooling Layer (MCP):** Standardized protocol for agents to interact with the Code Sandbox, BigQuery, and Job Market APIs.
5.  **Data Layer:** BigQuery for high-scale competency logging and analytics.

## 8. Tech Stack
*   **Frontend:** Angular, React, Tailwind CSS.
*   **Orchestration & AI:** Gemini 1.5 Pro, Gemini 1.5 Flash, Agent Development Kit (ADK), LangGraph, Python.
*   **Cloud Infrastructure:** Google Cloud Run, Vertex AI, Cloud Endpoints.
*   **Protocols:** Model Context Protocol (MCP), Agent-to-Agent (A2A) Communication.
*   **Data & Tools:** Google BigQuery, Docker (Sandboxing), Playwright, GitHub API, REST/WebSocket APIs.

## 9. Data Requirements
*   **Competency Logs DB:** Hosted on BigQuery. Must store granular skill tags, timestamps, and mastery levels.
*   **State Management:** The ADK Orchestrator must maintain session state to allow for multi-turn adaptive interviews.
*   **External Data:** Real-time ingestion of job market trends via Industry Job Market APIs.

## 10. API Specifications
*   **UI to Backend:** RESTful endpoints for dashboard data; WebSockets for real-time interview interactions.
*   **MCP Tools:**
    *   `mcp_code_sandbox`: POST code snippets; RETURN execution results/errors.
    *   `mcp_bigquery`: READ/WRITE competency tags.
    *   `mcp_github_scanner`: GET repository metadata and file contents.
*   **A2A:** Internal gRPC or REST calls between agents for autonomous alerting and roadmap updates.

## 11. Security Requirements
*   **Authentication:** Secure login for Student, Teacher, and Parent personas.
*   **Authorization:** Role-Based Access Control (RBAC) to ensure parents only see their child's data and teachers only see their classroom.
*   **Sandbox Isolation:** Strict Docker-based isolation for the `mcp_code_sandbox` to prevent RCE (Remote Code Execution) attacks.

## 12. Deployment & Infrastructure
*   **Environment:** Fully serverless deployment on Google Cloud Platform (GCP).
*   **CI/CD:** Automated deployment to Cloud Run via GitHub Actions.
*   **Monitoring:** Cloud Logging and Monitoring to track agent reasoning traces and tool-call latency.

## 13. Success Metrics
*   **Diagnostic Accuracy:** % of identified skill gaps that correlate with student performance in follow-up assessments.
*   **Engagement Rate:** Increase in student interaction time due to dynamic format adaptation (FR-4).
*   **Demo Performance:** Zero downtime and <2s latency during the National Finale live demo.

## 14. Timeline & Milestones
*   **Phase 1:** Core Orchestrator and Learning Agent development (Gemini 1.5 Pro/Flash integration).
*   **Phase 2:** MCP Tooling implementation (Code Sandbox & BigQuery logging).
*   **Phase 3:** A2A Collaboration logic (Teacher alerts & Career roadmap automation).
*   **Phase 4:** Multi-Persona UI finalization and Cloud Run optimization.
*   **Final Milestone:** Live Demo at National Finale (August 8th, 2026).

## 15. Open Questions & Risks
*   **Risk:** Potential latency in multi-agent reasoning chains (A2A) exceeding the 2,000ms NFR.
*   **Risk:** Model hallucinations during complex AST-based project grading.
*   **Question:** Should the Spaced-Repetition Engine (SRE) reside within the Learning Agent or as a standalone microservice? (Currently assigned to Learning Agent).