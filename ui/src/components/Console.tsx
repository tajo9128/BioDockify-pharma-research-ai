'use client';

import { cn } from '@/lib/utils';

interface ConsoleProps {
  logs: Array<{ level: string; message: string; timestamp: Date }>;
}

export default function Console({ logs }: ConsoleProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-emerald-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-cyan-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          Terminal Output
        </h3>
        <button
          onClick={() => {
            if (logs.length > 0) {
              const lastLog = logs[logs.length - 1];
              navigator.clipboard.writeText(lastLog.message);
            }
          }}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Copy Last Log
        </button>
      </div>
      <div className="bg-black/60 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">Waiting for process to start...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-slate-600 shrink-0">[{formatTime(new Date(log.timestamp))}]</span>
              <span className={cn('font-medium shrink-0', getLevelColor(log.level))}>
                {log.level.toUpperCase()}:
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
