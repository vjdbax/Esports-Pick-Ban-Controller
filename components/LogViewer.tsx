import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClear: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose, logs, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const getTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + date.getMilliseconds();
  };

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'request': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col font-mono text-sm">
        
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-gray-950 rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="text-gray-100 font-bold">vMix Command Logs</span>
            <span className="bg-gray-800 text-gray-400 px-2 rounded text-xs">{logs.length} entries</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClear} className="text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-gray-800 text-xs uppercase border border-gray-700">
              Clear
            </button>
            <button onClick={onClose} className="text-white bg-red-900/50 hover:bg-red-900 border border-red-800 px-3 py-1 rounded text-xs uppercase">
              Close
            </button>
          </div>
        </div>

        {/* Logs Console */}
        <div className="flex-grow overflow-y-auto p-4 space-y-1 bg-black/40">
          {logs.length === 0 && (
            <div className="text-gray-600 text-center italic mt-10">No commands sent yet...</div>
          )}
          
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 border-b border-gray-800/30 pb-1 mb-1 last:border-0 hover:bg-white/5 p-1 rounded">
              <span className="text-gray-500 whitespace-nowrap">[{getTime(log.timestamp)}]</span>
              <div className="flex-grow break-all">
                <span className={`font-bold ${getColor(log.type)} uppercase mr-2 text-xs tracking-wider w-16 inline-block`}>
                  {log.type}
                </span>
                <span className="text-gray-300">{log.message}</span>
                {log.details && (
                  <pre className="mt-1 text-xs text-gray-500 overflow-x-auto bg-black/30 p-1 rounded">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
};