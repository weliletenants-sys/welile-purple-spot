import { useState, useEffect } from 'react';

export interface DiagnosticLog {
  id: string;
  timestamp: Date;
  type: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
}

const MAX_LOGS = 100;

export const useDiagnostics = () => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);

  useEffect(() => {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // Override console methods to capture logs
    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: 'error',
        message,
        stack: new Error().stack,
      });
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: 'warn',
        message,
      });
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: 'error',
        message: event.message,
        stack: event.error?.stack,
      });
    };

    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const addLog = (log: DiagnosticLog) => {
    setLogs(prev => {
      const newLogs = [log, ...prev];
      // Keep only the most recent MAX_LOGS entries
      return newLogs.slice(0, MAX_LOGS);
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const data = {
      exportDate: new Date().toISOString(),
      appVersion: '2.0.0',
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    logs,
    clearLogs,
    exportLogs,
  };
};

