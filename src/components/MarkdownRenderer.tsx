import React from 'react';

interface Props {
  content: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  if (!content) return null;

  // Split lines and render formatted elements
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  const renderedElements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        renderedElements.push(
          <div key={`code-${index}`} className="my-3 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
            {codeLang && (
              <div className="bg-slate-900 px-3 py-1 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                {codeLang}
              </div>
            )}
            <pre className="p-3 text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        codeLang = '';
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeLang = line.trim().replace('```', '');
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={index} className="text-base font-bold text-slate-100 mt-4 mb-2 flex items-center gap-2 border-b border-slate-800 pb-1">
          {line.replace('### ', '')}
        </h3>
      );
      return;
    }
    if (line.startsWith('#### ')) {
      renderedElements.push(
        <h4 key={index} className="text-sm font-semibold text-indigo-300 mt-3 mb-1">
          {line.replace('#### ', '')}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={index} className="text-lg font-bold text-white mt-5 mb-2 border-b border-slate-700 pb-1">
          {line.replace('## ', '')}
        </h2>
      );
      return;
    }

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const formattedText = renderInlineFormatting(line.trim().replace(/^[-*]\s+/, ''));
      renderedElements.push(
        <li key={index} className="ml-4 list-disc text-slate-300 my-1 text-sm leading-relaxed">
          {formattedText}
        </li>
      );
      return;
    }

    // Numbered lists
    if (/^\d+\.\s+/.test(line.trim())) {
      const formattedText = renderInlineFormatting(line.trim().replace(/^\d+\.\s+/, ''));
      renderedElements.push(
        <div key={index} className="flex items-start gap-2 my-1 text-slate-300 text-sm leading-relaxed">
          <span className="font-bold text-indigo-400 font-mono text-xs mt-0.5">{line.trim().match(/^\d+\./)?.[0]}</span>
          <div>{formattedText}</div>
        </div>
      );
      return;
    }

    if (line.trim() === '') {
      renderedElements.push(<div key={index} className="h-2" />);
      return;
    }

    renderedElements.push(
      <p key={index} className="text-slate-300 text-sm leading-relaxed my-1">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  return <div className="space-y-1 font-sans">{renderedElements}</div>;
};

function renderInlineFormatting(text: string): React.ReactNode {
  // Simple regex parser for **bold** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
