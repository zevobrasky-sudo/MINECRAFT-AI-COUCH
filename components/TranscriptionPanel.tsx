
import React, { useEffect, useRef } from 'react';
import { TranscriptionEntry } from '../types';

interface TranscriptionPanelProps {
  transcriptions: TranscriptionEntry[];
  streamingUserText?: string;
  streamingAiText?: string;
}

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ 
  transcriptions, 
  streamingUserText = '', 
  streamingAiText = '' 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions, streamingUserText, streamingAiText]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {transcriptions.length === 0 && !streamingUserText && !streamingAiText ? (
        <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale px-10 text-center">
          <span className="text-4xl mb-4">📝</span>
          <p className="text-xs uppercase tracking-widest font-bold">No Activity Yet</p>
        </div>
      ) : (
        <>
          {transcriptions.map((t, i) => (
            <div 
              key={i} 
              className={`flex flex-col ${t.role === 'ai' ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                t.role === 'ai' 
                  ? 'bg-gray-800 text-gray-100 rounded-bl-none border border-white/5' 
                  : 'bg-green-700/80 text-white rounded-br-none border border-green-400/20'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">
                    {t.role === 'ai' ? 'Steve AI' : 'Player'}
                  </span>
                </div>
                <p className="leading-relaxed">{t.text}</p>
              </div>
            </div>
          ))}
          
          {/* Active Streaming Input (User) */}
          {streamingUserText && (
            <div className="flex flex-col items-end animate-in fade-in duration-200">
              <div className="max-w-[85%] p-3 rounded-xl text-sm bg-green-700/40 text-white/70 rounded-br-none border border-green-400/10 italic">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Player (Talking...)</span>
                </div>
                <p className="leading-relaxed">{streamingUserText}</p>
              </div>
            </div>
          )}

          {/* Active Streaming Output (AI) */}
          {streamingAiText && (
            <div className="flex flex-col items-start animate-in fade-in duration-200">
              <div className="max-w-[85%] p-3 rounded-xl text-sm bg-gray-800/60 text-gray-300 rounded-bl-none border border-white/5 italic">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Steve AI (Responding...)</span>
                </div>
                <p className="leading-relaxed">{streamingAiText}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TranscriptionPanel;
