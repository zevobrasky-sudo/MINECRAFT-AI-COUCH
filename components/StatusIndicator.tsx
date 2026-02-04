
import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getLabel = () => {
    switch(status) {
      case ConnectionStatus.CONNECTED: return 'World Connected';
      case ConnectionStatus.CONNECTING: return 'Synchronizing...';
      case ConnectionStatus.ERROR: return 'Connection Failed';
      default: return 'Coach Offline';
    }
  };

  const getColor = () => {
    switch(status) {
      case ConnectionStatus.CONNECTED: return 'bg-green-500';
      case ConnectionStatus.CONNECTING: return 'bg-yellow-500 animate-pulse';
      case ConnectionStatus.ERROR: return 'bg-red-500';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className={`w-2 h-2 rounded-full ${getColor()}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {getLabel()}
      </span>
    </div>
  );
};

export default StatusIndicator;
