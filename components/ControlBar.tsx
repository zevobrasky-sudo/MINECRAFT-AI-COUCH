
import React from 'react';
import { ConnectionStatus } from '../types';

interface ControlBarProps {
  status: ConnectionStatus;
  isMicOn: boolean;
  isScreenSharing: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMic: () => void;
  onToggleScreen: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  status,
  isMicOn,
  isScreenSharing,
  onStart,
  onStop,
  onToggleMic,
  onToggleScreen
}) => {
  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING;

  return (
    <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center items-center gap-4 z-20">
      <div className="flex items-center gap-3 bg-gray-900/90 border border-white/10 p-2 rounded-2xl backdrop-blur-xl shadow-2xl">
        
        {/* Session Control */}
        {!isConnected && !isConnecting ? (
          <button 
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_0_rgb(22,101,52)] active:translate-y-1 active:shadow-none"
          >
            <span className="text-xl">🚀</span>
            <span>ENTER WORLD</span>
          </button>
        ) : (
          <button 
            onClick={onStop}
            disabled={isConnecting}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            <span className="text-xl">🚪</span>
            <span>LEAVE SESSION</span>
          </button>
        )}

        {/* Separator */}
        <div className="h-8 w-[1px] bg-white/10 mx-2" />

        {/* Hardware Toggles */}
        <button
          onClick={onToggleMic}
          disabled={!isConnected}
          className={`p-4 rounded-xl transition-all ${isMicOn ? 'bg-blue-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} disabled:opacity-30 disabled:cursor-not-allowed`}
          title={isMicOn ? "Turn Mic Off" : "Turn Mic On"}
        >
          {isMicOn ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" /></svg>
          )}
        </button>

        <button
          onClick={onToggleScreen}
          disabled={!isConnected}
          className={`p-4 rounded-xl transition-all ${isScreenSharing ? 'bg-purple-600 text-white shadow-inner' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} disabled:opacity-30 disabled:cursor-not-allowed`}
          title={isScreenSharing ? "Stop Screen Share" : "Start Screen Share"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
