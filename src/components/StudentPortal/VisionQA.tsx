import React, { useState } from 'react';
import { LanguageType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getActiveStudentSession, recordStudentActivity } from '../../lib/telemetryStore';
import { Eye, Upload, AlertTriangle, CheckCircle2, Sparkles, Image as ImageIcon, ArrowRight, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface Props {
  language: LanguageType;
  onSetModality: (modality: 'Vision Image') => void;
}

export const VisionQA: React.FC<Props> = ({ language, onSetModality }) => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ routingHeader: string; response: string } | null>(null);

  React.useEffect(() => {
    onSetModality('Vision Image');
  }, [onSetModality]);

  const sampleArchitectures = [
    {
      title: t('sample1Title', 'AWS Multi-Region CQRS Event-Driven Diagram'),
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="%230f172a"/><rect x="20" y="110" width="100" height="70" rx="8" fill="%231e293b" stroke="%23ff9900" stroke-width="2"/><text x="70" y="150" fill="%23f8fafc" font-size="12" font-family="sans-serif" text-anchor="middle">API Gateway</text><line x1="120" y1="145" x2="170" y2="145" stroke="%23ff9900" stroke-width="2"/><rect x="170" y="110" width="100" height="70" rx="8" fill="%231e293b" stroke="%233b82f6" stroke-width="2"/><text x="220" y="140" fill="%23f8fafc" font-size="11" font-family="sans-serif" text-anchor="middle">Kinesis CDC</text><text x="220" y="158" fill="%2393c5fd" font-size="10" font-family="sans-serif" text-anchor="middle">Event Stream</text><line x1="270" y1="145" x2="320" y2="145" stroke="%233b82f6" stroke-width="2"/><rect x="320" y="110" width="100" height="70" rx="8" fill="%231e293b" stroke="%23a855f7" stroke-width="2"/><text x="370" y="150" fill="%23f8fafc" font-size="12" font-family="sans-serif" text-anchor="middle">EventBridge</text><line x1="420" y1="125" x2="480" y2="85" stroke="%2310b981" stroke-width="2"/><rect x="480" y="50" width="100" height="60" rx="8" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><text x="530" y="85" fill="%23f8fafc" font-size="11" font-family="sans-serif" text-anchor="middle">DynamoDB</text><line x1="420" y1="165" x2="480" y2="205" stroke="%23ef4444" stroke-width="2"/><rect x="480" y="180" width="100" height="60" rx="8" fill="%237f1d1d" stroke="%23ef4444" stroke-width="2"/><text x="530" y="210" fill="%23f8fafc" font-size="11" font-family="sans-serif" text-anchor="middle">Aurora (SPOF)</text></svg>',
      prompt: t('sample1Prompt', 'Analyze this AWS Multi-Region CQRS Event-Driven diagram (API Gateway, Kinesis CDC, EventBridge, DynamoDB, Aurora) for single points of failure, event consistency hazards, and multi-region replication gaps.'),
    },
    {
      title: t('sample2Title', 'Cloud Distributed Cache SPOF Diagram'),
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="%230f172a"/><rect x="40" y="100" width="120" height="80" rx="8" fill="%231e293b" stroke="%233b82f6" stroke-width="2"/><text x="100" y="145" fill="%23f8fafc" font-size="14" font-family="sans-serif" text-anchor="middle">API Gateway</text><line x1="160" y1="140" x2="260" y2="140" stroke="%233b82f6" stroke-width="2" stroke-dasharray="4"/><rect x="260" y="100" width="120" height="80" rx="8" fill="%237f1d1d" stroke="%23ef4444" stroke-width="2"/><text x="320" y="135" fill="%23f8fafc" font-size="14" font-family="sans-serif" text-anchor="middle">Single Redis</text><text x="320" y="155" fill="%23fca5a5" font-size="11" font-family="sans-serif" text-anchor="middle">(NO REPLICAS - SPOF)</text><line x1="380" y1="140" x2="480" y2="140" stroke="%233b82f6" stroke-width="2"/><rect x="480" y="100" width="100" height="80" rx="8" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><text x="530" y="145" fill="%23f8fafc" font-size="14" font-family="sans-serif" text-anchor="middle">DB Cluster</text></svg>',
      prompt: t('sample2Prompt', 'Identify the single point of failure in this cloud architecture diagram and provide a 3-step high-availability remediation plan.'),
    },
    {
      title: t('sample3Title', 'Concurrent Go/Java Async Code Race Condition'),
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="%23020617"/><text x="30" y="40" fill="%2338bdf8" font-size="14" font-family="monospace">package main</text><text x="30" y="70" fill="%23f8fafc" font-size="13" font-family="monospace">var balance int = 100 // Unsynchronized global state</text><text x="30" y="105" fill="%23f8fafc" font-size="13" font-family="monospace">func withdraw(amount int) {</text><text x="50" y="135" fill="%23ef4444" font-size="13" font-family="monospace">    if balance >= amount { // Race Condition Hazard</text><text x="70" y="165" fill="%23ef4444" font-size="13" font-family="monospace">        time.Sleep(10 * time.Millisecond)</text><text x="70" y="195" fill="%23ef4444" font-size="13" font-family="monospace">        balance -= amount</text><text x="50" y="225" fill="%23f8fafc" font-size="13" font-family="monospace">    }</text><text x="30" y="255" fill="%23f8fafc" font-size="13" font-family="monospace">}</text></svg>',
      prompt: t('sample3Prompt', 'Analyze this Go code snippet screenshot for concurrency bugs, explain memory visibility hazards, and refactor using atomic operations or mutex locks.'),
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !prompt) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/vision-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          prompt: prompt || 'Analyze this architecture diagram or code screenshot, detect structural flaws and give step-by-step remediation.',
          portal: 'Student',
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setResult({
          routingHeader: data.routingHeader || '[PORTAL: Student] | [Feature: Vision Image] | [Language: ' + language + ']',
          response: `### ⚠️ Gemini API Error\n\n**Error Details:** ${data.error || 'Failed to call Gemini Vision API. Please check your API Key.'}\n\nPlease verify that **GEMINI_API_KEY** is properly set in environment settings and try again.`,
        });
      } else {
        setResult(data);
        const activeStudent = getActiveStudentSession();
        recordStudentActivity({
          studentId: activeStudent.id,
          studentName: activeStudent.studentName,
          rollNo: activeStudent.rollNo,
          module: 'Vision Image Review',
          actionType: 'Architecture Diagram Review',
          title: prompt || 'Multimodal Vision Diagram Analysis',
          score: '90/100',
          summary: data.response ? data.response.slice(0, 150) + '...' : 'Vision diagram analysis complete.',
          diagnosedGap: 'Multimodal Vision Architecture Diagnostic Submitted',
        });
      }
    } catch (err: any) {
      console.error(err);
      setResult({
        routingHeader: '[PORTAL: Student] | [Feature: Vision Image] | [Language: ' + language + ']',
        response: `### ⚠️ Gemini API Error\n\n**Error Details:** ${err?.message || 'Network error occurred while reaching Gemini API server endpoint.'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono">{t('visionTitle', 'Gemini Multimodal Vision Architecture Review')}</h2>
            <p className="text-sm text-slate-400">
              {t('visionSubtitle', 'Upload architecture diagrams, system workflows, or code screenshots to detect structural flaws, memory hazards, and SPOFs.')}
            </p>
          </div>
        </div>

        {/* Preset Sample Architectures */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
            {t('tryPresets', 'Try Preset Engineering Samples:')}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sampleArchitectures.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImage(sample.image);
                  setPrompt(sample.prompt);
                }}
                className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
              >
                <div className="w-16 h-12 bg-slate-900 rounded border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">{sample.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{sample.prompt}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input & Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Preview / Upload */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('uploadLabel', 'Upload Image / Diagram / Screenshot')}
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-all relative overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {selectedImage ? (
                <div className="space-y-3">
                  <img
                    src={selectedImage}
                    alt="Uploaded preview"
                    className="max-h-56 mx-auto rounded-lg border border-slate-800 shadow-lg object-contain"
                  />
                  <p className="text-xs text-emerald-400 font-semibold">{t('imageLoaded', 'Image Loaded & Ready for Gemini Vision Analysis')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">{t('dragDropClick', 'Drag & Drop or Click to Upload')}</p>
                  <p className="text-xs text-slate-500">{t('uploadSupports', 'Supports PNG, JPG, WebP, SVG screenshots')}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('engineeringPromptLabel', 'Engineering Prompt / Specific Focus Question')}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('engineeringPromptPlaceholder', 'e.g. Detect concurrency race conditions, memory leaks, single points of failure, or Big-O complexity bottlenecks...')}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 font-sans resize-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || (!selectedImage && !prompt)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all font-mono text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('btnAnalyzing', 'Running Gemini Multimodal Vision Diagnostic...')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('btnAnalyze', 'Analyze Structural Flaws & Remediation')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right Column: Senior Architecture Review Output */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t('diagnosticReportTitle', 'Senior Engineering Diagnostic Report')}</span>
            </h3>
            {result?.routingHeader && (
              <span className="text-[10px] font-mono bg-slate-950 text-indigo-300 px-2.5 py-1 rounded border border-slate-800">
                {result.routingHeader}
              </span>
            )}
          </div>

          <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800/80 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-12 space-y-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-sm font-mono animate-pulse">{t('evaluatingGraph', 'Evaluating Architecture Graph & AST Constraints...')}</p>
              </div>
            ) : result ? (
              <MarkdownRenderer content={result.response} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-600" />
                <p className="text-sm">{t('noAnalysisPerformed', 'No analysis performed yet.')}</p>
                <p className="text-xs text-slate-600">{t('noAnalysisDesc', 'Select a preset sample or upload your own diagram to receive senior mentor diagnostic feedback.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
