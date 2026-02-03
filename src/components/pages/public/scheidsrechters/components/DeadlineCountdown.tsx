import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeadlineCountdownProps {
  deadline: string | null;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  total: number; // total milliseconds
}

function getTimeRemaining(deadline: string): TimeRemaining {
  const total = new Date(deadline).getTime() - Date.now();
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, total };
}

export function DeadlineCountdown({ deadline, className }: DeadlineCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  
  useEffect(() => {
    if (!deadline) return;
    
    // Initial calculation
    setTimeRemaining(getTimeRemaining(deadline));
    
    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline));
    }, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [deadline]);
  
  if (!deadline || !timeRemaining) {
    return null;
  }
  
  const isExpired = timeRemaining.total <= 0;
  const isUrgent = timeRemaining.total <= 24 * 60 * 60 * 1000; // < 24 hours
  const isWarning = timeRemaining.total <= 48 * 60 * 60 * 1000; // < 48 hours
  
  // Determine color based on urgency
  const getColorClass = () => {
    if (isExpired) return 'text-muted-foreground bg-muted';
    if (isUrgent) return 'text-destructive bg-destructive/10';
    if (isWarning) return 'text-warning bg-warning/10';
    return 'text-success bg-success/10';
  };
  
  const getIcon = () => {
    if (isExpired) return <CheckCircle className="h-4 w-4" />;
    if (isUrgent) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };
  
  const formatTimeRemaining = () => {
    if (isExpired) return 'Poll gesloten';
    
    const parts: string[] = [];
    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}d`);
    }
    if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(`${timeRemaining.hours}u`);
    }
    parts.push(`${timeRemaining.minutes}m`);
    
    return parts.join(' ');
  };
  
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        getColorClass(),
        className
      )}
      aria-label={isExpired ? 'Poll is gesloten' : `Nog ${formatTimeRemaining()} om beschikbaarheid in te vullen`}
    >
      {getIcon()}
      <span>{formatTimeRemaining()}</span>
    </div>
  );
}
