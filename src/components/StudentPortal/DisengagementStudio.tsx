import React, { useState, useEffect, useMemo } from 'react';
import { LanguageType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, Zap, Flame, RefreshCw, BookOpen, ArrowRight, Loader2, Compass } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface Props {
  language: LanguageType;
  onSetModality: (modality: 'Text') => void;
}

export const DisengagementStudio: React.FC<Props> = ({ language, onSetModality }) => {
  const { t } = useLanguage();
  const [topic, setTopic] = useState<string>('B-Trees vs LSM Trees in Storage Engines');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ routingHeader: string; response: string } | null>(null);

  useEffect(() => {
    onSetModality('Text');
  }, [onSetModality]);

  const presetDryTopics = [
    t('dryTopic1', 'Paxos Consensus Protocol & Majority Quorums'),
    t('dryTopic2', 'Memory Safety: Garbage Collection vs Rust Borrow Checker'),
    t('dryTopic3', 'Database Locking: Optimistic (OCC) vs Pessimistic Concurrency'),
    t('dryTopic4', 'OAuth 2.0 PKCE Code Challenge Authorization Flow'),
    t('dryTopic5', 'TCP 3-Way Handshake vs QUIC UDP Connection Migration'),
  ];

  const handleAdaptTopic = async (topicToAdapt?: string) => {
    const selectedTopic = topicToAdapt || topic;
    if (!selectedTopic.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/ai/disengagement-adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          portal: 'Student',
          language,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Localized default template if custom AI response hasn't been generated yet
  const defaultAnalogyResponse = useMemo(() => {
    const header = t('realWorldAnalogyHeader', 'Real-World High-Stakes Analogy');
    const amazonText = t('imagineAmazonFacility', 'Imagine an **Amazon Black Friday Sorting Facility**:');
    const btreeShelves = t('rigidWarehouseShelves', 'The Rigid Warehouse Shelves');
    const btreeDesc1 = t('btreeDesc1', 'Every single item has a fixed, pre-sorted slot on a physical shelf.');
    const btreeDesc2 = t('btreeDesc2', 'When a new shipment arrives, workers walk directly to that shelf to place it.');
    const analogyLabel = t('analogyLabel', 'Analogy');
    const btreeAnalogy = t('btreeAnalogy', 'Great for **Reads** (finding an existing product instantly), but if 100,000 packages arrive per second, workers constantly get stuck shuffling shelf space.');
    const usedByLabel = t('usedByLabel', 'Used By');
    const btreeUsedBy = t('btreeUsedBy', 'PostgreSQL & MySQL for standard relational transactions.');

    const lsmConveyor = t('lsmTreesConveyorBelt', 'Log-Structured Merge Trees - The High-Speed Conveyor Belt');
    const lsmDesc1 = t('lsmDesc1', 'Packages are immediately dropped onto a fast RAM conveyor belt in memory (**MemTable**).');
    const lsmDesc2 = t('lsmDesc2', 'When full, a background robot dumps sorted blocks onto disk (**SSTables**).');
    const lsmAnalogy = t('lsmAnalogy', 'Built for extreme **Write** speeds (e.g., logging Uber GPS coordinates every millisecond).');
    const lsmUsedBy = t('lsmUsedBy', 'Cassandra, RocksDB, and Google Bigtable.');

    return `### ${header}: B-Trees vs LSM Trees

${amazonText}

1. **B-Trees (${btreeShelves}):**
   - ${btreeDesc1}
   - ${btreeDesc2}
   - **${analogyLabel}:** ${btreeAnalogy}
   - **${usedByLabel}:** ${btreeUsedBy}

2. **LSM Trees (${lsmConveyor}):**
   - ${lsmDesc1}
   - ${lsmDesc2}
   - **${analogyLabel}:** ${lsmAnalogy}
   - **${usedByLabel}:** ${lsmUsedBy}`;
  }, [t, language]);

  const displayedResponse = useMemo(() => {
    if (!result || !result.response) {
      return defaultAnalogyResponse;
    }
    // Clean out leading routing header if returned inside the markdown response body
    let raw = result.response.replace(/^\[PORTAL:[^\]]+\]\s*\|\s*\[Feature:[^\]]+\]\s*\|\s*\[Language:[^\]]+\]\s*/i, '').trim();
    return t(raw, raw);
  }, [result, defaultAnalogyResponse, t]);

  const dynamicRoutingHeader = useMemo(() => {
    const portalStr = t('portalStudent', 'Student');
    const featureStr = t('featureText', 'Text');
    const langLabel = t('languageTagLabel', 'Language');
    const currentLangStr = t(language, language);
    return `[PORTAL: ${portalStr}] | [Feature: ${featureStr}] | [${langLabel}: ${currentLangStr}]`;
  }, [language, t]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <span>{t('analogyTitle', 'Disengagement Adaptation Studio')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                {t('dryTheoryToAnalogy', 'Dry Theory → High-Stakes Analogy')}
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              {t('analogySubtitle', 'Instantly transforms dry textbook computer science theory into vivid, high-stakes real-world engineering analogies (Netflix, Uber, Amazon, Stripe).')}
            </p>
          </div>
        </div>

        {/* Preset Dry Topics */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            {t('clickDryTopic', 'Click Dry CS Topic to Transform Instantly:')}
          </span>
          <div className="flex flex-wrap gap-2">
            {presetDryTopics.map((dry, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopic(dry);
                  handleAdaptTopic(dry);
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-orange-300 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-orange-500/40 transition-all font-mono"
              >
                {dry}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input & Output Studio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t('enterComplexTopic', 'Enter Complex or Dry Engineering Topic')}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('topicPlaceholder', 'e.g. B-Trees vs LSM Trees, Consensus Algorithms, Memory Alignment...')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 font-sans"
            />
          </div>

          <button
            onClick={() => handleAdaptTopic()}
            disabled={loading || !topic.trim()}
            className="md:self-end px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all font-mono text-sm font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('translatingAnalogy', 'Translating to Real-World System Design...')}</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>{t('adaptToAnalogy', 'Adapt to Real-World Analogy')}</span>
              </>
            )}
          </button>
        </div>

        {/* Output Card */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 shadow-2xl min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              <p className="text-sm font-mono animate-pulse">{t('mappingAbstraction', 'Mapping Abstraction to High-Throughput Industry Scenario...')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
                <span className="text-xs font-mono text-orange-400 font-bold flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>{t('realWorldAnalogyEngine', 'Real-World System Design Analogy Engine')}</span>
                </span>
                <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2.5 py-1 rounded border border-slate-800">
                  {dynamicRoutingHeader}
                </span>
              </div>

              <MarkdownRenderer content={displayedResponse} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
