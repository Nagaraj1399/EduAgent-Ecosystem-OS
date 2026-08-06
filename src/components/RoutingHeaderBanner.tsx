import React from 'react';
import { PortalType, FeatureModality, LanguageType } from '../types';
import { Cpu, Eye, Mic, FileText, Globe, Shield } from 'lucide-react';

interface Props {
  portal: PortalType | 'Landing';
  feature: FeatureModality;
  language: LanguageType;
}

export const RoutingHeaderBanner: React.FC<Props> = ({ portal, feature, language }) => {
  const displayPortal = portal === 'Landing' ? 'Student/Overview' : portal;
  const formattedHeader = `[PORTAL: ${displayPortal}] | [Feature: ${feature}] | [Language: ${language}]`;


  const getFeatureIcon = () => {
    switch (feature) {
      case 'Vision Image':
        return <Eye className="w-4 h-4 text-emerald-400" />;
      case 'Voice Audio':
        return <Mic className="w-4 h-4 text-cyan-400" />;
      case 'Text':
      default:
        return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs font-mono py-2 px-4 flex flex-wrap items-center justify-between gap-2 shadow-inner">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded border border-slate-700 font-bold">
          <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>ROUTING HEADER</span>
        </div>
        <span className="text-slate-100 font-bold tracking-wide bg-indigo-950/80 px-3 py-1 rounded border border-indigo-800/60 text-indigo-200">
          {formattedHeader}
        </span>
      </div>

      <div className="flex items-center gap-3 text-slate-400">
        <div className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
          {getFeatureIcon()}
          <span className="text-slate-300 capitalize">{feature}</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300">{language}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
          <Shield className="w-3 h-3" />
          <span>EduAgent OS Active</span>
        </div>
      </div>
    </div>
  );
};
