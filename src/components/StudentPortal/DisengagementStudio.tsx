import React, { useState, useEffect } from 'react';
import { LanguageType } from '../../types';

export interface Props {
  language?: LanguageType | string;
  onSetModality?: (modality: 'Text') => void;
}

export function DisengagementAnalogyEngine({ language = 'English', onSetModality }: Props) {
  const [selectedTopic, setSelectedTopic] = useState("Memory Safety: Garbage Collection vs Rust Borrow Checker");
  const [analogyOutput, setAnalogyOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onSetModality) {
      onSetModality('Text');
    }
  }, [onSetModality]);

  const topics = [
    "Paxos Consensus Protocol & Majority Quorums",
    "Memory Safety: Garbage Collection vs Rust Borrow Checker",
    "Database Locking: Optimistic (OCC) vs Pessimistic Concurrency",
    "OAuth 2.0 PKCE Code Challenge Authorization Flow",
    "TCP 3-Way Handshake vs QUIC UDP Connection Migration"
  ];

  const handleGenerateAnalogy = (topicText?: string) => {
    const targetTopic = topicText || selectedTopic;
    setLoading(true);
    setAnalogyOutput(null);

    setTimeout(() => {
      if (targetTopic.includes("Memory Safety")) {
        setAnalogyOutput(
          "🧹 **Garbage Collection vs Rust Borrow Checker Analogy:**\n\n" +
          "• **Garbage Collection (Java/Go):** Imagine hosting a massive party where you just drop trash anywhere on the floor. At the end of the night, a cleaning crew (GC) walks around sweeping everything up. It's easy for guests, but sometimes causes unexpected pauses (Stop-The-World).\n\n" +
          "• **Rust Borrow Checker:** Imagine a strict library where every single book has a strict logbook. If you take a book, nobody else can burn or rewrite it until you officially hand it back. It requires discipline upfront, but guarantees zero accidents!"
        );
      } else if (targetTopic.includes("Paxos")) {
        setAnalogyOutput(
          "🏛️ **Paxos Consensus Analogy:** Imagine a parliament of 5 ministers trying to pass a law across different cities. They send messengers who might get delayed. To pass a bill, a strict majority (Quorum) must agree on the exact version, preventing any rogue minister from changing laws unilaterally."
        );
      } else {
        setAnalogyOutput(
          `🚀 **Real-World Analogy for "${targetTopic}":**\n\nThink of this like traffic management on a multi-lane highway during rush hour. Synchronization mechanisms act like automated toll booths and traffic lights ensuring high throughput without collisions or data loss.`
        );
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 rounded-3xl shadow-2xl max-w-5xl mx-auto space-y-6 border border-blue-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <span>🔥</span> Disengagement Analogy Engine
          </h2>
          <p className="text-xs text-slate-400">Generates intuitive real-world analogies when students get stuck on abstract concepts.</p>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-300 text-xs rounded-full border border-amber-500/30 font-semibold">
          Dry Theory → High-Stakes Analogy
        </span>
      </div>

      {/* Quick Topic Chips */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Click Dry CS Topic to Transform Instantly:</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedTopic(t);
                handleGenerateAnalogy(t);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border cursor-pointer ${selectedTopic === t ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box & Action */}
      <div className="space-y-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Enter Complex or Dry Engineering Topic</label>
        <div className="flex gap-3">
          <input 
            type="text"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="flex-grow p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          />
          <button 
            type="button"
            onClick={() => handleGenerateAnalogy(selectedTopic)}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-bold rounded-xl shadow-lg transition text-sm text-white flex items-center gap-2 whitespace-nowrap disabled:opacity-50 cursor-pointer"
          >
            <span>⚡</span> {loading ? "Adapting..." : "Adapt to Real-World Analogy"}
          </button>
        </div>
      </div>

      {/* Output Console */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
        <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span className="text-amber-400 font-bold flex items-center gap-1.5"><span>🌿</span> Real-World System Design Analogy Engine</span>
          <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">[PORTAL: Student] | [Feature: Text] | [Language: {String(language)}]</span>
        </div>

        <div className="min-h-[140px] text-sm text-slate-200 leading-relaxed whitespace-pre-line pt-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 space-x-2 text-amber-400">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Synthesizing real-world analogy...</span>
            </div>
          ) : analogyOutput ? (
            analogyOutput
          ) : (
            <span className="text-slate-500 italic">No analogy generated. Select a topic above and click adapt.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const DisengagementStudio = DisengagementAnalogyEngine;
export default DisengagementAnalogyEngine;
