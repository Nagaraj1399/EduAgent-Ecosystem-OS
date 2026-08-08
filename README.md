# EduAgent OS — v3.6 Enterprise 🚀
*EduMentor AI • Google Cloud & AI Studio Ecosystem*

[![Build Status](https://img.shields.io/badge/build-passing-success?style=for-the-badge&logo=github)](https://github.com)
[![Vitest Unit Tests](https://img.shields.io/badge/tests-17%2F17%20passed-blue?style=for-the-badge&logo=vitest)](https://github.com)
[![Gemini 1.5 Pro](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-orange?style=for-the-badge&logo=googlecloud)](https://cloud.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🔗 Quick Links & Deployment Portal

> **Note:** Access links below for live evaluation and video walkthroughs.

* **🌐 Live Production Deployment:** [https://eduagent-os.ai.studio]
* **🎥 Live Demo Video:** [https://drive.google.com/file/d/14hlfvs-kGvvAOvfl6-9Hj-u11QSju_SV/view?usp=drive_link]

---

## 🌟 Project Overview & Architecture
**EduAgent OS** is an enterprise-grade AI technical evaluation, career mentorship, and resume-driven technical challenge platform designed to simulate high-stakes multinational corporation (MNC) interviews. Powered by Gemini 1.5 Pro and Google Cloud infrastructure, the platform delivers zero-loop sequential state management, real-time resume parsing, automated skill gap audits, and an interactive AI Avatar Copilot.

---

## 📂 Project Structure & Architecture Hierarchy

```text
eduagent-os/
├── .github/
│   └── workflows/          # CI/CD pipelines (GitHub Actions, Vitest gating)
├── public/                 # Static assets, avatar avatars, and media files
├── src/
│   ├── components/
│   │   ├── InterviewCopilot.tsx      # Neural AI Avatar & real-time chat interface
│   │   ├── ResumeAuditSuite.tsx      # Independent resume file upload & audit parser
│   │   ├── ChallengeEngine.tsx       # Non-looping sequential state-managed interview engine (Q1-Q5)
│   │   └── AnalogyEngine.tsx         # Disengagement Analogy Engine for abstract CS concepts
│   ├── services/
│   │   └── geminiClient.ts           # Gemini 1.5 Pro API integration and prompt handlers
│   ├── tests/
│   │   ├── api.test.ts               # API endpoint validation tests
│   │   ├── components.test.tsx       # UI component test suite
│   │   ├── db.test.ts                # Database transaction and state mock tests
│   │   └── auth.test.ts              # Authentication & security boundary checks
│   ├── App.tsx                       # Main entry point combining modules
│   └── main.tsx                      # React DOM root render
├── package.json                      # Dependencies and npm scripts
├── tailwind.config.js                # Tailwind CSS styling and glassmorphic configuration
├── tsconfig.json                     # TypeScript strict configuration
└── vite.config.ts                    # Vite build configuration and Vitest setup
