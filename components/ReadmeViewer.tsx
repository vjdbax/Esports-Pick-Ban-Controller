import React, { useEffect, useState } from 'react';

interface ReadmeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeViewer: React.FC<ReadmeViewerProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        fetch('/api/readme')
            .then(res => res.json())
            .then(data => {
                setContent(data.content || 'No content found.');
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setContent("Error loading documentation.");
                setLoading(false);
            });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Simple Markdown Parser (Headers, Lists, Bold, Links)
  // Avoids adding heavyweight dependencies like react-markdown for this specific use case
  const renderMarkdown = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, index) => {
          // Headers
          if (line.startsWith('# ')) {
              return <h1 key={index} className="text-3xl font-bold text-orange-500 mt-6 mb-4 pb-2 border-b border-gray-700">{parseInline(line.replace('# ', ''))}</h1>;
          }
          if (line.startsWith('## ')) {
              return <h2 key={index} className="text-xl font-bold text-blue-400 mt-6 mb-3">{parseInline(line.replace('## ', ''))}</h2>;
          }
          if (line.startsWith('### ')) {
              return <h3 key={index} className="text-lg font-bold text-white mt-4 mb-2">{parseInline(line.replace('### ', ''))}</h3>;
          }
          
          // Lists
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
              return (
                  <li key={index} className="ml-6 list-disc text-gray-300 mb-1 pl-1 marker:text-gray-500">
                      {parseInline(line.replace(/^[\*\-]\s/, ''))}
                  </li>
              );
          }
          // Numbered lists (simple detection)
          if (/^\d+\.\s/.test(line.trim())) {
              return (
                  <div key={index} className="ml-6 flex gap-2 text-gray-300 mb-1">
                      <span className="font-mono text-gray-500">{line.match(/^\d+\./)?.[0]}</span>
                      <span>{parseInline(line.replace(/^\d+\.\s/, ''))}</span>
                  </div>
              );
          }

          // Horizontal Rule
          if (line.trim() === '---') {
              return <hr key={index} className="border-gray-700 my-6" />;
          }

          // Empty lines
          if (line.trim() === '') {
              return <div key={index} className="h-2"></div>;
          }

          // Paragraph
          return <p key={index} className="text-gray-300 mb-2 leading-relaxed">{parseInline(line)}</p>;
      });
  };

  const parseInline = (text: string) => {
      // Very basic parser for **bold** and [link](url)
      // This is not a full MD parser, but sufficient for the generated README
      
      const parts = [];
      let remaining = text;
      let i = 0;

      while (remaining.length > 0) {
          // Check for link [text](url)
          const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
          // Check for bold **text**
          const boldMatch = remaining.match(/\*\*([^\*]+)\*\*/);

          const linkIndex = linkMatch ? linkMatch.index : -1;
          const boldIndex = boldMatch ? boldMatch.index : -1;

          if (linkIndex === -1 && boldIndex === -1) {
              parts.push(<span key={i++}>{remaining}</span>);
              break;
          }

          // Find which one is first
          const isLinkFirst = linkIndex !== -1 && (boldIndex === -1 || linkIndex! < boldIndex!);
          
          if (isLinkFirst && linkMatch) {
              if (linkIndex! > 0) {
                  parts.push(<span key={i++}>{remaining.substring(0, linkIndex)}</span>);
              }
              parts.push(
                  <a key={i++} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                      {linkMatch[1]}
                  </a>
              );
              remaining = remaining.substring(linkIndex! + linkMatch[0].length);
          } else if (boldMatch) {
               if (boldIndex! > 0) {
                  parts.push(<span key={i++}>{remaining.substring(0, boldIndex)}</span>);
              }
              parts.push(
                  <strong key={i++} className="text-white font-bold">
                      {boldMatch[1]}
                  </strong>
              );
              remaining = remaining.substring(boldIndex! + boldMatch[0].length);
          }
      }
      return parts;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950 rounded-t-lg">
          <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <h2 className="text-xl font-bold text-white">Инструкция / Documentation</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar bg-gray-900">
           {loading ? (
               <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">Loading documentation...</div>
           ) : (
               <div className="max-w-3xl mx-auto pb-10">
                   {renderMarkdown(content)}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
