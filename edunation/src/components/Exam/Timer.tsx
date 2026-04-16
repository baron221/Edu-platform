'use client';

import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeUp]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = seconds < 300; // 5 minutes

  return (
    <div style={{
      padding: '8px 16px',
      borderRadius: '99px',
      background: isLowTime ? '#fee2e2' : '#f1f5f9',
      color: isLowTime ? '#b91c1c' : '#475569',
      fontWeight: '700',
      fontSize: '18px',
      fontFamily: 'monospace',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: `2px solid ${isLowTime ? '#ef4444' : '#e2e8f0'}`,
    }}>
      <span style={{ fontSize: '20px' }}>{isLowTime ? '⚠️' : '⏲️'}</span>
      {formatTime(seconds)}
    </div>
  );
};

export default Timer;
