
import React, { RefObject } from 'react';

interface LiveViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  isScreenSharing: boolean;
  canvasRef: RefObject<HTMLCanvasElement>;
}

const LiveView: React.FC<LiveViewProps> = ({ videoRef, isScreenSharing, canvasRef }) => {
  return (
    <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {isScreenSharing ? (
        <div className="w-full h-full flex items-center justify-center relative z-20 group">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-contain shadow-2xl transition-transform duration-500"
          />
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 pointer-events-none border-4 border-green-500/20 rounded-lg overflow-hidden">
             <div className="w-full h-0.5 bg-green-400/30 absolute top-0 animate-[scan_4s_linear_infinite]" />
             <style>{`
               @keyframes scan {
                 0% { top: 0%; opacity: 0; }
                 10% { opacity: 1; }
                 90% { opacity: 1; }
                 100% { top: 100%; opacity: 0; }
               }
             `}</style>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 backdrop-blur rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest">Local Mirror Feed</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 z-10">
          <div className="relative">
            <div className="w-48 h-48 rounded-full border-4 border-dashed border-gray-700 flex items-center justify-center">
              <span className="text-6xl grayscale opacity-30">🛏️</span>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
          </div>
          <div className="text-center px-6">
            <h3 className="text-xl font-medium text-gray-300">Prepare for Battle</h3>
            <p className="text-gray-500 mt-2 max-w-xs">Steve AI is ready to scout your Hypixel Bed Wars match. Share your screen to start the rush.</p>
          </div>
        </div>
      )}

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" />

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-white/10 pointer-events-none z-30" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-white/10 pointer-events-none z-30" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-white/10 pointer-events-none z-30" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-white/10 pointer-events-none z-30" />
    </div>
  );
};

export default LiveView;
