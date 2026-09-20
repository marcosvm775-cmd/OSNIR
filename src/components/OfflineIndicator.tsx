import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-status-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900/90 text-amber-300 border border-amber-500/30 px-3 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md animate-fadeIn"
      role="status"
    >
      <div className="relative flex items-center justify-center">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Database className="w-3 h-3 text-emerald-400" />
        <span className="text-slate-200">
          Modo Offline — Banco na memória do aparelho.
        </span>
      </div>
    </div>
  );
};
