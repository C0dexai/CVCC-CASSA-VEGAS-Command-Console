
import React from 'react';

type SyncStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    CONNECTED: { text: 'Live Sync: Connected', color: 'bg-neon-lime', shadow: 'shadow-neon-lime' },
    CONNECTING: { text: 'Live Sync: Connecting...', color: 'bg-yellow-400 animate-pulse', shadow: '' },
    DISCONNECTED: { text: 'Live Sync: Disconnected', color: 'bg-red-500', shadow: '' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-xs text-gray-300">
      <span className={`relative flex h-2.5 w-2.5`}>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color} ${config.shadow}`}></span>
      </span>
      <span>{config.text}</span>
    </div>
  );
};

export default SyncStatusIndicator;
