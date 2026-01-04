'use client';

import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'pending' | 'running' | 'completed' | 'failed';

interface StatusBadgeProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-xs';
      case 'lg':
        return 'px-5 py-2 text-base';
      default:
        return 'px-4 py-1.5 text-sm';
    }
  };

  const getStatusConfig = (s: Status) => {
    switch (s) {
      case 'pending':
        return {
          className: 'bg-gray-800/50 text-gray-400 border-gray-700/50',
          defaultLabel: 'Pending',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'running':
        return {
          className: 'bg-[#5B9FF0]/10 text-[#5B9FF0] border-[#5B9FF0]/30 animate-pulse',
          defaultLabel: 'Running',
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        };
      case 'completed':
        return {
          className: 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/30',
          defaultLabel: 'Completed',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'failed':
        return {
          className: 'bg-[#FC8181]/10 text-[#FC8181] border-[#FC8181]/30',
          defaultLabel: 'Failed',
          icon: <XCircle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          className: 'bg-gray-800/50 text-gray-400 border-gray-700/50',
          defaultLabel: 'Unknown',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
    }
  };

  const config = getStatusConfig(status);
  const displayLabel = label || config.defaultLabel;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold backdrop-blur-md border',
        getSizeClasses(),
        config.className
      )}
    >
      {config.icon}
      <span>{displayLabel}</span>
    </div>
  );
}
