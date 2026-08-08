# EduAgent OS — Enterprise 3-Portal EdTech AI Ecosystem

[![Built with React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Powered by Gemini 1.5 Pro](https://img.shields.io/badge/Gemini-1.5_Pro-4285F4?logo=google)](https://ai.google.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Rendering-000000?logo=three.js)](https://threejs.org/)

**EduAgent OS** is an enterprise-grade, 3-Portal AI-powered Educational Ecosystem engineered for higher education and STEM learning. Powered by Google's Gemini 1.5 Pro multimodal AI models, it seamlessly bridges the gap between **Students**, **Teachers**, and **Parents**.

---

## 🌐 Live Application & Deployment Links

- 🚀 **Live Production Application:** [https://ais-pre-aoar7o6dxaxbt242xa7kff-342455903858.asia-southeast1.run.app](https://ais-pre-aoar7o6dxaxbt242xa7kff-342455903858.asia-southeast1.run.app)
- ⚡ **Development Environment:** [https://ais-dev-aoar7o6dxaxbt242xa7kff-342455903858.asia-southeast1.run.app](https://ais-dev-aoar7o6dxaxbt242xa7kff-342455903858.asia-southeast1.run.app)

---

## 🌟 Key Ecosystem Features

### 🎓 1. Student Portal
- **🤖 3D Robotic Interviewer (Three.js):** Real-time interactive 3D humanoid AI avatar that conducts behavioral & technical STAR framework interviews with dynamic lighting and voice synthesis.
- **💼 Enterprise AI Copilot & Resume Audit:** Real-time PDF / DOCX / TXT resume parsing, individual skill gap audit reports, and customized MNC interview question generator.
- **🔥 Disengagement Analogy Engine:** Instantly converts dry computer science theory (e.g. Paxos Consensus, Memory Safety, Garbage Collection vs Rust Borrow Checker, Database Isolation) into intuitive real-world analogies.
- **📸 Multimodal Vision QA:** Upload architecture diagrams, circuit schematics, or UI wireframes for Gemini multimodal visual debugging and step-by-step breakdown.
- **📊 Interactive Skill Gap Matrix:** Comprehensive technical competency radar matrix mapping strengths against role requirements.
- **🧠 Spaced Retrieval Engine:** SuperMemo SM-2 algorithmic flashcard system targeting long-term memory retention.
- **💻 Engineering Practice Tasks:** Hands-on coding environment with integrated test suite execution.
- **📝 Automated Project Grader:** Full-stack code quality, security vulnerability, and architecture analysis.

### 👩‍🏫 2. Teacher Portal
- **📈 Cohort Mastery Heatmaps:** Real-time analytics tracking class-wide skill distributions and learning velocity.
- **🤖 AI Lesson Plan & Quiz Builder:** Instantly generate bloom-taxonomy aligned curriculum, assignments, and rubric-graded quizzes.
- **⚠️ Early Intervention Sentinel:** Algorithmic identification of struggling students with suggested micro-interventions.
- **📋 Automated Grading & Feedback Assistant:** Batch review engineering project submissions with detailed constructive feedback.

### 👨‍👩‍👧 3. Parent Portal
- **📊 Weekly Learning Velocity Digest:** High-level summary of skill acquisition, time invested, and practice milestones.
- **💬 AI Parent Communication Assistant:** Generates personalized progress reports in multiple languages.
- **🎯 Milestone Goal Tracker:** Clear visualization of career readiness and internship preparation progress.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Lucide Icons |
| **3D & Graphics** | Three.js (`@types/three`), Custom WebGL Shader Shards |
| **Backend API** | Node.js, Express v4, `tsx` runtime executor |
| **AI Integration** | `@google/genai` Official TypeScript SDK (Gemini 1.5 Pro Server-Side) |
| **Build & Bundling** | Vite 6, esbuild (CommonJS server output for production) |
| **Testing Suite** | Vitest, React Testing Library, Supertest, JSDOM |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** or **bun** / **yarn**
- **Gemini API Key** (Google AI Studio)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/eduagent-os.git
cd eduagent-os
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and add your Gemini API key:
```bash
cp .env.example .env
```
Add your key inside `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Development Server
Start the Express + Vite unified development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Tests
Run the Vitest test suite:
```bash
npm test
```

### 5. Production Build
Compile the frontend static assets and bundle the server:
```bash
npm run build
npm start
```

---

## 📤 How to Push to GitHub

To push this repository to your GitHub account, follow these simple steps in your terminal:

```bash
# 1. Initialize a new Git repository
git init

# 2. Add all files to staging
git add .

# 3. Create your initial commit
git commit -m "feat: Initial release of EduAgent OS - Enterprise AI Ecosystem"

# 4. Rename default branch to main
git branch -M main

# 5. Add your GitHub repository remote URL
git remote add origin https://github.com/YOUR_USERNAME/eduagent-os.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 📁 Repository Directory Structure

```
.
├── .env.example          # Environment variable template
├── .github/              # GitHub Actions workflows
├── server.ts             # Express server with Vite middleware integration
├── src/
│   ├── App.tsx           # Main App component with Portal routing
│   ├── main.tsx          # Application entry point
│   ├── index.css         # Tailwind CSS styling imports
│   ├── types.ts          # Global TypeScript interfaces
│   ├── components/
│   │   ├── Header.tsx    # Ecosystem navigation bar
│   │   ├── LandingPage.tsx
│   │   ├── StudentPortal/
│   │   │   ├── RoboticInterviewer3D.tsx  # 3D Avatar Interviewer
│   │   │   ├── VoiceInterview.tsx        # Enterprise Copilot & Resume Audit
│   │   │   ├── DisengagementStudio.tsx   # Dry Theory Analogy Engine
│   │   │   ├── VisionQA.tsx              # Multimodal Diagram Analyzer
│   │   │   ├── SkillGapMatrix.tsx        # Skill Matrix Tracker
│   │   │   └── EngineeringTasks.tsx      # Coding Challenge Runner
│   │   ├── TeacherPortal/
│   │   └── ParentPortal/
│   └── lib/              # Utility functions and API helpers
├── tests/                # Vitest unit & integration tests
├── vite.config.ts        # Vite build configuration
└── package.json          # Dependencies & npm scripts
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
